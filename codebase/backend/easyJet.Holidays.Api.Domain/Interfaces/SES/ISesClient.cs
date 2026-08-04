namespace easyJet.Holidays.Api.Domain.Interfaces.SES;

public interface ISesClient
{
    Task SendEmail(Data.SES.Email email);
}
