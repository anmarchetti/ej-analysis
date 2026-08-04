using AutoFixture;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Api.Domain.Data.Marketing;
using easyJet.Holidays.Api.Domain.Interfaces.Marketing;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using System.Net;

namespace easyJet.Holidays.Api.Domain.Tests.Controllers
{
    public class MarketingControllerTests
    {
        private readonly IFixture _fixture;

        private readonly MarketingController _sut;

        private readonly Mock<IMarketingService> _marketingServiceMock;
        private readonly Mock<ILogger<MarketingController>> _loggerMock;

        public MarketingControllerTests()
        {
            _fixture = FixtureUtils.AutoMoqFixture();

            _marketingServiceMock = new Mock<IMarketingService>();
            _loggerMock = new Mock<ILogger<MarketingController>>();

            _sut = new MarketingController(
                _marketingServiceMock.Object,
                _loggerMock.Object
            );
        }

        [Theory]
#pragma warning disable xUnit1045 // Avoid using TheoryData type arguments that might not be serializable
        [MemberData(nameof(GetCustomerPreferences_InvalidRequestGeneratorData))]
#pragma warning restore xUnit1045 // Avoid using TheoryData type arguments that might not be serializable
        public async Task GetCustomerPreferences_OnInvalidRequest_ReturnsEmptyOKResponse(CustomerPreferencesRequest request)
        {
            // Arrange
            // nothing to arrange for this case.

            // Act
            var result = await _sut.GetCustomerPreferences(request) as ObjectResult;
            var value = result!.Value as CustomerPreferencesResponse;

            // Assert
            result.Should().NotBeNull();
            result.StatusCode.Should().Be((int)HttpStatusCode.OK);
            value.Should().NotBeNull();
            value!.CanBeSent.Should().Be(default);
            value.Urls.Should().BeNullOrEmpty();
            _marketingServiceMock.Verify(
                mock =>
                mock.GetMarketingPreferences(It.IsAny<CustomerPreferencesRequest>()),
                Times.Never()
            );
        }

        public static readonly TheoryData<CustomerPreferencesRequest> GetCustomerPreferences_InvalidRequestGeneratorData = new()
        {
            new CustomerPreferencesRequest(){Email = null},
            new CustomerPreferencesRequest(){Email = "notAValidEmail"},
            new CustomerPreferencesRequest(){Email = "test@test.test", BookingReference = null},
            new CustomerPreferencesRequest(){Email = "test@test.test", BookingReference = "1"},
            new CustomerPreferencesRequest(){Email = "test@test.test", BookingReference = "12"},
            new CustomerPreferencesRequest(){Email = "test@test.test", BookingReference = "123"},
            new CustomerPreferencesRequest(){Email = "test@test.test", BookingReference = "1234"},
            new CustomerPreferencesRequest(){Email = "test@test.test", BookingReference = "12345"},
        };

        [Fact]
        public async Task GetCustomerPreferences_OnValidRequest_ReturnsOKResponseWithServiceData()
        {
            // Arrange
            var request = new CustomerPreferencesRequest() { Email = "test@test.test", BookingReference = "1234567" };
            var response = new CustomerPreferencesResponse();
            _marketingServiceMock.Setup(mock => mock.GetMarketingPreferences(request))
                .ReturnsAsync(response);

            // Act
            var result = await _sut.GetCustomerPreferences(request) as ObjectResult;
            var value = result!.Value as CustomerPreferencesResponse;

            // Assert
            result.Should().NotBeNull();
            result.StatusCode.Should().Be((int)HttpStatusCode.OK);
            value.Should().NotBeNull();
            value.Should().BeEquivalentTo(response);
            _marketingServiceMock.Verify(
                mock =>
                    mock.GetMarketingPreferences(request),
                Times.Once()
            );
        }

