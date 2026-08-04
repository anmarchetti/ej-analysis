using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Atcom.Logging;
using easyJet.Foundation.Atcom.Models;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Atcom.Services.Sync
{
    [Service(typeof(IExcludeDataObjectsService), Lifetime = Lifetime.Transient)]
    public class AtcomExcludeDataObjectsService : IExcludeDataObjectsService
    {
        private readonly IExcludeDataObjectsSettingsService excludeDataObjectsSettingsService;
        private readonly IAtcomLogger logger;

        public AtcomExcludeDataObjectsService(IExcludeDataObjectsSettingsService excludeDataObjectsSettingsService, IAtcomLogger logger)
        {
            this.excludeDataObjectsSettingsService = excludeDataObjectsSettingsService;
            this.logger = logger;
        }

        /// <summary>
        /// Removes excluded DataObjects
        /// </summary>
        /// <param name="source">the original IEnumerable</param>
        /// <returns>the IEnumerable without the excluded elements</returns>
        public IEnumerable<T> ExceptExcluded<T>(IEnumerable<T> source)
            where T : DataObject
        {
            foreach (var entry in source)
            {
                if (!IsExcluded(entry.Code))
                {
                    yield return entry;
                }
            }
        }

        /// <summary>
        /// Check if an item should be excluded
        /// </summary>
        /// <param name="code">the code to check</param>
        /// <returns>a value indicating if code should be excluded or not</returns>
        public bool IsExcluded(string code)
        {
            if (excludeDataObjectsSettingsService.GetCodes().Contains(code.ToLower()))
            {
                logger.Warn($"{nameof(code)}:{code} is excluded, skipping!", this);
                return true;
            }

            return false;
        }

        /// <summary>
        /// Check if an item should be excluded
        /// </summary>
        /// <param name="item">the item to check</param>
        /// <returns>a value indicating if an item should be excluded or not</returns>
        public bool IsExcluded(Item item) => GetDestinationAncestorCodes(item).Any(IsExcluded);

        private static List<string> GetDestinationAncestorCodes(Item item)
        {
            var result = new List<string>();
            while (item != null && !item.TemplateID.Equals(Constants.TemplateIds.DestinationsFolder))
            {
                var code = item.Fields[Constants.Fields.DatasourceItem.Code]?.Value;
                if (!string.IsNullOrWhiteSpace(code))
                {
                    result.Add(code);
                }

                item = item.Parent;
            }

            return result;
        }
    }
}
