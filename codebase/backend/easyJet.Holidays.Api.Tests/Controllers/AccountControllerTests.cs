using AutoFixture;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Vouchers;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Moq;
using System.Net;

namespace easyJet.Holidays.Api.Domain.Tests.Controllers
{
    public class AccountControllerTests
    {
        private readonly AccountController _sut;

        private readonly Mock<IAuthenticationService> authenticationServiceMock = new();
        private readonly Mock<ICustomerProvider> customerProviderMock = new();
        private readonly Mock<IVouchersService> vouchersServiceMock = new();
        private readonly Mock<ICaptchaService> captchaServiceMock = new();


        public AccountControllerTests()
        {
            var fixture = FixtureUtils.AutoMoqFixture();

            fixture.Inject(Options.Create(new B2BSettings { EmailDoesNotExistErrorCode = "EmailNotExistent" }));
            fixture.Inject(Options.Create(new GoogleSettings()));
            fixture.Inject(Options.Create(new ApiSettings { Vouchers = new() }));
            fixture.Inject(Options.Create(new EnvironmentBehaviourSettings { }));
            
            _sut = new AccountController(
                authenticationServiceMock.Object,
                customerProviderMock.Object,
                vouchersServiceMock.Object,
                captchaServiceMock.Object,
                fixture.Create<IOptions<B2BSettings>>(),
                fixture.Create<IOptions<ApiSettings>>(),
                fixture.Create<IOptions<GoogleSettings>>(),
                fixture.Create<IOptions<EnvironmentBehaviourSettings>>()
            );
            _sut.ControllerContext = new ControllerContext();
            _sut.ControllerContext.HttpContext = new DefaultHttpContext();
        }

        [Fact]
        public async Task ResetPassword_NoErrorThrown_ReturnOK()
        {
            // Arrange
            customerProviderMock
                .Setup(x => x.ResetPassword(It.IsAny<string>())).Verifiable();

            // Act
            var response = await _sut.ResetPassword("any");

            // Assert
            customerProviderMock.Verify(x => x.ResetPassword(It.IsAny<string>()), Times.Once);
        }

        [Fact]
        public async Task ResetPassword_ExceptionB2bThrown_ReturnOK()
        {
            // Arrange
            customerProviderMock
                .Setup(x => x.ResetPassword(It.IsAny<string>()))
                .ThrowsAsync(new ApiException(new ExceptionCode { Code = "API-ERR-1000003", Description = "Can not register customer" }, null, new ApiError[] { new ApiError { Code = "EmailNotExistent" } }, null, HttpStatusCode.BadRequest, null));

            // Act
            var response = await _sut.ResetPassword("any");

            // Assert
            response.Should().BeOfType<OkObjectResult>();
        }

        [Fact]
        public async Task ResetPassword_Nonb2bExceptionThrown_Failure()
        {
            // Arrange
            customerProviderMock
                .Setup(x => x.ResetPassword(It.IsAny<string>()))
                .ThrowsAsync(new ApiException(new ExceptionCode { }));

            // Act
            Task result() => _sut.ResetPassword("any");

            // Assert
            await Assert.ThrowsAsync<ApiException>(result);
        }

        [Fact]
        public async Task ResetPassword_AnyExceptionThrown_Failure()
        {
            // Arrange
#pragma warning disable CA2201 // Do not raise reserved exception types
            customerProviderMock
                .Setup(x => x.ResetPassword(It.IsAny<string>()))
                .ThrowsAsync(new Exception());
#pragma warning restore CA2201 // Do not raise reserved exception types

            // Act
            Task result() => _sut.ResetPassword("any");

            // Assert
            await Assert.ThrowsAsync<Exception>(result);
        }
    }
}
