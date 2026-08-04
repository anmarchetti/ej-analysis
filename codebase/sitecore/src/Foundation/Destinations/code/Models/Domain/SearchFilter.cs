using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class SearchFilter
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="SearchFilter"/> class.
        /// Sets search filters.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        public SearchFilter(Item item)
        {
            FlightFilters = item
                .Children
                .Where(x => x.TemplateID == Constants.TemplateIds.FlightsFilter)
                .SelectMany(x => x.Children.Where(y => y.TemplateID == Constants.TemplateIds.TimeFilter))
                .Select(x => new FlightFilter(x));
        }

        /// <summary>
        /// Gets or sets flights filters.
        /// </summary>
        public IEnumerable<FlightFilter> FlightFilters { get; set; }
    }
}