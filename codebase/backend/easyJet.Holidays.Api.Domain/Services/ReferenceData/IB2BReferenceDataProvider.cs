using easyJet.Holidays.Api.Domain.Data.ReferenceData;

namespace easyJet.Holidays.Api.Domain.Services.ReferenceData
{
    public interface IB2BReferenceDataProvider
    {
        Task<List<CountryInformation>> GetB2BCountries();
    }
}
