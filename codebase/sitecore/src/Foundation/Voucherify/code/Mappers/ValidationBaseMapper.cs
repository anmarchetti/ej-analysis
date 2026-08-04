using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Voucherify.Models.Domain;
using easyJet.Foundation.Voucherify.Models.Domain.Validation;
using Sitecore;
using Sitecore.Configuration;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.Globalization;

namespace easyJet.Foundation.Voucherify.Mappers
{
    public abstract class ValidationBaseMapper
    {
        private static readonly string DictionaryPrefix = Settings.GetSetting("Voucherify.DictionaryPrefix");

        /// <summary>
        /// Get validation rule.
        /// </summary>
        /// <typeparam name="T">Type of rule criteria.</typeparam>
        /// <param name="criteria">Rule criteria.</param>
        /// <param name="errorCode">Error code.</param>
        /// <param name="placeholder">Placeholder.</param>
        /// <returns>Validation rule.</returns>
        protected static ValidationRule<T> GetValidationRule<T>(T criteria, string errorCode, string placeholder = null)
        {
            if (EqualityComparer<T>.Default.Equals(criteria, default) || string.IsNullOrEmpty(errorCode))
            {
                return null;
            }

            string criteriaString;
            if (criteria is List<DatasourceObject> dataSource)
            {
                if (!dataSource.Any())
                {
                    return null;
                }

                criteriaString = string.Join(", ", dataSource);
            }
            else if (criteria is List<PromoCollection> promoCollections)
            {
                if (!promoCollections.Any())
                {
                    return null;
                }

                criteriaString = string.Join(", ", promoCollections);
            }
            else
            {
                criteriaString = criteria.ToString();
            }

            return BuildValidationRule(criteria, criteriaString, errorCode, placeholder);
        }

        /// <summary>
        /// Build validation rule with multiple validation message placeholders.
        /// </summary>
        /// <typeparam name="T">Type of rule criteria.</typeparam>
        /// <param name="criteria">Rule criteria.</param>
        /// <param name="errorCode">Error code.</param>
        /// <param name="criteriasByPlaceholders">Collection of criteria placeholder pairs.</param>
        /// <returns>Validation rule.</returns>
        protected static ValidationRule<T> BuildValidationRule<T>(T criteria, string errorCode, Dictionary<string, string> criteriasByPlaceholders)
        {
            return new ValidationRule<T>()
            {
                Criteria = criteria,
                ValidationResult = new ValidationResult(errorCode, () => BuildErrorMessageWithMultiplePlaceholders(errorCode, criteriasByPlaceholders))
            };
        }

        /// <summary>
        /// Build promo collections item.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <param name="fieldName">Sitecore field name.</param>
        /// <returns>Collection of promo collection items.</returns>
        protected static IList<PromoCollection> BuildPromoCollectionsItem(Item item, string fieldName)
        {
            MultilistField multilist = item.Fields[fieldName];
            var items = multilist?.GetItems();

            if (items != null && items.Length > 0)
            {
                return items.Select(x => new PromoCollection(x)).ToList();
            }

            return new List<PromoCollection>();
        }

        /// <summary>
        /// Build datasource item.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <param name="fieldName">Sitecore field name.</param>
        /// <returns>Collection of datasource items.</returns>
        protected static List<DatasourceObject> BuildDatasourceItem(Item item, string fieldName)
        {
            MultilistField multilist = item.Fields[fieldName];
            var items = multilist?.GetItems();

            if (items != null && items.Length > 0)
            {
                return items.Select(x => new DatasourceObject(x)).ToList();
            }

            return new List<DatasourceObject>();
        }

