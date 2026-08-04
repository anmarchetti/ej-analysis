using System.Diagnostics.CodeAnalysis;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Logger;

namespace easyJet.Foundation.Voucherify.Logging
{
    [ExcludeFromCodeCoverage]
    [Service(typeof(IVoucherifyLogger), Lifetime = Lifetime.Singleton)]
    public class VoucherifyLogger : BaseLogger, IVoucherifyLogger
    {
        private const string LoggerName = "easyJet.Foundation.Voucherify.Logger";

        public VoucherifyLogger()
            : base(LoggerName)
        {
        }
    }
}