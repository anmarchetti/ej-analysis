using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using System.Net;
using System.Text.Json;
using System.Text.Json.Nodes;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.TradePortal.TradePortalAgentFeedback;

public class TradePortalFeedbackControllerAddFeedbackFaultTests : BaseTradePortalComponentTest
{
    private const string ApiRoute = "/api/v1.0/trade-portal/feedback";

    [Fact]
    public async Task FeedbackFormDynamoDbNotAvailable_ShouldReturnInternalServerError()
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

        var server = SpawnServer("AwsDynamoDbMockServer");
        ApplyConfigurationField("Aws:ServiceURL", server.Url);

        SetupApiAuthorizationForClient();

        // Act
        var response = await Client.PostAsync(ApiRoute, contentToPost);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
        var responseContent = JsonSerializer.Deserialize<JsonObject>(await response.Content.ReadAsStringAsync());
        responseContent!["code"]?.GetValue<string>().Should().Be("API-ERR-2700002");
        responseContent["error"]?.GetValue<string>().Should().Be("Failed to save feedback in storage");
    }
}