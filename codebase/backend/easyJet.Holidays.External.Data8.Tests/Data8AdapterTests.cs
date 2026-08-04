using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Data8.Ancillaries;
using easyJet.Holidays.External.Data8.Models;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using System.Net;
using System.Text;
using Xunit;

namespace easyJet.Holidays.External.Data8.Tests;

public class Data8AdapterTests
{
    private const string Country = "GB";

    [Fact]
    public async Task LookupAddress_EmptyInput_ReturnsEmptyResult()
    {
        var handler = new StubHttpMessageHandler((_, _, _) => throw new InvalidOperationException("Should not call HTTP"));
        var sut = CreateSut(handler);

        var result = await sut.LookupAddress(" ", Country);

        result.Items.Should().BeEmpty();
        handler.Requests.Should().BeEmpty();
    }

    [Fact]
    public async Task LookupAddress_WhenSearchResultIsNotContainer_ReturnsSearchResult()
    {
        var handler = new StubHttpMessageHandler((request, body, _) =>
        {
            if (request.RequestUri!.AbsolutePath.EndsWith("Search.json", StringComparison.Ordinal))
            {
                return JsonResponse("""
                    {"Results":[{"Label":"2 King Road","Value":"VAL1","Container":false}]}
                    """);
            }

            throw new InvalidOperationException($"Unexpected endpoint: {request.RequestUri.AbsolutePath}");
        });

        var sut = CreateSut(handler);

        var result = await sut.LookupAddress("2 king road", Country);

        result.Items.Should().HaveCount(1);
        result.Items[0].AddressLine.Should().Be("2 King Road");
        result.Items[0].Id.Should().Be("VAL1");
        handler.Requests.Select(x => x.Path).Should().ContainSingle().Which.Should().Be("PredictiveAddress/Search.json");
        handler.Requests.Should().OnlyContain(x => x.Query.Contains("key=test-api-key", StringComparison.Ordinal));
        handler.Requests.First(x => x.Path == "PredictiveAddress/Search.json").Body.Should().Contain("\"country\":\"GB\"");
        handler.Requests.First(x => x.Path == "PredictiveAddress/Search.json").Body.Should().Contain("\"search\":\"2 king road\"");
        handler.Requests.First(x => x.Path == "PredictiveAddress/Search.json").Body.Should().Contain("\"preferredLanguage\":\"en\"");
    }

    [Fact]
    public async Task LookupAddress_WhenSearchResultIsContainer_UsesDrillDown()
    {
        var handler = new StubHttpMessageHandler((request, body, _) =>
        {
            if (request.RequestUri!.AbsolutePath.EndsWith("Search.json", StringComparison.Ordinal))
            {
                return JsonResponse("""
                    {"Results":[{"Value":"CONTAINER1","Container":true}],"SessionID":"SESSION-1"}
                    """);
            }

            if (request.RequestUri.AbsolutePath.EndsWith("DrillDown.json", StringComparison.Ordinal))
            {
                body.Should().Contain("CONTAINER1");
                body.Should().Contain("\"country\":\"GB\"");
                body.Should().Contain("\"sessionID\":\"SESSION-1\"");
                return JsonResponse("""
                    {"Results":[{"Label":"2 King Road","Value":"VAL2","Container":false}]}
                    """);
            }

            throw new InvalidOperationException($"Unexpected endpoint: {request.RequestUri.AbsolutePath}");
        });

        var sut = CreateSut(handler);

        var result = await sut.LookupAddress("2 king road", Country);

        result.Items.Should().HaveCount(1);
        result.Items[0].Id.Should().Be("VAL2");
        handler.Requests.Select(x => x.Path).Should().ContainInOrder(
            "PredictiveAddress/Search.json",
            "PredictiveAddress/DrillDown.json");
    }

