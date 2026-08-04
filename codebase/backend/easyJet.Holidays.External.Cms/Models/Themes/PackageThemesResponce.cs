using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.Themes;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.Themes
{
    public class PackageThemesResponce : JsonApiResponse<ThemesFromSitecore>
    {
        public override ApiError[] ApiErrors => null; // Don't handle response body errors
    }

    public class ThemesFromSitecore
    {
        public PackageTheme[] Themes { get; set; }
    }
}
