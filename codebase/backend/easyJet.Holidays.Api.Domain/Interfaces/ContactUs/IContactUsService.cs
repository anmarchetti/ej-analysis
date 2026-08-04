using easyJet.Holidays.Api.Domain.Data.ContactUs;

namespace easyJet.Holidays.Api.Domain.Interfaces.ContactUs;

public interface IContactUsService
{
    Task<ContactUsResult> CreateCase(ContactFormRequest contactFormRequest);
}
