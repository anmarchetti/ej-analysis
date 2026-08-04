using easyJet.Holidays.External.Atcom.Models.InfoBooking;

namespace easyJet.Holidays.External.Atcom.Models.Search
{
    /// <summary>
    /// Represents a request to search for alternative hotel rooms.
    /// </summary>
    public class SearchAlternativeHotelRoomsRequest : AtcomApiRequest<object>
    {
        /// <summary>
        /// Gets the namespace for the request. 
        /// This implementation returns an empty string as no request body is required.
        /// </summary>
        protected override string RequestNamespace => string.Empty; // No request body, doesn't matter

        /// <summary>
        /// Gets the HTTP method used for the request.
        /// This implementation uses the HTTP GET method.
        /// </summary>
        public override HttpMethod Method => HttpMethod.Get;
    }
}