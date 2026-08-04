using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Dates;

namespace easyJet.Holidays.Api.Domain.Interfaces.AmendBooking
{
    public interface IAmendSeatsService
    {
        Task<AmendSeatsResponse> ChangeSeats(AmendSeatsRequest amendSeatsRequest);

        Task<AmendDatesOffer> UpdateSeatsInformation(AmendDatesOffer datesOffer);
    }
}