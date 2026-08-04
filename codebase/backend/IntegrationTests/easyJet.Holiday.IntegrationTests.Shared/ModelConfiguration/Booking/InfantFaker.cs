using easyJet.Holidays.Api.Domain.Data.Guests;

namespace easyJet.Holiday.IntegrationTests.Shared.ModelConfiguration.Booking;

public class InfantFaker : BasePersonWithDetailsFaker
{
    public InfantFaker() : base(PersonType.Infant, 1, 2)
    {
    }
}