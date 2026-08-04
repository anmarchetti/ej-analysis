using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.External.Atcom.Models.Internal;
using easyJet.Holidays.External.DataHub.SoapReference;

namespace easyJet.Holidays.External.AWS.Domain.Models;

/// <summary>
/// Represents a wrapper class for encapsulating booking synchronization transfer data.
/// </summary>
/// <remarks>
/// This class serves as a container for various types of booking-related responses, including
/// reservation data, and special requests. It is primarily utilized in
/// workflows involving the mapping, building, and processing of booking data.
/// </remarks>
public class BookingSyncTransferWrapper
{
    /// <summary>
    /// Represents the response data associated with a reservation in the system.
    /// Encapsulates information returned after a reservation operation.
    /// </summary>
    public ReservationDataResponse? ReservationDataResponse { get; set; }

    /// <summary>
    /// Gets or sets the collection of special requests associated with a booking.
    /// </summary>
    /// <remarks>
    /// This property represents a list of grouped special requests relevant to a booking,
    /// encapsulated in the <c>SpecialRequestsGroup</c> class. These special requests
    /// may include preferences or additional requirements specified by the customer.
    /// </remarks>
    public IEnumerable<SpecialRequestsGroup>? SpecialRequests { get; set; }

    /// <summary>
    /// Represents the response data related to display settings or parameters in the booking system.
    /// Typically used to convey display-specific details or configurations.
    /// </summary>
    public DisplayResponse? DisplayResponse { get; set; }

    /// <summary>
    /// Initializes a new instance of the <see cref="BookingSyncTransferWrapper"/> class.
    /// </summary>
    /// <param name="reservationDataResponse">The reservation data response.</param>
    /// <param name="specialRequests">The special requests associated with the booking.</param>
    /// <param name="displayResponse">The display response associated with the booking.</param>
    public BookingSyncTransferWrapper(
        ReservationDataResponse? reservationDataResponse = null,
        IEnumerable<SpecialRequestsGroup>? specialRequests = null,
        DisplayResponse? displayResponse = null)
    {
        ReservationDataResponse = reservationDataResponse;
        SpecialRequests = specialRequests;
        DisplayResponse = displayResponse;
    }
}