        [Fact]
        public async Task GetCustomerPreferences_OnValidRequestAndException_ReturnsOKResponseAfterLogging()
        {
            // Arrange
            var request = new CustomerPreferencesRequest() { Email = "test@test.test", BookingReference = "1234567" };
            var expectedException = new InvalidOperationException();
            var response = new CustomerPreferencesResponse();
            _marketingServiceMock.Setup(mock => mock.GetMarketingPreferences(request))
                .ThrowsAsync(expectedException);

            // Act
            var result = await _sut.GetCustomerPreferences(request) as ObjectResult;
            var value = result!.Value as CustomerPreferencesResponse;

            // Assert
            result.Should().NotBeNull();
            result.StatusCode.Should().Be((int)HttpStatusCode.OK);
            value.Should().NotBeNull();
            value.Should().BeEquivalentTo(response);
            _marketingServiceMock.Verify(
                mock =>
                    mock.GetMarketingPreferences(request),
                Times.Once()
            );
            _loggerMock.Verify(
                LoggerTestUtils.VerifyForLogLevel<MarketingController>(LogLevel.Error),
                Times.Once()
            );
        }

        [Theory]
#pragma warning disable xUnit1045 // Avoid using TheoryData type arguments that might not be serializable
        [MemberData(nameof(Unsubscribe_InvalidOrNullRequestGeneratorData))]
#pragma warning restore xUnit1045 // Avoid using TheoryData type arguments that might not be serializable
        public async Task Unsubscribe_InvalidOrNullRequest_ReturnsErrorResponseAfterLogging(UnsubscribeRequest request)
        {
            // Arrange
            // nothing to arrange

            // Act
            Func<Task<IActionResult>> action = async () => await _sut.Unsubscribe(request);

            // Assert
            var exc = await Record.ExceptionAsync(action) as ApiException;
            exc.Should().NotBeNull();
            exc!.StatusCode.Should().Be(HttpStatusCode.BadRequest);
            _marketingServiceMock.Verify(mock => mock.Unsubscribe(It.IsAny<UnsubscribeRequest>()), Times.Never);
            _loggerMock.Verify(LoggerTestUtils.VerifyForLogLevel<MarketingController>(LogLevel.Error));
        }

        public static readonly TheoryData<UnsubscribeRequest> Unsubscribe_InvalidOrNullRequestGeneratorData = new()
        {
#pragma warning disable CS8625 // Cannot convert null literal to non-nullable reference type.
             null,
#pragma warning restore CS8625 // Cannot convert null literal to non-nullable reference type.
            new UnsubscribeRequest(){Email = null} ,
            new UnsubscribeRequest(){Email = string.Empty} ,
        };

        [Fact]
        public async Task Unsubscribe_ValidRequest_ReturnsEmptyOKResponseAfterCallingService()
        {
            // Arrange
            var request = new UnsubscribeRequest() { Email = "test.test@test.test" };
            _marketingServiceMock.Setup(
                    mock =>
                    mock.Unsubscribe(request)
            );

            // Act
            var response = await _sut.Unsubscribe(request) as StatusCodeResult;

            // Assert
            response.Should().NotBeNull();
            response!.StatusCode.Should().Be((int)HttpStatusCode.OK);
            _marketingServiceMock.Verify(
                mock =>
                mock.Unsubscribe(request),
                Times.Once
            );
            _loggerMock.Verify(LoggerTestUtils.VerifyForLogLevel<MarketingController>(LogLevel.Error), Times.Never);
        }

        [Fact]
        public async Task VerifyInExternalSystems_ValidRequest_ReturnsEmtpyOKResponseAfterCallingService()
        {
            // Arrange 
            var request = new MarketingPreferencesRequest() { };
            _marketingServiceMock.Setup(
                mock =>
                mock.AddToVerify(It.IsAny<IEnumerable<string>>())
            ).Returns(Task.CompletedTask);

            // Act
            var response = await _sut.VerifyInExternalSystems(request) as StatusCodeResult;

            // Assert
            response.Should().NotBeNull();
            response!.StatusCode.Should().Be((int)HttpStatusCode.OK);

            _marketingServiceMock.Verify(x => x.AddToVerify(It.IsAny<IEnumerable<string>>()), Times.Once);
        }

