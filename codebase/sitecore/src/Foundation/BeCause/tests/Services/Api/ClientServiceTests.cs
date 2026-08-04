using System;
using System.Collections.Generic;
using AutoFixture.Xunit2;
using easyJet.Foundation.BeCause.Logging;
using easyJet.Foundation.BeCause.Services.Api;
using easyJet.Foundation.SitecoreExtensions.Utils;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace easyJet.Foundation.BeCause.Tests.Services.Api
{
    public class ClientServiceTests
    {
        private readonly ClientService sut;
        private readonly IBeCauseLogger logger;

        public ClientServiceTests()
        {
            logger = Substitute.For<IBeCauseLogger>();
            sut = new ClientService(logger);
        }

        [Theory]
        [AutoData]
        public void GetResultAsync_ShouldThrowException_IfUrlIsNull(string payload, string apiKey)
        {
            // Arrange
            var url = string.Empty;

            // Act
            // Assert
            using (new SecretsManagerSwitcher(new Dictionary<string, string> { { Constants.BecauseApiKeyName, apiKey } }))
            {
                Assert.ThrowsAsync<ArgumentNullException>(async () => await sut.GetResultAsync(url, payload));
            }
        }

        [Theory]
        [AutoData]
        public void GetResultAsync_ShouldThrowException_IfPayloadIsNull(string url, string apiKey)
        {
            // Arrange
            using (new SecretsManagerSwitcher(new Dictionary<string, string> { { Constants.BecauseApiKeyName, apiKey } }))
            {
                var payload = string.Empty;

                // Act
                // Assert
                Assert.ThrowsAsync<ArgumentNullException>(async () => await sut.GetResultAsync(url, payload));
            }
        }

        [Theory]
        [AutoData]
        public void GetResultAsync_ShouldThrowException_IfApiKeyIsNull(string url, string payload)
        {
            // Arrange
            // Act
            // Assert
            using (new SecretsManagerSwitcher(new Dictionary<string, string> { { Constants.BecauseApiKeyName, string.Empty } }))
            {
                Assert.ThrowsAsync<NullReferenceException>(async () => await sut.GetResultAsync(url, payload));
            }
        }

        [Theory]
        [AutoData]
        public void GetResultAsync_ShouldBeEmpty_IfUrlIsInvalid(string url, string payload, string apiKey)
        {
            // Arrange
            // Act
            using (new SecretsManagerSwitcher(new Dictionary<string, string> { { Constants.BecauseApiKeyName, apiKey } }))
            {
                var result = sut.GetResultAsync(url, payload).GetAwaiter().GetResult();

                // Assert
                result.Should().BeNullOrEmpty();
            }
        }

        [Theory]
        [AutoData]
        public void GetResultAsync_ShouldBeEmpty_IfUrlIsWhitespace(string payload, string apiKey)
        {
            // Arrange
            // Act
            using (new SecretsManagerSwitcher(new Dictionary<string, string> { { Constants.BecauseApiKeyName, apiKey } }))
            {
                var result = sut.GetResultAsync(" ", payload).GetAwaiter().GetResult();

                // Assert
                result.Should().BeNull();
                logger.Received().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
            }
        }

        [Theory]
        [AutoData]
        public void GetStatusAsync_ShouldThrowException_IfUrlIsNull(string apiKey)
        {
            // Arrange
            using (new SecretsManagerSwitcher(new Dictionary<string, string> { { Constants.BecauseApiKeyName, apiKey } }))
            {
                var url = string.Empty;

                // Act
                // Assert
                Assert.ThrowsAsync<ArgumentNullException>(async () => await sut.GetStatusAsync(url));
            }
        }

        [Theory]
        [AutoData]
        public void GetStatusAsync_ShouldThrowException_IfApiKeyIsNull(string url)
        {
            // Arrange
            // Act
            // Assert
            using (new SecretsManagerSwitcher(new Dictionary<string, string> { { Constants.BecauseApiKeyName, string.Empty } }))
            {
                Assert.ThrowsAsync<NullReferenceException>(async () => await sut.GetStatusAsync(url));
            }
        }

        [Theory]
        [AutoData]
        public void GetStatusAsync_ShouldBeEmpty_IfUrlIsInvalid(string url, string apiKey)
        {
            // Arrange
            // Act
            using (new SecretsManagerSwitcher(new Dictionary<string, string> { { Constants.BecauseApiKeyName, apiKey } }))
            {
                var result = sut.GetStatusAsync(url).GetAwaiter().GetResult();

                // Assert
                result.Should().BeNullOrEmpty();
            }
        }

        [Theory]
        [AutoData]
        public void GetStatusAsync_ShouldBeEmpty_IfUrlIsWhitespace(string apiKey)
        {
            // Arrange
            // Act
            using (new SecretsManagerSwitcher(new Dictionary<string, string> { { Constants.BecauseApiKeyName, apiKey } }))
            {
                var result = sut.GetStatusAsync(" ").GetAwaiter().GetResult();

                // Assert
                result.Should().BeNull();
                logger.Received().Error(Arg.Any<string>(), Arg.Any<ArgumentException>(), Arg.Any<object>());
            }
        }

        [Theory]
        [AutoData]
        public void GetData_ShouldThrowException_IfUrlIsNull(string apiKey)
        {
            // Arrange
            using (new SecretsManagerSwitcher(new Dictionary<string, string> { { Constants.BecauseApiKeyName, apiKey } }))
            {
                var url = string.Empty;

                // Act
                // Assert
                Assert.ThrowsAsync<ArgumentNullException>(async () => await sut.GetDataAsync(url));
            }
        }

        [Theory]
        [AutoData]
        public void GetData_ShouldBeEmpty_IfUrlIsInvalid(string url, string apiKey)
        {
            // Arrange
            // Act
            using (new SecretsManagerSwitcher(new Dictionary<string, string> { { Constants.BecauseApiKeyName, apiKey } }))
            {
                var result = sut.GetDataAsync(url).GetAwaiter().GetResult();

                // Assert
                result.Should().BeNullOrEmpty();
                logger.Received().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
            }
        }

        [Theory]
        [AutoData]
        public void GetData_ShouldBeEmpty_IfUrlIsWhitespace(string apiKey)
        {
            // Arrange
            // Act
            using (new SecretsManagerSwitcher(new Dictionary<string, string> { { Constants.BecauseApiKeyName, apiKey } }))
            {
                var result = sut.GetDataAsync(" ").GetAwaiter().GetResult();

                // Assert
                result.Should().BeNull();
                logger.Received().Error(Arg.Any<string>(), Arg.Any<ArgumentException>(), Arg.Any<object>());
            }
        }
    }
}