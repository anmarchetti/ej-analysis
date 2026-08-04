using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using easyJet.Feature.SitecoreEnhancment.HtmlControls;
using easyJet.Feature.SitecoreEnhancment.Logging;
using easyJet.Feature.SitecoreEnhancment.Services;
using Sitecore;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.DependencyInjection;
using Sitecore.Diagnostics;
using Sitecore.Shell.Applications.Workbox;
using Sitecore.Text;
using Sitecore.Web;
using Sitecore.Workflows;
using Sitecore.Workflows.Simple;

namespace easyJet.Feature.SitecoreEnhancment.Workbox
{
    [ExcludeFromCodeCoverage]
    public class CustomWorkbox : WorkboxForm
    {
        private readonly ISitecoreEnhancmentLogger logger;
        private readonly IConfigurationService configurationService;
        private readonly Dictionary<string, string> fieldNameMapping;

        protected OffsetCollection Offset => new OffsetCollection();

        public CustomWorkbox()
        {
            logger = (ISitecoreEnhancmentLogger)ServiceLocator.ServiceProvider.GetService(typeof(ISitecoreEnhancmentLogger));
            configurationService = (IConfigurationService)ServiceLocator.ServiceProvider.GetService(typeof(IConfigurationService));
            fieldNameMapping = configurationService.GetWorkboxDictionary();
        }

        /// <summary>Displays the state.</summary>
        /// <param name="workflow">The workflow.</param>
        /// <param name="state">The state.</param>
        /// <param name="stateItems">The item for the workflow state.</param>
        /// <param name="control">The control.</param>
        /// <param name="offset">The offset.</param>
        /// <param name="pageSize">Size of the page.</param>
        protected override void DisplayState(
              IWorkflow workflow,
              WorkflowState state,
              StateItems stateItems,
              System.Web.UI.Control control,
              int offset,
              int pageSize)
        {
            base.DisplayState(workflow, state, stateItems, control, offset, pageSize);
            Item[] array = stateItems.Items.ToArray();
            if (array.Length == 0)
            {
                return;
            }

            int num = offset + pageSize;
            if (num > array.Length)
            {
                num = array.Length;
            }

            var xmlControls = control.Controls.OfType<Sitecore.Web.UI.XmlControls.XmlControl>().ToArray();
            int controlsIndex = 0;
            for (int index = offset; index < num; ++index)
            {
                var xmlControl = xmlControls[controlsIndex].Controls.OfType<Sitecore.Web.UI.HtmlControls.Border>().FirstOrDefault();
                xmlControl.Class = "work-box-container";
                AppendChangedFieldNames(array[index], xmlControl);
                controlsIndex++;
            }
        }

        /// <summary>
        /// Workflow completion callback to refresh the counts of items in workflow states.
        /// </summary>
        /// <param name="args">The arguments for the workflow execution.</param>
        protected void WorkflowCompleteStateItemCount(WorkflowPipelineArgs args)
        {
            IWorkflow workflowFromPage = GetWorkflowFromPage();
            if (workflowFromPage == null)
            {
                return;
            }

            int itemCount = workflowFromPage.GetItemCount(args.PreviousState.StateID);
            if (PageSize > 0 && itemCount % PageSize == 0)
            {
                int num = Offset[args.PreviousState.StateID];
                if (itemCount / PageSize > 1 && num > 0)
                {
                    Offset[args.PreviousState.StateID]--;
                }
                else
                {
                    Offset[args.PreviousState.StateID] = 0;
                }
            }

            Refresh(workflowFromPage.GetStates().ToDictionary(state => state.StateID, state => Offset[state.StateID].ToString()));
        }

        protected class OffsetCollection
        {
            public int this[string key]
            {
                get
                {
                    if (Context.ClientPage.ServerProperties[key] != null)
                    {
                        return (int)Context.ClientPage.ServerProperties[key];
                    }

                    UrlString urlString = new UrlString(WebUtil.GetRawUrl());

                    if (urlString[key] != null && int.TryParse(urlString[key], out int result))
                    {
                        return result;
                    }

                    return 0;
                }

                set
                {
                    Context.ClientPage.ServerProperties[key] = value;
                }
            }
        }

        /// <summary>Append changed field names to the item.</summary>
        /// <param name="item">The item.</param>
        /// <param name="control">The control.</param>
        private void AppendChangedFieldNames(Item item, System.Web.UI.Control control)
        {
            Assert.ArgumentNotNull(item, nameof(item));
            Assert.ArgumentNotNull(control, nameof(control));

            var changedFieldsNames = GetChangedFieldsNames(item);
            UnorderedList unorderedListControl = new UnorderedList
            {
                ListItems = changedFieldsNames
            };

            control.Controls.Add(unorderedListControl);
        }

        /// <summary>
        /// Returns display names of changed item's fields.
        /// </summary>
        /// <param name="item">Item to check fields.</param>
        /// <returns>Collections of display names.</returns>
        private List<string> GetChangedFieldsNames(Item item)
        {
            var versionNumbers = item.Versions.GetVersionNumbers();
            var previousVersionNumber = Sitecore.Data.Version.Invalid.Number;

            if (versionNumbers.Length > 1)
            {
                previousVersionNumber =
                    versionNumbers.LastOrDefault(versionNumber => versionNumber.Number < item.Version.Number)?.Number ??
                    previousVersionNumber;
            }

            var changedFieldsNames = new List<string>();

            if (previousVersionNumber != -1)
            {
                var previousVersionOfItem = Context.ContentDatabase.GetItem(
                    item.ID,
                    item.Language,
                    Sitecore.Data.Version.Parse(previousVersionNumber));

                foreach (Field field in item.Fields)
                {
                    try
                    {
                        // Add field to list if field is not OOTB
                        // And if field doesn't exist in previous version OR values of current and previous versions are different
                        if (!field.Name.StartsWith("__") && (!previousVersionOfItem.Fields.Contains(field.ID) ||
                            item.Fields[field.Name].Value != previousVersionOfItem.Fields[field.Name].Value))
                        {
                            if (fieldNameMapping.TryGetValue(field.DisplayName, out var fieldName))
                            {
                                changedFieldsNames.Add(fieldName);
                            }
                            else
                            {
                                changedFieldsNames.Add(field.DisplayName);
                            }
                        }
                    }
                    catch (System.Exception exc)
                    {
                        logger.Error($"Error occurred while comparing fields versions. Item: {item.Name} ({item.ID}), FieldName: {field.Name}", exc, this);
                    }
                }
            }

            return changedFieldsNames;
        }
    }
}