    [Fact]
    public async Task LookupAddress_WhenDrillDownReturnsNestedContainer_ResolvesAllLevels()
    {
        var handler = new StubHttpMessageHandler((request, body, _) =>
        {
            if (request.RequestUri!.AbsolutePath.EndsWith("Search.json", StringComparison.Ordinal))
            {
                return JsonResponse("""
                    {"Results":[{"Value":"CONTAINER1","Container":true}],"SessionID":"SESSION-1"}
                    """);
            }

            if (request.RequestUri.AbsolutePath.EndsWith("DrillDown.json", StringComparison.Ordinal) && body.Contains("CONTAINER1", StringComparison.Ordinal))
            {
                return JsonResponse("""
                    {"Results":[{"Value":"CONTAINER2","Container":true}]}
                    """);
            }

            if (request.RequestUri.AbsolutePath.EndsWith("DrillDown.json", StringComparison.Ordinal) && body.Contains("CONTAINER2", StringComparison.Ordinal))
            {
                return JsonResponse("""
                    {"Results":[{"Label":"2 King Road","Value":"VAL3","Container":false}]}
                    """);
            }

            throw new InvalidOperationException($"Unexpected endpoint: {request.RequestUri.AbsolutePath}");
        });

        var sut = CreateSut(handler);

        var result = await sut.LookupAddress("2 king road", Country);

        result.Items.Should().HaveCount(1);
        result.Items[0].Id.Should().Be("VAL3");
        handler.Requests.Select(x => x.Path).Should().ContainInOrder(
            "PredictiveAddress/Search.json",
            "PredictiveAddress/DrillDown.json",
            "PredictiveAddress/DrillDown.json");
    }

    [Fact]
    public async Task LookupAddress_RemovesDuplicateAddresses()
    {
        var handler = new StubHttpMessageHandler((request, _, _) =>
        {
            if (request.RequestUri!.AbsolutePath.EndsWith("Search.json", StringComparison.Ordinal))
            {
                return JsonResponse("""
                    {"Results":[{"Label":"2 King Road","Value":"VAL1","Container":false},{"Label":"2 King Road","Value":"VAL1","Container":false}]}
                    """);
            }

            throw new InvalidOperationException($"Unexpected endpoint: {request.RequestUri.AbsolutePath}");
        });

        var sut = CreateSut(handler);

        var result = await sut.LookupAddress("2 king road", Country);

        result.Items.Should().HaveCount(1);
    }

    [Fact]
    public async Task LookupAddress_WhenNumberOfResultsConfigured_LimitsReturnedItems()
    {
        var handler = new StubHttpMessageHandler((request, _, _) =>
        {
            if (request.RequestUri!.AbsolutePath.EndsWith("Search.json", StringComparison.Ordinal))
            {
                return JsonResponse("""
                    {"Results":[{"Label":"1 King Road","Value":"VAL1","Container":false},{"Label":"2 King Road","Value":"VAL2","Container":false}]}
                    """);
            }

            throw new InvalidOperationException($"Unexpected endpoint: {request.RequestUri.AbsolutePath}");
        });

        var sut = CreateSut(handler, numberOfResults: 1);

        var result = await sut.LookupAddress("king road", Country);

        result.Items.Should().HaveCount(1);
        result.Items[0].Id.Should().Be("VAL1");
    }

    [Fact]
    public async Task LookupAddress_WhenSearchFails_ReturnsEmptyResult()
    {
        var handler = new StubHttpMessageHandler((request, _, _) =>
        {
            if (request.RequestUri!.AbsolutePath.EndsWith("Search.json", StringComparison.Ordinal))
            {
                return new HttpResponseMessage(HttpStatusCode.InternalServerError);
            }

            throw new InvalidOperationException($"Unexpected endpoint: {request.RequestUri.AbsolutePath}");
        });

        var sut = CreateSut(handler);

        var result = await sut.LookupAddress("2 king road", Country);

        result.Items.Should().BeEmpty();
        handler.Requests.Should().HaveCount(1);
    }

    [Fact]
    public async Task LookupAddress_WhenCancelled_ThrowsOperationCanceledException()
    {
        var handler = new StubHttpMessageHandler((request, _, cancellationToken) =>
        {
            cancellationToken.ThrowIfCancellationRequested();

            if (request.RequestUri!.AbsolutePath.EndsWith("Search.json", StringComparison.Ordinal))
            {
                return JsonResponse("{" + "\"Results\":[]}" );
            }

            throw new InvalidOperationException($"Unexpected endpoint: {request.RequestUri.AbsolutePath}");
        });

        var sut = CreateSut(handler);
        using var cts = new CancellationTokenSource();
        cts.Cancel();

        var act = async () => await sut.LookupAddress("2 king road", Country, cts.Token);

        await act.Should().ThrowAsync<OperationCanceledException>();
    }

    [Fact]
    public async Task LookupAddress_WhenSearchResponseHasNoResultsNode_ReturnsEmpty()
    {
        var handler = new StubHttpMessageHandler((request, _, _) =>
        {
            if (request.RequestUri!.AbsolutePath.EndsWith("Search.json", StringComparison.Ordinal))
            {
                return JsonResponse("{}");
            }

            throw new InvalidOperationException($"Unexpected endpoint: {request.RequestUri.AbsolutePath}");
        });

        var sut = CreateSut(handler);

        var result = await sut.LookupAddress("2 king road", Country);

        result.Items.Should().BeEmpty();
    }

