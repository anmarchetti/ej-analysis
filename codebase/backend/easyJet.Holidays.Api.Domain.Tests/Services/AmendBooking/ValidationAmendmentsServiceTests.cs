using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Services.AmendBooking;
using easyJet.Holidays.Api.Domain.Services.AmendBooking.AmendmentValidators;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using easyJet.Holidays.Api.Domain.Services.Booking;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Options;
using Moq;

namespace easyJet.Holidays.Api.Domain.Tests.Services.AmendBooking;

public class ValidationAmendmentsServiceTests
{
    private Mock<IReferenceDataService> _referenceDataServiceMock = new Mock<IReferenceDataService>();
    private Mock<ISettingsService> _settingsServiceMock = new Mock<ISettingsService>();
    private Mock<IAuthenticationService> _authenticationServiceMock = new Mock<IAuthenticationService>();
    private Mock<ITradeAgentCookieAuthService> _tradeAgentCookieServiceMock = new Mock<ITradeAgentCookieAuthService>();
    private Mock<IB2BBookingService> _b2BBookingServiceMock = new Mock<IB2BBookingService>();
    private IOptions<ApiSettings> _apiSettings;
    private IOptions<AtcomSettings> _atcomSettings;
    private Mock<IEnumerable<IAmendmentValidator>> _amendmentValidatorsMock = new Mock<IEnumerable<IAmendmentValidator>>();
    private Mock<AtcomStatusesValidator> _atcomStatusesValidatorMock = new Mock<AtcomStatusesValidator>();

    private IValidationAmendmentsService _sub;

    public ValidationAmendmentsServiceTests()
    {
        _apiSettings = Options.Create(new ApiSettings
        {
            AmendBookingMemo = new AmendBookingMemoSettings
            {
                SpecialRequestChange = new MemoSettings
                {
                    Code = "AMD9"
                },
                FlightTimeChange = new MemoSettings
                {
                    Code = "AMD1"
                },
                TransferChange = new MemoSettings
                {
                    Code = "AMD2"
                },
                HolidayDateChange = new MemoSettings
                {
                    Code = "AMD8"
                }
            },
            ExternalHotelsProviders = new Dictionary<ExternalHotelProviders, List<string>>
            {
                { ExternalHotelProviders.DI, new List<string> { "TGX" } },
                { ExternalHotelProviders.HBG, new List<string> { "HB3" } },
            }
        });

        var validators = new List<IAmendmentValidator> { _atcomStatusesValidatorMock.Object };

        _sub = new ValidationAmendmentsService(validators);
    }
}