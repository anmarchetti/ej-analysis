using easyJet.Holiday.IntegrationTests.Shared.Models.Offer;
using easyJet.Holidays.IntegrationTests.TestApi.Service.PackageOffers;
using Microsoft.AspNetCore.Mvc;

namespace easyJet.Holidays.IntegrationTests.TestApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class OfferController : ControllerBase
    {
        private readonly IOfferService _offersService;

        public OfferController(IOfferService offersService)
        {
            _offersService = offersService;
        }

        [HttpPost]
        [Route("random-offer")]
        public async Task<IActionResult> GetRandomOffer([FromBody] SearchOffersRequest request)
        {
            var result = await _offersService.ProvideOffer(request);

            return Ok(result);
        }
    }
}
