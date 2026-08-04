namespace easyJet.Foundation.Optimizely.Logging
{
    using System.Diagnostics.CodeAnalysis;
    using easyJet.Foundation.DependencyInjection;
    using easyJet.Foundation.DependencyInjection.Attributes;
    using easyJet.Foundation.SitecoreExtensions.Logger;

    /// <inheritdoc cref="IOptimizelyLogger" />
    [ExcludeFromCodeCoverage]
    [Service(typeof(IOptimizelyLogger), Lifetime = Lifetime.Singleton)]
    public class OptimizelyLogger : BaseLogger, IOptimizelyLogger
    {
        private const string LoggerName = "easyJet.Foundation.Optimizely.Logger";

        /// <inheritdoc cref="IOptimizelyLogger" />
        public OptimizelyLogger()
            : base(LoggerName)
        {
        }
    }
}