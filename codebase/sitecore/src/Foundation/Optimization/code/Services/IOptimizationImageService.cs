using System.IO;
using Sitecore.Resources.Media;

namespace easyJet.Foundation.Optimization.Services
{
    public interface IOptimizationImageService
    {
        /// <summary>
        /// Optimize the image.
        /// </summary>
        /// <param name="inputStream">The unoptimized media stream.</param>
        /// <param name="options">The media options.</param>
        /// <returns>Optimized stream.</returns>
        Stream Optimize(MediaStream inputStream, MediaOptions options);
    }
}
