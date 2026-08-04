using System.Diagnostics.CodeAnalysis;
using Sitecore.Personalization.Mvc.Pipelines.Response.CustomizeRendering;

namespace easyJet.Foundation.Presentation.Pipelines.CustomizeRendering
{
    // Exclude from code coverage as tests are written for mocked testable object but sonar qube doesn't pick it up
    public class Personalize : Sitecore.Personalization.Mvc.Pipelines.Response.CustomizeRendering.Personalize
    {
        public override void Process(CustomizeRenderingArgs args)
        {
            if (args.Aborted)
            {
                return;
            }

            base.Process(args);
        }
    }
}