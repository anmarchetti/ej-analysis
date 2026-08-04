using easyJet.Holidays.External.Atcom.Models.InfoBooking;

namespace easyJet.Holidays.External.Atcom.Models.Search
{
    /// <summary>
    /// Represents a request to search for alternative hotels.
    /// </summary>
    public class SearchAlternativeHotelsRequest : AtcomApiRequest<object>
    {
        /// <summary>
        /// Gets the namespace for the request.
        /// </summary>
        /// <remarks>
        /// This request does not require a specific namespace, hence it returns an empty string.
        /// </remarks>
        protected override string RequestNamespace => string.Empty; // No request body, doesn't matter

        /// <summary>
        /// Gets the HTTP method used for the request.
        /// </summary>
        /// <returns>
        /// An <see cref="HttpMethod"/> representing the HTTP GET method.
        /// </returns>
        public override HttpMethod Method => HttpMethod.Get;
    }
}