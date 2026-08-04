using easyJet.Holidays.Api.Domain.Data.Guests;

namespace easyJet.Holiday.IntegrationTests.Shared.ModelConfiguration.Booking;

public class ChildFaker : BasePersonWithDetailsFaker
{
    public ChildFaker() : base(PersonType.Child, 3, 14)
    {
    }
}