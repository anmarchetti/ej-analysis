namespace easyJet.Holidays.Api.Domain.Data.PackageOffers.RoomVariants
{
    public class RoomVariantsResponse
    {
        public List<SearchOffersResponse> SearchOffersResponses { get; set; } = new();

        public List<AltBoardType> AltBoards { get; set; } = new();
    }
}
