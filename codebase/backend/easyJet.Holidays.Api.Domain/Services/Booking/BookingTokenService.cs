using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Serialize;

namespace easyJet.Holidays.Api.Domain.Services.Booking
{
    public class BookingTokenService : IBookingTokenService
    {
        private readonly ISecureSerializer _secureSerializer;

        public BookingTokenService(
            ISecureSerializer secureSerializer
            )
        {
            _secureSerializer = secureSerializer;
        }

        /// <summary>
        /// Parse booking token
        /// </summary>
        /// <param name="token">Token value</param>
        /// <returns>Request instance</returns>
        public GetBookingRequest ParseGetBookingToken(string token)
        {
            try
            {
                var tokenModel = _secureSerializer.Deserialize<BookingToken>(token);

                var request = new GetBookingRequest
                {
                    BookingReference = tokenModel.BookingReference,
                    LastName = tokenModel.LastName,
                    Date = tokenModel.Date
                };

                return request;
            }
            catch (Exception ex)
            {
                throw new ApiException(ApiExceptionCodes.BookingTokenEncode, "Can not decode booking token", null, ex);
            }
        }

        /// <inheritdoc />
        public string GetBookingToken(GetBookingRequest request)
        {
            try
            {
                var encoded = _secureSerializer.Serialize(new BookingToken
                {
                    BookingReference = request.BookingReference,
                    LastName = request.LastName,
                    Date = request.Date
                });

                return encoded;
            }
            catch (Exception ex)
            {
                throw new ApiException(ApiExceptionCodes.BookingTokenEncode, "Can not create booking token", null, ex);
            }
        }
    }
}