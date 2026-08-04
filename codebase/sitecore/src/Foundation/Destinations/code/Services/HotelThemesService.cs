using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Analytics.Helpers;
using easyJet.Foundation.Analytics.Services;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Models.Responses;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.Abstractions;
using Sitecore.Analytics;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Services
{
    [Service(typeof(IHotelThemesService), Lifetime = Lifetime.Singleton)]
    public class HotelThemesService : IHotelThemesService
    {
        private const string ThemeTypeIdsByTypeCodeCacheKey = "Destinations.Cache.ThemeTypeIdsByTypeCode";
        private const string HotelThemesCacheKey = "Destinations.Cache.HotelThemes";

        private readonly IHtmlCacheRepository cache;
        private readonly IDestinationsLogger logger;
        private readonly IProfileService profileService;
        private readonly BaseFactory factory;

        public HotelThemesService(BaseFactory factory, IProfileService profileService, IDestinationsLogger logger, IHtmlCacheRepository cache)
        {
            this.factory = factory;
            this.cache = cache;
            this.logger = logger;
            this.profileService = profileService;
        }

        /// <summary>
        /// Method returns hotel themes with their types children.
        /// </summary>
        /// <returns>Hotel themes with types.</returns>
        public IEnumerable<HotelThemeResponseItem> GetHotelThemes()
        {
            var data = cache.GetItem<IEnumerable<HotelThemeResponseItem>>(HotelThemesCacheKey);

            if (data != null)
            {
                return data;
            }

            var hotelThemesFolderItem = Sitecore.Context.Database.SelectSingleItem($"{Sitecore.Context.Site.RootPath}/Data/*[@@templateId='{Constants.TemplateIds.HotelThemesFolder}']");

            if (hotelThemesFolderItem != null)
            {
                var hotelThemes = hotelThemesFolderItem.GetChildren().Where(x => x.TemplateID == Constants.TemplateIds.HotelTheme).Select(hotelTheme => new HotelThemeResponseItem(hotelTheme)).ToList();

                if (hotelThemes.Any())
                {
                    cache.StoreItem(HotelThemesCacheKey, hotelThemes, 60);
                    return hotelThemes;
                }
            }

            return Enumerable.Empty<HotelThemeResponseItem>();
        }

        /// <inheritdoc/>
        public Dictionary<string, ThemeTypeIds> GetThemeAndTypeIdsGroupedByTypeCode(string sitePath = null)
        {
            var data = cache.GetItem<Dictionary<string, ThemeTypeIds>>(ThemeTypeIdsByTypeCodeCacheKey);

            if (data != null)
            {
                return data;
            }

            var path = string.IsNullOrWhiteSpace(sitePath) ? Sitecore.Context.Site.RootPath : sitePath;
            var hotelThemesFolderItem = SiteExtensions.GetContentDatabase().SelectSingleItem($"{path}/Data/*[@@templateId='{Constants.TemplateIds.HotelThemesFolder}']");

            // Getting themes and types ids and grouping them by theme type code.
            var themeTypeIdsByTypeCode = hotelThemesFolderItem?.GetDescendantsByTemplate(Constants.TemplateIds.ThemeType)
                .Select(x => new
                {
                    TypeCode = x.Fields[Constants.Fields.DatasourceItem.Code].Value ?? string.Empty,
                    ThemeTypeIds = new ThemeTypeIds(x)
                })
                .GroupBy(x => x.TypeCode)
                .ToDictionary(key => key.Key, value => value.First().ThemeTypeIds);

            if (themeTypeIdsByTypeCode != null && themeTypeIdsByTypeCode.Any())
            {
                cache.StoreItem(ThemeTypeIdsByTypeCodeCacheKey, themeTypeIdsByTypeCode, 60);
                return themeTypeIdsByTypeCode;
            }

            return new Dictionary<string, ThemeTypeIds>();
        }

        /// <inheritdoc/>
        public bool BoostHotelThemePatternCard(string hotelType)
        {
            var profilePatternCard = GetHotelThemeProfilePatternCardByHotelType(hotelType);
            var patternCard = profilePatternCard?.Item1;
            var profileCard = profilePatternCard?.Item2;

            if (patternCard == null || profileCard == null)
            {
                var msg = $"Can not find pattern card or profile card for {hotelType}.";
                logger.Warn(msg, this);
                return false;
            }

            var profile = Tracker.Current.Interaction.Profiles[patternCard.Parent.Parent.Name];

            return profileService.BoostUserPattern(patternCard, profile, profileCard);
        }

        /// <inheritdoc/>
        public IEnumerable<HotelWithThemeRow> GetHotelsWithThemes(Item item)
        {
            var webDatabase = factory.GetDatabase("web");
            return item.GetDescendantsByTemplate(Constants.TemplateIds.Accommodation)
                .Select(x => new HotelWithThemeRow(x)
                {
                    Published = webDatabase.GetItem(x.ID) != null
                });
        }

        /// <summary>
        /// Get tuple of hotel theme pattern card and profile card.
        /// </summary>
        /// <param name="hotelType">Hotel type (City, Beach, Lakes).</param>
        /// <returns>Tuple of hotel pattern card and profile card.</returns>
        private Tuple<Item, Item> GetHotelThemeProfilePatternCardByHotelType(string hotelType)
        {
            return cache.GetOrAdd(
                $"Destinations.HotelTheme.PatternProfileCard-{hotelType}",
                () => ProfileCardHelper.GetProfilePatternCardByType("Destinations.HotelThemeProfilePath", hotelType));
        }
    }
}