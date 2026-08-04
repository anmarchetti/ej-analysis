using easyJet.Holidays.External.Domain.Models;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.External.Domain.Tests.Models
{
    public class EndpointUriTests
    {
        [Fact]
        public void Constructor_BuildsEndpoint()
        {
            // Arrange
            // Act
            var endpointUri = new EndpointUri("http://domain.com", "/path/name?q=1");

            // Assert
            endpointUri.Endpoint.Should().Be(new Uri("http://domain.com/path/name?q=1"));
            endpointUri.BaseUri.Should().Be("/path/name?q=1");
        }

        [Fact]
        public void Constructor_InvalidUri_ThrowsException()
        {
            Assert.Throws<UriFormatException>(() => new EndpointUri("test", "path"));
        }
    }
}
