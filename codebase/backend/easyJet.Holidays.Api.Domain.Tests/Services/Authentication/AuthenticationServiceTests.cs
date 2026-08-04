using AutoFixture;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Authentication;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Interfaces.Customers;
using easyJet.Holidays.Api.Domain.Services;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Authentication
{
    public class AuthenticationServiceTests
    {
        [Theory]
        [InlineData("6694DF6B7AACDA3857DE300395765AB4", 1231231241221)]
        [InlineData("zzzzaaaa0123", 81297381238123)]
        public async Task MappedCustomerId_LoggedIn_GetCustomerIdDigits(string customerId, decimal expected)
        {
            // Arrange
            var fixture = FixtureUtils.AutoMoqFixture();

            var integrationCookieService = fixture.Freeze<Mock<IDAIntegrationService>>();
            var customerProvider = fixture.Freeze<Mock<ICustomerProvider>>();

            integrationCookieService.Setup(x => x.GetCookie(It.IsAny<HttpContext>())).Returns(new CustomerAuthModel());
            customerProvider.Setup(x => x.GetDetails(It.IsAny<CustomerCredentials>())).ReturnsAsync(new CustomerDetails
            {
                Id = customerId
            });

            fixture.Freeze<Mock<ICustomerMapperService>>().Setup(x => x.GetOrCreateCustomerId(customerId)).ReturnsAsync(expected);

            var sut = fixture.Freeze<AuthenticationService>();

            // Act
            var result = await sut.MappedCustomerId();

            // Assert
            result.Should().Be(expected.ToString());
        }

        [Fact]
        public async Task GetCustomerIdWithErrorsHandling_NotLoggedIn_ThrowsApiException()
        {
            // Arrange
            var fixture = FixtureUtils.AutoMoqFixture();

            var integrationCookieService = fixture.Freeze<Mock<IDAIntegrationService>>();
            var customerProvider = fixture.Freeze<Mock<ICustomerProvider>>();

            integrationCookieService.Setup(x => x.GetCookie(It.IsAny<HttpContext>())).Returns((CustomerAuthModel)null);

            var customMapperService = fixture.Freeze<Mock<ICustomerMapperService>>();

            var sut = fixture.Freeze<AuthenticationService>();

            // Act

            // Assert
            var apiException = await Assert.ThrowsAsync<ApiException>(() => sut.GetCustomerIdWithErrorsHandling());
            apiException.Code.Should().Be(ApiExceptionCodes.CustomerNoMappedId);

            customMapperService.Verify(x => x.GetOrCreateCustomerId(It.IsAny<string>()), Times.Never);
            customerProvider.Verify(x => x.GetDetails(It.IsAny<CustomerCredentials>()), Times.Never);
        }

        [Fact]
        public async Task MappedCustomerId_NotLoggedIn_NoCustomerId()
        {
            // Arrange
            var fixture = FixtureUtils.AutoMoqFixture();

            var integrationCookieService = fixture.Freeze<Mock<IDAIntegrationService>>();
            var customerProvider = fixture.Freeze<Mock<ICustomerProvider>>();

            integrationCookieService.Setup(x => x.GetCookie(It.IsAny<HttpContext>())).Returns((CustomerAuthModel)null);
            customerProvider.Setup(x => x.GetDetails(It.IsAny<CustomerCredentials>())).ReturnsAsync((CustomerDetails)null); // No customer details

            var sut = fixture.Freeze<AuthenticationService>();

            // Act
            var result = await sut.MappedCustomerId();

            // Assert
            result.Should().Be(null);
        }

        [Theory]
        [InlineData("email@test.com\ttesT@test.com")]
        [InlineData("email@test.com\r\ntEst@test.com")]
        [InlineData("email@test.com teSt@test.com")]
        public async Task CheckIfAccountIsLocked_TrueIfAccountIsLocked(string email)
        {
            // Arrange
            var fixture = FixtureUtils.AutoMoqFixture();

            var settingsService = fixture.Freeze<Mock<ISettingsService>>();

            settingsService.Setup(service => service.GetLockedAccountSetting()).ReturnsAsync(
                new LockedAccountSettings()
                {
                    EmailsString = email
                }
            );

            var sut = fixture.Freeze<AuthenticationService>();

            // Act
            var result = await sut.CheckIfAccountIsLocked("test@test.com");

            // Assert
            result.Should().Be(true);
        }

        [Theory]
        [InlineData("")]
        [InlineData("email@test.com\temail2@test.com")]
        [InlineData("email@test.com\r\nemail2@test.com")]
        [InlineData("email@test.com email2@test.com")]
        public async Task CheckIfAccountIsLocked_FalseIfAccountIsNot(string email)
        {
            // Arrange
            var fixture = FixtureUtils.AutoMoqFixture();

            var settingsService = fixture.Freeze<Mock<ISettingsService>>();

            settingsService.Setup(service => service.GetLockedAccountSetting()).ReturnsAsync(
                new LockedAccountSettings()
                {
                    EmailsString = email
                }
            );

            var sut = fixture.Freeze<AuthenticationService>();

            // Act
            var result = await sut.CheckIfAccountIsLocked("test@test.com");

            // Assert
            result.Should().Be(false);
        }

        [Theory]
        [InlineData("email@test.com\ttest@test.com")]
        [InlineData("email@test.com\r\ntest@test.com")]
        [InlineData("email@test.com test@test.com")]
        public async Task CheckIfAccountIsLocked_ThrowErrorIfAccountIsLocked(string emailsString)
        {
            // Arrange
            var fixture = FixtureUtils.AutoMoqFixture();

            var settingsService = fixture.Freeze<Mock<ISettingsService>>();

            settingsService.Setup(service => service.GetLockedAccountSetting()).ReturnsAsync(
                new LockedAccountSettings()
                {
                    EmailsString = emailsString
                }
            );

            var sut = fixture.Freeze<AuthenticationService>();

            // Assert
            var apiException = await Assert.ThrowsAsync<ApiException>(() => sut.CheckIfAccountIsLocked("test@test.com", true));
            apiException.Code.Should().Be(ApiExceptionCodes.AuthCustomerIsLocked);
        }

        [Fact]
        public async Task IsUserSignedIn_DontCheckIfAccountIsLockedIfUserIsNotLogedIn()
        {
            // Arrange
            var fixture = FixtureUtils.AutoMoqFixture();

            var integrationCookieService = fixture.Freeze<Mock<IDAIntegrationService>>();

            integrationCookieService.Setup(service => service.GetCookie(It.IsAny<HttpContext>())).Returns((CustomerAuthModel)null);

            var sut = fixture.Freeze<AuthenticationService>();

            var result = await sut.IsUserSignedIn();

            // Assert
            result.Should().Be(false);
            integrationCookieService.Verify(x => x.GetCookie(It.IsAny<HttpContext>()), Times.Once);
        }

        [Fact]
        public async Task IsUserSignedIn_ReturnTrueIfUserIsLoggedInAndNotlocked()
        {
            // Arrange
            var fixture = FixtureUtils.AutoMoqFixture();

            var integrationCookieService = fixture.Freeze<Mock<IDAIntegrationService>>();

            integrationCookieService.Setup(service => service.GetCookie(It.IsAny<HttpContext>())).Returns(
                new CustomerAuthModel
                {
                    Credentials = new CustomerCredentials
                    {
                        Password = "12345",
                        Username = "test@test.com"
                    }
                }
            );

            var settingsService = fixture.Freeze<Mock<ISettingsService>>();

            settingsService.Setup(service => service.GetLockedAccountSetting()).ReturnsAsync(
                new LockedAccountSettings()
                {
                    EmailsString = "email@test.com"
                }
            );

            var sut = fixture.Freeze<AuthenticationService>();

            var result = await sut.IsUserSignedIn();

            // Assert

            result.Should().Be(true);
            integrationCookieService.Verify(x => x.GetCookie(It.IsAny<HttpContext>()), Times.Once);
            settingsService.Verify(x => x.GetLockedAccountSetting(), Times.Once);
        }

        [Fact]
        public async Task IsUserSignedIn_ReturnFalseAndLogOutUserIfItIsLocked()
        {
            // Arrange
            var fixture = FixtureUtils.AutoMoqFixture();

            var integrationCookieService = fixture.Freeze<Mock<IDAIntegrationService>>();

            integrationCookieService.Setup(service => service.GetCookie(It.IsAny<HttpContext>())).Returns(
                new CustomerAuthModel
                {
                    Credentials = new CustomerCredentials
                    {
                        Password = "12345",
                        Username = "test@test.com"
                    }
                }
            );
            integrationCookieService.Setup(service => service.RemoveCookie(It.IsAny<HttpContext>()));

            var settingsService = fixture.Freeze<Mock<ISettingsService>>();

            settingsService.Setup(service => service.GetLockedAccountSetting()).ReturnsAsync(
                new LockedAccountSettings()
                {
                    EmailsString = "test@test.com"
                }
            );

            var sut = fixture.Freeze<AuthenticationService>();

            var result = await sut.IsUserSignedIn();

            // Assert

            result.Should().Be(false);
            settingsService.Verify(x => x.GetLockedAccountSetting(), Times.Once);
            integrationCookieService.Verify(x => x.GetCookie(It.IsAny<HttpContext>()), Times.Once);
            integrationCookieService.Verify(x => x.RemoveCookie(It.IsAny<HttpContext>()), Times.Once);
        }
    }
}
