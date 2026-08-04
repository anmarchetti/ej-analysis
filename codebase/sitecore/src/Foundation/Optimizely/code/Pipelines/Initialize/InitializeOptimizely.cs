namespace easyJet.Foundation.Optimizely.Pipelines.Initialize
{
    using easyJet.Foundation.SitecoreExtensions.Interfaces;
    using OptimizelySDK;
    using Sitecore.Pipelines;

    /// <inheritdoc />
    public class InitializeOptimizely : IPipelineProcessor<PipelineArgs>
    {
        private readonly IOptimizely optimizely;

        /// <summary>
        /// Initializes a new instance of the <see cref="InitializeOptimizely"/> class.
        /// </summary>
        /// <param name="optimizely">the Optimizely.</param>
        public InitializeOptimizely(IOptimizely optimizely) => this.optimizely = optimizely;

        /// <inheritdoc />
        public void Process(PipelineArgs args)
        {
            // Touch Config to force-start polling
            optimizely.GetOptimizelyConfig();
        }
    }
}