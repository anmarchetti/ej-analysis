using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class FlightFilter : DatasourceObject
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="FlightFilter"/> class.
        /// </summary>
        /// Sets flight filter.
        /// <param name="item">Sitecore item.</param>
        public FlightFilter(Item item)
        {
            var filterType = item.GetTargetItem(Constants.Fields.TimeFilter.FilterType);
            var direction = FlightDirection.None;

            if (filterType != null)
            {
                Code = filterType.Fields[Constants.Fields.DatasourceItem.Code].Value;
                Name = filterType.Fields[Constants.Fields.DatasourceItem.Name].Value;

                if (filterType.Name.StartsWith(nameof(FlightDirection.Inbound), StringComparison.OrdinalIgnoreCase))
                {
                    direction = FlightDirection.Inbound;
                }
                else if (filterType.Name.StartsWith(nameof(FlightDirection.Outbound), StringComparison.OrdinalIgnoreCase))
                {
                    direction = FlightDirection.Outbound;
                }
            }

            var trackingIdPrefix = direction == FlightDirection.None ? null : direction.ToString();
            TimeSlots = item.GetItems(Constants.Fields.TimeFilter.Time).Select(x => new TimeFilter(x, trackingIdPrefix));
        }

        /// <summary>
        /// Gets or sets time slots.
        /// </summary>
        public IEnumerable<TimeFilter> TimeSlots { get; set; }
    }
}