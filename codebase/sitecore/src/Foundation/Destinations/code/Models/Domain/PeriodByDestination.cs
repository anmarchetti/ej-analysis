using System.Collections.Generic;
using System.Linq;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class PeriodByDestination : TimePeriod
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="PeriodByDestination"/> class.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        public PeriodByDestination(Item item)
            : base(item)
        {
            var destinations = ((MultilistField)item.Fields[Constants.Fields.PeriodByDestination.Destinations])?.GetItems();
            Destinations = destinations?.Select(x => new DatasourceObject(x)).ToList();
        }

        /// <summary>
        /// Gets destinations.
        /// </summary>
        public List<DatasourceObject> Destinations { get; }
    }
}