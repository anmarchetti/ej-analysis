namespace easyJet.Holidays.Api.Domain.Data.AmendBooking.RoomAndBoard
{
    public class AmendRoomVariantsResponse
    {
        public IEnumerable<AmendRoomVariant> RoomVariants { get; set; } = Enumerable.Empty<AmendRoomVariant>();

        public decimal UpsellAmount { get; set; }
    }
}
