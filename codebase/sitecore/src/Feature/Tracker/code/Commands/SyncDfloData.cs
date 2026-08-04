using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Threading;
using System.Threading.Tasks;
using easyJet.Feature.Tracker.Models.Dflo;
using easyJet.Feature.Tracker.Services;
using easyJet.Foundation.DynamoDb.Models;
using easyJet.Foundation.DynamoDb.Repositories.Base;
using easyJet.Foundation.SitecoreExtensions.Commands;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyJet.Foundation.XConnect.Common.Services;
using Sitecore;
using Sitecore.Configuration;
using Sitecore.Diagnostics;
using Sitecore.Shell.Framework.Commands;
using Sitecore.Web.UI.Sheer;
using Sitecore.XConnect;
using Sitecore.XConnect.Collection.Model;

[assembly: InternalsVisibleTo("easyJet.Feature.Tracker.Tests")]
[assembly: InternalsVisibleTo("DynamicProxyGenAssembly2")]

namespace easyJet.Feature.Tracker.Commands
{
    public class SyncDfloData : BaseAsyncCommand
    {
        protected override string CommandTitle => "Dflo Data Synchronization";

        protected override string CommandCategory => "Dflo Emails Data Synchronization";

        private static int BatchSize => Settings.GetIntSetting(Constants.Performance.XConnectBatchSize, 100);

        private static int MaxConcurrentTasks => Settings.GetIntSetting(Constants.Performance.MaxConcurrentTasks, 7);

        private readonly IDfloService dfloService;
        private readonly IAwsDynamoDbRepository<EmailMessageAwsDbModel> repository;
        private readonly IXdbService xdbService;

        public SyncDfloData(IDfloService dfloService, IAwsDynamoDbRepository<EmailMessageAwsDbModel> repository, IXdbService xdbService, IUserCreationService userCreationService)
            : base(userCreationService)
        {
            this.dfloService = dfloService;
            this.repository = repository;
            this.xdbService = xdbService;
        }

        internal async Task SyncData()
        {
            List<string> processedContactIds;
            try
            {
                var dynamoDbEmails = await repository.GetAll().ConfigureAwait(false);
                processedContactIds = dynamoDbEmails.Select(dynamoDbEmail => dynamoDbEmail.ContactId).Distinct().ToList();
            }
            catch (Exception ex)
            {
                Log.Error($"Couldn't get data from DynamoDb Contact Emails table. Exception: {ex}.", this);
                return;
            }

            Log.Info($"Contacts that were already processed: {processedContactIds.Count}.", this);

            var enumerator = await GetEnumerator();
            using (var semaphore = new SemaphoreSlim(MaxConcurrentTasks))
            {
                var batchCount = 1;
                while (await enumerator.MoveNextAsync())
                {
                    IReadOnlyCollection<Contact> contactsBatch = enumerator.Current;

                    var contactIdByEmail = contactsBatch.Where(contact => contact.GetFacet<EmailAddressList>(EmailAddressList.DefaultFacetKey)?.PreferredEmail?.SmtpAddress != null && contact.Id != null)
                        .ToDictionary(c => c.GetFacet<EmailAddressList>(EmailAddressList.DefaultFacetKey).PreferredEmail.SmtpAddress, c => (Guid)c.Id);

                    var contactsToProcess = contactIdByEmail.Where(c => processedContactIds.All(cip => cip != c.Value.ToString())).Select(c => c.Key);
                    var emailsByContacts = await dfloService.GetEmailsByEmailAsync(contactsToProcess).ConfigureAwait(false);

                    var emailsToAddTasks = emailsByContacts.Select(async emailsByContact =>
                    {
                        await semaphore.WaitAsync();
                        try
                        {
                            return await Task.Run(() => UpdateContactEmails(contactIdByEmail, emailsByContact));
                        }
                        finally
                        {
                            semaphore.Release();
                        }
                    });
                    var emailsToAddTasksResults = await Task.WhenAll(emailsToAddTasks);

                    var emailsToAdd = emailsToAddTasksResults.SelectMany(emails => emails).ToList();

                    try
                    {
                        if (emailsToAdd.Any())
                        {
                            Log.Info($"Submitting emails batch {batchCount}. Number of emails to sync {emailsToAdd.Count}", this);
                            await repository.SaveBatchAsync(emailsToAdd, 5, 200).ConfigureAwait(false);
                        }
                    }
                    catch (Exception ex)
                    {
                        Log.Error($"Error on submitting contact emails batch to Aws Dynamo DB. Exception: {ex}.", this);
                    }

                    batchCount++;
                }
            }
        }

        internal virtual async Task<IAsyncEntityBatchEnumerator<Contact>> GetEnumerator()
        {
            var query = xdbService.GetContactsQuery().Where(contact => contact.IsKnown)
                .WithExpandOptions(new ContactExpandOptions(EmailAddressList.DefaultFacetKey));
            var enumerator = await query.GetBatchEnumerator(BatchSize);
            return enumerator;
        }

        protected override bool IsCommandContextValid(CommandContext context) => true;

        protected override void Action(ClientPipelineArgs args)
        {
            var task = Task.Run(async () => await SyncData().ConfigureAwait(false));
            task.Wait();
        }

        protected override void PostAction(ClientPipelineArgs args) => Context.ClientPage.SendMessage(this, "Finished syncing Dflo Data");

        private static EmailMessageAwsDbModel MapDfloOnAwsDbEmailModel(Document document, Guid contactId)
            => new EmailMessageAwsDbModel
            {
                ContactId = contactId.ToString(),
                EmailId = document.Id,
                SentDate = document.DateStored,
                Subject = document.Subject
            };

        private IReadOnlyCollection<EmailMessageAwsDbModel> UpdateContactEmails(Dictionary<string, Guid> contactIdByEmail, KeyValuePair<string, IEnumerable<Document>> emailsByContact)
        {
            var contactId = contactIdByEmail[emailsByContact.Key];
            var contactEmails = emailsByContact.Value.Select(email => MapDfloOnAwsDbEmailModel(email, contactId));
            return contactEmails.ToList();
        }
    }
}
