using easyJet.Holidays.Api.Domain.Data.Authentication.Agent;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Api;
using easyJet.Holidays.External.Domain.Exceptions;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using System.Text;
using Xunit;
using InfoBookingRequest = easyJet.Holidays.External.Atcom.Models.InfoBooking.InfoBookingRequest;
using InfoBookingResponse = easyJet.Holidays.External.Atcom.Models.InfoBooking.InfoBookingResponse;

namespace easyJet.Holidays.External.Atcom.Tests.Api
{

    public class AtcomApiServiceTests
    {
        private readonly Mock<AtcomApiClient> _atcomApiClientMock;
        private readonly Mock<ITradeAgentAuthenticationService> _tradeAgentAuthServiceMock = new();
        private readonly IOptions<AtcomSettings> _atcomSettings;
        private readonly AtcomApiService _atcomApiService;

        #region Test data

        private readonly AtcomError unableToFindChosenFlightsWarning = new AtcomError
        {
            Code = "W11124",
            Message = "Unable to find chosen flights so returning cheapest available"
        };

        private readonly AtcomError otherWarningWithMessage = new AtcomError
        {
            Code = "W11125",
            Message = "Warning message"
        };

        private readonly AtcomError otherWarningWithoutMessage = new AtcomError
        {
            Code = "W11127"
        };

        private readonly AtcomError otherWarning = new AtcomError
        {
            Code = "W11129"
        };

        private const string ResponseHasWarningsMessage = "Response has warnings";
        private const string ResponseHasErrorsMessage = "Response has errors";
        private const string ErrorCodeToIgnore = "E14543";
        private const string OtherErrorCode = "E1234";

        private const string AtcomResponseWithWarning = @"
    <p2:InfoBookingResponse xmlns:p1=""AtComRes/Common"" xmlns:p2=""AtComRes/InfoBookingResponse"">
    <p1:Adm>
        <p1:Ser_Msg>
			<p1:Severity>WARN</p1:Severity>
			<p1:Code>{0}</p1:Code>
			<p1:Desc>Warning message</p1:Desc>
		</p1:Ser_Msg>
    </p1:Adm>
    </p2:InfoBookingResponse>";

        private const string AtcomResponseWithError = @"
    <p2:InfoBookingResponse xmlns:p1=""AtComRes/Common"" xmlns:p2=""AtComRes/InfoBookingResponse"">
    <p1:Adm>
        <p1:Ser_Msg>
			<p1:Severity>ERROR</p1:Severity>
			<p1:Code>{0}</p1:Code>
			<p1:Desc>Error</p1:Desc>
		</p1:Ser_Msg>
    </p1:Adm>
    </p2:InfoBookingResponse>";

        private const string CorrectAtcomResponse = @"
    <p2:InfoBookingResponse xmlns:p1=""AtComRes/Common"" xmlns:p2=""AtComRes/InfoBookingResponse"">
    <p1:Adm>
    </p1:Adm>
    </p2:InfoBookingResponse>";

        private const string UnavailableFlightsWarning = @"
    <p2:InfoBookingResponse xmlns:p1=""AtComRes/Common"" xmlns:p2=""AtComRes/InfoBookingResponse"">
    <p1:Adm>
        <p1:Ser_Msg>
			<p1:Severity>WARN</p1:Severity>
			<p1:Code>{0}</p1:Code>
			<p1:Desc>Unable to find chosen flights so returning cheapest available</p1:Desc>
		</p1:Ser_Msg>
    </p1:Adm>
    </p2:InfoBookingResponse>";
        #endregion

        public AtcomApiServiceTests()
        {
            _atcomApiClientMock = new Mock<AtcomApiClient>(
                null,
                Options.Create(new EnvironmentBehaviourSettings()),
                null,
                null,
                Options.Create(new HeadersSettings()),
                null);

            _tradeAgentAuthServiceMock.Setup(mock => mock.GetCurrentAgent())
                .Returns(new AgentDetails { Number = "", Name = "" });

            _atcomSettings = Options.Create(new AtcomSettings
            {
                IgnoreAllErrors = false,
                ErrorCodesToIgnore = new[] { ErrorCodeToIgnore },
                WarningCodesTreatedAsErrors = new List<AtcomError> { unableToFindChosenFlightsWarning, otherWarningWithMessage, otherWarningWithoutMessage },
                EndpointTemplate = new AtcomEndpointTemplateSettings { TradeAgentParam = "" }
            });

            _atcomApiService = new AtcomApiService(
                _atcomApiClientMock.Object,
                _atcomSettings,
                _tradeAgentAuthServiceMock.Object);
        }


        [Fact]
        public async Task GetResponseContentAsync_FailsOnReplacedFlights()
        {
            SetupAtcomApiClientMock(string.Format(UnavailableFlightsWarning, unableToFindChosenFlightsWarning.Code));
            var act = () => _atcomApiService.GetResponseContentAsync<InfoBookingRequest, InfoBookingResponse>(new InfoBookingRequest());
            await act.Should().ThrowAsync<ErrorResponseException>().WithMessage(ResponseHasWarningsMessage);
        }