    [Fact]
    public async Task LookupAddress_WhenSearchResponseHasInvalidJson_ReturnsEmpty()
    {
        var handler = new StubHttpMessageHandler((request, _, _) =>
        {
            if (request.RequestUri!.AbsolutePath.EndsWith("Search.json", StringComparison.Ordinal))
            {
                return JsonResponse("{not-valid-json");
            }

            throw new InvalidOperationException($"Unexpected endpoint: {request.RequestUri.AbsolutePath}");
        });

        var sut = CreateSut(handler);

        var result = await sut.LookupAddress("2 king road", Country);

        result.Items.Should().BeEmpty();
    }

    [Fact]
    public async Task LookupAddress_WhenSearchResultHasNoValue_IgnoresEntry()
    {
        var handler = new StubHttpMessageHandler((request, _, _) =>
        {
            if (request.RequestUri!.AbsolutePath.EndsWith("Search.json", StringComparison.Ordinal))
            {
                return JsonResponse("""
                    {"Results":[{"Container":false}]}
                    """);
            }

            throw new InvalidOperationException($"Unexpected endpoint: {request.RequestUri.AbsolutePath}");
        });

        var sut = CreateSut(handler);

        var result = await sut.LookupAddress("2 king road", Country);

        result.Items.Should().BeEmpty();
    }

    [Fact]
    public async Task LookupAddress_WhenContainerMissing_DefaultsToRetrieve()
    {
        var handler = new StubHttpMessageHandler((request, _, _) =>
        {
            if (request.RequestUri!.AbsolutePath.EndsWith("Search.json", StringComparison.Ordinal))
            {
                return JsonResponse("""
                    {"Results":[{"Label":"2 King Road","Value":"VAL1"}]}
                    """);
            }

            throw new InvalidOperationException($"Unexpected endpoint: {request.RequestUri.AbsolutePath}");
        });

        var sut = CreateSut(handler);

        var result = await sut.LookupAddress("2 king road", Country);

        result.Items.Should().HaveCount(1);
        handler.Requests.Select(x => x.Path).Should().ContainSingle().Which.Should().Be("PredictiveAddress/Search.json");
    }

    [Fact]
    public async Task LookupAddress_WhenResponseUsesLowercaseProperties_UsesDrillDown()
    {
        var handler = new StubHttpMessageHandler((request, _, _) =>
        {
            if (request.RequestUri!.AbsolutePath.EndsWith("Search.json", StringComparison.Ordinal))
            {
                return JsonResponse("""
                    {"results":[{"value":"CONTAINER1","container":true}]}
                    """);
            }

            if (request.RequestUri.AbsolutePath.EndsWith("DrillDown.json", StringComparison.Ordinal))
            {
                return JsonResponse("""
                    {"Results":[{"label":"2 King Road","value":"VAL2","container":false}]}
                    """);
            }

            throw new InvalidOperationException($"Unexpected endpoint: {request.RequestUri.AbsolutePath}");
        });

        var sut = CreateSut(handler);

        var result = await sut.LookupAddress("2 king road", Country);

        result.Items.Should().HaveCount(1);
        handler.Requests.Select(x => x.Path).Should().ContainInOrder(
            "PredictiveAddress/Search.json",
            "PredictiveAddress/DrillDown.json");
    }

    [Fact]
    public async Task RetrieveAddress_SendsRetrieveRequestAndReturnsAddress()
    {
        var handler = new StubHttpMessageHandler((request, _, _) =>
        {
            if (request.RequestUri!.AbsolutePath.EndsWith("Retrieve.json", StringComparison.Ordinal))
            {
                return JsonResponse("""
                    {"Result":{"Address":{"Lines":["2 King Road","Heath Grove","","","Nottingham","Nottinghamshire","NG1 1AA"]}}}
                    """);
            }

            throw new InvalidOperationException($"Unexpected endpoint: {request.RequestUri.AbsolutePath}");
        });

        var sut = CreateSut(handler);

        var result = await sut.RetrieveAddress("VAL1", Country);

        var requestBody = handler.Requests.First(x => x.Path == "PredictiveAddress/Retrieve.json").Body;
        requestBody.Should().Contain("\"country\":\"GB\"");
        requestBody.Should().Contain("\"id\":\"VAL1\"");
        requestBody.Should().Contain("\"preferredLanguage\":\"en\"");
        requestBody.Should().Contain("\"includeCountry\":false");
        requestBody.Should().Contain("\"includeLocation\":false");
        requestBody.Should().Contain("\"normalizeCase\":true");
        requestBody.Should().Contain("\"normalizeTownCase\":true");

        result.Should().NotBeNull();
        result!.AddressLine1.Should().Be("2 King Road");
        result.Postcode.Should().Be("NG1 1AA");
    }

