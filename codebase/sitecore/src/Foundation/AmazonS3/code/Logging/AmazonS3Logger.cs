using System.Diagnostics.CodeAnalysis;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Logger;

namespace easyJet.Foundation.AmazonS3.Logging
{
    [ExcludeFromCodeCoverage]
    [Service(typeof(IAmazonS3Logger), Lifetime = Lifetime.Singleton)]
    public class AmazonS3Logger : BaseLogger, IAmazonS3Logger
    {
        private const string LoggerName = "easyJet.Foundation.AmazonS3.Logger";

        public AmazonS3Logger()
            : base(LoggerName)
        {
        }
    }
}