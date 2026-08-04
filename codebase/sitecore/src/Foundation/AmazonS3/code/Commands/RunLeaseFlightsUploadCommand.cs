using System.Linq;
using System.Threading;
using easyJet.Foundation.AmazonS3.Models;
using easyJet.Foundation.AmazonS3.Services;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Models;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore;
using Sitecore.Abstractions;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.Jobs;
using Sitecore.Shell.Framework.Commands;

namespace easyJet.Foundation.AmazonS3.Commands
{
    public class RunLeaseFlightsUploadCommand : Command
    {
        private readonly IAmazonS3AcmiBucketService amazonS3AmciBucketService;
        private readonly BaseMediaManager mediaManager;
        private readonly IUserCreationService userCreationService;

        public RunLeaseFlightsUploadCommand(
            IAmazonS3AcmiBucketService amazonS3AmciBucketService,
            BaseMediaManager mediaManager,
            IUserCreationService userCreationService)
        {
            this.amazonS3AmciBucketService = amazonS3AmciBucketService;
            this.mediaManager = mediaManager;
            this.userCreationService = userCreationService;
        }

        /// <summary>
        /// Hide or show command in context menu by condition.
        /// </summary>
        /// <param name="context">Context item.</param>
        /// <returns>Command state.</returns>
        public override CommandState QueryState(CommandContext context)
        {
            var item = context.Items.FirstOrDefault();

            if (item == null)
            {
                return CommandState.Hidden;
            }

            return item.TemplateID.Equals(Constants.LeaseFlightTool.TemplateId) && IsCommandContextValid(context) ? base.QueryState(context) : CommandState.Hidden;
        }

        /// <summary>
        /// Execute command. Run a job for cancellation and refund process.
        /// </summary>
        /// <param name="context">Context item.</param>
        public override void Execute(CommandContext context)
        {
            Item item = context.Items.FirstOrDefault();
            var siteInfo = item.GetSiteInfo();
            DefaultJobOptions options = new DefaultJobOptions(Constants.Jobs.BulkToolJob.Name, "Commands", siteInfo.Name, this, nameof(Process), new object[] { item })
            {
                EnableSecurity = true,
                ContextUser = userCreationService.GetOrCreateNonAnonymousUser(GetType().Name),
                Priority = ThreadPriority.AboveNormal
            };
            Context.ClientPage.ClientResponse.Alert("Lease flight tool started.");
            JobManager.Start(options);
        }

        /// <summary>
        /// Checking that input file field has file.
        /// </summary>
        /// <param name="context">Command context.</param>
        /// <returns>True if input file field has file and has csv extension.</returns>
        protected internal bool IsCommandContextValid(CommandContext context)
        {
            var item = context.Items.FirstOrDefault();

            FileField file = item?.Fields[Constants.LeaseFlightTool.InputFileField];

            return file?.ContainsCsvFile() ?? false;
        }

        private static MediaItem GetMediaItem(Item item) => new FileField(item?.Fields[Constants.LeaseFlightTool.InputFileField])?.MediaItem;

        /// <summary>
        /// Upload file to S3 bucket.
        /// </summary>
        /// <param name="item">Context item.</param>
        private void Process(Item item)
        {
            var status = Constants.Jobs.ProgressStatuses.InProgress;

            var fileItem = GetMediaItem(item);

            if (fileItem == null)
            {
                status = Constants.Jobs.ProgressStatuses.Failed;
                SaveChanges(item, status);
                return;
            }

            using (var csvFile = new CsvFile(fileItem))
            {
                var isSuccess = amazonS3AmciBucketService.UploadFile(csvFile);

                status = isSuccess ? Constants.Jobs.ProgressStatuses.Success : Constants.Jobs.ProgressStatuses.Failed;
            }

            SaveChanges(item, status);
        }

        private void SaveChanges(Item item, string status)
        {
            if (status != Constants.Jobs.ProgressStatuses.Failed)
            {
                item.ExecuteItemFieldAction(Constants.LeaseFlightTool.InputFileField, field =>
                {
                    var fileField = (FileField)field;
                    fileField.MediaItem?.Delete();
                    fileField.Clear();
                });
                item.ExecuteItemFieldAction(Constants.LeaseFlightTool.StatusField, field => field.Value = status);
            }
            else
            {
                item.ExecuteItemFieldAction(Constants.LeaseFlightTool.StatusField, field => field.Value = string.Empty);
            }
        }
    }
}
