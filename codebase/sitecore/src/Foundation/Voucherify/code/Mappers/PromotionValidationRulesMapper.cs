using System.Collections.Generic;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.Voucherify.Models.Domain.Validation;
using Sitecore;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Voucherify.Mappers
{
    /// <summary>
    /// Represent logic for mapping Validation Rules against Sitecore Promotion Item.
    /// </summary>
    public class PromotionValidationRulesMapper : ValidationBaseMapper
    {
        /// <summary>
        /// Map Promotion Criteria's to Validation Rules.
        /// </summary>
        /// <param name="item">Promotion Item.</param>
        /// <returns>Validation Rules.</returns>
        public static PromotionValidationRules BuildValidationRules(Item item)
        {
            var dateRangeOfValidity = GetValidationRule(
                    BuildDateTimeRange(item, Templates.Promotion.Fields.DateValidityFrom, Templates.Promotion.Fields.DateValidityTo),
                    item[Templates.Promotion.Fields.DateRangeOfValidityErrorCode]);

            if (MainUtil.GetBool(item[Templates.Promotion.Fields.Global], false))
            {
                return new PromotionValidationRules()
                {
                    DateRangeOfValidity = dateRangeOfValidity
                };
            }

            return new PromotionValidationRules()
            {
                Airports = GetValidationRule(
                    BuildDatasourceItem(item, Templates.Promotion.Fields.Airport),
                    item[Templates.Promotion.Fields.AirportErrorCode],
                    Constants.Placeholdres.AirportsPlaceholder),
                Boards = GetValidationRule(
                    BuildDatasourceItem(item, Templates.Promotion.Fields.Board),
                    item[Templates.Promotion.Fields.BoardErrorCode],
                    Constants.Placeholdres.BoardsPlaceholder),
                DateRangeOfValidity = dateRangeOfValidity,
                DepartureDate = GetValidationRule(
                    BuildDateTimeRange(item, Templates.Promotion.Fields.DepartureDateFrom, Templates.Promotion.Fields.DepartureDateTo),
                    item[Templates.Promotion.Fields.DepartureDateErrorCode],
                    Constants.Placeholdres.DataRangePlaceholder),
                ReturnDate = GetValidationRule(
                    BuildDateTimeRange(item, Templates.Promotion.Fields.ReturnDateFrom, Templates.Promotion.Fields.ReturnDateTo),
                    item[Templates.Promotion.Fields.ReturnDateErrorCode],
                    Constants.Placeholdres.DataRangePlaceholder),
                Destinations = GetValidationRule(
                    BuildDatasourceItem(item, Templates.Promotion.Fields.Destination),
                    item[Templates.Promotion.Fields.DestinationErrorCode],
                    Constants.Placeholdres.DestinationsPlaceholder),
                Duration = GetValidationRule(
                            item.GetByte(Templates.Promotion.FieldsIds.Duration),
                            item[Templates.Promotion.Fields.DurationErrorCode],
                            Constants.Placeholdres.DurationPlaceholder),
                DurationRange = BuildValidationRule(
                            item.GetByte(Templates.Promotion.FieldsIds.Duration),
                            item[Templates.Promotion.Fields.DurationRangeErrorCode],
                            new Dictionary<string, string>()
                            {
                                { Constants.Placeholdres.MinimumDurationPlaceholder, item.GetByte(Templates.Promotion.FieldsIds.MinimumDuration)?.ToString() },
                                { Constants.Placeholdres.MaximumDurationPlaceholder, item.GetByte(Templates.Promotion.FieldsIds.MaximumDuration)?.ToString() }
                            }),
                MinimumDuration = GetValidationRule(
                    item.GetByte(Templates.Promotion.FieldsIds.MinimumDuration),
                    item[Templates.Promotion.Fields.MinimumDurationErrorCode],
                    Constants.Placeholdres.MinimumDurationPlaceholder),
                MaximumDuration = GetValidationRule(
                    item.GetByte(Templates.Promotion.FieldsIds.MaximumDuration),
                    item[Templates.Promotion.Fields.MaximumDurationErrorCode],
                    Constants.Placeholdres.MaximumDurationPlaceholder),
                HolidayThemes = GetValidationRule(
                    BuildDatasourceItem(item, Templates.Promotion.Fields.HolidayTheme),
                    item[Templates.Promotion.Fields.HolidayThemeErrorCode],
                    Constants.Placeholdres.HolidayThemesPlaceholder),
                HolidayTypes = GetWithParentValidationRule(
                    BuildDatasourceItem(item, Templates.Promotion.Fields.HolidayType),
                    item,
                    Templates.Promotion.Fields.HolidayType,
                    item[Templates.Promotion.Fields.HolidayTypeErrorCode],
                    Constants.Placeholdres.HolidayTypesPlaceholder),
                HotelTypes = GetValidationRule(
                    BuildDatasourceItem(item, Templates.Promotion.Fields.HotelType),
                    item[Templates.Promotion.Fields.HotelTypeErrorCode],
                    Constants.Placeholdres.HotelTypesPlaceholder),
                PromoCollectionCodes = GetValidationRule(
                    BuildPromoCollectionsItem(item, Templates.Promotion.Fields.PromoCollections),
                    item[Templates.Promotion.Fields.PromoCollectionsErrorCode],
                    Constants.Placeholdres.PromoCollectionsPlaceholder),
                NAdults = GetValidationRule(
                    item.GetInteger(Templates.Promotion.FieldsIds.NumberOfAdults),
                    item[Templates.Promotion.Fields.NumberOfAdultsErrorCode],
                    Constants.Placeholdres.AdultsPlaceholder),
                NChildren = GetValidationRule(
                    item.GetInteger(Templates.Promotion.FieldsIds.NumberOfChildren),
                    item[Templates.Promotion.Fields.NumberOfChildrenErrorCode],
                    Constants.Placeholdres.ChildrenPlaceholder),
                NInfants = GetValidationRule(
                    item.GetInteger(Templates.Promotion.FieldsIds.NumberOfInfants),
                    item[Templates.Promotion.Fields.NumberOfInfantsErrorCode],
                    Constants.Placeholdres.InfantsPlaceholder)
            };
        }
    }
}