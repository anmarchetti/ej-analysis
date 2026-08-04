using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;

namespace easyJet.Holidays.Api.Domain.Extensions;

/// <summary>
/// Extension methods for bookingResponse used in booking amendments
/// </summary>
public static class BookingAmendmentExtensions
{
    /// <summary>
    /// Check for booking to be able to change transfer
    /// </summary>
    /// <param name="bookingResponse"></param>
    /// <returns></returns>
    /// <exception cref="ApiException"></exception>
    public static BookingResponse IfTransfersAmendmentAllowed(this BookingResponse bookingResponse)
    {
        if (!bookingResponse.AmendmentInfo.Transfer.AmendAllow)
        {
            throw new ApiException(ApiExceptionCodes.AmendBookingTransfers, null,
                "Transfers modification prohibited");
        }
        return bookingResponse;
    }

    /// <summary>
    /// Check for booking to be able to change transfer
    /// </summary>
    /// <param name="bookingResponseTask"></param>
    /// <returns></returns>
    /// <exception cref="ApiException"></exception>
    public static async Task<BookingResponse> IfTransfersAmendmentAllowed(this Task<BookingResponse> bookingResponseTask)
    {
        var bookingResponse = await bookingResponseTask;
        return IfTransfersAmendmentAllowed(bookingResponse);
    }

    /// <summary>
    /// Check for booking to be able to change flight
    /// </summary>
    /// <param name="bookingResponse"></param>
    /// <returns></returns>
    /// <exception cref="ApiException"></exception>
    public static BookingResponse IfRoutesAmendmentAllowed(this BookingResponse bookingResponse)
    {
        if (!bookingResponse.AmendmentInfo.Route)
        {
            throw new ApiException(ApiExceptionCodes.AmendBookingRoutes, null,
                "Routes modification prohibited");
        }
        return bookingResponse;
    }

    /// <summary>
    /// Check for booking to be able to change flight
    /// </summary>
    /// <param name="bookingResponseTask"></param>
    /// <returns></returns>
    /// <exception cref="ApiException"></exception>
    public static async Task<BookingResponse> IfRoutesAmendmentAllowed(this Task<BookingResponse> bookingResponseTask)
    {
        var bookingResponse = await bookingResponseTask;
        return IfRoutesAmendmentAllowed(bookingResponse);
    }

    /// <summary>
    /// Throws an exception if seats amendment is prohibited in the booking's AmendmentInfo
    /// </summary>
    /// <param name="bookingResponse"></param>
    /// <returns></returns>
    /// <exception cref="ApiException"></exception>
    public static BookingResponse IfSeatsAmendmentAllowed(this BookingResponse bookingResponse)
    {
        if (!bookingResponse.AmendmentInfo.Seats)
        {
            throw new ApiException(ApiExceptionCodes.AmendBookingSeats, null,
                "Seats modification prohibited");
        }
        return bookingResponse;
    }

    /// <summary>
    /// Throws an exception if seats amendment is prohibited in the booking's AmendmentInfo
    /// </summary>
    /// <param name="bookingResponseTask"></param>
    /// <returns></returns>
    /// <exception cref="ApiException"></exception>
    public static async Task<BookingResponse> IfSeatsAmendmentAllowed(this Task<BookingResponse> bookingResponseTask)
    {
        var bookingResponse = await bookingResponseTask;
        return IfSeatsAmendmentAllowed(bookingResponse);
    }

    /// <summary>
    /// Check if user is logged in as lead passenger or trade agent for Trade Portal bookings
    /// </summary>
    /// <param name="bookingResponse"></param>
    /// <param name="tradeAgentAuthService"></param>
    /// <param name="authenticationService"></param>
    /// <returns></returns>
    /// <exception cref="ApiException"></exception>
    private static async Task<BookingResponse> WhenLoggedInAsLeadPaxOrTradeAgent(this BookingResponse bookingResponse,
        ITradeAgentAuthenticationService tradeAgentAuthService, IAuthenticationService authenticationService)
    {
        bool isTradePortalBooking = bookingResponse?.IsExternalAgency ?? false;

        if (isTradePortalBooking)
        {
            if (!tradeAgentAuthService.IsLoggedInAsTradeAgent())
            {
                throw new ApiException(ApiExceptionCodes.AmendTradePortalBookingNotATradeAgent, null,
                    "Only trade agents can amend Trade Portal booking");
            }
        }
        else
        {
            var loggedAsBookingLeadPassenger = await authenticationService.IsLoggedInAsLeadPax(bookingResponse?.LeadPassenger?.Email);
            if (!loggedAsBookingLeadPassenger)
            {
                throw new ApiException(ApiExceptionCodes.LoggedNotAsBookingLeadPassenger, null,
                    "Customer is not logged in or is not the lead passenger for the booking");
            }
        }

        return bookingResponse;
    }

    /// <summary>
    /// Check if user is logged in as lead passenger or trade agent for Trade Portal bookings
    /// </summary>
    /// <param name="bookingResponseTask"></param>
    /// <param name="tradeAgentAuthService"></param>
    /// <param name="authenticationService"></param>
    /// <returns></returns>
    /// <exception cref="ApiException"></exception>
    public static async Task<BookingResponse> WhenLoggedInAsLeadPaxOrTradeAgent(this Task<BookingResponse> bookingResponseTask,
        ITradeAgentAuthenticationService tradeAgentAuthService, IAuthenticationService authenticationService)
    {
        ArgumentNullException.ThrowIfNull(tradeAgentAuthService);
        ArgumentNullException.ThrowIfNull(authenticationService);

        var bookingResponse = await bookingResponseTask;
        return await WhenLoggedInAsLeadPaxOrTradeAgent(bookingResponse, tradeAgentAuthService, authenticationService);
    }

    /// <summary>
    /// Adds api errors to the response
    /// </summary>
    /// <param name="amendBookingInfo">response</param>
    /// <param name="apiErrors">errors to be added to the response</param>
    public static ValidateAmendBookingResponse ConcatenateApiErrors(this ValidateAmendBookingResponse amendBookingInfo, ApiError[] apiErrors)
    {
        if (amendBookingInfo is null)
            return null;

        amendBookingInfo.ApiErrors ??= Array.Empty<ApiError>();

        amendBookingInfo.ApiErrors = amendBookingInfo.ApiErrors.Concat(apiErrors ?? Array.Empty<ApiError>()).ToArray();

        return amendBookingInfo;
    }
}