using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.AWS.FreeNightsDataSync.Models
{
    public class FreeNightsResponse : JsonApiResponse<FreeNight[]>
    {
        public override ApiError[] ApiErrors => null; // Don't handle response body errors
    }

    public class FreeNight
    {
        public string AccommodationCode { get; set; }

        public string AccommodationName { get; set; }

        public string RoomCode { get; set; }

        public DateTime? TravelStartDate { get; set; }

        public DateTime? TravelEndDate { get; set; }

        public int? CurrentStay { get; set; }

        public int? CurrentFree { get; set; }

        public int? MinStay { get; set; }
    }
}