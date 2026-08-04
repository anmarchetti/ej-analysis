namespace easyJet.Holidays.Api.Domain.Data.ContactUs;

public record ContactUsResult
{
    public bool IsSuccessful { get; init; }
    public string CaseNumber { get; init; }
}
