using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Logger;

namespace easyJet.Foundation.Atcom.Logging
{
    [Service(typeof(IAtcomLogger), Lifetime = Lifetime.Singleton)]
    public class AtcomLogger : BaseLogger, IAtcomLogger
    {
        private const string LoggerName = "easyJet.Foundation.Atcom.Logger";

        public AtcomLogger()
            : base(LoggerName)
        {
        }
    }
}