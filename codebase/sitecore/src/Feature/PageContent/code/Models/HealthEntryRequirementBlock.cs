using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.Data.Items;

namespace easyJet.Feature.PageContent.Models
{
    public class HealthEntryRequirementBlock
    {
        public HealthEntryRequirementBlock(Item item)
        {
            if (item != null)
            {
                AirportCodes = item.GetItems(Constants.Fields.HealthEntryRequirementsBlock.Airports).Select(x => new Airport(x).Code).ToHashSet();
                HealthEntryRequirements = item.GetItems(Constants.Fields.HealthEntryRequirementsBlock.HealthEntryRequirements).Select(x => new HealthEntryRequirementTile(x));
            }
        }

        /// <summary>
        /// Gets or Sets Airport Codes.
        /// </summary>
        public HashSet<string> AirportCodes { get; set; }

        /// <summary>
        /// Gets or sets get or Sets healty/entry requirements.
        /// </summary>
        public IEnumerable<HealthEntryRequirementTile> HealthEntryRequirements { get; set; }
    }
}