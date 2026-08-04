using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Monitoring;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;

namespace easyJet.Holidays.Api.Controllers.Booking
{
    /// <summary>
    /// Booking transfers controller
    /// </summary>
    /// <param name="bookingTransfersService"></param>
    /// <param name="metricsService"></param>
    [Route("booking")]
    [ApiController]
    [ApiVersion("1.0")]
    public class BookingTransfersController(IBookingTransfersService bookingTransfersService, IMetricsService metricsService) : ControllerBase
    {
        private const string BookingReferenceValidationMessage = "Booking reference cannot be null or empty.";
        private const string LastNameValidationMessage = "Lead passenger last name cannot be null or empty.";
        private const string DateValidationMessage = "Departure date is required.";


        /// <summary>
        /// Get transfer details by booking reference, last name and departure date
        /// </summary>
        /// <param name="request">Booking lookup payload from the request body.</param>
        /// <param name="cancellationToken"></param>
        /// <returns></returns>
        [HttpPost("transfer")]
        public async Task<ActionResult<TransferDetailsResponse>> GetTransferDetails([FromBody] GetBookingRequest request,
            CancellationToken cancellationToken = default)
        {
            if (request == null)
            {
                return BadRequest("Request body is required.");
            }

            var validationError = ValidateRequest(request.BookingReference, request.LastName, request.Date);
            if (validationError != null)
            {
                return BadRequest(validationError);
            }

            try
            {
                var transferDetails = await bookingTransfersService.GetTransferDetailsFor(request, cancellationToken);

                if (transferDetails == null)
                {
                    metricsService.IncrementCounter(CancellationMetricConstants.TransferDetailsRequestTotal, 1,
                        new KeyValuePair<string, object>("status", "not_found"));
                    return NotFound($"No transfer details found for booking reference: {request.BookingReference}");
                }

                metricsService.IncrementCounter(CancellationMetricConstants.TransferDetailsRequestTotal, 1,
                    new KeyValuePair<string, object>("status", MetricConstants.SuccessMetricStatus));
                return Ok(transferDetails);
            }
            catch (Exception)
            {
                metricsService.IncrementCounter(CancellationMetricConstants.TransferDetailsRequestTotal, 1,
                    new KeyValuePair<string, object>("status", MetricConstants.FailureMetricStatus));
                throw;
            }
        }

        private static string ValidateRequest(string bookingReference, string lastName, DateTime? date)
        {
            if (string.IsNullOrWhiteSpace(bookingReference))
            {
                return BookingReferenceValidationMessage;
            }

            if (string.IsNullOrWhiteSpace(lastName))
            {
                return LastNameValidationMessage;
            }

            if (!date.HasValue || date.Value == default)
            {
                return DateValidationMessage;
            }

            return null;
        }
    }
}