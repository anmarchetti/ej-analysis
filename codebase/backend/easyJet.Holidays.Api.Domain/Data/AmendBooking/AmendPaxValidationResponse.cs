namespace easyJet.Holidays.Api.Domain.Data.AmendBooking;

/// <summary>
/// Api response model for representing availability to change pax information
/// </summary>
public class AmendPaxValidationResponse
{
    /// <summary>
    /// Pax id.
    /// </summary>
    public string PaxId { get; set; }

    /// <summary>
    /// Can change pax information.
    /// </summary>
    public bool CanBeChanged { get; set; }
}