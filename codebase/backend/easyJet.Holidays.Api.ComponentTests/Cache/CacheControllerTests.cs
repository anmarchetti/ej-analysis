using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using System.Net;
using System.Text.Json;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.Cache
{
    public class CacheControllerTests : BaseComponentTest
    {
        [Fact]
        public async Task CacheClear_ValidRequest_ShouldSucceed()
        {
            // Arrange
            SetupApiAuthorizationForClient();

            // Act
            var response = await Client.GetAsync("/api/v1.0/cache/clear?bucket=whatever");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        [Fact]
        public async Task Cache_GetEverythingForBucketName_ShouldReturnAllEntriesFromBucket()
        {
            // Arrange
            ApplyManyConfigurationFields(new KeyValuePair<string, string>[]
            {
                new("Cache:BackgroundRefreshDisabled", "false"),
                new("EnvironmentBehaviour:PreloadReferenceDataOnStart", "true"),
            });
            SetupApiAuthorizationForClient();

            // Act
            var response = await Client.GetAsync("/api/v1.0/cache?bucket=Cms");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var cacheObject = JsonSerializer.Deserialize<Dictionary<string, object>>(await response.Content.ReadAsStringAsync());
            // by the moment of test implementation there are already mocks for the Cms bucket.
            // so we can assume, they would not be removed entirely at any later moment of development
            cacheObject!.Count.Should().BeGreaterThan(0);
            cacheObject.Keys.Should().AllSatisfy(x => x.Should().StartWith("_Cms"));
        }

        [Fact]
        public async Task CacheClear_NoToken_ShouldReturnUnauthorized()
        {
            // Arrange
            // Act
            var response = await Client.GetAsync("/api/v1.0/cache/clear?bucket=whatever");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        }
    }
}