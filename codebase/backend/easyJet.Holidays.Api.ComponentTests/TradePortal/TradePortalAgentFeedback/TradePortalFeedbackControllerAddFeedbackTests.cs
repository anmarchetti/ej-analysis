using easyJet.Holidays.Api.ComponentTests.Infrastructure;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using System.Net;
using System.Text.Json;
using System.Text.Json.Nodes;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.TradePortal.TradePortalAgentFeedback;

public class TradePortalFeedbackControllerAddFeedbackTests : BaseTradeFixtureAwareComponentTest
{
    private const string ApiRoute = "/api/v1.0/trade-portal/feedback";

    public TradePortalFeedbackControllerAddFeedbackTests(TradePortalWebApplicationFixture tradeWebApp) : base(tradeWebApp)
    {
    }

    [Fact]
    public async Task FeedbackFormWithValidInput_ShouldSendMessage()
    {
        // Arrange
        var formDataBoundary = $"----------{Guid.NewGuid():N}";
        var bytes = "some content"u8.ToArray();

        var contentToPost = new MultipartFormDataContent(formDataBoundary);
        var file1Content = new ByteArrayContent(bytes);
        file1Content.Headers.ContentType = new("application/pdf");
        var file2Content = new ByteArrayContent(bytes);
        file2Content.Headers.ContentType = new("image/png");
        var file3Content = new ByteArrayContent(bytes);
        file3Content.Headers.ContentType = new("image/jpeg");

        contentToPost.Add(file1Content, "Documents", "file1.pdf");
        contentToPost.Add(file2Content, "Documents", "file2.png");
        contentToPost.Add(file3Content, "Documents", "file3.jpeg");
        TradePortalFeedbackTestUtils.FillFormWithFields(contentToPost);

        // Act
        // if you want to see the message - subscribe to mailing list, specified in appsettings.json inside AWS:SNS:Topics:TradeAgentFeedback setting
        // for the time test was implemented it was set to "easyjet-holidays-trade-agent-feedback-email-nonprod"
        var response = await Client.PostAsync(ApiRoute, contentToPost);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task FeedbackFormNotATradeAgent_ShouldReturnUnauthorized()
    {
        // Arrange
        var formDataBoundary = $"----------{Guid.NewGuid():N}";
        var contentToPost = new MultipartFormDataContent(formDataBoundary);
        TradePortalFeedbackTestUtils.FillFormWithFields(contentToPost);

        var client = CreateClient();

        // Act
        var response = await client.PostAsync(ApiRoute, contentToPost);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Theory]
    [InlineData("Name", "John^^")]
    [InlineData("AbtaNumber", "askjgfdak")]
    [InlineData("TradeAgentName", "example@example.com")]
    [InlineData("Email", "example@&3e.com")]
    public async Task FeedbackFormInvalidField_ShouldReturnBadRequest(string fieldName, string corruptedValue)
    {
        // Arrange
        var formDataBoundary = $"----------{Guid.NewGuid():N}";
        var contentToPost = new MultipartFormDataContent(formDataBoundary);
        TradePortalFeedbackTestUtils.ReplaceField(contentToPost, fieldName, corruptedValue);

        // Act
        var response = await Client.PostAsync(ApiRoute, contentToPost);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var responseContent = JsonSerializer.Deserialize<JsonObject>(await response.Content.ReadAsStringAsync());
        responseContent!["error"]?.GetValue<string>().Should().Be("Invalid model state");
        responseContent["code"]?.GetValue<string>().Should().Be("API-ERR-000001");
        responseContent["innerErrors"]?.AsArray().Count.Should().Be(1);
        responseContent["innerErrors"]?.AsArray().Should().Contain(x =>
            x!["message"]!.GetValue<string>().StartsWith($"The field {fieldName} must match the regular expression", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task FeedbackFormWithExceededFilesAmount_ShouldReturnBadRequest()
    {
        // Arrange
        var formDataBoundary = $"----------{Guid.NewGuid():N}";
        var bytes = "some content"u8.ToArray();
        var contentToPost = new MultipartFormDataContent(formDataBoundary)
        {
            {new ByteArrayContent(bytes), "Documents", "file1.pdf"},
            {new ByteArrayContent(bytes), "Documents", "file2.pdf"},
            {new ByteArrayContent(bytes), "Documents", "file3.png"},
            {new ByteArrayContent(bytes), "Documents", "file4.png"},
            {new ByteArrayContent(bytes), "Documents", "file5.jpeg"},
            {new ByteArrayContent(bytes), "Documents", "file6.jpeg"}
        };
        TradePortalFeedbackTestUtils.FillFormWithFields(contentToPost);

        // Act
        var response = await Client.PostAsync(ApiRoute, contentToPost);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var responseContent = JsonSerializer.Deserialize<JsonObject>(await response.Content.ReadAsStringAsync());
        responseContent!["error"]?.GetValue<string>().Should().Be("Invalid model state");
        responseContent["code"]?.GetValue<string>().Should().Be("API-ERR-000001");
        responseContent["innerErrors"]?.AsArray().Count.Should().Be(1);
        responseContent["innerErrors"]?.AsArray().Should().Contain(x =>
            x!["message"]!.GetValue<string>().StartsWith("Maximum allowed amount of attachments for field 'Documents' is ", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task FeedbackFormFileSizeExceeded_ShouldReturnBadrequest()
    {
        // Arrange
        var formDataBoundary = $"----------{Guid.NewGuid():N}";
        var rand = new Random(0); // providing seed just so it generate equal sequence each run
        var bytes = Enumerable.Repeat((byte)rand.Next(), 10_485_761).ToArray();

        var contentToPost = new MultipartFormDataContent(formDataBoundary)
        {
            {new ByteArrayContent(bytes), "Documents", "file1.pdf"},
        };
        TradePortalFeedbackTestUtils.FillFormWithFields(contentToPost);

        // Act
        var response = await Client.PostAsync(ApiRoute, contentToPost);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var responseContent = JsonSerializer.Deserialize<JsonObject>(await response.Content.ReadAsStringAsync());
        responseContent!["error"]?.GetValue<string>().Should().Be("Invalid model state");
        responseContent["code"]?.GetValue<string>().Should().Be("API-ERR-000001");
        responseContent["innerErrors"]?.AsArray().Count.Should().Be(1);
        responseContent["innerErrors"]?.AsArray().Should().Contain(x =>
            x!["message"]!.GetValue<string>().StartsWith("Each file inside field 'Documents' should have size, less, than 10MB", StringComparison.OrdinalIgnoreCase));
    }
}