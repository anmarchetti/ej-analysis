using easyJet.Holidays.Api.Domain.Settings;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Settings
{
    public class ApolloSettingsTests
    {
        [Fact]
        public void ApolloSettings_AllowsBindingOfNestedConfiguration()
        {
            var settings = new ApolloSettings
            {
                Host = "https://apollo.example.com",
                AppSyncDomain = "abc.appsync-api.eu-west-1.amazonaws.com",
                TimeoutMilliSeconds = 5000,
                Api = new ApolloApiSettings
                {
                    GraphQl = "/graphql"
                },
                DefaultBookingFields = ["reference", "status"],
                AwsBooking = new ApolloBookingAwsSettings
                {
                    Algorithm = "AWS4-HMAC-SHA256",
                    Region = "eu-west-1",
                    Service = "appsync"
                }
            };

            settings.Host.Should().Be("https://apollo.example.com");
            settings.Api.GraphQl.Should().Be("/graphql");
            settings.DefaultBookingFields.Should().ContainInOrder("reference", "status");
            settings.AwsBooking.Algorithm.Should().Be("AWS4-HMAC-SHA256");
            settings.AwsBooking.Region.Should().Be("eu-west-1");
            settings.AwsBooking.Service.Should().Be("appsync");
        }
    }
}
