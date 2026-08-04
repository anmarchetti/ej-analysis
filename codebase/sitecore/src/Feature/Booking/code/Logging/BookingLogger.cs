using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Logger;

namespace easyJet.Feature.Booking.Logging
{
    [Service(typeof(IBookingLogger))]
    public class BookingLogger : BaseLogger, IBookingLogger
    {
        private const string LoggerName = "easyJet.Feature.Booking.Logger";

        public BookingLogger()
            : base(LoggerName)
        {
        }
    }
}