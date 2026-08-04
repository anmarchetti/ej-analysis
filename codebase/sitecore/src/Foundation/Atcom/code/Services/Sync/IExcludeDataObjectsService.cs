using System.Collections.Generic;
using easyJet.Foundation.Atcom.Models;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Atcom.Services.Sync
{
    public interface IExcludeDataObjectsService
    {
        /// <summary>
        /// Removed all Dataobjects that should be excluded
        /// </summary>
        /// <param name="source">the source collection</param>
        /// <returns>the filtered collection</returns>
        IEnumerable<T> ExceptExcluded<T>(IEnumerable<T> source)
            where T : DataObject;

        /// <summary>
        /// Checks if a code should be excluded
        /// </summary>
        /// <param name="code">the code</param>
        /// <returns>bool should be excluded?</returns>
        bool IsExcluded(string code);

        /// <summary>
        /// Checks if an item should be excluded
        /// </summary>
        /// <param name="item">the item</param>
        /// <returns>bool should be excluded?</returns>
        bool IsExcluded(Item item);
    }
}
