using AutoFixture.Xunit3;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.ComponentTests.Shared;
using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Tests.Domain;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using FluentAssertions.Execution;
using System.Net;
using System.Text.Json.Nodes;
using Xunit;


namespace easyJet.Holidays.Api.ComponentTests.Search;

/// <summary>
/// Component tests for <see cref="SearchController"/>
/// </summary>
public class SearchControllerOffersAlterationsTests : BaseComponentTest
{
    [Trait("Api", "/api/v1.0/search/offers-alterations")]
    [Trait("Category", "Component")]
    [Theory]
    [InlineAutoData("Valid request", "startDate=2020-08-13&duration=7&departure=LGW&room[0].adults=2&accommodationId=ESMJ0007&outboundRouteId=171501/3132&inboundRouteId=173148/3357&packageId=203226/2/955/7", HttpStatusCode.OK)]
    [InlineAutoData("No accommodation", "startDate=2020-08-13&duration=7&departure=LGW&room[0].adults=2&accommodationId=&outboundRouteId=171501/3132&inboundRouteId=173148/3357&packageId=203226/2/955/7", HttpStatusCode.BadRequest)]
    [InlineAutoData("No package id", "startDate=2020-08-13&duration=7&departure=LGW&room[0].adults=2&accommodationId=ESMJ0007&outboundRouteId=171501/3132&inboundRouteId=173148/3357&packageId=", HttpStatusCode.BadRequest)]
    [InlineAutoData("No outbound route", "startDate=2020-08-13&duration=7&departure=LGW&room[0].adults=2&accommodationId=ESMJ0007&outboundRouteId=&inboundRouteId=173148/3357&packageId=203226/2/955/7", HttpStatusCode.BadRequest)]
    [InlineAutoData("No inbound route", "startDate=2020-08-13&duration=7&departure=LGW&room[0].adults=2&accommodationId=ESMJ0007&outboundRouteId=171501/3132&inboundRouteId=&packageId=203226/2/955/7", HttpStatusCode.BadRequest)]
    [InlineAutoData("No room", "startDate=2020-08-13&duration=7&departure=LGW&accommodationId=ESMJ0007&outboundRouteId=171501/3132&inboundRouteId=&packageId=203226/2/955/7", HttpStatusCode.BadRequest)]
    public async Task OffersAlterations_ValidateRequest(string because, string queryString, HttpStatusCode status)
    {
        // Arrange 
        var query = $"/api/v1.0/search/offers-alterations?{queryString}";

        // Act
        var response = await Client.GetAsync(query);

        // Assert
        using (new AssertionScope())
        {
            response.StatusCode.Should().Be(status, because);
        }
    }

    [Trait("Api", "/api/v1.0/search/offers-alterations")]
    [Trait("Category", "Component")]
    [Theory]
    [InlineAutoData("startDate=2020-08-13&duration=7&departure=LGW&room[0].adults=2&accommodationId=ESMJ0007&outboundRouteId=171501/3132&inboundRouteId=173148/3357&packageId=203226/2/955/7")]
    public async Task OffersAlterations_AtcomError_500WithErrorCode(string queryString)
    {
        await this.VerifyWhenAtcomThrowsError(
            builder => builder.WithPath("/fcgi-bin/ezydmouk/avcache3_g")
                .WithParam("s_tp", "6")
                .UsingGet(),
            $"/api/v1.0/search/offers-alterations?{queryString}",
            ApiExceptionCodes.SearchPackagesError
        );
    }

    [Trait("Api", "/api/v1.0/search/offers-alterations")]
    [Trait("Category", "Component")]
    [Theory]
    [InlineAutoData("startDate=2020-08-13&duration=7&departure=LGW&room[0].adults=2&accommodationId=ESMJ0007&outboundRouteId=171501/3132&inboundRouteId=173148/3357&packageId=203226/2/955/7")]
    public async Task OffersAlterations_Atcom200InvalidFormat_500WithErrorCode(string queryString)
    {
        await this.VerifyWhenAtcomResponseIsNotValidXml(
            builder => builder.WithPath("/fcgi-bin/ezydmouk/avcache3_g")
                .WithParam("s_tp", "6")
                .UsingGet(),
            $"/api/v1.0/search/offers-alterations?{queryString}",
            ApiExceptionCodes.SearchPackagesError,
            "invalid xml response data"
        );
    }

