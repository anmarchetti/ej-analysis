using easyJet.Holidays.Api.Domain.Data.Errors;

namespace easyJet.Holiday.IntegrationTests.Shared.Models.Booking;

public record BookingAttempt
{
    public BookingAttempt(string status)
    {
        Status = status;
    }

    public string Status { get; init; }
    public int HttpStatusCode { get; init; }
    public string? Error { get; init; }
    public string? CorrelationId { get; init; }
    public ICollection<ApiError>? InnerErrors { get; init; }
    public TimeSpan? TimeTaken { get; set; }
}
