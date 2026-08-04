#nullable enable

using easyJet.Holidays.Api.Domain.Data.Filters;
using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Themes;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.Offers;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using Force.DeepCloner;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Domain.Services.Offers;

/// <summary>
/// Hotel them utils
/// </summary>
public class HotelThemeService : IHotelThemeService
{
    private readonly IReferenceDataService _referenceDataService;
    private readonly CmsSettings _cmsSettings;

    public HotelThemeService(IReferenceDataService referenceDataService, IOptions<CmsSettings> cmsSettings)
    {
        _referenceDataService = referenceDataService;
        _cmsSettings = cmsSettings.Value;
    }

    /// <summary>
    /// Get theme and type from prom code
    /// </summary>
    /// <param name="promCode">Prom code</param>
    /// <returns></returns>
    public async Task<(PackageTheme?, ThemeType?)> GetTheme(string promCode)
    {
        var themeSettings = await _referenceDataService.GetAllThemes();

        if (!string.IsNullOrWhiteSpace(promCode) && promCode.Length >= 4 && themeSettings != null)
        {
            var theme = themeSettings.FirstOrDefault(t => CompareThemeCode(promCode, t.Code));
            var type = theme?.Types?.FirstOrDefault(ty => CompareThemeCode(promCode, ty.Code));

            // And remove child types for themes
            if (theme != null)
            {
                // need to clone otherwise original object will be changed and loos child types
                theme = theme.DeepClone();
                theme.Types = null;
            }

            return (theme, type);
        }

        return (null, null);
    }

    /// <summary>
    /// Compare promotion code from atcom and theme code from sitecore.
    /// Also supports only single letter theme filtering.
    /// You con use e.g. "CB" and "C"
    /// </summary>
    /// <param name="prom">Promotion code</param>
    /// <param name="code">Theme code</param>
    /// <returns></returns>
    public static bool CompareThemeCode(string prom, string code)
    {
        if (string.IsNullOrEmpty(prom) || string.IsNullOrEmpty(code) || prom.Length < 4)
        {
            return false;
        }
        var themeCode = prom.Substring(2, 2);
        return themeCode.ToUpper().StartsWith(code.ToUpper());
    }

    /// <summary>
    /// Get package theme for booking.
    /// </summary>
    /// <param name="promo">Prom for booking.</param>
    /// <returns>Package theme.</returns>
    /// <exception cref="ArgumentException">Can not find package theme for promo.</exception>
    public async Task<PackageThemeType> GetPackageThemeType(string promo)
    {
        var (theme, _) = await GetTheme(promo);

        var isPackageThemeValid = Enum.TryParse<PackageThemeType>(theme?.ItemName, out var result);

        if (!isPackageThemeValid)
        {
            throw new ArgumentException($"Cannot find package theme for promo: {promo}.");
        }

        return result;
    }

    /// <summary>
    /// <inheritdoc />
    /// </summary>
    public async Task<ThemeType?> GetHotelType(HotelType[] facilityMatrix, BaseSearchRequest? searchRequest = null)
    {
        if (facilityMatrix.IsNullOrEmpty()) return null;

        //if holiday type filter is applied consider only selected types
        var limitedTypes = GetHotelTypes(searchRequest?.HotelTypes);

        if (limitedTypes.Any())
        {
            facilityMatrix = facilityMatrix.Where(x => limitedTypes.Contains(x.Code)).ToArray();

            if (facilityMatrix.IsNullOrEmpty()) return null;
        }

        var facilityMatrixConfiguration = await _referenceDataService.GetFacilityMatrixConfiguration();

        var hotelType = GetPersonalizedHotelType(facilityMatrix, searchRequest is not null, searchRequest?.Children(), searchRequest?.Infants());
        return MapToThemeType(hotelType, facilityMatrixConfiguration);
    }

    /// <summary>
    /// <inheritdoc />
    /// </summary>
    public async Task<ThemeType?> GetHotelType(HotelType[] facilityMatrix, int? nChildren, int? nInfant)
    {
        if (facilityMatrix.IsNullOrEmpty()) return null;

        var facilityMatrixConfiguration = await _referenceDataService.GetFacilityMatrixConfiguration();

        var hotelType = GetPersonalizedHotelType(facilityMatrix, true, nChildren, nInfant);
        return MapToThemeType(hotelType, facilityMatrixConfiguration);
    }

    ///<summary>
    /// Gets the related hotel theme proms be the selected prom.
    /// For example, you have prom EUBA(beach adults) and you expected all PROM which related to the beach holiday.
    /// </summary>
    /// <param name="prom">The prom.</param>
    /// <returns>
    /// List of proms.
    /// </returns>
    public async Task<IEnumerable<string>> GetReletedThemeProms(string prom)
    {
        if (string.IsNullOrEmpty(prom))
        {
            return Enumerable.Empty<string>();
        }

        var themeSettings = await _referenceDataService.GetAllThemes();

        var preffix = prom[0..2];

        var themes = themeSettings.Single(themeSetting => themeSetting.Code.Equals(prom[2].ToString(), StringComparison.OrdinalIgnoreCase)).Types;

        var themeProms = themes.Select(theme => $"{preffix}{theme.Code}");

        return themeProms;
    }

    private HotelType GetPersonalizedHotelType(HotelType[] facilityMatrix, bool withPaxMixCheck, int? nChildren, int? nInfant)
    {
        if (facilityMatrix.Length == 1)
        {
            return facilityMatrix.First();
        }

        if (withPaxMixCheck)
        {
            var settings = _cmsSettings.FacilityMatrix;

            if (facilityMatrix.Any(x => x.Code == settings.AdultHolidayCode && nChildren == 0 && nInfant == 0))
            {
                return facilityMatrix.First(x => x.Code == settings.AdultHolidayCode);
            }

            if (facilityMatrix.Any(x => x.Code == settings.FamilyHolidayCode && (nChildren > 0 || nInfant > 0)))
            {
                return facilityMatrix.First(x => x.Code == settings.FamilyHolidayCode);
            }
        }

        var highestRating = facilityMatrix.Max(x => x.Value);
        var highestRatedType = facilityMatrix.First(x => x.Value == highestRating);
        return highestRatedType;
    }

    private static ThemeType MapToThemeType(HotelType facilityMatrixType, List<HotelTypeFilterConfiguration> matrix)
    {
        var configuration = matrix.Find(x => x.Code.Equals(facilityMatrixType.Code, StringComparison.OrdinalIgnoreCase));

        return new ThemeType
        {
            Code = facilityMatrixType.Code,
            Description = configuration?.Description,
            FilledIcon = configuration?.FilledIcon,
            Icon = configuration?.Icon,
            Name = configuration?.Name,
            ItemName = configuration?.ItemName,
            TypeAndThemeTitle = configuration?.TypeTitle
        };
    }

    public static IReadOnlyList<string> GetHotelTypes(string? hotelTypes)
    {
        if (string.IsNullOrEmpty(hotelTypes))
        {
            return Array.Empty<string>();
        }

        return hotelTypes
            .Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries)
            .Select(f => f.Trim())
            .ToList();
    }
}
