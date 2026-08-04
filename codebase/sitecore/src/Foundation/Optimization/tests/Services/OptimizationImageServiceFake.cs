using Dianoga;
using easyJet.Foundation.Optimization.Services;
using easyJet.Foundation.PushNotifications.Logging;

namespace easyJet.Foundation.Optimization.Tests.Services
{
    public class OptimizationImageServiceFake : OptimizationImageService
    {
        public OptimizationImageServiceFake(IOptimizationLogger logger, MediaOptimizer optimizer)
            : base(logger, optimizer)
        {
        }
    }
}
