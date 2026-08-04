using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using System.Runtime.CompilerServices;

[assembly: InternalsVisibleTo("easyJet.Holidays.Api.Domain.Tests")]
namespace easyJet.Holidays.Api.Domain.Services.AmendBooking;

/// <inheritdoc />
public class AmendLuggageService : IAmendLuggageService
{
    private readonly IBookingRepository _bookingRepository;
    private readonly IAuthenticationService _authService;
    private readonly ITradeAgentAuthenticationService _tradeAgentCookieService;

    /// <summary>
    /// Resolve dependencies
    /// </summary>
    public AmendLuggageService(
        IBookingRepository bookingRepository,
        IAuthenticationService authService,
        ITradeAgentAuthenticationService tradeAgentCookieService)
    {
        _bookingRepository = bookingRepository;
        _authService = authService;
        _tradeAgentCookieService = tradeAgentCookieService;
    }

    /// <inheritdoc />
    public async Task<AmendLuggageResponse> ChangeExtraLuggage(AmendLuggageRequest amendLuggageRequest)
    {
        var booking = await _bookingRepository
            .GetBooking(amendLuggageRequest.BookingReference)
            .WhenLoggedInAsLeadPaxOrTradeAgent(_tradeAgentCookieService, _authService);

        var amendInfoBookingRequest = new AmendInfoBookingRequest
        {
            BookingReference = amendLuggageRequest.BookingReference,
            ExtraLuggageInfo = amendLuggageRequest.ExtraLuggageInfo
        };

        booking.ExtraLuggageInfo = amendLuggageRequest.ExtraLuggageInfo;

        var amendInfoBookingResponse = await _bookingRepository.ValidateAmendBookingInfo(amendInfoBookingRequest, booking, false);

        var response = new AmendLuggageResponse
        {
            ExtraLuggageInfo = amendInfoBookingResponse.ExtraLuggageInfo,
            AmendmentCharges = amendInfoBookingResponse.PaymentInfo?.AmendmentCharges
        };

        if (_tradeAgentCookieService.IsLoggedInAsTradeAgent())
        {
            response.PaymentInfo = amendInfoBookingResponse?.PaymentInfo;
            response.TradeAgentPriceBreakdown = amendInfoBookingResponse?.TradeAgentPriceBreakdown;
            response.PriceBreakdown = amendInfoBookingResponse?.PriceBreakdown;
        }

        return response;
    }
}