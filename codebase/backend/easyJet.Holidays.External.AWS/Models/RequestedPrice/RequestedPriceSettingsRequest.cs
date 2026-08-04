using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.AWS.Models.RequestedPrice
{
    /// <summary>
    /// Represents a request for retrieving requested price settings.
    /// </summary>
    public class RequestedPriceSettingsRequest : JsonApiRequest<RequestedPriceSettingsRequestBody>
    {
        /// <summary>
        /// Gets the HTTP method for the request, which is GET.
        /// </summary>
        public override HttpMethod Method => HttpMethod.Get;
    }

    /// <summary>
    /// Represents the body of the requested price settings request.
    /// </summary>
    public class RequestedPriceSettingsRequestBody
    {
        /// <summary>
        /// Gets or sets the market code for the request.
        /// </summary>
        public required string MarketCode { get; set; }
    }
}
