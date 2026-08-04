using easyJet.Holidays.Api.Domain.Data.PackageOffers.RoomVariants;
using Refit;

namespace easyJet.Holiday.IntegrationTests.Shared.Decorators
{
    public class RoomVariantsSearchRequestDecorator : RoomVariantsSearchRequest
    {
        [AliasAs("room[0].adults")]
        public int Adult { get; set; }
        [AliasAs("room[0].children")]
        public int Children { get; set; }
        [AliasAs("room[0].infants")]
        public int Infant { get; set; }
        [AliasAs("room[0].roomCode")]
        public string RoomCode { get; set; }
    }
}
