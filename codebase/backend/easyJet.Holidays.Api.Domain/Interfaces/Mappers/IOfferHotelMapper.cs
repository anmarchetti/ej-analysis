using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;

namespace easyJet.Holidays.Api.Domain.Interfaces.Mappers;

public interface IOfferHotelMapper
{
    Task<OfferHotel> MapWithoutBoardsRooms(Hotel hotel, string promCode, BaseSearchRequest request = null);

    Task EnrichBoardTypeAndRoomType(Hotel hotelModel, Unit offerUnit, DateTime? startDate = null, int? duration = null);
    Task<Data.PackageOffers.BoardType> GetBoardType(string board, Hotel hotelModel);
    Task<Data.PackageOffers.RoomType> GetRoomType(string roomCode, string roomName, Hotel hotelModel, DateTime? startDate = null, int? duration = null);
    Task EnrichAltBoards(Hotel hotel, Offer offer);
    Task<List<AltBoardType>> EnrichAltBoards(Hotel hotel, IEnumerable<AltBoardType> altBoards);
    Task<AccommodationOffersResponse> BuildAccommodationOffers(Hotel hotelModel, List<Offer> offers, BaseSearchRequest request = null);
}