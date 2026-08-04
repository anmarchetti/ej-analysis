using System.Diagnostics.CodeAnalysis;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Logger;

namespace easyJet.Foundation.ExternalExtras.Logging
{
    [ExcludeFromCodeCoverage]
    [Service(typeof(IExternalExtrasLogger), Lifetime = Lifetime.Singleton)]
    public class ExternalExtrasLogger : BaseLogger, IExternalExtrasLogger
    {
        private const string LoggerName = "easyJet.Foundation.ExternalExtras.Logger";

        public ExternalExtrasLogger()
            : base(LoggerName)
        {
        }
    }
}