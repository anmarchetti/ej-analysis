using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.Eskel;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Eskel.Models
{
    public class BookingsResponse : JsonApiResponse<Booking[]>
    {
        public override ApiError[] ApiErrors => null; // Don't handle response body errors
    }
}
