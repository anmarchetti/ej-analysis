using AutoFixture.Xunit3;
using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Tests.Domain;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using Microsoft.Net.Http.Headers;
using System.Net;
using System.Text.Json;
using System.Text.Json.Nodes;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.Credit
{
    /// <summary>
    /// Component tests for <see cref="AccountController"/>
    /// </summary>
    public class CreditControllerTests : BaseComponentTest
    {

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/credit/me")]
        [Theory]
        [InlineData(true, "my-credits.json")]
        [InlineData(false, "my-credits-disabled.json")]
        public async Task CreditsControllerMe_Valid_Response(bool isActive, string expected)
        {
            ApplyConfigurationField("Api:Vouchers:IsActive", isActive.ToString());

            var message = new HttpRequestMessage(HttpMethod.Get, "/api/v1.0/credit/me");
            message.Headers.Add(HeaderNames.Cookie, "eJ2Session=495d1c49420a43a8122d6b2f5ff1a48e162a8bd69ecd779b866bdc09574776ae&CookieTypeKey=1;");
            message.Headers.Add("Allow_Cache", "false");

            var expectedResponse = ObjectUtils.MinifyJson(await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "Voucherify", expected)));

            // Act
            var response = await Client.SendAsync(message);

            var content = await response.Content.ReadAsStringAsync();

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            content.Should().Be(expectedResponse);
        }

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/credit/me")]
        [Fact]
        public async Task CreditsControllerMe_DynamoDbNotAvailable_ShouldFail()
        {
            // Arrange
            var message = new HttpRequestMessage(HttpMethod.Get, "/api/v1.0/credit/me");
            message.Headers.Add(HeaderNames.Cookie, "eJ2Session=495d1c49420a43a8122d6b2f5ff1a48e162a8bd69ecd779b866bdc09574776ae&CookieTypeKey=1;");
            message.Headers.Add("Allow_Cache", "false");
            var server = SpawnServer("AwsDynamoDbMockServer");

            ApplyManyConfigurationFields(new[]
            {
                new KeyValuePair<string, string>("Api:Vouchers:IsActive", "true"),
                new KeyValuePair<string, string>("Aws:ServiceURL", server.Url)
            });

            // Act
            var response = await Client.SendAsync(message);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
            var responseContent = JsonSerializer.Deserialize<JsonObject>(await response.Content.ReadAsStringAsync());
            responseContent["error"].GetValue<string>().Should().Be("Can not get customer credits info.");
            responseContent["code"].GetValue<string>().Should().Be("API-ERR-301000");
        }

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/credit/me")]
        [Theory]
        [InlineAutoData()]
        public async Task CreditsControllerMe_Unauthorized()
        {
            ApplyConfigurationField("Api:Vouchers:IsActive", "true");

            var message = new HttpRequestMessage(HttpMethod.Get, "/api/v1.0/credit/me");

            // Act
            var response = await Client.SendAsync(message);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        }

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/credit/history")]
        [Theory]
        [InlineData(true, "my-history.json")]
        [InlineData(false, "my-history-disabled.json")]
        public async Task CreditsControllerHistory_Valid_Response(bool isActive, string expected)
        {
            ApplyConfigurationField("Api:Vouchers:IsActive", isActive.ToString());

            var message = new HttpRequestMessage(HttpMethod.Get, "/api/v1.0/credit/history");
            message.Headers.Add(HeaderNames.Cookie, "eJ2Session=495d1c49420a43a8122d6b2f5ff1a48e162a8bd69ecd779b866bdc09574776ae&CookieTypeKey=1;");

            var expectedResponse = ObjectUtils.MinifyJson(await File.ReadAllTextAsync(Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "Voucherify", expected)));

            // Act
            var response = await Client.SendAsync(message);

            var content = await response.Content.ReadAsStringAsync();

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            content.Should().Be(expectedResponse);
        }

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/credit/history")]
        [Fact]
        public async Task CreditsControllerHistory_DynamoDbNotAvailable_Fail()
        {
            // Arrange
            var message = new HttpRequestMessage(HttpMethod.Get, "/api/v1.0/credit/history");
            message.Headers.Add(HeaderNames.Cookie, "eJ2Session=495d1c49420a43a8122d6b2f5ff1a48e162a8bd69ecd779b866bdc09574776ae&CookieTypeKey=1;");
            var server = SpawnServer("AwsDynamoDbMockServer");
            ApplyManyConfigurationFields(new[]
            {
                new KeyValuePair<string, string>("Api:Vouchers:IsActive", "true"),
                new KeyValuePair<string, string>("Aws:ServiceURL", server.Url)
            });

            // Act
            var response = await Client.SendAsync(message);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
            var responseContent = JsonSerializer.Deserialize<JsonObject>(await response.Content.ReadAsStringAsync());
            responseContent["error"].GetValue<string>().Should().Be("Can not get customer credit history.");
            responseContent["code"].GetValue<string>().Should().Be("API-ERR-301001");
        }

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/credit/me")]
        [Fact]
        public async Task CreditsComtrollerHistory_Anuthorized()
        {
            ApplyConfigurationField("Api:Vouchers:IsActive", "true");

            var message = new HttpRequestMessage(HttpMethod.Get, "/api/v1.0/credit/history");

            // Act
            var response = await Client.SendAsync(message);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        }
    }
}
