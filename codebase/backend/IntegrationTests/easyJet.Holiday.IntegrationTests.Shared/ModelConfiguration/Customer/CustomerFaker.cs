using Bogus;
using easyJet.Holiday.IntegrationTests.Shared.Constants;

namespace easyJet.Holiday.IntegrationTests.Shared.ModelConfiguration.Customer;

public sealed class CustomerFaker : Faker<Models.Customers.CustomerInfo>
{
    public CustomerFaker() : base(locale: "en")
    {
        RuleFor(x => x.Address1, f => f.Address.StreetName());
        RuleFor(x => x.City, f => f.Address.City());
        RuleFor(x => x.CountryCode, f => f.PickRandom(CustomerConstants.CustomerCountryCodes));
        RuleFor(x => x.MobilePhone, f => f.Random.Replace("#########"));
        RuleFor(x => x.DialingCode, f => f.Random.Replace("##"));
        RuleFor(x => x.FirstName, f => f.Name.FirstName());
        RuleFor(x => x.LastName, f => f.Name.LastName());
        RuleFor(x => x.Email, f => f.Internet.Email(provider:"test.com"));
        RuleFor(x => x.PostalCode, f => f.Random.Replace("#####"));
        RuleFor(x => x.Title, f => f.PickRandom(CustomerConstants.CustomerTitleList));
    }
}