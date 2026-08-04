using Sitecore.Data;
using Sitecore.FakeDb;

namespace easyJet.Feature.PageContent.Tests.Models
{
    public class HealthRequirementTileDbItem : DbItem
    {
        public HealthRequirementTileDbItem(string name)
           : this(name, ID.NewID)
        {
        }

        public HealthRequirementTileDbItem(string name, ID id)
            : this(string.Empty, string.Empty, string.Empty, string.Empty, string.Empty, name, id)
        {
        }

        public HealthRequirementTileDbItem(string title, string description, string image, string icon, string cta, string name, ID id)
            : base(name, id)
        {
            Add(Constants.Fields.HealthEntryRequirementTile.Title, title);
            Add(Constants.Fields.HealthEntryRequirementTile.Description, description);
            Add(Constants.Fields.HealthEntryRequirementTile.Image, image);
            Add(Constants.Fields.HealthEntryRequirementTile.Icon, icon);
            Add(Constants.Fields.HealthEntryRequirementTile.CTA, cta);
        }
    }
}
