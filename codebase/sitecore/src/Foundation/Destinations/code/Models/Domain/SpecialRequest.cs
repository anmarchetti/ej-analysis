using Sitecore;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class SpecialRequest : DatasourceObject
    {
        // Requires for deserialization
        public SpecialRequest()
        {
        }

        public SpecialRequest(Item item)
            : base(item)
        {
            if (item != null)
            {
                DisplayName = item.Fields[Constants.Fields.SpecialRequest.DisplayName]?.Value;
                PreSelectedForInfant = MainUtil.GetBool(item.Fields[Constants.Fields.SpecialRequest.PreSelectedForInfant]?.Value, false);
                PreSelectedForAlert = item.Fields[Constants.Fields.SpecialRequest.PreSelectedForInfantAlert]?.Value;
            }
        }

        public string DisplayName { get; set; }

        public bool PreSelectedForInfant { get; set; }

        public string PreSelectedForAlert { get; set; }
    }
}