using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using Refit;

namespace easyJet.Holiday.IntegrationTests.Shared.SitecoreApi;

public interface ISitecoreApi
{
    [Get("/Content/ByPath?path=%7bsite%7d%2fSettings%2fAmend+Booking+Settings&readAll=true")]
    Task<ApiResponse<AmendBookingSetting>> GetAmendBookingSettings();

    [Get("/SpecialRequests/GetSpecialRequest?sc_lang=en")]
    Task<ApiResponse<SpecialRequests>> GetSpecialRequests();
}