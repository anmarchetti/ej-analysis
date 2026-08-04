using easyJet.Holidays.Api.ComponentTests.Shared;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using FluentAssertions.Execution;
using Newtonsoft.Json;
using System.Net;
using System.Text.Json.Nodes;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.Search;

public class SearchControllerPackagesTests : BaseComponentTest
{
    [Fact]
    public async Task SearchPackages_ValidRequest_ShouldFindPackages()
    {
        // Act
        var url = "/api/v1.0/search/packages?startDate=2023-06-01&endDate=2023-06-10&flexibleDays=0&duration[0]=14&" +
            "departure=LGW,LTN,SEN,STN&geography=MT,MTMT&automaticAllocation=false&room[0].adults=1&room[0].children=0&" +
            "room[0].infants=0&&&take=10&page=1&freeForKidsOnly=false&searchType=normal&distressedFlightsOnly=false&" +
            "placementId=hotels_list&destinations[0]=region:MTMT&minTemp=0&maxTemp=30";
        var response = await Client.GetAsync(url);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = ResponseContentHelper.ReadContent<JsonObject>(response);
        using (new AssertionScope())
        {
            var offers = content["offers"]!.AsArray();
            offers.Count.Should().Be(3);
        }
    }

    [Theory]
    [InlineData("orderBy=discAmount")]
    [InlineData("orderBy=discPercent")]
    [InlineData("orderBy=price")]
    [InlineData("orderBy=smartSeer")]
    [InlineData("orderBy=tripAdvisor")]
    public async Task SearchPackages_WithDifferentSoritngOptions_ShouldFindPackages(string urlParams)
    {
        // Act
        var url = "/api/v1.0/search/packages?startDate=2023-06-01&endDate=2023-06-10&flexibleDays=0&duration[0]=14&" +
            "departure=LGW,LTN,SEN,STN&geography=MT,MTMT&automaticAllocation=false&room[0].adults=1&room[0].children=0&" +
            "room[0].infants=0&&&take=10&page=1&freeForKidsOnly=false&searchType=normal&distressedFlightsOnly=false&" +
           @"placementId=hotels_list&destinations[0]=region:MTMT&minTemp=0&maxTemp=30&" + urlParams;
        var response = await Client.GetAsync(url);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = ResponseContentHelper.ReadContent<JsonObject>(response);
        using (new AssertionScope())
        {
            var offers = content["offers"]!.AsArray();
            offers.Count.Should().Be(3);
        }
    }

    /// <summary>
    /// 32 offer from atcom - files\Atcom\search\s_tp=3_GRSK.xml
    /// giata mapping - mappings\CMS\GetAccommodationIdToGiataMapping_GRSK.json
    /// 21 offers after merging offers (17 offes for unique hotels + 4 offers from both DC and TGX + 7 offers from HBG discarded) 
    /// filters - mappings\CMS\GetAllFilters_GRSK.json
    /// hotels - mappings\CMS\DestinationsSearch_GetHotels_GRSK.json
    /// </summary>
    /// <returns></returns>
    [Fact]
    public async Task SearchPackages_WhenAtcomReturnsPackagesFromDirectContractAndTravelgateForSameHotel_ThenOffersForSameHotelAreMerged()
    {
        // Act
        var query = "api/v1.0/search/packages?duration[0]=7&take=30&page=1&searchType=normal&placementId=hotels_list&" +
            "startDate=2024-08-17&endDate=2024-08-27&flexibleDays=0&departure=LGW&geography=GR,GRSK&automaticAllocation=true&" +
            "room[0].adults=2&room[0].children=0&room[0].infants=0&distressedFlightsOnly=false&minTemp=0&maxTemp=30";
        var response = await Client.GetAsync(query);
        var responseJson = await response.Content.ReadAsStringAsync();

        // Assert
        using (new AssertionScope())
        {
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            var expectedResponse = await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(),
                "__admin", "files", "WebApi", "search", "packages-merge", "packages_GRSK_merge_offers_from_DC_n_TGX.json"));
            var expectedOffers = JsonConvert.DeserializeObject<SearchOffersResponse>(expectedResponse);
            var offers = JsonConvert.DeserializeObject<SearchOffersResponse>(responseJson);

