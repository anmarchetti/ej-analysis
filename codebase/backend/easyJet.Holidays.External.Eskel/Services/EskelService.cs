using easyJet.Holidays.Api.Domain.Data.Eskel;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.Eskel;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Eskel.Models;
using easyJet.Holidays.External.Eskel.Settings;
using Microsoft.Extensions.Logging;

namespace easyJet.Holidays.External.Eskel.Services
{
    public class EskelService : IEskelService
    {
        private readonly IApiService _apiService;
        private readonly EskelSettings _eskelSettings;
        private readonly ILogger<IEskelService> _logger;

        public EskelService(IApiService apiService, EskelSettings eskelSettings, ILogger<IEskelService> logger)
        {
            _apiService = apiService;
            _eskelSettings = eskelSettings;
            _logger = logger;
        }

        public virtual async Task<Booking[]> GetBookingsByCreatedDate(DateTime createdDate)
        {
            var bookingsRequest = new BookingsRequest()
            {
                Endpoint = new Uri(_eskelSettings.AtcomBookingDetailsUrl),
                Token = _eskelSettings.Token,
                CreatedDate = createdDate.ToIso8601Date()
            };

            var bookings = await GetBookings(bookingsRequest);
            return bookings;
        }

        private async Task<Booking[]> GetBookings(BookingsRequest bookingsRequest)
        {
            try
            {
                bookingsRequest.SetQueryString();

                var responseContentAsync =
                    await _apiService.GetResponseContentAsync<BookingsRequest, BookingsResponse>(bookingsRequest);

                return responseContentAsync?.Payload?.Body;
            }
            catch (Exception e)
            {
                _logger.LogError("Failed to get bookings landing today");
                _logger.LogError($"{e}");
                throw;
            }
        }
    }
}