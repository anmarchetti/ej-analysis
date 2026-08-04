using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Payment;
using easyJet.Holidays.Api.Domain.Data.Booking;

namespace easyJet.Holidays.Api.Domain.Interfaces.AmendBooking.Payment;

/// <summary>
/// Represents a service for calculating amendment charges and validating amendment payments.
/// </summary>
public interface IAmendmentChargesService
{
    /// <summary>
    /// Calculates the amendment payment information based on the original booking, validate booking response, and optional flag for board and room amendment.
    /// </summary>
    /// <param name="originalBooking">The original booking response.</param>
    /// <param name="validateBookingResponse">The validate booking response.</param>
    /// <returns>The amendment payment information.</returns>
    AmendmentPaymentInfo CalculateAmendmentPaymentInfo(BookingResponse originalBooking, ValidateBookingResponse validateBookingResponse);

    /// <summary>
    /// Validates the amend commit payment based on the amend booking request, validate booking response, and booking response.
    /// </summary>
    /// <param name="request">The amend booking request.</param>
    /// <param name="bookingResponse">The booking response.</param>
    /// <param name="validateBookingResponse">The validate booking response.</param>
    void ValidateAmendCommitPayment(AmendBookingRequest request, BookingResponse bookingResponse, ValidateBookingResponse validateBookingResponse);
}