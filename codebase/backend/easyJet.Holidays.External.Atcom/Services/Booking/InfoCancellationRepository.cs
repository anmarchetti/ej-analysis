using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.External.Atcom.Mappers.InfoCancellation;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Exceptions;
using easyJet.Holidays.External.Domain.Extensions;
using BookingResponse = easyJet.Holidays.Api.Domain.Data.Booking.BookingResponse;
using InfoCancellationResponse = easyJet.Holidays.Api.Domain.Data.Booking.InfoCancellationResponse;

namespace easyJet.Holidays.External.Atcom.Services.Booking
{
    /// <inheritdoc />
    public class InfoCancellationRepository(
        IInfoCancellationMapper infoCancellationMapper,
        IApiService apiService)
        : IInfoCancellationRepository
    {
        private readonly List<string> _ignoreErrors = ["E34011"];

        /// <inheritdoc />
        public async Task<InfoCancellationResponse> GetInfoCancellationAsync(BookingResponse bookingResponse)
        {
            ArgumentNullException.ThrowIfNull(bookingResponse);

            const bool withoutFee = false;
            const bool withoutFeeSpecified = false;

            var infoCancellationRequest = await infoCancellationMapper.CreateRequest(bookingResponse, withoutFee, withoutFeeSpecified, null);

            infoCancellationRequest.ValidateResponse = (response) =>
            {
                if (!response.HasErrors())
                {
                    return;
                }

                foreach (var error in response.ApiErrors)
                {
                    if (!_ignoreErrors.Any(x => string.Equals(x, error.Code, StringComparison.Ordinal)))
                    {
                        throw new ErrorResponseException(response, "Response has errors", response.ApiErrors, null);
                    }
                }
            };

            var response = await apiService.GetResponseContentAsyncCustomErrorHandling<Models.InfoCancellation.InfoCancellationRequest, Models.InfoCancellation.InfoCancellationResponse>(
                infoCancellationRequest);

            return infoCancellationMapper.MapResponse(response.Payload.Body);
        }
    }
}
