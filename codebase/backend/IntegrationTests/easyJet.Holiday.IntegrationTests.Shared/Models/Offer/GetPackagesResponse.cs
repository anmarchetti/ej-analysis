using easyJet.Holidays.Api.Domain.Data.PackageOffers;

namespace easyJet.Holiday.IntegrationTests.Shared.Models.Offer;

public class GetPackagesResponse
{
    public Holidays.Api.Domain.Data.PackageOffers.Offer[] Offers { get; set; }
    public Status Status { get; set; }
}