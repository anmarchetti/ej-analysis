using System.Diagnostics.CodeAnalysis;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Logger;

namespace easyJet.Foundation.HotelBeds.Logging
{
    [ExcludeFromCodeCoverage]
    [Service(typeof(IHotelBedsLogger), Lifetime = Lifetime.Singleton)]
    public class HotelBedsLogger : BaseLogger, IHotelBedsLogger
    {
        private const string LoggerName = "easyJet.Foundation.HotelBeds.Logger";

        public HotelBedsLogger()
            : base(LoggerName)
        {
        }
    }
}