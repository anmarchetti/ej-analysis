using Sitecore.ContentTesting.Pipelines.GetTestToRun;

namespace easyJet.Foundation.Presentation.Pipelines.GetTestToRun
{
    /// <summary>
    /// Ensure test for page designs.
    /// </summary>
    public class EnsurePageDesignTest : EnsurePageTest
    {
        /// <summary>
        /// Ensure test for page designs.
        /// If there is no multivariant page design in args <see cref="GetTestToRunArgs.CustomData"/>
        /// then process default Sitecore behavior of checking tests.
        /// </summary>
        /// <param name="args">GetTestToRunArgs arguments.</param>
        public override void Process(GetTestToRunArgs args)
        {
            if (!args.CustomData.TryGetValue(Constants.PageDesignArgsKey, out var pageDesign) || pageDesign == null)
            {
                base.Process(args);
            }
        }
    }
}