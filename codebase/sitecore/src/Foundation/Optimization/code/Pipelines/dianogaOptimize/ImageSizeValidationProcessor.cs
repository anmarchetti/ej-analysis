using Dianoga.Processors;
using easyJet.Foundation.Optimization.Utils;
using easyJet.Foundation.PushNotifications.Logging;
using Sitecore.Configuration;

namespace easyJet.Foundation.Optimization.Pipelines.dianogaOptimize
{
    public class ImageSizeValidationProcessor
    {
        private static readonly int MinImageSizeInKb = Settings.GetIntSetting("Optimization.MinImageSize", 50);
        private readonly IOptimizationLogger logger;

        public ImageSizeValidationProcessor(IOptimizationLogger logger)
        {
            this.logger = logger;
        }

        public virtual void Process(ProcessorArgs args)
        {
            var imageSizeInKb = BytesConverter.ConvertToKilobytes(args.InputStream.MediaItem.Size);
            if (imageSizeInKb < MinImageSizeInKb)
            {
                logger.Warn($"{args.InputStream.MediaItem.MediaPath} cannot be optimized due to image size {imageSizeInKb} less than min image size {MinImageSizeInKb}", this);
                args.AbortPipeline();
            }
        }
    }
}