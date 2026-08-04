using System.Linq;
using Sitecore;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Shell.Framework.Commands;
using Sitecore.Web.UI.Sheer;

namespace easyJet.Feature.Booking.Commands
{
    public class StopBulkToolProcessCommand : Command
    {
        public override void Execute(CommandContext context)
        {
            Context.ClientPage.Start(this, nameof(Confirm), context.Parameters);
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

            return item.TemplateID.Equals(Constants.TemplateIds.CancellationAndRefund) && IsInRunnningStatus(item) ? base.QueryState(context) : CommandState.Hidden;
        }

        /// <summary>
        /// Confirm that bulk tool process shoud be stopped.
        /// </summary>
        /// <param name="args">ClientPipelineArgs args.</param>
        protected void Confirm(ClientPipelineArgs args)
        {
            if (args.IsPostBack)
            {
                if (args.Result == "yes")
                {
                    var job = Sitecore.Jobs.JobManager.GetJob(Constants.Jobs.BulkToolJob.Name);
                    var bulkToolItem = Context.ContentDatabase.GetItem(new ID(args.Parameters["id"]));
                    bulkToolItem.Editing.BeginEdit();
                    bulkToolItem.Fields[Constants.Fields.CancellationAndRefund.Status].Value = Constants.ProgressStatuses.Cancelled;
                    bulkToolItem.Editing.EndEdit();

                    if (job != null)
                    {
                        job.Status.State = Sitecore.Jobs.JobState.Finished;
                        Context.ClientPage.ClientResponse.Alert("Bulk tool process was stopped.");
                    }
                    else
                    {
                        Context.ClientPage.ClientResponse.Alert("Bulk tool process not found.");
                    }
                }
            }
            else
            {
                SheerResponse.Confirm("Are you sure you want to stop bulk tool process?");
                args.WaitForPostBack();
            }
        }

        /// <summary>
        /// Check that bulk tool process has active status.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <returns>True if exists active bulk tool process is active.</returns>
        private bool IsInRunnningStatus(Item item)
        {
            return item[Constants.Fields.CancellationAndRefund.Status] == Constants.ProgressStatuses.InProgress;
        }
    }
}