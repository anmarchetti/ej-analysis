using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.AWS.Models.RequestedPrice
{
    /// <summary>  
    /// Represents the response body containing requested price settings.  
    /// </summary>  
    public class RequestedPriceSettingsResponseBody
    {
        /// <summary>  
        /// Gets or sets the collection of named search responses.  
        /// </summary>  
        public required IEnumerable<NamedSearchResponse> RequestedSearches { get; set; }
    }

    /// <summary>  
    /// Represents the API response for requested price settings.  
    /// </summary>  
    public class RequestedPriceSettingsResponse : JsonApiResponse<RequestedPriceSettingsResponseBody>
    {
        /// <summary>  
        /// Gets the API errors associated with the response.  
        /// Returns null as response body errors are not handled.  
        /// </summary>  
        public override ApiError[] ApiErrors => []; // Don't handle response body errors  
    }
}
