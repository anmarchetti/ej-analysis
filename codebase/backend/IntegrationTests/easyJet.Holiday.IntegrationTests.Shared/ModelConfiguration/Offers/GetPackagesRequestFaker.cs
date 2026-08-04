using Bogus;
using easyJet.Holiday.IntegrationTests.Shared.Constants;
using easyJet.Holiday.IntegrationTests.Shared.Models.Offer;

namespace easyJet.Holiday.IntegrationTests.Shared.ModelConfiguration.Offers;

public class GetPackagesRequestFaker : Faker<GetPackagesRequest>
{
    public GetPackagesRequestFaker()
    {
        RuleFor(x => x.StartDate, f => f.Date.Between(DateTime.Now.AddDays(100), DateTime.Now.AddDays(150)).Date.ToString("yyyy-MM-dd"));
        RuleFor(x => x.Duration, f => f.Random.Int(7, 14));
        RuleFor(x => x.Departure, f => f.PickRandom(OfferConstants.DepartureAirportList["UK"]));
        RuleFor(x => x.Geography, string.Join('|',OfferConstants.RandomGeographyList));
        RuleFor(x => x.OriginalGeography, string.Join('|',OfferConstants.RandomGeographyList));
        RuleFor(x => x.Destinations, ["country:ES", "country:PT"]);
        RuleFor(x => x.Adults, GuestsConstants.DefaultNumberOfAdults);
        RuleFor(x => x.Children, 0);
        RuleFor(x => x.Infants, 0);
        RuleFor(x => x.Take, 20);
        RuleFor(x => x.Page, 1);
        RuleFor(x => x.SearchType, "normal");
        RuleFor(x => x.PlacementId, "hotel_list");
    }
}