namespace easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;

/// <summary>
/// Indicates whether booking-linked credit is expired or expiring soon.
/// </summary>
public enum BookingCreditExpiryState
{
    /// <summary>
    /// The booking has no expired or expiring credit.
    /// </summary>
    None,

    /// <summary>
    /// The booking has expired credit only.
    /// </summary>
    ExpiredOnly,

    /// <summary>
    /// The booking has credit that is expiring soon only.
    /// </summary>
    ExpiringOnly,

    /// <summary>
    /// The booking has both expired credit and credit that is expiring soon.
    /// </summary>
    Both
}

