using EasyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.Data.Items;

namespace easyJet.Feature.PageContent.Models.Validation
{
    /// <summary>
    /// Models describes health/entry requirement block validation model.
    /// </summary>
    public class HealthEntryRequirementBlock
    {
        public HealthEntryRequirementBlock(Item item)
        {
            if (item != null)
            {
                Name = item.Name;
                AirportIds = item.Fields[Constants.Fields.HealthEntryRequirementsBlock.Airports].Value.Separate();
            }
        }

        /// <summary>
        /// Gets or Sets Health/Entry requirement block name.
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Gets or Sets Airport ids.
        /// </summary>
        public string[] AirportIds { get; set; }
    }
}