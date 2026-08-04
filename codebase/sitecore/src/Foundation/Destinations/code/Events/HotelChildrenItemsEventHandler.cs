using System;
using System.Collections.Generic;
using easyJet.Foundation.Destinations.ContentSearch.Extensions;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.SitecoreExtensions.Disablers;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Events;

namespace easyJet.Foundation.Destinations.Events
{
    public class HotelChildrenItemsEventHandler
    {
        private const string MasterDatabase = "master";

        private enum EventType
        {
            Changed,
            Deleted,
        }

        private readonly IDestinationsLogger logger;

        public HotelChildrenItemsEventHandler(IDestinationsLogger logger)
        {
            this.logger = logger;
        }

        /// <summary>
        /// Trigger workflow on hotel item which children are changed.
        /// </summary>
        /// <param name="sender">Sender.</param>
        /// <param name="args">Sitecore Event Args.</param>
        public void OnItemSaved(object sender, EventArgs args)
        {
            ChangeItemWorkflowState(args, EventType.Changed);
        }

        /// <summary>
        /// Trigger workflow on hotel item which children are deleted.
        /// </summary>
        /// <param name="sender">Sender.</param>
        /// <param name="args">Sitecore Event Args.</param>
        public void OnItemDeleting(object sender, EventArgs args)
        {
            ChangeItemWorkflowState(args, EventType.Deleted);
        }

        /// <summary>
        /// Change accommodation item workflow state if accomodation child item was changed or deleted.
        /// </summary>
        /// <param name="args">Args with data.</param>
        private void ChangeItemWorkflowState(EventArgs args, EventType eventType)
        {
            if (WorkflowDisabler.IsActive)
            {
                return;
            }

            if (CanChangeWorflowState(args, out Item item))
            {
                try
                {
                    var hotelItem = item.GetAncestorByBaseTemplateId(Constants.TemplateIds.Accommodation);
                    if (hotelItem == null)
                    {
                        logger.Warn($"Cannot find the hotel for {item.Name} ({item.ID})", this);
                        return;
                    }

                    if (!hotelItem.HasVersion())
                    {
                        logger.Warn($"Hotel {hotelItem.Name} ({hotelItem.ID}) - does not have any version in {hotelItem.Language.Name} language.", this);
                        return;
                    }

                    if (hotelItem.Version.Number == 1)
                    {
                        hotelItem = hotelItem.Versions.AddVersion();
                    }

                    var defaultWorkflowId = hotelItem.Template?.StandardValues[FieldIDs.DefaultWorkflow];

                    if (!string.IsNullOrWhiteSpace(defaultWorkflowId))
                    {
                        var hotelItemWorkflow = hotelItem.Database.WorkflowProvider?.GetWorkflow(hotelItem);
                        if (hotelItemWorkflow != null)
                        {
                            var hotelStateID = hotelItemWorkflow.GetState(hotelItem)?.StateID;

                            if (hotelStateID == Constants.WorkflowsStateIds.DestinationsWorkflowApprovedId.ToString())
                            {
                                hotelItem = hotelItem.Versions.AddVersion();
                            }

                            // If current state is not scheduled then workflow should be reset.
                            if (hotelStateID != Constants.WorkflowsStateIds.DestinationsWorkflowScheduledId.ToString())
                            {
                                hotelItem.ResetWorkflowState();
                            }
                            else
                            {
                                logger.Warn($"Hotel's children were changed or deleted while Hotel item: ({hotelItem.ID}) in scheduled states.", this);
                            }
                        }
                        else
                        {
                            var workflow = hotelItem.Database.WorkflowProvider?.GetWorkflow(defaultWorkflowId);

                            if (workflow != null)
                            {
                                workflow.Start(hotelItem);
                            }
                            else
                            {
                                logger.Warn($"Workflow with ID: {defaultWorkflowId} is not found.", this);
                            }
                        }
                    }

                    AppendHotelLogs(item, hotelItem, eventType);
                }
                catch (Exception exc)
                {
                    logger.Error($"Error while changing workflow state on {item.Name} ({item.ID})", exc, this);
                }
            }
        }

