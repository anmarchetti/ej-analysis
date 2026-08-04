using easyJet.Holidays.Api.Domain.Data.BulkToolBooking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Filters;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using Microsoft.Extensions.Options;
using System.Net;

namespace easyJet.Holidays.Api.Controllers
{
    /// <summary>
    /// Cancellation And Refund tool controller.
    /// </summary>
    [Route("cancellationandrefund")]
    [ApiController]
    [ApiVersion("1.0")]
    public class CancellationAndRefundController : ControllerBase
    {
        private readonly IBulkToolBookingService _cancellationAndRefundBookingService;
        private readonly BulkToolSettings _bulkToolSettings;

        /// <summary>
        /// also known as old bulktool
        /// </summary>
        /// <param name="cancellationAndRefundBookingService">underlying service for processing requests</param>
        /// <param name="options">wrapper around <see cref="BulkToolSettings"/> controlling whether bulktool is enabled or not and where it refers to in case it is disabled.</param>
        /// <exception cref="ArgumentNullException"></exception>
        public CancellationAndRefundController(IBulkToolBookingService cancellationAndRefundBookingService, IOptions<BulkToolSettings> options)
        {
            _cancellationAndRefundBookingService = cancellationAndRefundBookingService;
            _bulkToolSettings = options?.Value ?? throw new ArgumentNullException(nameof(options));
        }

        /// <summary>
        /// Action on cancellation and refund whith cheking on api key
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost]
        [Route("cancelandrefund")]
        [ProducesResponseType(typeof(IEnumerable<BulkToolResponse>), (int)HttpStatusCode.OK)]
        [ServiceFilter(typeof(ApiAuthAttribute))]
        [ServiceFilter(typeof(DisableCreditsAttribute))]
        [NoCacheControl]
        public async Task<IActionResult> CancelAndRefund(BulkToolRequest request)
        {
            if (!_bulkToolSettings.IsEnabled)
            {
                var decommissionResult = new BulkToolResponse()
                {
                    Message = $"This tool is deprecated and being decommissioned. " +
                              $"Your request has not been processed. " +
                              $"Please head over to {_bulkToolSettings.ReferralUrl}",
                };

                return Ok(decommissionResult);
            }

            var result = await _cancellationAndRefundBookingService.RunBulkProcess(request, HttpContext.TraceIdentifier);

            return Ok(result);
        }
    }
}
