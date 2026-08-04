using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Services.Booking;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.B2B.Models.B2BGetBooking;
using easyJet.Holidays.External.Domain.Api;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.B2B.Services
{
    public class B2BBookingService : IB2BBookingService
    {
        private readonly IApiService _apiService;
        private readonly B2BSettings _b2bSettings;
        private readonly EndpointsProvider _endpointsProvider;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly BulkToolSettings _bulkToolSettings;
        private readonly ILogger<B2BBookingService> _logger;

        public B2BBookingService(
            IApiService apiService,
            IOptions<B2BSettings> b2bSettings,
            EndpointsProvider endpointsProvider,
            IHttpContextAccessor httpContextAccessor,
            IOptions<BulkToolSettings> bulkToolSettings,
            ILogger<B2BBookingService> logger)
        {
            _b2bSettings = b2bSettings.Value ?? throw new ArgumentNullException(nameof(b2bSettings));
            _bulkToolSettings = bulkToolSettings.Value ?? throw new ArgumentNullException(nameof(bulkToolSettings));
            _apiService = apiService;
            _endpointsProvider = endpointsProvider;
            _httpContextAccessor = httpContextAccessor;
            _logger = logger;
        }

        public async Task<B2BData> GetBooking(BookingResponse bookingResponse)
        {
            var externalPNRs = bookingResponse.GetAllExternalPnrs();

            if (bookingResponse.BookingStatus != _bulkToolSettings.Statuses.Booking || externalPNRs.IsNullOrEmpty())
                return new B2BData();

            var request = new B2BGetBookingRequest
            {
                Endpoint = _endpointsProvider.GetEndpoint(B2BEndpoint.BasicService, _httpContextAccessor.HttpContext?.Request?.Cookies)
            };

            var lead = bookingResponse.Guests.First(x => x.IsLead).LastName;
            var passenger = new List<Passenger>();

            foreach (var externalPNR in externalPNRs)
            {
                try
                {
                    request.Payload.Body = new B2BGetBookingRequestBody(_b2bSettings)
                    {
                        PNR = new PNR
                        {
                            BookingReference = externalPNR,
                            PassengerLastName = lead
                        }
                    };

                    var bookingInfo = await _apiService.GetResponseContentAsync<B2BGetBookingRequest, B2BGetBookingResponse>(request);
                    passenger.AddRange(bookingInfo.Payload.Body.DataListRoot.GetBookingSummaryResponse.Passengers.Passenger);
                }
                catch (Exception)
                {
                    _logger.LogError("Can't get B2B (GetBookingSummaryRequestV1) data for: {p2}, {p1}", externalPNR, bookingResponse.Guests.First(x => x.IsLead).LastName);
                }
            }

            return new B2BData
            {
                Passengers = new Passengers
                {
                    Passenger = passenger
                }
            };
        }
    }
}
