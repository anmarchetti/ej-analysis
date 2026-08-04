using easyJet.Holidays.Api.Domain.Data.Eskel;

namespace easyJet.Holidays.Api.Domain.Interfaces.Eskel
{
    public interface IEskelService
    {
        Task<Data.Eskel.Booking[]> GetBookingsByCreatedDate(DateTime createdDate);
    }
}