            for (var i = 0; i < expectedOffers?.Offers.Count; i++)
            {
                var offer = offers!.Offers[i];
                var expectedOffer = expectedOffers.Offers[i];

                offer.Accom.Code.Should().Be(expectedOffer.Accom.Code);
                offer.Accom.Unit.First().Board.Should().Be(expectedOffer.Accom.Unit.First().Board);
                offer.Price.Should().Be(expectedOffer.Price);
                offer.AlternativeAccommodations.Should().BeEquivalentTo(expectedOffer.AlternativeAccommodations);

                if (expectedOffer.AltBoards.IsNullOrEmpty())
                {
                    offer.AltBoards.Should().BeNullOrEmpty();
                    continue;
                }

                for (var j = 0; j < expectedOffer.AltBoards.Count; j++)
                {
                    var board = offer.AltBoards[j];
                    var expectedBoard = expectedOffer.AltBoards[j];

                    board.AccommodationId.Should().Be(expectedBoard.AccommodationId);
                    board.Code.Should().Be(expectedBoard.Code);
                    board.PackageId.Should().Be(expectedBoard.PackageId);
                    board.Price.Should().Be(expectedBoard.Price);
                    board.PricePP.Should().Be(expectedBoard.PricePP);
                }
            }
        }
    }

    [Fact]
    public async Task SearchPackages_WithSmartseerSort_ReturnsOrderedOffers()
    {
        // Act

        // smartseer sort is the default option even if nothing is passed in orderBy parameter
        var url = "/api/v1.0/search/packages?duration[0]=7&take=10&page=1&searchType=normal&placementId=hotels_list&" +
            "startDate=2024-07-07&endDate=2024-07-17&flexibleDays=0&departure=LTN&geography=ES,ESFU&automaticAllocation=true&" +
            "room[0].adults=2&room[0].children=0&room[0].infants=0&distressedFlightsOnly=false&minTemp=0&maxTemp=30";
        var httpResponse = await Client.GetAsync(url);

        // Assert
        httpResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var responseJson = await httpResponse.Content.ReadAsStringAsync();
        var searchResponse = JsonConvert.DeserializeObject<SearchOffersResponse>(responseJson);

        using (new AssertionScope())
        {
            //order and sponsored flag should be same as in smartseer sort_ESFU.json
            searchResponse?.Offers.Select(x => x.Accom.Id).Should()
                .Equal(new string[] { "ESFU0051", "ESFU0013", "ESFU0024", "ESFU0025", "ESFU0005", "ESFU0004", "ESFU0054", "ESFU0029", "ESFU0034", "ESFU0018" });

            searchResponse?.Offers.Single(x => x.Accom.Id == "ESFU0051").IsSponsored.Should().BeTrue();
            searchResponse?.Offers.Where(x => x.Accom.Id != "ESFU0051").Select(x => x.IsSponsored).Should().AllBeEquivalentTo(false);
        }
    }

    // uses: 
    //      shared:
    //          orchestrator\easyJet.Holidays.Api.ComponentTests\__admin\mappings\CMS\GetAllHotelCodes.json
    //          orchestrator\easyJet.Holidays.Api.ComponentTests\__admin\mappings\CMS\Packages_GetHotels_EUX.json
    //          orchestrator\easyJet.Holidays.Api.ComponentTests\__admin\mappings\CMS\GetAllFilters_EUX.json
    //          orchestrator\easyJet.Holidays.Api.ComponentTests\__admin\mappings\CMS\GetAccommodationIdToGiataMapping_ESFU_EUX.json
    //      ch:
    //          orchestrator\easyJet.Holidays.Api.ComponentTests\__admin\mappings\Atcom\search-packages\eux\s_tp=3_ESFU_ch.json
    //          orchestrator\easyJet.Holidays.Api.ComponentTests\__admin\files\Atcom\search\eux\s_tp=3_ESFU_ch.xml
    //      de: 
    //          orchestrator\easyJet.Holidays.Api.ComponentTests\__admin\mappings\Atcom\search-packages\eux\s_tp=3_ESFU_de.json
    //          orchestrator\easyJet.Holidays.Api.ComponentTests\__admin\files\Atcom\search\eux\s_tp=3_ESFU_de.xml
    //      fr:
    //          orchestrator\easyJet.Holidays.Api.ComponentTests\__admin\mappings\Atcom\search-packages\eux\s_tp=3_ESFU_fr.json
    //          orchestrator\easyJet.Holidays.Api.ComponentTests\__admin\files\Atcom\search\eux\s_tp=3_ESFU_fr.xml
    [Theory]
    [InlineData("de-CH", "GVA")]
    [InlineData("fr-CH", "GVA")]
    [InlineData("de-DE", "BER")]
    [InlineData("fr-FR", "CDG")]
    public async Task SearchPackages_ForMarketsOtherThanUK_MapsCorrectSearchEndpoint_ReturnsPackages(string languageCookieValue, string expectedDepAirport)
    {
        // Arrange
        var url = $"/api/v1.0/search/packages?duration[0]=7&take=10&page=1&searchType=normal&placementId=hotels_list&" +
                  $"startDate=2024-07-07&endDate=2024-07-17&flexibleDays=0&departure={expectedDepAirport}&geography=ES,ESFU&automaticAllocation=true&" +
                  "room[0].adults=2&room[0].children=0&room[0].infants=0&distressedFlightsOnly=false&minTemp=0&maxTemp=30";

        using var message = new HttpRequestMessage(HttpMethod.Get, url);
        message.Headers.Add("Cookie", $"holidays#lang={languageCookieValue};");

        // Act
        var httpResponse = await Client.SendAsync(message);

        var responseJson = await httpResponse.Content.ReadAsStringAsync();
        var searchResponse = JsonConvert.DeserializeObject<SearchOffersResponse>(responseJson);

        // Assert
        httpResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        searchResponse.Should().NotBeNull();
        searchResponse!.Offers.Should().NotBeNullOrEmpty();

        searchResponse.Offers[0].Transport.OutboundFlight.DepName.Should().Be(expectedDepAirport);
        searchResponse.Offers[0].Transport.ReturnFlight.ArrName.Should().Be(expectedDepAirport);
    }
}