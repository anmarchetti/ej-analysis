using Allure.Xunit.Attributes;
using easyJet.Holiday.IntegrationTests.Infrastructure.Repeat;
using easyJet.Holiday.IntegrationTests.Infrastructure.TestApi;
using easyJet.Holiday.IntegrationTests.Shared.Models.Offer;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.AccommodationOffer;
using FluentAssertions;
using System.Globalization;
using Xunit.Abstractions;

namespace easyJet.Holiday.IntegrationTests.Tests.Shortlist
{
    [AllureSuite("Shortlist tests")]
    [AllureOwner("NEPTUNE team")]
    public class ShortlistTests(IHttpClientFactory _httpClientFactory, TestApiHttpClient testApiHttpClient, ITestOutputHelper testOutputHelper) : BaseTest(_httpClientFactory, testApiHttpClient, testOutputHelper)
    {
        [Fact]
        public async Task GetShortlistSummary_ReturnsAllUserShortlistedOffers()
        {
            var offerCreateParams = new OfferSearchParams
            {
                FlexibleDays = 3,
                Count = 5
            };

            var orderedOffers =
                await RepeatDecorator<Offer[]>
                .Create()
                .RepeatTimes(5)
                .Execute(async () =>
                {
                    var offerResponse = await SearchOffersStep(new SearchOffersRequest { OfferParameters = offerCreateParams });
                    return offerResponse.Content?.OrderBy(x => x.Accom.PackageId).ToArray() ?? [];
                });

            var customerResponse = await customerTestApi.CreateRandomCustomer();
            var customer = customerResponse.Content;

            ArgumentNullException.ThrowIfNull(customer);

            foreach (var offer in orderedOffers)
            {
                var shortlistRequest = ToShortlistRequest(offer, offerCreateParams);
                await shortlistApi.Create(shortlistRequest, customer.Credentials.LoginCookie);
            }

            var summaryResponse = await shortlistApi.Summary(null, false, customer.Credentials.LoginCookie);

            summaryResponse.Content.Should().NotBeNull();
            summaryResponse.Content!.Offers.Should().NotBeNullOrEmpty();
            summaryResponse.Content.Offers.Count.Should().Be(orderedOffers.Length);
            var orderedSummary = summaryResponse.Content.Offers.OrderBy(x => x.Accom.PackageId).ToArray();

            for (int i = 0; i < orderedSummary.Length; i++)
            {
                orderedSummary[i].Accom.PackageId.Should().Be(orderedOffers[i].Accom.PackageId);
            }
        }

        private static ShortListOfferRequest ToShortlistRequest(Offer offer, OfferSearchParams searchParams)
        {
            return new ShortListOfferRequest
            {
                AccommodationId = offer.Accom.Id,
                BoardType = offer.Accom.Unit[0].BoardType.Code,
                ChildAges = string.Join(',', offer.Accom.Unit[0].Occupation.ChildAges),
                Departure = offer.Transport.OutboundFlight.DepPt,
                Duration = [offer.Stay ?? 0],
                FlexibleDays = searchParams.FlexibleDays,
                IArrAirport = offer.Transport.OutboundFlight.ArrPt,
                IDepAirport = offer.Transport.OutboundFlight.DepPt,
                ITheme = offer.Accom.Theme.Code,
                InboundRouteId = offer.Transport.ReturnFlight.Id,
                IsExt = false,
                OutboundRouteId = offer.Transport.OutboundFlight.Id,
                PackageId = offer.Accom.PackageId,
                Room = [ new RoomAllocation {
                    Adults = offer.Accom.Unit[0].Occupation.Adults,
                    Children = offer.Accom.Unit[0].Occupation.Children,
                    Infants = offer.Accom.Unit[0].Occupation.Infants,
                    RoomCode = offer.Accom.Unit[0].RoomType.Code,
                }],
                StartDate = DateOnly.FromDateTime(offer.Date!.Value).ToString("o", CultureInfo.InvariantCulture),
                Transfer = offer.Transfers[0].Code
            };
        }
    }
}
