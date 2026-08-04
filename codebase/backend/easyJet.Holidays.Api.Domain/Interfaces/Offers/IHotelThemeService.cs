using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Themes;

namespace easyJet.Holidays.Api.Domain.Interfaces.Offers;

public interface IHotelThemeService
{
    /// <summary>
    /// Returns the holiday type for this hotel according to facility matrix from sitecore and pax mix from request
    /// </summary>
    Task<ThemeType> GetHotelType(HotelType[] facilityMatrix, BaseSearchRequest searchRequest = null);
    /// <summary>
    /// Returns the holiday type for this hotel according to facility matrix from sitecore and pax mix
    /// </summary>
    Task<ThemeType> GetHotelType(HotelType[] facilityMatrix, int? nChildren, int? nInfant);
    Task<PackageThemeType> GetPackageThemeType(string promo);
    Task<(PackageTheme, ThemeType)> GetTheme(string promCode);

    /// <summary>
    /// Gets the releted hotel theme proms be the selected prom.
    /// For example you have prom EUBA(beach adults) and you excpected all PROM wich related to the beach holiday.
    /// </summary>
    /// <param name="prom">The prom.</param>
    /// <returns>List of proms.</returns>
    Task<IEnumerable<string>> GetReletedThemeProms(string prom);
}