        [Fact]
        public async Task GetResponseContentAsync_FailsOnRightWarningWithMessage()
        {
            SetupAtcomApiClientMock(string.Format(AtcomResponseWithWarning, otherWarningWithMessage.Code));
            var act = () => _atcomApiService.GetResponseContentAsync<InfoBookingRequest, InfoBookingResponse>(new InfoBookingRequest());
            await act.Should().ThrowAsync<ErrorResponseException>().WithMessage(ResponseHasWarningsMessage);
        }

        [Fact]
        public async Task GetResponseContentAsync_FailsOnRightWarningWithoutMessage()
        {
            SetupAtcomApiClientMock(string.Format(AtcomResponseWithWarning, otherWarningWithoutMessage.Code));
            var act = () => _atcomApiService.GetResponseContentAsync<InfoBookingRequest, InfoBookingResponse>(new InfoBookingRequest());
            await act.Should().ThrowAsync<ErrorResponseException>().WithMessage(ResponseHasWarningsMessage);
        }

        [Fact]
        public async Task GetResponseContentAsyncIgnoreErrors_FailsOnRightWarning()
        {
            SetupAtcomApiClientMock(string.Format(AtcomResponseWithWarning, otherWarningWithMessage.Code));
            var act = () => _atcomApiService.GetResponseContentAsyncIgnoreErrors<InfoBookingRequest, InfoBookingResponse>(new InfoBookingRequest());
            await act.Should().ThrowAsync<ErrorResponseException>().WithMessage(ResponseHasWarningsMessage);
        }

        [Fact]
        public async Task GetResponseContentAsync_DoesNotFailOnOtherWarning()
        {
            SetupAtcomApiClientMock(string.Format(AtcomResponseWithWarning, otherWarning.Code));
            var act = () => _atcomApiService.GetResponseContentAsync<InfoBookingRequest, InfoBookingResponse>(new InfoBookingRequest());
            await act.Should().NotThrowAsync();
        }

        [Fact]
        public async Task GetResponseContentAsyncIgnoreErrors_DoesNotFailOnOtherWarning()
        {
            SetupAtcomApiClientMock(string.Format(AtcomResponseWithWarning, otherWarning.Code));
            var act = () => _atcomApiService.GetResponseContentAsyncIgnoreErrors<InfoBookingRequest, InfoBookingResponse>(new InfoBookingRequest());
            await act.Should().NotThrowAsync();
        }

        [Fact]
        public async Task GetResponseContentAsync_FailsOnError()
        {
            SetupAtcomApiClientMock(string.Format(AtcomResponseWithError, OtherErrorCode));
            var act = () => _atcomApiService.GetResponseContentAsync<InfoBookingRequest, InfoBookingResponse>(new InfoBookingRequest());
            await act.Should().ThrowAsync<ErrorResponseException>().WithMessage(ResponseHasErrorsMessage);
        }

        [Fact]
        public async Task GetResponseContentAsyncIgnoreErrors_FailsOnError()
        {
            SetupAtcomApiClientMock(string.Format(AtcomResponseWithError, OtherErrorCode));
            var act = () => _atcomApiService.GetResponseContentAsyncIgnoreErrors<InfoBookingRequest, InfoBookingResponse>(new InfoBookingRequest());
            await act.Should().ThrowAsync<ErrorResponseException>().WithMessage(ResponseHasErrorsMessage);
        }

        [Fact]
        public async Task GetResponseContentAsync_DoesNotFailOnCorrectResponse()
        {
            SetupAtcomApiClientMock(CorrectAtcomResponse);
            var act = () => _atcomApiService.GetResponseContentAsync<InfoBookingRequest, InfoBookingResponse>(new InfoBookingRequest());
            await act.Should().NotThrowAsync();
        }

        [Fact]
        public async Task GetResponseContentAsyncIgnoreErrors_DoesNotFailOnCorrectResponse()
        {
            SetupAtcomApiClientMock(CorrectAtcomResponse);
            var act = () => _atcomApiService.GetResponseContentAsyncIgnoreErrors<InfoBookingRequest, InfoBookingResponse>(new InfoBookingRequest());
            await act.Should().NotThrowAsync();
        }

        [Fact]
        public async Task GetResponseContentAsyncIgnoreErrors_DoesNotFailOnIgnoredError()
        {
            SetupAtcomApiClientMock(string.Format(AtcomResponseWithError, ErrorCodeToIgnore));
            var act = () => _atcomApiService.GetResponseContentAsyncIgnoreErrors<InfoBookingRequest, InfoBookingResponse>(new InfoBookingRequest());
            await act.Should().NotThrowAsync();
        }

        [Fact]
        public async Task GetResponseContentAsyncIgnoreErrors_DoesNotFailOnAnyErrorIfConfigured()
        {
            _atcomSettings.Value.IgnoreAllErrors = true;
            SetupAtcomApiClientMock(string.Format(AtcomResponseWithError, OtherErrorCode));
            var act = () => _atcomApiService.GetResponseContentAsyncIgnoreErrors<InfoBookingRequest, InfoBookingResponse>(new InfoBookingRequest());
            await act.Should().NotThrowAsync();
        }

        private void SetupAtcomApiClientMock(string response)
        {
            _atcomApiClientMock
                .Setup(mock => mock.MakeCall(
                    It.IsAny<HttpMethod>(),
                    It.IsAny<Uri>(),
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<TimeSpan?>()))
                .ReturnsAsync(new MemoryStream(Encoding.UTF8.GetBytes(response)));
        }
    }
}