        /// <summary>
        /// Build date time range.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <param name="fieldNameFrom">Field name - from.</param>
        /// <param name="fieldNameTo">Field name - to.</param>
        /// <returns>Date time range.</returns>
        protected static DateTimeRange BuildDateTimeRange(Item item, string fieldNameFrom, string fieldNameTo)
        {
            var to = item[fieldNameTo];
            var from = item[fieldNameTo];

            if (!string.IsNullOrEmpty(from) && !string.IsNullOrEmpty(to))
            {
                var fromDate = ((DateField)item.Fields[fieldNameFrom]).DateTime;
                var toDate = ((DateField)item.Fields[fieldNameTo]).DateTime;
                return new DateTimeRange()
                {
                    From = DateUtil.ToServerTime(fromDate),
                    To = DateUtil.ToServerTime(toDate)
                };
            }

            return null;
        }

        /// <summary>
        /// Get with parent validation rule.
        /// </summary>
        /// <typeparam name="T">Type of validation rule.</typeparam>
        /// <param name="criteria">Rule criteria.</param>
        /// <param name="item">Sitecore item.</param>
        /// <param name="fieldName">Field name.</param>
        /// <param name="errorCode">Error code.</param>
        /// <param name="placeholder">Placeholder.</param>
        /// <returns>Validation rule.</returns>
        protected static ValidationRule<T> GetWithParentValidationRule<T>(T criteria, Item item, string fieldName, string errorCode, string placeholder = null)
        {
            if (item == null || string.IsNullOrWhiteSpace(fieldName) || string.IsNullOrWhiteSpace(errorCode))
            {
                return null;
            }

            MultilistField multilist = item.Fields[fieldName];
            var items = multilist.GetItems();

            if (items.Length <= 0)
            {
                return null;
            }

            var criteriaString = string.Join(", ", items.Select(x => $"{new DatasourceObject(x.Parent).Name} - {new DatasourceObject(x).Name}"));

            return BuildValidationRule(criteria, criteriaString, errorCode, placeholder);
        }

        /// <summary>
        /// Build validation rule with one validation message placeholder.
        /// </summary>
        /// <typeparam name="T">Type of rule criteria.</typeparam>
        /// <param name="criteria">Rule criteria.</param>
        /// <param name="criteriaString">Criteria string.</param>
        /// <param name="errorCode">Error code.</param>
        /// <param name="placeholder">Placeholder.</param>
        /// <returns>Validation rule.</returns>
        private static ValidationRule<T> BuildValidationRule<T>(T criteria, string criteriaString, string errorCode, string placeholder = null)
        {
            return new ValidationRule<T>()
            {
                Criteria = criteria,
                ValidationResult = new ValidationResult(errorCode, () => BuildErrorMessage(errorCode, criteriaString, placeholder))
            };
        }

        /// <summary>
        /// Build error message with one message placeholder.
        /// </summary>
        /// <param name="errorCode">Error code.</param>
        /// <param name="criteria">Criteria.</param>
        /// <param name="placeholder">Placeholder.</param>
        /// <returns>Error message.</returns>
        private static string BuildErrorMessage(string errorCode, string criteria, string placeholder)
        {
            string message = Translate.Text($"{DictionaryPrefix}.{errorCode}");

            if (!string.IsNullOrEmpty(placeholder) && !string.IsNullOrEmpty(criteria))
            {
                return message.Replace(placeholder, criteria);
            }

            return message;
        }

        /// <summary>
        /// Build error message with multiple message placeholders.
        /// </summary>
        /// <param name="errorCode">Error code.</param>
        /// <param name="criteriasByPlaceholders">Collection of criteria placeholder pairs.</param>
        /// <returns>Error message.</returns>
        private static string BuildErrorMessageWithMultiplePlaceholders(string errorCode, Dictionary<string, string> criteriasByPlaceholders)
        {
            string message = Translate.Text($"{DictionaryPrefix}.{errorCode}");

            return criteriasByPlaceholders
                .Where(criteriaByPlaceholder => !string.IsNullOrEmpty(criteriaByPlaceholder.Key) && !string.IsNullOrEmpty(criteriaByPlaceholder.Value))
                .Aggregate(message, (current, criteriaByPlaceholder) => current.Replace(criteriaByPlaceholder.Key, criteriaByPlaceholder.Value));
        }
    }
}