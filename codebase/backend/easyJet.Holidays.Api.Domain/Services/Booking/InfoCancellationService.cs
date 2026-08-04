using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;

namespace easyJet.Holidays.Api.Domain.Services.Booking
{
    /// <inheritdoc />
    public class InfoCancellationService(IInfoCancellationRepository cancellationRepository) : IInfoCancellationService
    {
        /// <inheritdoc />
        public async Task<InfoCancellationResponse> GetInfoCancellationAsync(BookingResponse booking)
        {
            var infoCancellationResponse = await cancellationRepository.GetInfoCancellationAsync(booking);
            if (infoCancellationResponse == null)
            {
                throw new ApiException(ApiExceptionCodes.BookingFeeCancellationError, null, "Booking fee could not be retrieved");
            }

            return infoCancellationResponse;
        }
    }
}
