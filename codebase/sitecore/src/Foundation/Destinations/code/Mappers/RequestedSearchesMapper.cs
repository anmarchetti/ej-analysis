using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore;
using Sitecore.Data;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Mappers
{
    public static class RequestedSearchesMapper
    {
        /// <summary>
        /// Initialize fields from requested search item.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <param name="requestedSearchItem">Requested search sitecore item.</param>
        /// <param name="freeForKidsOnly">Free for kids only.</param>
        /// <returns>Requested search object.</returns>
        public static RequestedSearch MapFromRequestedSearchItem(Item item, Item requestedSearchItem, bool freeForKidsOnly = false)
        {
            if (item == null)
            {
                return null;
            }

            var isReoccurringPromoPage = item.TemplateID == Constants.TemplateIds.ReoccurringPromoPage;

            var requestedSearch = new RequestedSearch(item)
            {
                FreeForKidsOnly = freeForKidsOnly,
                Origin = GetItemsCodes(item, Constants.Fields.RequestedSearch.Origin),
                Destinations = GetItemsCodes(item, Constants.Fields.RequestedSearch.Destination),
                // Reoccurring promo pages should not have start and end dates, so we set them to DateTime.MinValue
                StartDate = isReoccurringPromoPage ? DateTime.MinValue : item.GetDate(Constants.Fields.SearchParameters.StartDate),
                EndDate = isReoccurringPromoPage ? DateTime.MinValue : item.GetDate(Constants.Fields.SearchParameters.EndDate),
                InitialSearchDays = MainUtil.GetInt(item[Constants.Fields.DateSettings.InitialSearchDays], 0),
                BoardTypes = GetItemsCodes(item, Constants.Fields.Filters.BoardTypes),
                FacilityTypes = item.GetItems(Constants.Fields.Filters.FacilityTypes).Select(x => new FacilityType(x)).ToList(),
                StarRating = item[Constants.Fields.Filters.StarRating]?.Split(',').ToList(),
                TripAdvisorRating = MainUtil.GetFloat(item[Constants.Fields.Filters.TripAdvisorRating], 0),
                ThemeTypes = GetHotelThemes(item.Database, item[Constants.Fields.Filters.HolidayThemes], item[Constants.Fields.Filters.HolidayTypes]),
                MinPPPrice = MainUtil.GetFloat(item[Constants.Fields.Filters.MinPricePP], 0),
                MaxPPPrice = MainUtil.GetFloat(item[Constants.Fields.Filters.MaxPricePP], 0),
                MinTotalPrice = MainUtil.GetFloat(item[Constants.Fields.Filters.MinTotalPrice], 0),
                MaxTotalPrice = MainUtil.GetFloat(item[Constants.Fields.Filters.MaxTotalPrice], 0),
                DiscountPercentsMin = MainUtil.GetFloat(item[Constants.Fields.Filters.DiscountPercentsMin], 0),
                DiscountPercentsMax = MainUtil.GetFloat(item[Constants.Fields.Filters.DiscountPercentsMax], 0),
                DiscountAmountMin = MainUtil.GetFloat(item[Constants.Fields.Filters.DiscountAmountMin], 0),
                DiscountAmountMax = MainUtil.GetFloat(item[Constants.Fields.Filters.DiscountAmountMax], 0),
                DiscountOnly = MainUtil.GetBool(item[Constants.Fields.Filters.DiscountOnly], false),
                IsFlexibleDatesRange = MainUtil.GetBool(item[Constants.Fields.DateSettings.IsFlexibleDatesRange], false),
                PromoCollections = item.GetItems(Constants.Fields.Filters.PromoCollections).Select(x => x[Constants.Fields.PromotionCollectionItem.Key]).ToList()
            };
            if (requestedSearchItem == null)
            {
                return requestedSearch;
            }

            requestedSearch.Name = requestedSearchItem[Constants.Fields.DatasourceItem.Name];
            requestedSearch.Periods = GetPromoPageTimePeriods(requestedSearch, item);
            return requestedSearch;
        }

        /// <summary>
        /// Get inherited time periods from a promo page.
        /// </summary>
        /// <param name="requestedSearch">Requested search.</param>
        /// <param name="item">Sitecore item.</param>
        /// <returns>Inherited time periods.</returns>
        private static List<TimePeriod> GetPromoPageTimePeriods(RequestedSearch requestedSearch, Item item)
        {
            var timePeriods = new List<TimePeriod>();

            if (item.TemplateID == Constants.TemplateIds.ReoccurringPromoPage)
            {
                var maxDaysBeforeDeparture = item.GetDecimal(Constants.FieldsIds.ReoccurringPromoPage.MaxDaysBeforeDeparture);
                var startDate = DateTime.Now.Date;
                var endDate = startDate.AddDays((double)maxDaysBeforeDeparture);

                timePeriods.Add(new TimePeriod()
                {
                    SearchDateRangeStartDate = startDate,
                    SearchDateRangeEndDate = new DateTime(endDate.Year, endDate.Month, DateTime.DaysInMonth(endDate.Year, endDate.Month))
                });
            }
            else if (item.TemplateID == Constants.TemplateIds.PromoPage)
            {
                timePeriods.Add(new TimePeriod()
                {
                    SearchDateRangeStartDate = requestedSearch.StartDate,
                    SearchDateRangeEndDate = requestedSearch.EndDate
                });
            }
            else
            {
                timePeriods.AddRange(item.Children.Select(x => new TimePeriod(x)).ToList());
            }

            return timePeriods;
        }

        /// <summary>
        /// Gets or sets items codes which selected in the field.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <param name="fieldName">Field name.</param>
        /// <returns>Collection of codes.</returns>
        private static List<string> GetItemsCodes(Item item, string fieldName)
        {
            return item.GetItems(fieldName).Select(x => x[Constants.Fields.DatasourceItem.Code]).ToList();
        }

        /// <summary>
        /// Get hotel themes.
        /// Splits fields values by pipe.
        /// Combined from both hotel themes and hotel types
        /// By ids result get sitecore items and cast to HotelTheme.
        /// </summary>
        /// <param name="database">Sitecore database.</param>
        /// <param name="hotelThemes">Value of hotel theme field.</param>
        /// <param name="hotelTypes">Value of hotel type field.</param>
        /// <returns>Collection of hotel themes.</returns>
        private static List<HotelTheme> GetHotelThemes(Database database, string hotelThemes, string hotelTypes)
        {
            var ids = new List<string>();
            var hotelThemesIds = hotelThemes.Split('|').Where(x => !string.IsNullOrWhiteSpace(x)).ToList();
            var hotelTypeIds = hotelTypes.Split('|').Where(x => !string.IsNullOrWhiteSpace(x)).ToList();

            if (!hotelThemesIds.Any() && !hotelTypeIds.Any())
            {
                return new List<HotelTheme>();
            }

            if (hotelThemesIds.Any())
            {
                ids.AddRange(hotelThemesIds);
            }

            if (hotelTypeIds.Any())
            {
                ids.AddRange(hotelTypeIds);
            }

            return ids.Select(database.GetItem).Select(x => new HotelTheme(x)).ToList();
        }
    }
}