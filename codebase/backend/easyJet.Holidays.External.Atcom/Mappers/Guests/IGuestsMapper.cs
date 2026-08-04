using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.External.Atcom.Models.Internal;

namespace easyJet.Holidays.External.Atcom.Mappers.Guests
{
    public interface IGuestsMapper
    {
        /// <summary>
        /// Map Passenger from Atcom to our model
        /// </summary>
        /// <param name="pax"></param>
        /// <returns></returns>
        PersonWithDetails MapGuest(Pax pax);

        /// <summary>
        /// Map Booking customer details to LeadPassenger (the same model)
        /// </summary>
        /// <param name="pax"></param>
        /// <returns></returns>
        LeadPassenger MapLeadPassenger(Pax pax, Models.Internal.Person customerDetails);

        Pax[] Map(IEnumerable<PersonWithDetails> personWithDetails);
    }
}
