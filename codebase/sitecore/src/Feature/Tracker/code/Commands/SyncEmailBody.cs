using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using easyJet.Feature.Tracker.Services;
using easyJet.Foundation.DynamoDb.Models;
using easyJet.Foundation.SitecoreExtensions.Commands;
using EasyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore;
using Sitecore.Diagnostics;
using Sitecore.Shell.Framework.Commands;
using Sitecore.Web.UI.Sheer;

namespace easyJet.Feature.Tracker.Commands
{
    public class SyncEmailBody : BaseAsyncCommand
    {
        private readonly IDynamoDbEmailRepository dynamoDbEmailMessageRepository;
        private readonly IDfloService dfloService;
        private readonly ISyncEmailBodyConfigurationProvider syncEmailBodyConfigurationProvider;
        private int failedBatchesCount;

        public SyncEmailBody(IDfloService dfloService, IDynamoDbEmailRepository dynamoDbEmailMessageRepository, ISyncEmailBodyConfigurationProvider syncEmailBodyConfigurationProvider, IUserCreationService userCreationService)
        : base(userCreationService)
        {
            this.dfloService = dfloService;
            this.syncEmailBodyConfigurationProvider = syncEmailBodyConfigurationProvider;
            this.dynamoDbEmailMessageRepository = dynamoDbEmailMessageRepository;
        }

        protected override string CommandTitle => "Dflo Data Synchronization";

        protected override string CommandCategory => "Dflo Emails Body Synchronization";

        protected override bool IsCommandContextValid(CommandContext context)
        {
            return true;
        }

        protected override void Action(ClientPipelineArgs args)
        {
            var task = Task.Run(async () => await UpdateEmails().ConfigureAwait(false));
            task.Wait();
        }

        protected override void PostAction(ClientPipelineArgs args)
        {
            Context.ClientPage.SendMessage(this, "[Dflo] Finished Syncing Dflo Email Body Data");
        }

        private async Task UpdateEmails()
        {
            failedBatchesCount = 0;

            using (var semaphore = new SemaphoreSlim(syncEmailBodyConfigurationProvider.MaxConcurrentTasks))
            {
                var batchIndex = 0;
                while (!dynamoDbEmailMessageRepository.GetDoneStateFromWorker())
                {
                    if (failedBatchesCount >= syncEmailBodyConfigurationProvider.BatchFailureLimit)
                    {
                        Log.Error($"[Dflo] Failed to submit {syncEmailBodyConfigurationProvider.BatchFailureLimit} batches.", this);
                        break;
                    }

                    var emailsToUpdate = await dynamoDbEmailMessageRepository.GetNextSetFromWorker().ConfigureAwait(false);

                    if (!emailsToUpdate.Any())
                    {
                        break;
                    }

                    var itemsToSave = await PerformUpdate(batchIndex, emailsToUpdate, semaphore).ConfigureAwait(false);

                    if (!itemsToSave.Any())
                    {
                        continue;
                    }

                    await SaveBatch(itemsToSave, batchIndex);

                    batchIndex++;
                }
            }
        }

        private async Task<List<EmailMessageAwsDbModel>> PerformUpdate(int batchIndex, List<EmailMessageAwsDbModel> emailsToUpdate, SemaphoreSlim semaphore)
        {
            Log.Info($"[Dflo] Batch {batchIndex} has {emailsToUpdate.Count} to update.", this);

            var itemsToSync = new List<EmailMessageAwsDbModel>();
            var updateBodyTasks = emailsToUpdate.Select(async emailToUpdate =>
            {
                await semaphore.WaitAsync();
                try
                {
                    var (emailId, emailBody) = await Task.Run(() => dfloService.GetEmailBodyByIdAsync(emailToUpdate.EmailId)).ConfigureAwait(false);
                    if (!string.IsNullOrEmpty(emailBody))
                    {
                        emailToUpdate.Body = emailBody.ToGzipedString();
                        Log.Debug($"[Dflo] Got Email with id: {emailId}. BodySize: {emailBody.Length}. Zipped BodySize: {emailToUpdate.Body?.Length ?? 0}", this);
                        itemsToSync.Add(emailToUpdate);
                    }
                }
                finally
                {
                    semaphore.Release();
                }
            });

            await Task.WhenAll(updateBodyTasks).ConfigureAwait(false);
            return itemsToSync;
        }

        private async Task SaveBatch(List<EmailMessageAwsDbModel> itemsToSync, int batchIndex)
        {
            var currentDelay = syncEmailBodyConfigurationProvider.InitialMillisecondsDelay;

            for (var submitCounter = 0; submitCounter <= syncEmailBodyConfigurationProvider.ResubmissionLimit; submitCounter++)
            {
                try
                {
                    await dynamoDbEmailMessageRepository.SaveBatch(itemsToSync, syncEmailBodyConfigurationProvider.BatchPortion).ConfigureAwait(false);
                    Log.Info($"[Dflo] Batch {batchIndex} successfully submitted {itemsToSync.Count} emails to AWS.", this);
                    return;
                }
                catch (Exception)
                {
                    Log.Warn($"[Dflo] Retrying batch {batchIndex}. Attempt {submitCounter + 1} of {syncEmailBodyConfigurationProvider.ResubmissionLimit}.", this);
                    await Task.Delay(currentDelay);
                    currentDelay *= 2;
                }
            }

            var emailData = string.Join("," + Environment.NewLine, itemsToSync.Select(i => $"Email id:{i.EmailId}, ContactId: {i.ContactId}, BodyLength: {i.Body?.Length ?? 0}"));
            Log.Error($"[Dflo] Failed to submit batch {batchIndex} after {syncEmailBodyConfigurationProvider.ResubmissionLimit} attempts. Data: {emailData}", this);
            failedBatchesCount++;
        }
    }
}