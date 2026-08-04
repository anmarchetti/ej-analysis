using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Exceptions;
using easyJet.Holidays.External.Domain.Models.Api.Payload;
using easyJet.Holidays.External.EI.Api;
using easyJet.Holidays.External.EI.Models;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using System.Text;
using Xunit;

namespace easyJet.Holidays.External.EI.Tests.Services;

public class EIApiServiceTests
{
    private readonly Mock<EiApiClient> _eiApiClientMock;
    private readonly EiApiService _eiApiService;
    
    private const string ResponseHasWarningsMessage = "Response has errors";
    private const string _paymentId = "1";
    private readonly MakePaymentRequest _makePaymentRequest = new()
    {
        Payload = new JsonApiPayload<MakePaymentRequestBody>
        {
            Body = new MakePaymentRequestBody
            {
                ClientData = new MakePaymentRequestClientData(),
                OrderData = new OrderData(),
                BrowserInfo = new MakePaymentRequestBrowserInfo(),
                PaymentDetail = new MakePaymentRequestPaymentDetail()
            }
        }
    };
    private readonly MakePaymentResponse _makePaymentResponse = new()
    {
        Payload = new JsonApiPayload<MakePaymentResponseBody>()
        {
            Body = new MakePaymentResponseBody()
            {
                PaymentId = _paymentId,
            }
        }
    };
    private readonly ErrorResponse _errorResponse = new()
    {
        Payload = new JsonApiPayload<ErrorResponseBody>
        {
            Body = new ErrorResponseBody
            {
                Errors =
                [
                    new Error
                    {
                        Message = ResponseHasWarningsMessage,
                        AffectedData =
                        [
                            new Data() { DataName = "SVC_PAY_001", Information = ResponseHasWarningsMessage }
                        ]
                    }
                ]
            }
        }
    };
    

    public EIApiServiceTests()
    {
        IOptions<PaymentsSettings> paymentsSettings = Options.Create(new PaymentsSettings(){ Api = new PaymentsApiSettings() {TimeoutMilliSeconds = 10000}});
        _eiApiClientMock = new Mock<EiApiClient>(
            null, 
            paymentsSettings, 
            Options.Create(new EnvironmentBehaviourSettings()), 
            null);
        _eiApiService = new EiApiService(_eiApiClientMock.Object, paymentsSettings);
    }
    
    [Fact]
    public void Constructor_ShouldThrowArgumentNullException_WhenPaymentSettingsIsNull()
    {
        var mockNullPaymentSettings = new Mock<IOptions<PaymentsSettings>>();
        
        Assert.Throws<ArgumentNullException>(() => new EiApiService(null, mockNullPaymentSettings.Object));
    }

    [Fact]
    public void Name_ReturnPaymentAPIServiceName()
    {
        string name = _eiApiService.Name();
        
        Assert.Equal("EI API service.", name);
    }

    [Fact]
    public async Task GetResponseContentAsync_ReturnResponseContent()
    {
        SetupEiApiClientMock(_makePaymentResponse.PayloadString);
        
        var act = await _eiApiService.GetResponseContentAsync<MakePaymentRequest, MakePaymentResponse>(_makePaymentRequest);
        Assert.Equal(_paymentId, act.Payload.Body.PaymentId);
    }
    
    [Fact]
    public async Task GetResponseContentAsync_ShouldThrowException_WhenErrorResponseReceived()
    {
        SetupEiApiClientMock(_errorResponse.PayloadString);
        
        var act = () => _eiApiService.GetResponseContentAsync<MakePaymentRequest, ErrorResponse>(_makePaymentRequest);
        await act.Should().ThrowAsync<ErrorResponseException>()
            .WithMessage(ResponseHasWarningsMessage);
    }
    
    [Fact]
    public void DeserializeResponse_ReturnResponse()
    {
        string responseString = "{\n  \"paymentId\" : " + _paymentId + "\n}";
        
        MakePaymentResponse act = _eiApiService.DeserializeResponse<MakePaymentResponse>(responseString);
        Assert.Equal(_paymentId, act.Payload.Body.PaymentId);
    }
    
    [Fact]
    public void DeserializeResponse_ThrowException_WhenErrorResponseReceived()
    {
        string responseString = "{\n  \"error\" : \"response unavailable\",\n \"code\" : \"ERR001\", \n \"SVC_PAY_001\" : \"Test\" \n}";
        
        var act = () => _eiApiService.DeserializeResponse<MakePaymentResponse>(responseString);
        act.Should().Throw<DeserializationException>();
    }

    private void SetupEiApiClientMock(string response)
    {
        _eiApiClientMock
            .Setup(mock => mock.MakeCall(
                It.IsAny<HttpMethod>(),
                It.IsAny<Uri>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<TimeSpan?>()))
            .ReturnsAsync(new MemoryStream(Encoding.UTF8.GetBytes(response)));
    }
}