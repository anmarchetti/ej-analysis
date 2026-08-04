namespace easyJet.Holidays.Api.Domain.Extensions
{
    /// <summary>
    /// Provides extension methods for handling hotel-related operations.
    /// </summary>
    public static class HotelExtensions
    {
        /// <summary>
        /// Determines the hotel type based on the provided hotel code.
        /// </summary>
        /// <param name="hotelCode">The code of the hotel to be evaluated.</param>
        /// <returns>
        /// Returns "DI" if the hotel code starts with 'Z', "HBG" if it starts with 'X',
        /// and "DIRECT" for other cases or if the hotel code is null or empty.
        /// </returns>
        public static string GetHotelType(string hotelCode)
        {
            if (!string.IsNullOrEmpty(hotelCode))
            {
                if (hotelCode.StartsWith('Z'))
                {
                    return "DI";
                }
                if (hotelCode.StartsWith('X'))
                {
                    return "HBG";
                }
            }
            return "DIRECT";
        }
    }
}