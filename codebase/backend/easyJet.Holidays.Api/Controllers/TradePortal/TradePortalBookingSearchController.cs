using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Hotels;
using easyJet.Holidays.Api.Domain.Services.Content;
using easyJet.Holidays.Api.Domain.Services.Luggage;
using easyJet.Holidays.Api.Domain.Settings;

using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using Microsoft.Extensions.Options;
using System.ComponentModel.DataAnnotations;
using System.Net;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;

namespace easyJet.Holidays.Api.Controllers.TradePortal;

[Route("trade-portal/booking/search")]
[ApiController]
[ApiVersion("1.0")]
public class TradePortalBookingSearchController : ControllerBase
{
    private readonly IBookingRepository _bookingRepository;
    private readonly ILogger<TradePortalBookingSearchController> _logger;
    private readonly AtcomSettings _atcomSettings;
    private readonly TradePortalSettings _tradePortalSettings;
    private readonly IHotelsService _hotelsService;
    private readonly IContentService _contentService;
    private readonly IBookingFetchService _bookingFetchService;
    private readonly ILuggageService _luggageService;


    /// <summary>
    /// DI constructor, resolves dependencies. 
    /// </summary>
    public TradePortalBookingSearchController(
        IBookingRepository bookingRepository,
        ILogger<TradePortalBookingSearchController> logger,
        IOptions<AtcomSettings> atcomSettings,
        IOptions<TradePortalSettings> tradePortalSettings,
        IHotelsService hotelsService,
        IContentService contentService,
        IBookingFetchService bookingFetchService,
        ILuggageService luggageService)
    {
        _bookingRepository = bookingRepository;
        _logger = logger;
        _hotelsService = hotelsService;
        _contentService = contentService;
        _bookingFetchService = bookingFetchService;
        _luggageService = luggageService;
        _atcomSettings = atcomSettings.Value;
        _tradePortalSettings = tradePortalSettings.Value;
    }

    /// <summary>
    /// Searches booking by booking reference
    /// </summary>
    /// <param name="bookingReference"></param>
    /// <response code="200">Booking</response>
    /// <response code="400">Bad Request: validation error</response>
    /// <response code="404">Booking not found</response>
    [HttpGet]
    [Route("simple")]
    public async Task<IActionResult> SimpleSearch(
        [StringLength(30)]
        [RegularExpression("^\\w+$")]
        string bookingReference)
    {
        try
        {
            var booking = await _bookingRepository.GetBooking(bookingReference);

            if (booking == null)
            {
                return NotFound();
            }

            await _contentService.UpdateHealsEntryRequirementsContent(booking);
            await _bookingFetchService.EnrichAndSecureBookingResponse(booking);
            await _hotelsService.EnrichBookingResponse(booking);

            return Ok(booking);
        }
        catch (ApiException ex)
        {
            _logger.LogError(ex, "Exception occurred while getting booking");

            if (ex.Code.Equals(ApiExceptionCodes.BookingViewError))
            {
                if (ex.InnerErrors?.Any(error => error.Code == _atcomSettings.ErrorCodes.UserDoesNotHavePermissionToViewBooking) ?? false)
                {
                    throw new ApiException(ex.Code, ex.Message, ex.InnerErrors, ex.InnerException, HttpStatusCode.Forbidden);
                }

                throw new ApiException(ex.Code, ex.Message, ex.InnerErrors, ex.InnerException, HttpStatusCode.NotFound);
            }

            throw;
        }

    }

    /// <summary>
    /// Searches booking by specified parameters
    /// </summary>
    /// <param name="request"></param>
    /// <response code="200">BookingResponse</response>
    /// <response code="400">Bad Request: validation error</response>
    /// <response code="404">Booking not found</response>
    [HttpGet]
    [Route("advanced")]
    public async Task<IActionResult> AdvancedSearch([FromQuery] AdvancedBookingSearchRequest request)
    {
        if (!request.ResultsPerPage.HasValue)
        {
            request.ResultsPerPage = _tradePortalSettings.AdvancedBookingSearch.ResultsPerPage;
        }

        try
        {
            var response = await _bookingRepository.SearchBookings(request);

            if (!response.Bookings.Any())
            {
                return NotFound();
            }

            return Ok(response);
        }
        catch (ApiException e)
        {
            _logger.LogError("Exception occurred while running advanced booking search");

            if (e.Code.Equals(ApiExceptionCodes.BookingViewError)
                && (e.InnerErrors?.Any(error => error.Code == _atcomSettings.ErrorCodes.BookingSearchSessionExpired) ?? false))
            {
                throw new ApiException(ApiExceptionCodes.BookingSearchSessionExpired, e.Message, e.InnerErrors, e.InnerException, HttpStatusCode.BadRequest);
            }

            throw;
        }
    }
}