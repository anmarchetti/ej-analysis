using System.Collections.Generic;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Models.Responses;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Services
{
    public interface IHotelThemesService
    {
        IEnumerable<HotelThemeResponseItem> GetHotelThemes();

        /// <summary>
        /// Get collection of themes and types ids groupped by type code.
        /// </summary>
        /// <param name="sitePath">Site path.</param>
        /// <returns>Collection of themes and types ids.</returns>
        Dictionary<string, ThemeTypeIds> GetThemeAndTypeIdsGroupedByTypeCode(string sitePath = null);

        /// <summary>
        /// Boost Hotel Theme pattern card.
        /// </summary>
        /// <param name="hotelType">Name of holiday type of pattern card.</param>
        /// <returns><see langword="true"/> if hotel theme pattern card was successfully updated.</returns>
        bool BoostHotelThemePatternCard(string hotelType);

        /// <summary>
        /// Get all hotels with their themes and types.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <returns>Hotel with themes collection.</returns>
        IEnumerable<HotelWithThemeRow> GetHotelsWithThemes(Item item);
    }
}