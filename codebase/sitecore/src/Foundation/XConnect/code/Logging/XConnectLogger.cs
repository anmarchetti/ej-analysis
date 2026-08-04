using System.Diagnostics.CodeAnalysis;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Logger;

namespace easyJet.Foundation.XConnect.Common.Logging
{
    [ExcludeFromCodeCoverage]
    [Service(typeof(IXConnectLogger), Lifetime = Lifetime.Singleton)]
    public class XConnectLogger : BaseLogger, IXConnectLogger
    {
        private const string LoggerName = "easyJet.Foundation.XConnect.Logger";

        public XConnectLogger()
            : base(LoggerName)
        {
        }
    }
}