using System.Collections.Generic;
using System.Linq;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class NamedSearchItem : BaseSearchParameters
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="NamedSearchItem"/> class.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        public NamedSearchItem(Item item)
            : base(item)
        {
            if (item == null)
            {
                return;
            }

            Name = item[Constants.Fields.DatasourceItem.Name];

            Periods = item.Children.Select(x => new PeriodByDestination(x));
            SetChildAges(item, Constants.Fields.NamedSearch.ChildAges);
            SetThemeTypes(item, new[] { Constants.Fields.BaseThemes.ThemeTypes });
            SetPromoCollections(item, Constants.Fields.Filters.PromoCollections);
        }

        /// <summary>
        /// Gets periods.
        /// </summary>
        public IEnumerable<PeriodByDestination> Periods { get; }
    }
}