        /// <summary>
        /// Can change worflow state for the item.
        /// </summary>
        /// <param name="args">Event args.</param>
        /// <param name="item">Returns item eligible for the modification to a workflow state.</param>
        /// <returns>True if item is eligible to change a workflow state.</returns>
        private bool CanChangeWorflowState(EventArgs args, out Item item)
        {
            var sitecoreArgs = (SitecoreEventArgs)args;
            item = Event.ExtractParameter(sitecoreArgs, 0) as Item;

            bool isAccommodationChildItem = item.IsAccommodationChildItem() && item.Database.Name == MasterDatabase;

            // If event has item changes, it means item was changed.
            // If event has only item args than it means that item was deleted.
            if (sitecoreArgs.Parameters.Length > 1 && isAccommodationChildItem)
            {
                // If item was updated - it will have 2nd parametr ItemChanges
                bool hasItemChanges = Event.ExtractParameter(sitecoreArgs, 1) is ItemChanges itemChanges && IsNotSystemFields(itemChanges.FieldChanges);

                return hasItemChanges;
            }

            if (isAccommodationChildItem)
            {
                return true;
            }

            return false;
        }

        private static readonly Dictionary<ID, string> FolderChangesMapping = new Dictionary<ID, string>()
        {
            { Constants.TemplateIds.AccommodationRoom, Constants.Fields.HotelFolderUpdates.UpdatesRoomsFolder },
            { Constants.TemplateIds.SitecoreImage, Constants.Fields.HotelFolderUpdates.UpdatesImagesFolder },
            { Constants.TemplateIds.ExternalImage, Constants.Fields.HotelFolderUpdates.UpdatesImagesFolder },
            { Constants.TemplateIds.AccommodationFacility, Constants.Fields.HotelFolderUpdates.UpdatesFacilitiesFolder },
            { Constants.TemplateIds.AccommodationBoard, Constants.Fields.HotelFolderUpdates.UpdatesBoardsFolder },
            { Constants.TemplateIds.RoomFacility, Constants.Fields.HotelFolderUpdates.UpdatesRoomsFolder },
        };

        /// <summary>
        /// Appends logs about changing of accomodations child item.
        /// </summary>
        /// <param name="savedItem">Accomodation child Item.</param>
        /// <param name="hotelItem">Accomodation Item.</param>
        private void AppendHotelLogs(Item savedItem, Item hotelItem, EventType eventType)
        {
            if (!FolderChangesMapping.TryGetValue(savedItem.TemplateID, out string fieldKey))
            {
                return;
            }

            var message = $"{savedItem.Name} has been {eventType} by {Context.User?.DisplayName} {DateTime.UtcNow}{Environment.NewLine}";

            hotelItem.Editing.BeginEdit();
            try
            {
                hotelItem.Fields[fieldKey].Value += message;
                hotelItem.Editing.AcceptChanges();
            }
            catch (Exception e)
            {
                logger.Error($"Error while appending HotelLogs", e, this);
                if (hotelItem.Editing.IsEditing)
                {
                    hotelItem.Editing.CancelEdit();
                }
            }
            finally
            {
                if (hotelItem.Editing.IsEditing)
                {
                    hotelItem.Editing.EndEdit();
                }
            }
        }

        /// <summary>
        /// Checks if field change list has non-system fields.
        /// </summary>
        /// <param name="fieldChanges">List of field changes.</param>
        /// <returns>Boolean value.</returns>
        private bool IsNotSystemFields(FieldChangeList fieldChanges)
        {
            foreach (FieldChange fieldChange in fieldChanges)
            {
                if (!fieldChange.Definition.Name.Contains("__"))
                {
                    return true;
                }
            }

            return false;
        }
    }
}