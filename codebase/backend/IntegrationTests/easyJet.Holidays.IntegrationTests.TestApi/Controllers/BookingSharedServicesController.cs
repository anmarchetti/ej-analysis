using easyJet.Holidays.IntegrationTests.TestApi.Service.Booking;
using Microsoft.AspNetCore.Mvc;

namespace easyJet.Holidays.IntegrationTests.TestApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class BookingSharedServicesController : ControllerBase
    {
        private readonly ISharedServicesBookingService _sharedServicesBookingService;

        public BookingSharedServicesController(ISharedServicesBookingService sharedServicesBookingService)
        {
            _sharedServicesBookingService = sharedServicesBookingService;
        }


        [HttpPut]
        [Route("cancel-booking")]
        public async Task<IActionResult> CancelBooking([FromBody] Api.Domain.Data.SharedServices.Booking.CancelBookingRequest request)
        {
            var result = await _sharedServicesBookingService.CancelBooking(request);

            return Ok(result);
        }
    }
}
