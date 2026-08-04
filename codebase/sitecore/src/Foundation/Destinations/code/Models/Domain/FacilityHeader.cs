using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Utils;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class FacilityHeader
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="FacilityHeader"/> class.
        /// Requires for deserealization.
        /// </summary>
        public FacilityHeader()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="FacilityHeader"/> class.
        /// </summary>
        /// <param name="item">Siteceore item.</param>
        /// <param name="order">Order of header.</param>
        public FacilityHeader(Item item, int order)
            : this(item)
        {
            Order = order;
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="FacilityHeader"/> class.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        public FacilityHeader(Item item)
        {
            if (item == null)
            {
                return;
            }

            Name = item[Constants.Fields.DatasourceItem.Name];
            TrackingId = ItemUtils.GetTrackingId(item);
            FacilityFilteredTypes = item.GetItems(Constants.Fields.FacilityHeader.Facilities).Select((x, index) => new FacilityFilteredType(x, index));
        }

        /// <summary>
        /// Gets or sets name.
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Gets or sets order.
        /// </summary>
        public int Order { get; set; }

        /// <summary>
        /// Gets or sets the tracking id
        /// </summary>
        public string TrackingId { get; set; }

        /// <summary>
        /// Gets or sets facility filtered types.
        /// </summary>
        public IEnumerable<FacilityFilteredType> FacilityFilteredTypes { get; set; }
    }
}