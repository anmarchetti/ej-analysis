using easyJet.Holidays.Api.Domain.Data.Attributes;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Services.Booking;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;

namespace easyJet.Holidays.Api.Controllers.TradePortal
{
    [Route("trade-portal/group-booking")]
    [ApiController]
    [ApiVersion("1.0")]
    public class TradePortalGroupBookingController : ControllerBase
    {
        private readonly IGroupBookingService _groupBookingService;

        public TradePortalGroupBookingController(IGroupBookingService groupBookingService)
        {
            _groupBookingService = groupBookingService;
        }

        [Route("")]
        [HttpPost]
        public async Task<IActionResult> Submit([FromBody][ValidGroupBookingRequest] GroupBookingRequest request)
        {
            await _groupBookingService.Submit(request);
            return NoContent();
        }
    }
}