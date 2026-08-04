using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Utils;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class TimeFilter : DatasourceObject
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="TimeFilter"/> class.
        /// Sets time filter.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <param name="trackingIdPrefix">Optional prefix prepended to the tracking id.</param>
        public TimeFilter(Item item, string trackingIdPrefix = null)
            : base(item)
        {
            if (item == null)
            {
                return;
            }

            StartTime = ((DateField)item.Fields[Constants.Fields.TimeSetting.StartTime]).GetIsoDate();
            EndTime = ((DateField)item.Fields[Constants.Fields.TimeSetting.EndTime]).GetIsoDate();
            AtcomCode = item.Fields[Constants.Fields.TimeSetting.AtcomCode].Value;

            var trackingId = ItemUtils.GetTrackingId(item);
            TrackingId = string.IsNullOrEmpty(trackingIdPrefix)
                ? trackingId
                : $"{trackingIdPrefix} {trackingId?.ToLower()}".Trim();
        }

        /// <summary>
        /// Gets or sets start time.
        /// </summary>
        public string StartTime { get; set; }

        /// <summary>
        /// Gets or sets end time.
        /// </summary>
        public string EndTime { get; set; }

        /// <summary>
        /// Gets or sets atcom code.
        /// </summary>
        public string AtcomCode { get; set; }

        /// <summary>
        /// Gets or sets tracking id.
        /// </summary>
        public string TrackingId { get; set; }
    }
}