    [Fact]
    public async Task RetrieveAddress_WhenLinesMissing_ReturnsEmptyAddress()
    {
        var handler = new StubHttpMessageHandler((request, _, _) =>
        {
            if (request.RequestUri!.AbsolutePath.EndsWith("Retrieve.json", StringComparison.Ordinal))
            {
                return JsonResponse("""
                    {"Result":{"Address":{"Lines":null}}}
                    """);
            }

            throw new InvalidOperationException($"Unexpected endpoint: {request.RequestUri.AbsolutePath}");
        });

        var sut = CreateSut(handler);

        var result = await sut.RetrieveAddress("VAL1", Country);

        result.Should().BeEquivalentTo(new AddressResult());
    }

    [Fact]
    public async Task RetrieveAddress_WhenThreeLines_UsesSecondLineAsTownCity()
    {
        var handler = new StubHttpMessageHandler((request, _, _) =>
        {
            if (request.RequestUri!.AbsolutePath.EndsWith("Retrieve.json", StringComparison.Ordinal))
            {
                return JsonResponse("""
                    {"Result":{"Address":{"Lines":["2 King Road","Nottingham","NG1 1AA"]}}}
                    """);
            }

            throw new InvalidOperationException($"Unexpected endpoint: {request.RequestUri.AbsolutePath}");
        });

        var sut = CreateSut(handler);

        var result = await sut.RetrieveAddress("VAL1", Country);

        result.AddressLine1.Should().Be("2 King Road");
        result.AddressLine2.Should().BeEmpty();
        result.TownCity.Should().Be("Nottingham");
        result.Postcode.Should().Be("NG1 1AA");
    }

    [Fact]
    public async Task LookupAddress_WhenContainerIsNonBoolean_ReturnsEmpty()
    {
        var handler = new StubHttpMessageHandler((request, _, _) =>
        {
            if (request.RequestUri!.AbsolutePath.EndsWith("Search.json", StringComparison.Ordinal))
            {
                return JsonResponse("""
                    {"Results":[{"Value":"VAL1","Container":1}]}
                    """);
            }

            throw new InvalidOperationException($"Unexpected endpoint: {request.RequestUri.AbsolutePath}");
        });

        var sut = CreateSut(handler);

        var result = await sut.LookupAddress("2 king road", Country);

        result.Items.Should().BeEmpty();
        handler.Requests.Select(x => x.Path).Should().ContainSingle().Which.Should().Be("PredictiveAddress/Search.json");
    }

    private static Data8Adapter CreateSut(StubHttpMessageHandler handler, int numberOfResults = int.MaxValue)
    {
        var httpClient = new System.Net.Http.HttpClient(handler)
        {
            BaseAddress = new Uri("https://webservices.data-8.co.uk/")
        };

        var logger = new Mock<ILogger<Data8HttpClient>>();
        var languageService = new Mock<ILanguageService>();
        languageService.Setup(x => x.GetCurrentLanguage()).Returns("en");
        var data8Settings = Options.Create(new Data8Settings { ApiKey = "test-api-key", NumberOfResults = numberOfResults });
        var data8HttpClient = new Data8HttpClient(httpClient, logger.Object, data8Settings);
        return new Data8Adapter(data8HttpClient, languageService.Object, data8Settings);
    }

    private static HttpResponseMessage JsonResponse(string json)
    {
        return new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json")
        };
    }

    private sealed class StubHttpMessageHandler : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, string, CancellationToken, HttpResponseMessage> _responseFactory;

        public StubHttpMessageHandler(Func<HttpRequestMessage, string, CancellationToken, HttpResponseMessage> responseFactory)
        {
            _responseFactory = responseFactory;
        }

        public List<(string Path, string Query, string Body)> Requests { get; } = [];

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            cancellationToken.ThrowIfCancellationRequested();
            var body = request.Content == null ? string.Empty : await request.Content.ReadAsStringAsync(cancellationToken);
            Requests.Add((request.RequestUri!.AbsolutePath.TrimStart('/'), request.RequestUri.Query, body));
            return _responseFactory(request, body, cancellationToken);
        }
    }
}
