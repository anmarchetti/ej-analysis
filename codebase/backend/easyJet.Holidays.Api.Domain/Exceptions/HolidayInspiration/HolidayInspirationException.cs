namespace easyJet.Holidays.Api.Domain.Exceptions.HolidayInspiration
{
    /// <summary>
    /// Base class for Holiday Inspiration related exceptions
    /// </summary>
    public class HolidayInspirationException : Exception
    {
        /// <summary>
        /// Initializes new instance of the HolidayInspirationException class.
        /// </summary>
        public HolidayInspirationException()
        {
        }

        /// <summary>
        /// Initializes new instance of the HolidayInspirationException class.
        /// </summary>
        public HolidayInspirationException(string message, Exception innerException) : base(message, innerException)
        {
        }

        /// <summary>
        /// Initializes new instance of the HolidayInspirationException class.
        /// </summary>
        /// <param name="message"></param>
        public HolidayInspirationException(string message) : base(message)
        {
        }

        /// <summary>
        /// Exception indicating an error during filtering destinations by routes availability
        /// </summary>
        public static HolidayInspirationException FailedToFilterByRoutesAvailability(Exception innerException) => new("Can not filter by routes availability.", innerException);

        /// <summary>
        /// Exception indicating an error during filtering destinations by weather
        /// </summary>
        public static HolidayInspirationException FailedToFilterByWeather(Exception innerException) => new("Can not filter by weather.", innerException);
    }
}
