using Allure.Xunit.Attributes;
using easyJet.Holiday.IntegrationTests.Infrastructure.TestApi;
using easyJet.Holiday.IntegrationTests.Infrastructure.xUnit.Attributes;
using easyJet.Holiday.IntegrationTests.Shared.Constants;
using easyJet.Holiday.IntegrationTests.Shared.Models.Offer;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using FluentAssertions;
using Force.DeepCloner;
using Refit;
using System.Net;
using Xunit.Abstractions;
using Offer = easyJet.Holidays.Api.Domain.Data.PackageOffers.Offer;
using Person = easyJet.Holidays.Api.Domain.Data.Guests.Person;

namespace easyJet.Holiday.IntegrationTests.Tests.Search;

[AllureSuite("Search tests")]
[AllureSubSuite("Alternative accommodations")]
[AllureOwner("MARS team")]
public class SearchPackages : BaseTest
{
    private const int MaxAttempts = 5;
    private Random _random = new();
    private readonly ITestOutputHelper _output;

    public SearchPackages(ITestOutputHelper output, IHttpClientFactory _httpClientFactory, TestApiHttpClient testApiHttpClient, ITestOutputHelper testOutputHelper)
        : base(_httpClientFactory, testApiHttpClient, testOutputHelper)
    {
        _output = output;
    }

    [EnvironmentSpecificFact("QA")]
    public async Task SearchAndValidateTGXPackage()
    {
        var packagesRequest = new GetPackagesRequest
        {
            StartDate = DateTime.UtcNow.AddDays(_random.Next(100, 150)).Date.ToString("yyyy-MM-dd"),
            Duration = 7,
            Departure = OfferConstants.RegionConstants.DepartureAirports.LondonGatwick,
            Geography = OfferConstants.AllDestinations,
            Adults = 2,
            Take = 30,
            SearchType = "normal",
            PlacementId = "hotel_list"
        };

        (var validateResponse, var attempt) = await LookupAllSearchPages(packagesRequest);

        _output.WriteLine($"attempts taken: {attempt + 1}");
        validateResponse.Should().NotBeNull();
        validateResponse.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    private static bool IsTravelGateCode(string code)
    {
        return code.StartsWith("Z");
    }

    private async Task<ApiResponse<ValidateBookingResponse>> ValidateOffer(ApiResponse<GetOffersResponse> offersResponse)
    {
        var validateBookingRequest = new ValidateBookingRequest
        {
            ExtraLuggageInfo = offersResponse!.Content!.Offers.First().ExtraLuggageInfo.DeepClone(),
            Offer = offersResponse!.Content!.Offers.First(),
            Guests = new List<Person>
            {
                new()
                {
                    Age = 30,
                    Sex = Sex.Unknown,
                    Type = PersonType.Adult
                },
                new()
                {
                    Age = 30,
                    Sex = Sex.Unknown,
                    Type = PersonType.Adult
                }
            },
        };

        var validateResponse = await bookingApi.ValidatePackage(validateBookingRequest);
        return validateResponse;
    }

    private async Task<ApiResponse<GetOffersResponse>> GetOfferWithAlteredRoom(GetPackagesRequest packagesRequest, Offer offer, Unit newUnit)
    {
        var newOffersRequest = new GetOffersRequest
        {
            StartDate = packagesRequest.StartDate,
            Duration = new List<int> { packagesRequest.Duration },
            Departure = packagesRequest.Departure,
            Adults = packagesRequest.Adults,
            RoomCode = newUnit!.Code,
            AccommodationId = newUnit.AccommodationId,
            PackageId = newUnit.PackageId,
            OutboundRouteId = offer!.Transport.Routes.First().Id,
            InboundRouteId = offer.Transport.Routes.Last().Id,
            Transfer = offer.Transfers.First().Id,
            BoardType = newUnit.Board,
            AltAccommodationId = offer.Accom.Code,
            AltPackageId = offer.Accom.PackageId,
            IsExt = true
        };
        var offersResponse = await offersApi.GetOffers(newOffersRequest);
        return offersResponse;
    }

    private async Task<(ApiResponse<ValidateBookingResponse> validateResponse, int lastAttemptNumber)> LookupAllSearchPages(GetPackagesRequest packagesRequest)
    {
        ApiResponse<GetPackagesResponse> packagesResponse;
        ApiResponse<ValidateBookingResponse> validateResponse = default!;
        int lastPage = 0;
        var currentPage = 0;
        var attemptNumber = 0;
        do
        {
            packagesRequest.Page = currentPage;
            packagesResponse = await searchApi.GetPackages(packagesRequest);
            packagesResponse.StatusCode.Should().Be(HttpStatusCode.OK);

            if (lastPage == 0)
            {
                lastPage = (int)packagesResponse.Content.Status.Total / packagesRequest.Take;
            }

            var offers = packagesResponse.Content.Offers.Where(x =>
                x.AlternativeAccommodations.Any(y => IsTravelGateCode(y.Code))).ToArray();

            if (!offers.Any())
            {
                currentPage++;
                continue;
            }

            (validateResponse, attemptNumber) = await FindAndValidateOffersOnPage(offers, packagesRequest, attemptNumber);

            if (validateResponse != null && validateResponse.StatusCode == HttpStatusCode.OK)
            {
                return (validateResponse, attemptNumber);
            }

            currentPage++;
        } while (currentPage < lastPage && attemptNumber < MaxAttempts);

        return (validateResponse, attemptNumber)!;
    }

    private async Task<(ApiResponse<ValidateBookingResponse> validateResponse, int attempt)> FindAndValidateOffersOnPage(Offer[] offers, GetPackagesRequest packagesRequest, int attempt)
    {
        foreach (var offer in offers)
        {
            var alternativeAccommodation = offer.AlternativeAccommodations.First(x => IsTravelGateCode(x.Code));

            var initialOffersRequest = new GetOffersRequest
            {
                StartDate = packagesRequest.StartDate,
                Duration = new List<int> { packagesRequest.Duration },
                Departure = packagesRequest.Departure,
                Adults = packagesRequest.Adults,
                RoomCode = offer.Accom.Unit.First().Code,
                AccommodationId = offer.Accom.Code,
                PackageId = offer.Accom.PackageId,
                OutboundRouteId = offer.Transport.Routes.First().Id,
                InboundRouteId = offer.Transport.Routes.Last().Id,
                Transfer = offer.Transfers.First().Id,
                BoardType = offer.Accom.Unit.First().Board,
                AltAccommodationId = alternativeAccommodation.Code,
                AltPackageId = alternativeAccommodation.PackageId
            };

            var offersAlterationsResponse = await offersApi.GetOffersAlterations(initialOffersRequest);
            var newUnit = offersAlterationsResponse?.Content?.Rooms.FirstOrDefault()
                .FirstOrDefault(x => x.AccommodationId.StartsWith("Z"));

            if (newUnit?.Board == offer.Accom.Unit.First().Board)
            {
                var offerWithAlteredRoomResponse = await GetOfferWithAlteredRoom(packagesRequest, offer, newUnit);

                var validateResponse = await ValidateOffer(offerWithAlteredRoomResponse);

                if (validateResponse.StatusCode == HttpStatusCode.OK)
                {
                    return (validateResponse, attempt);
                }

                attempt++;
            }

            if (attempt >= MaxAttempts)
            {
                break;
            }

        }

        return (null, attempt)!;
    }
}