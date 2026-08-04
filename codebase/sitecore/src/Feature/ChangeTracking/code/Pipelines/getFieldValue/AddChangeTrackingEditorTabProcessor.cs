using easyJet.Feature.ChangeTracking.Services;
using easyJet.Foundation.SitecoreExtensions.Interfaces;
using Sitecore;
using Sitecore.Pipelines.GetFieldValue;

namespace easyJet.Feature.ChangeTracking.Pipelines.getFieldValue
{
    public class AddChangeTrackingEditorTabProcessor : IPipelineProcessor<GetFieldValueArgs>
    {
        private static IChangeTrackingTrackerService changeTrackingTrackerService;

        public AddChangeTrackingEditorTabProcessor(IChangeTrackingTrackerService changeTrackingTrackerService)
        {
            AddChangeTrackingEditorTabProcessor.changeTrackingTrackerService = changeTrackingTrackerService;
        }

        public void Process(GetFieldValueArgs args)
        {
            if (!args.Field.ID.Equals(Constants.Ids.EditorsField) ||
                args.Field.Item.Database.Name != "master" ||
                args.Field.Item.TemplateID == TemplateIDs.Template ||
                !changeTrackingTrackerService.IsTracked(args.Field.Item))
            {
                return;
            }

            args.Value = Constants.Ids.ChangeTrackingEditorTab.ToString();
            args.AbortPipeline();
        }
    }
}
