using Sitecore;
using Sitecore.Analytics;
using Sitecore.Configuration;
using Sitecore.ContentTesting.Managers;
using Sitecore.ContentTesting.Pipelines.StartTest;
using Sitecore.Diagnostics;

namespace easyJet.Foundation.Presentation.Pipelines.StartTest
{
    public class Deploy : StartTestProcessor
    {
        public override void Process(StartTestArgs args)
        {
            Assert.ArgumentNotNull(args, nameof(args));
            DeployAssociatedTestsManager associatedTestsManager = new DeployAssociatedTestsManager();
            var contentDatabase = Context.ContentDatabase ?? Factory.GetDatabase("master");

            associatedTestsManager.DeployComponentRelatedDependencies(args.TestDefinitionItem);

            if (args.TestDefinitionItem != null && args.TestDefinitionItem.CanStart)
            {
                if (args.TestDefinitionItem.InnerItem?.State.GetWorkflow() == null)
                {
                    var analyticsTestingWorkflow = contentDatabase.WorkflowProvider.GetWorkflow(Constants.Workflows.AnalyticsTestingId);
                    analyticsTestingWorkflow?.Start(args.TestDefinitionItem.InnerItem);
                }

                associatedTestsManager.DeployTest(args.TestDefinitionItem);
            }

            args.Result = true;
        }
    }
}