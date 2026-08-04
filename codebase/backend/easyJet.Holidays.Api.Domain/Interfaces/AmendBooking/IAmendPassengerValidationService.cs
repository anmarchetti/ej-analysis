using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Guests;

namespace easyJet.Holidays.Api.Domain.Interfaces.AmendBooking
{
    public interface IAmendPassengerValidationService
    {
        int CalculateNameChangeCount(IEnumerable<AmendPaxHistoryItem> paxMemo, string passengerId);

        int CalculateNumberChangedCharacters(string oldName, string newName);

        bool IsAmendingLeadPassenger(IEnumerable<PersonWithDetails> guest, string amendPaxId);
    }
}