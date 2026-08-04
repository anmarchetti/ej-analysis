using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Atcom.Mappers.Search.Filters
{
    /// <summary>
    /// Initial theme filter
    /// </summary>
    public class InitialThemeFilter : ThemeFilter
    {
        public InitialThemeFilter(IOptions<AtcomSettings> atcomSettings, IReferenceDataService referenceDataService) : base(atcomSettings, referenceDataService)
        {
        }

        protected override string PropertyValue(PackagesSearchRequest r) => r.InitialThemes;
    }
}
