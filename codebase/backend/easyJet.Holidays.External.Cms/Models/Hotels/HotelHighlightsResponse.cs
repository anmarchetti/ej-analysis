using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.Hotels
{
    /// <inheritdoc />
    public class HotelHighlightsResponse : JsonApiResponse<IEnumerable<HotelHighlightsData>>
    {
        /// <inheritdoc />
#pragma warning disable S1168 // S1168: "Empty arrays and collections should be removed" - this is a valid case for an empty response
        public override ApiError[] ApiErrors => null;
#pragma warning restore S1168
    }
}
