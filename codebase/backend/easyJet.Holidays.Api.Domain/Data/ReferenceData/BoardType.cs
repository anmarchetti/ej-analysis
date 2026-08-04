using easyJet.Holidays.Api.Domain.Data.Hotels;

namespace easyJet.Holidays.Api.Domain.Data.ReferenceData
{
    public class BoardType : BaseRefDataType
    {
        public string TrackingId { get; set; }

        public BoardGroup BoardGroup { get; set; }
    }
}
