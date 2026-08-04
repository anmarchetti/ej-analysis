using AutoFixture.Xunit2;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyJet.Foundation.Testing.Extensions;
using FluentAssertions;
using NSubstitute;
using Sitecore.Abstractions;
using Sitecore.Security.Accounts;
using Xunit;

namespace easyJet.Foundation.SitecoreExtensions.Tests.Services
{
    public class UserCreationServiceTests
    {
        private readonly BaseSettings baseSettings;
        private readonly IUserCreationService sut;
        private readonly IUserService userService;

        public UserCreationServiceTests()
        {
            userService = Substitute.For<IUserService>();
            baseSettings = Substitute.For<BaseSettings>();
            sut = new UserCreationService(baseSettings, userService);
        }

        [Theory]
        [AutoData]
        public void GetOrCreateNonAnonymousUser_ReturnsNonAnonymousUser(User randomUser)
        {
            // Arrange
            randomUser.ForceSetFieldValue("_name", "RandomName");
            userService.GetContextUser().Returns(randomUser);

            // Act
            var actual = sut.GetOrCreateNonAnonymousUser("SpecialJob");

            // Assert
            actual.Should().Be(randomUser);
        }

        [Theory]
        [AutoData]
        public void GetOrCreateNonAnonymousUser_ReturnsExistingNonAnonymousUser(User anonymousUser, User randomUser)
        {
            // Arrange
            anonymousUser.ForceSetFieldValue("_name", "Anonymous");
            baseSettings.GetSetting(Constants.EnvironmentHintEnvironmentNameSettingsName).Returns("Master");

            var username = $@"{baseSettings.GetSetting(Constants.EnvironmentHintEnvironmentNameSettingsName)}\SpecialJob";
            randomUser.ForceSetFieldValue("_name", username);
            userService.GetContextUser().Returns(anonymousUser);

            userService.UserExists(username).Returns(true);
            userService.GetUser(username, true).Returns(randomUser);

            // Act
            var actual = sut.GetOrCreateNonAnonymousUser("SpecialJob");

            // Assert
            actual.Should().Be(randomUser);
        }

        [Theory]
        [AutoData]
        public void GetOrCreateNonAnonymousUser_ReturnsNewlyCreatedUser(User anonymousUser, User randomUser)
        {
            // Arrange
            anonymousUser.ForceSetFieldValue("_name", "Anonymous");
            userService.GetContextUser().Returns(anonymousUser);
            baseSettings.GetSetting(Constants.EnvironmentHintEnvironmentNameSettingsName).Returns("Master");
            var username = "Master\\SpecialJob";
            userService.UserExists(username).Returns(false);
            userService.GetUser(username, true).Returns(randomUser);

            // Act
            var actual = sut.GetOrCreateNonAnonymousUser("SpecialJob");

            // Assert
            actual.Should().Be(randomUser);
            userService.Received().CreateUser(username, Arg.Any<string>());
        }
    }
}
