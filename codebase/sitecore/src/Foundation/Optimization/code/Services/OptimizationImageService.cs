using System.IO;
using Dianoga;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.PushNotifications.Logging;
using Sitecore.Diagnostics;
using Sitecore.Resources.Media;

namespace easyJet.Foundation.Optimization.Services
{
    [Service(typeof(IOptimizationImageService), Lifetime = Lifetime.Singleton)]
    public class OptimizationImageService : IOptimizationImageService
    {
        private readonly MediaOptimizer optimizer;
        private readonly IOptimizationLogger logger;

        public OptimizationImageService(IOptimizationLogger logger)
            : this(logger, new MediaOptimizer())
        {
        }

        protected OptimizationImageService(IOptimizationLogger logger, MediaOptimizer optimizer)
        {
            this.logger = logger;
            this.optimizer = optimizer;
        }

        /// <inheritdoc/>
        public Stream Optimize(MediaStream inputStream, MediaOptions options)
        {
            Assert.ArgumentNotNull(inputStream, nameof(inputStream));
            Assert.ArgumentNotNull(options, nameof(options));

            var mediaPath = inputStream.MediaItem.MediaPath;
            if (!inputStream.AllowMemoryLoading)
            {
                logger.Warn($"Could not resize image as it was larger than the maximum size allowed for memory processing. Media item: {mediaPath}", this);
                return inputStream.Stream;
            }

            MediaStream optimizedOutputStream = optimizer.Process(inputStream, options);

            if (optimizedOutputStream != null && inputStream.Stream != optimizedOutputStream.Stream)
            {
                inputStream.Dispose();

                return optimizedOutputStream.Stream;
            }
            else
            {
                logger.Warn($"{mediaPath} cannot be optimized due to media type or path exclusion", this);
            }

            return inputStream.Stream;
        }
    }
}