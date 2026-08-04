using System;
using System.Web.Mvc;
using easyJet.Foundation.Destinations.Logging;
using Sitecore.Configuration;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.SecurityModel;
using Sitecore.Workflows.Simple;

namespace easyJet.Foundation.Destinations.Actions.Publishing
{
    public class ScheduleAction
    {
        private readonly IDestinationsLogger logger;

        public ScheduleAction()
        {
            logger = DependencyResolver.Current.GetService<IDestinationsLogger>();
        }

        /// <summary>
        /// Create queue item for publish agent per approved item.
        /// </summary>
        /// <param name="args">WorkflowPipeline args.</param>
        public void Process(WorkflowPipelineArgs args)
        {
            if (args.DataItem == null)
            {
                logger.Info("DataItem is null", this);
                return;
            }

            logger.Info("ScheduleAction Process method execution is started.", this);

            var scheduleTime = args.CommentFields[Constants.Fields.Schedule.ScheduleDateTime];

            if (scheduleTime != null)
            {
                var sourceItem = args.DataItem;

                string itemName = ItemUtil.ProposeValidItemName($"{sourceItem.ID.ToString()}");

                using (new SecurityDisabler())
                {
                    Item queueFolder = sourceItem.Database.GetItem(Settings.GetSetting("Destinations.WorkflowScheduleQueueFolderPath"));

                    Item publishQueueItem = queueFolder.Add(itemName, new TemplateID(Constants.TemplateIds.SchedulePublishQueue));

                    try
                    {
                        publishQueueItem.Editing.BeginEdit();

                        publishQueueItem.Fields[Constants.Fields.SchedulePublishQueue.PublishItemId].Value = sourceItem.ID.ToString();
                        publishQueueItem.Fields[Constants.Fields.SchedulePublishQueue.PublishItemPath].Value = sourceItem.Paths.Path;
                        publishQueueItem.Fields[Constants.Fields.SchedulePublishQueue.PublishScheduleDate].Value = scheduleTime;

                        publishQueueItem.Editing.EndEdit();
                    }
                    catch (Exception ex)
                    {
                        publishQueueItem.Editing.CancelEdit();
                        logger.Error($"Error occured while PublishQueueItem: ({publishQueueItem.ID.ToString()}) editing. {ex.Message}", ex, this);
                    }
                }
            }
            else
            {
                logger.Info("Schedule time is not setted", this);
            }
        }
    }
}