namespace easyJet.Holidays.Api.Domain.Interfaces.Booking;

/// <summary>
/// This service is responsible for analysing booking cancellation requests
/// </summary>
public interface IBookingCancellationRequestService
{
    /// <summary>
    /// Checks if the request comes from the website
    /// </summary>
    /// <returns></returns>
    public Task<bool> IsWebsiteRequest();
}