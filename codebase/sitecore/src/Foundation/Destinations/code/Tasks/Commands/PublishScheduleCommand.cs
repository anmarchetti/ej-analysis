using System;
using System.Linq;
using System.Web.Mvc;
using easyJet.Foundation.Destinations.Logging;
using EasyJet.Foundation.SitecoreExtensions.Publishing;
using Sitecore;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.SecurityModel;
using Sitecore.Tasks;

namespace easyJet.Foundation.Destinations.Tasks.Commands
{
    public class PublishScheduleCommand
    {
        private readonly IDestinationsLogger logger;

        public PublishScheduleCommand()
        {
            logger = DependencyResolver.Current.GetService<IDestinationsLogger>();
        }

        /// <summary>
        /// Publish scheduled items.
        /// </summary>
        /// <param name="items">Collections of items.</param>
        /// <param name="commandItem">Command Item.</param>
        /// <param name="scheduleItem">Schedule Item.</param>
        public void Run(Item[] items, CommandItem commandItem, ScheduleItem scheduleItem)
        {
            logger.Info("PublishScheduleCommand Run method execution is started.", this);

            var queueFolder = items.FirstOrDefault();

            var unpublishedItems = queueFolder?.Children.Where(x => !string.IsNullOrEmpty(x.Fields[Constants.Fields.SchedulePublishQueue.PublishItemId].Value)
                && !string.IsNullOrEmpty(x.Fields[Constants.Fields.SchedulePublishQueue.PublishScheduleDate].Value)
                && DateUtil.IsoDateToDateTime(x.Fields[Constants.Fields.SchedulePublishQueue.PublishScheduleDate].Value) <= DateTime.UtcNow);

            if (unpublishedItems != null)
            {
                foreach (var scheduleQueueItem in unpublishedItems)
                {
                    var actualItemId = new ID(scheduleQueueItem[Constants.Fields.SchedulePublishQueue.PublishItemId]);

                    Item actualItem = scheduleQueueItem.Database?.GetItem(actualItemId);

                    if (actualItem != null)
                    {
                        PublishScheduleItem(actualItem, scheduleQueueItem);
                    }
                    else
                    {
                        logger.Info($"Item with id: ({actualItemId.ToString()}) doesn't exist.", this);
                    }
                }
            }
        }

        /// <summary>
        /// Publish schedule item to web database.
        /// </summary>
        /// <param name="actualPublishItem">Actual publish item.</param>
        /// <param name="scheduleQueueItem">Schedule item with info when publish actual item.</param>
        private void PublishScheduleItem(Item actualPublishItem, Item scheduleQueueItem)
        {
            try
            {
                using (new SecurityDisabler())
                {
                    PublishingManager.PublishItem(actualPublishItem);

                    actualPublishItem.Editing.BeginEdit();
                    actualPublishItem[FieldIDs.WorkflowState] = Constants.WorkflowsStateIds.DestinationsWorkflowApprovedId.ToString();
                    actualPublishItem.Editing.EndEdit();

                    scheduleQueueItem.Editing.BeginEdit();
                    scheduleQueueItem[Constants.Fields.SchedulePublishQueue.PublishedDateTime] = DateUtil.ToIsoDate(DateTime.Now);
                    scheduleQueueItem[Constants.Fields.SchedulePublishQueue.IsPublished] = true.ToString();
                    scheduleQueueItem.Editing.EndEdit();

                    scheduleQueueItem.Recycle();
                }
            }
            catch (Exception ex)
            {
                actualPublishItem.Editing.CancelEdit();
                scheduleQueueItem.Editing.CancelEdit();
                logger.Error($"Error occured while ActualPublishItem: ({actualPublishItem.ID.ToString()}) and ScheduleQueueItem: ({scheduleQueueItem.ID.ToString()}). {ex.Message}", ex, this);
            }
        }
    }
}