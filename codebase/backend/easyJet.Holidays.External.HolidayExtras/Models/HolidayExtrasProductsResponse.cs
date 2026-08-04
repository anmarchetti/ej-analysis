using easyJet.Holidays.Api.Domain.Data.AirportParking;
using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.HolidayExtras.Models
{
    /// <summary>
    /// HX Product Library Response.
    /// </summary>
    public class HolidayExtrasProductsResponse : JsonApiResponse<AirportParkingSearchResponse>
    {
        /// <inheritdoc />
        public override ApiError[] ApiErrors { get; } = null!;
    }
}