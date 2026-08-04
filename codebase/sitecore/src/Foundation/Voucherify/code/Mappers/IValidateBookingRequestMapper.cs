using System.Collections.Generic;
using easyJet.Foundation.Voucherify.Models.Domain;
using easyJet.Foundation.Voucherify.Models.Requests;

namespace easyJet.Foundation.Voucherify.Mappers
{
    public interface IValidateBookingRequestMapper
    {
        IEnumerable<ValidateBooking> MapFromValidateBookingRequest(ValidateBookingRequest[] requests);
    }
}