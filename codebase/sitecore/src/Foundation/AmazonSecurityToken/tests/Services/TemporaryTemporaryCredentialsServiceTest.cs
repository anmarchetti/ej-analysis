using System;
using Amazon;
using easyJet.Foundation.AmazonSecurityToken.Logging;
using easyJet.Foundation.AmazonSecurityToken.Services;
using FluentAssertions;
using NSubstitute;
using NSubstitute.ReturnsExtensions;
using Sitecore.Abstractions;
using Xunit;

namespace easyJet.Foundation.AmazonSecurityToken.Tests.Services
{
    public class TemporaryTemporaryCredentialsServiceTest
    {
        private const string RoleArn = "arn:aws:iam::123456789012:role/testAssumeRole";
        private readonly TemporaryTemporaryCredentialsService sut;
        private readonly IAmazonSecurityTokenLogger logger;
        private readonly BaseSettings settings;

        public TemporaryTemporaryCredentialsServiceTest()
        {
            settings = Substitute.For<BaseSettings>();
            logger = Substitute.For<IAmazonSecurityTokenLogger>();
            sut = new TemporaryTemporaryCredentialsService(logger, settings);
        }

        [Fact]
        public void GetCredentials_ShouldThrowException_IfArnIsEmpty()
        {
            // Arrange
            var roleArn = string.Empty;
            var region = RegionEndpoint.EUWest1;
            var sessionDuration = Constants.DefaultSessionDuration;
            var sessionName = "Test";
            settings.GetSetting(Arg.Any<string>()).ReturnsNullForAnyArgs();

            // Assert
            Assert.Throws<ArgumentNullException>(() => sut.GetCredentials(roleArn, region, sessionDuration, sessionName));
        }

        [Fact]
        public void GetCredentials_ShouldThrowException_IfArnIsNotValid()
        {
            // Arrange
            var roleArn = "test";
            var region = RegionEndpoint.EUWest1;
            var sessionDuration = Constants.DefaultSessionDuration;
            var sessionName = "Test";

            // Assert
            Assert.Throws<ArgumentException>(() => sut.GetCredentials(roleArn, region, sessionDuration, sessionName));
        }

        [Fact]
        public void GetCredentials_ShouldThrowException_IfRegionIsEmpty()
        {
            // Arrange
            var roleArn = RoleArn;
            var sessionDuration = Constants.DefaultSessionDuration;
            var sessionName = "Test";
            settings.GetSetting(Arg.Any<string>()).ReturnsNullForAnyArgs();

            // Assert
            Assert.Throws<ArgumentNullException>(() => sut.GetCredentials(roleArn, null, sessionDuration, sessionName));
        }

        [Theory]
        [InlineData(-1)]
        [InlineData(0)]
        [InlineData(1)]
        [InlineData(899)]
        public void GetCredentials_ShouldThrowException_IfSessionHasInvalidValue(int sessionDuration)
        {
            // Arrange
            var roleArn = RoleArn;
            var region = RegionEndpoint.EUWest1;
            var sessionName = "Test";
            settings.GetSetting(Arg.Any<string>()).ReturnsNullForAnyArgs();

            // Assert
            Assert.Throws<ArgumentOutOfRangeException>(() => sut.GetCredentials(roleArn, region, sessionDuration, sessionName));
        }

        [Fact]
        public void GetCredentials_ShouldThrowException_IfSessionNameIsEmpty()
        {
            // Arrange
            var roleArn = RoleArn;
            var sessionDuration = Constants.DefaultSessionDuration;
            var region = RegionEndpoint.EUWest1;
            var sessionName = string.Empty;
            settings.GetSetting(Arg.Any<string>()).ReturnsNullForAnyArgs();

            // Assert
            Assert.Throws<ArgumentNullException>(() => sut.GetCredentials(roleArn, region, sessionDuration, sessionName));
        }

        [Fact]
        public void GetCredentials_ShouldLogError()
        {
            // Arrange
            var roleArn = RoleArn;
            var sessionDuration = Constants.DefaultSessionDuration;
            var region = RegionEndpoint.EUWest1;
            var sessionName = "Test";
            settings.GetSetting(Arg.Any<string>()).ReturnsNullForAnyArgs();

            // Act
            var result = sut.GetCredentials(roleArn, region, sessionDuration, sessionName);

            // Assert
            result.Should().BeNull();
            logger.Received().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }
    }
}