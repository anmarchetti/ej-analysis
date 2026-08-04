using Bogus;
using easyJet.Holiday.IntegrationTests.Shared.Constants;
using easyJet.Holidays.Api.Domain.Data.Guests;

namespace easyJet.Holiday.IntegrationTests.Shared.ModelConfiguration.Booking;

public class BasePersonWithDetailsFaker : Faker<PersonWithDetails>
{
    public BasePersonWithDetailsFaker(PersonType personType, int minAge, int maxAge) : base(locale: "en")
    {
        RuleFor(x => x.Sex, f => Sex.Unknown);
        Rules((f, x) =>
        {
            var age = f.Random.Int(minAge, maxAge);
            x.Age = age;
            x.DateOfBirth = DateTimeOffset.Now.AddYears(-age);
        });
        RuleFor(x => x.FirstName, f => f.Name.FirstName());
        RuleFor(x => x.LastName, f => f.Name.LastName());
        RuleFor(x => x.Title, f => f.PickRandom(CustomerConstants.CustomerTitleList));
        RuleFor(x => x.IsLead, false);
        RuleFor(x => x.Type, personType);
        RuleFor(x => x.NotBornYet, false);
    }
}