using easyJet.Holidays.Api.Domain.Data.Guests;

namespace easyJet.Holiday.IntegrationTests.Shared.ModelConfiguration.Booking;

public class AdultFaker : BasePersonWithDetailsFaker
{
    public AdultFaker() : base(PersonType.Adult, 18, 100)
    {
    }
}