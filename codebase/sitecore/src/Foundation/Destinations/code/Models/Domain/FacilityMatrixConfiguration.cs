using System.Collections.Generic;
using System.Text.Json.Serialization;
using System.Web.Script.Serialization;
using Sitecore.Data;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class FacilityMatrixConfiguration
    {
        public string Code { get; set; }

        public string Name { get; set; }

        public string ItemName { get; set; }

        public string TrackingId { get; set; }

        public string TypeTitle { get; set; }

        public string Description { get; set; }

        public string Icon { get; set; }

        public string FilledIcon { get; set; }

        public string TooltipText { get; set; }

        public bool IsExclusive { get; set; }

        [ScriptIgnore]
        public ID Id { get; set; }

        [ScriptIgnore]
        public List<FacilityMatrixConfigurationValue> Values { get; set; } = new List<FacilityMatrixConfigurationValue>();
    }
}