        [Fact]
        public async Task GetMarketingPreferences_ValidRequest_ReturnsEmtpyOKResponseAfterCallingService()
        {
            // Arrange 
            var requestMail = "test.test@test.test";
            var serviceResponse = new CustomerPreferencesResponse();
            _marketingServiceMock.Setup(
                mock =>
                mock.GetMarketingPreferences(requestMail)
            ).ReturnsAsync(serviceResponse);

            // Act
            var response = await _sut.GetMarketingPreferences(requestMail) as ObjectResult;

            // Assert
            response.Should().NotBeNull();
            response!.StatusCode.Should().Be((int)HttpStatusCode.OK);
            response.Value.Should().Be(serviceResponse);
            _marketingServiceMock.Verify(x => x.GetMarketingPreferences(requestMail), Times.Once);
        }
        [Fact]
        public void GenerateUnsubscribeUrl_NullRequest_ReturnsBadRequest()
        {
            // Arrange
            GenerateUnsubscribeUrlRequest request = null!;

            // Act
            var result = _sut.GenerateUnsubscribeUrl(request) as UnprocessableEntityObjectResult;

            // Assert
            result.Should().NotBeNull();
            result!.StatusCode.Should().Be((int)HttpStatusCode.UnprocessableEntity);
            result.Value.Should().Be("Request cannot be null");
            _marketingServiceMock.Verify(
                mock => mock.BuildUnsubscribeLink(It.IsAny<string>(), It.IsAny<string>()),
                Times.Never
            );
        }

        [Fact]
        public void GenerateUnsubscribeUrl_ServiceThrowsException_ReturnsBadRequestAndLogsError()
        {
            // Arrange
            var request = new GenerateUnsubscribeUrlRequest { Email = "test@test.com", Lang = "en" };
            var expectedException = new ArgumentException("Invalid email or language");
            
            _marketingServiceMock.Setup(mock => mock.BuildUnsubscribeLink(request.Email, request.Lang))
                .Throws(expectedException);

            // Act
            var result = _sut.GenerateUnsubscribeUrl(request) as BadRequestObjectResult;

            // Assert
            result.Should().NotBeNull();
            result!.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
            result.Value.Should().Be("Unable to generate unsubscribe URL");
            
            _marketingServiceMock.Verify(
                mock => mock.BuildUnsubscribeLink(request.Email, request.Lang),
                Times.Once
            );
            
            _loggerMock.Verify(
                LoggerTestUtils.VerifyForLogLevel<MarketingController>(LogLevel.Error),
                Times.Once
            );
        }

        [Fact]
        public void GenerateUnsubscribeUrl_ValidRequest_ReturnsOkWithUrl()
        {
            // Arrange
            var request = new GenerateUnsubscribeUrlRequest { Email = "test@test.com", Lang = "en" };
            var expectedUrl = "https://example.com/unsubscribe?email=encrypted&lang=en";
    
            _marketingServiceMock.Setup(mock => mock.BuildUnsubscribeLink(request.Email, request.Lang))
                .Returns(expectedUrl);

            // Act
            var result = _sut.GenerateUnsubscribeUrl(request) as OkObjectResult;

            // Assert
            result.Should().NotBeNull();
            result!.StatusCode.Should().Be((int)HttpStatusCode.OK);
    
            var response = result.Value as UnsubscribeUrlResponse;
            response.Should().NotBeNull();
            response!.UnsubscribeUrl.ToString().Should().Be(expectedUrl);
    
            _marketingServiceMock.Verify(
                mock => mock.BuildUnsubscribeLink(request.Email, request.Lang),
                Times.Once
            );
        }
    }
}