    [Trait("Api", "/api/v1.0/search/offers-alterations")]
    [Trait("Category", "Component")]
    [Theory]
    [InlineAutoData("startDate=2020-08-13&duration=7&departure=LGW&room[0].adults=2&accommodationId=NOROOMS&outboundRouteId=171501/3132&inboundRouteId=173148/3357&packageId=203226/2/955/7")]
    public async Task OffersAlterations_NoRoomsFromAtcom_404NotFoundResponse(string queryString)
    {
        // Arrange 
        var query = $"/api/v1.0/search/offers-alterations?{queryString}";

        // Act
        var response = await Client.GetAsync(query);
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        using (new AssertionScope())
        {
            // Should be 404 not found response
            response.StatusCode.Should().Be(HttpStatusCode.NotFound);
            content.Should().Be("No offers");
        }
    }

    [Trait("Api", "/api/v1.0/search/offers-alterations")]
    [Trait("Category", "Component")]
    [Theory]
    [InlineAutoData("startDate=2020-08-13&duration=7&departure=LGW&accommodationId=ESMJ0007&outboundRouteId=171627/3150&inboundRouteId=173274/3375&packageId=229210/2/997/7&room[0].adults=2&room[1].adults=1")]
    public async Task OffersAlterations_ValidResponse_MapResponseWithCmsData(string queryString)
    {
        // Arrange 
        var expectedResponse = ObjectUtils.MinifyJson(await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(),
            "__admin", "files", "WebApi", "offers_alterations_for_ESMJ0007.json")));
        var query = $"/api/v1.0/search/offers-alterations?{queryString}";

        // Act
        var response = await Client.GetAsync(query);
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        using (new AssertionScope())
        {
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            content.Should().Be(expectedResponse);
        }
    }

    [Trait("Api", "/api/v1.0/search/offers-alterations")]
    [Trait("Category", "Component")]
    [Theory]
    [InlineAutoData("startDate=2020-06-10&flexibleDays=3&duration=7&departure=LGW&room[0].adults=2&room[0].children=0&room[0].infants=0&room[0].roomCode=FAM.CM!NOR.ONLINE%20COM%20OPAQ&accommodationId=X9021412RoomDuplicates&outboundRouteId=E2d9fbb8d09e49b9cdcf2d6a233af903b&inboundRouteId=Edadc68f8f670644ff14a579ccae6749d&packageId=2152650943/2/891/7&boardType=AI")]
    public async Task OffersAlterations_DuplicatedCodes_MapResponseWithCmsData(string queryString)
    {
        // Arrange 
        var expectedResponse = ObjectUtils.MinifyJson(await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(),
            "__admin", "files", "WebApi", "offers_alterations_for_X9021412RoomDuplicates.json")));
        var query = $"/api/v1.0/search/offers-alterations?{queryString}";

        // Act
        var response = await Client.GetAsync(query);
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        using (new AssertionScope())
        {
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            content.Should().Be(expectedResponse);
        }
    }

    [Trait("Api", "/api/v1.0/search/offers-alterations")]
    [Trait("Category", "Component")]
    [Theory]
    [InlineAutoData("startDate=2020-06-10&isFlexible=true&duration=7&departure=LGW&room[0].adults=2&room[0].children=0&room[0].infants=0&room[0].roomCode=FAM.CM!NOR.ONLINE%20COM%20OPAQ&accommodationId=X9021412TGXRoomDuplicates&outboundRouteId=E2d9fbb8d09e49b9cdcf2d6a233af903b&inboundRouteId=Edadc68f8f670644ff14a579ccae6749d&packageId=2152650943/2/891/7&boardType=AI")]
    public async Task OffersAlterations_TGXRooms(string queryString)
    {
        // Arrange 
        var query = $"/api/v1.0/search/offers-alterations?{queryString}";

        // Act
        var response = await Client.GetAsync(query);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var responseContent = ResponseContentHelper.ReadContent<JsonNode>(response);
        responseContent["rooms"]![0]![2]!["code"]!.GetValue<string>().Should().Be("SUI.ST!tgxtest");
    }

    [Trait("Api", "/api/v1.0/search/offers-alterations")]
    [Trait("Category", "Component")]
    [Theory]
    [InlineAutoData("startDate=2020-05-06&duration=7&departure=LGW&room[0].adults=2&room[0].children=0&room[0].infants=0&room[0].roomCode=DBT.ST-2!NOR.CG-PACKAGEHB&accommodationId=X9065039&outboundRouteId=Ef5240b19d965709839acc3e3f1921a2e&inboundRouteId=E3f4279eb4054fb06f453a9c6d4456590&packageId=2151481234/2/856/7&boardType=HB&&isExt=true")]
    public async Task OffersAlterations_ExternalAccomodationSingleRoom_CalculateAltBoards(string queryString)
    {
        await Client.GetAndValidate(
            $"/api/v1.0/search/offers-alterations?{queryString}",
            "__admin", "files", "WebApi", "offers_alterations_X9065039_one_room_response.json");
    }

    [Trait("Api", "/api/v1.0/search/offers-alterations")]
    [Trait("Category", "Component")]
    [Theory]
    [InlineAutoData("startDate=2023-09-26&flexibleDays=0&duration=7&departure=LGW,LTN&room[0].adults=2&room[0].children=0&room[0].infants=0&room[0].roomCode=DB02&accommodationId=ESTF0015&outboundRouteId=2179946923/762777&inboundRouteId=2180431590/808732&packageId=2151620592/2/2094/7&altAcc[0].accId=Z0003702&altAcc[0].packId=2213361173/2/2094/7&boardType=BB")]
    public async Task AlternativeRooms_SitecoreContentForTGXRoom_ShouldPickFromDifferentSources(string queryString)
    {
        // Arrange 
        var query = $"/api/v1.0/search/offers-alterations?{queryString}";

        // Act
        var response = await Client.GetAsync(query);

        // Assert
        using (new AssertionScope())
        {
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var responseContent = ResponseContentHelper.ReadContent<JsonNode>(response);
            responseContent!["rooms"]![0]![6]!["code"]!.GetValue<string>().Should().Be("DB01");
            responseContent["rooms"]![0]![6]!["roomType"]!["title"]!.GetValue<string>().Should().Be("Double room TGX");
        }
    }

    [Trait("Api", "/api/v1.0/search/offers-alterations")]
    [Trait("Category", "Component")]
    [Theory]
    [InlineAutoData("startDate=2023-10-01&flexibleDays=0&duration=7&departure=LGW,LTN,STN&room[0].adults=2&room[0].children=0&room[0].infants=0&room[0].roomCode=FM01&room[1].adults=2&room[1].children=0&room[1].infants=0&room[1].roomCode=FM02&accommodationId=Z0001262&outboundRouteId=E3246f9d0bc21c647b3aec2a3b6e39547&inboundRouteId=E69f8a2a0d413822e87d2fe9a54583121&packageId=2213361103/2/2099/7&altAcc[0].accId=GRRH0054&altAcc[0].packId=2155722482/2/2099/7&boardType=AI&isExt=true")]
    public async Task AlternativeRooms_SitecoreContentForTGXRooms_ShouldPickFromDifferentSources(string queryString)
    {
        // Arrange 
        var query = $"/api/v1.0/search/offers-alterations?{queryString}";

        // Act
        var response = await Client.GetAsync(query);

        // Assert
        using (new AssertionScope())
        {
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var responseContent = await ResponseContentHelper.ReadContentAsync<JsonNode>(response);
            responseContent["rooms"]![0]![0]!["code"]!.GetValue<string>().Should().Be("TW02");
            responseContent["rooms"]![0]![0]!["roomType"]!["title"]!.GetValue<string>().Should().Be("Double Room with Garden View static");
            responseContent["rooms"]![1]![0]!["code"]!.GetValue<string>().Should().Be("TW02");
            responseContent["rooms"]![1]![0]!["roomType"]!["title"]!.GetValue<string>().Should().Be("Double Room with Garden View dynamic");
        }

    }
}