using easyJet.Holidays.Api.Domain.Data.ContactUs;
using Refit;

namespace easyJet.Holiday.IntegrationTests.Shared.Api
{
    public interface IContactUsApi
    {
        [Post("/contact-us")]
        Task<ApiResponse<ContactUsResult>> CreateCase([Body(BodySerializationMethod.UrlEncoded)] ContactFormRequest contactFormRequest);
    }
}
