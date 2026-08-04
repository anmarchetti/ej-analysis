using easyJet.Holidays.Api.Common.Exceptions;
using FluentAssertions;
using FluentAssertions.Execution;
using Newtonsoft.Json;
using System.Net;
using System.Text;
using WireMock.RequestBuilders;
using WireMock.ResponseBuilders;

namespace easyJet.Holidays.Tests.Domain.ComponentTests;

/// <summary>
/// Helper functionality for component tests
/// </summary>
public static class BaseComponentTestExtensions
{
    /// <summary>
    /// Util method to verify if APi returns correct error code when Atcom throws error
    /// </summary>
    /// <param name="test">Test instance</param>
    /// <param name="requestBuilder">Request builder</param>
    /// <param name="requestUri">Request uri</param>
    /// <param name="exception">Exception to verify</param>
    public static async Task VerifyWhenAtcomThrowsError(this BaseComponentTest test, Func<IRequestBuilder, IRequestBuilder> requestBuilder, string requestUri, ExceptionCode exception)
    {
        // Arrange 
        var server = test.SpawnServer($"AtcomWireMockServer");

        server.Given(
                requestBuilder(Request.Create().UsingGet())
            )
            .AtPriority(1)
            .RespondWith(
                Response.Create()
                    .WithStatusCode(HttpStatusCode.InternalServerError)
            );

        test.ApplyManyConfigurationFields(new[]
        {
            new KeyValuePair<string, string>("Atcom:Search:Uk:Host", server.Url),
            new KeyValuePair<string, string>("Atcom:Search:Ch:Host", server.Url),
            new KeyValuePair<string, string>("Atcom:Search:De:Host", server.Url),
            new KeyValuePair<string, string>("Atcom:Search:Fr:Host", server.Url),
            new KeyValuePair<string, string>("Atcom:Booking:Host", server.Url),
        });

        // Act
        var response = await test.Client.GetAsync(requestUri);

        // Assert
        await response.AssertErrorResponse(exception, HttpStatusCode.InternalServerError);
    }

    /// <summary>
    /// Util method to verify if APi returns correct error code when Atcom returns invalid XML
    /// </summary>
    /// <param name="test">Test instance</param>
    /// <param name="requestBuilder">Request builder</param>
    /// <param name="requestUri">Request uri</param>
    /// <param name="exception">Exception to verify</param>
    /// <param name="atcomResponse"></param>
    public static async Task VerifyWhenAtcomResponseIsNotValidXml(this BaseComponentTest test, Func<IRequestBuilder, IRequestBuilder> requestBuilder, string requestUri, ExceptionCode exception, string atcomResponse = "invalid xml response")
    {
        // Arrange 
        var server = test.SpawnServer($"AtcomWireMockServer");
        server.Given(
                requestBuilder(Request.Create().UsingGet())
            )
            .AtPriority(1)
            .RespondWith(
                Response.Create()
                    .WithStatusCode(HttpStatusCode.OK)
                    .WithBody(atcomResponse)
            );

        test.ApplyManyConfigurationFields(new[]
        {
            new KeyValuePair<string, string>("Atcom:Search:Uk:Host", server.Url),
            new KeyValuePair<string, string>("Atcom:Search:Ch:Host", server.Url),
            new KeyValuePair<string, string>("Atcom:Search:De:Host", server.Url),
            new KeyValuePair<string, string>("Atcom:Search:Fr:Host", server.Url),
            new KeyValuePair<string, string>("Atcom:Booking:Host", server.Url),
        });

        // Act
        var response = await test.Client.GetAsync(requestUri);

        // Assert
        await response.AssertErrorResponse(exception, HttpStatusCode.InternalServerError);
    }

    /// <summary>
    /// Asserts  error response: httpcode code,  code and description
    /// </summary>
    /// <param name="response">Http response</param>
    /// <param name="expectedException">Expected exception</param>
    /// <param name="expectedCode">Expected response http code</param>
    /// <param name="because"></param>
    /// <returns></returns>
    public static async Task AssertErrorResponse(this HttpResponseMessage response, ExceptionCode expectedException, HttpStatusCode expectedCode, string because = null)
    {
        // Act
        var content = await response.Content.ReadAsStringAsync();
        var responseType = new { error = "", code = "" };
        var responseData = JsonConvert.DeserializeAnonymousType(content, responseType);

        // Assert
        using (new AssertionScope())
        {
            response.StatusCode.Should().Be(expectedCode, because);
            responseData!.error.Should().Be(expectedException.Description, because);
            responseData.code.Should().Be(expectedException.Code, because);
        }
    }

    public static async Task PostAndValidate(this HttpClient instance, string url, string body, params string[] expectedResponsePath)
    {
        var pathArgs = new[] { Directory.GetCurrentDirectory() }.Concat(expectedResponsePath).ToArray();
        var expectedResponse = ObjectUtils.MinifyJson(await File.ReadAllTextAsync(Path.Combine(pathArgs)));

        // Act
        var response = await instance.PostAsync(url, new StringContent(body, Encoding.UTF8, "application/json"));
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        content.Should().Be(expectedResponse);
    }

    public static async Task GetAndValidate(this HttpClient instance, string url, params string[] expectedResponsePath)
    {
        var pathArgs = new[] { Directory.GetCurrentDirectory() }.Concat(expectedResponsePath).ToArray();
        var expectedResponse = ObjectUtils.MinifyJson(await File.ReadAllTextAsync(Path.Combine(pathArgs)));

        // Act
        var response = await instance.GetAsync(url);
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        content.Should().Be(expectedResponse);
    }
}