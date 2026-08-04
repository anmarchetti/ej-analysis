using Sitecore.Data;
using Sitecore.FakeDb;

namespace easyJet.Feature.PageContent.Tests.Models
{
    public class HealthRequirementBlockDbItem : DbItem
    {
        public HealthRequirementBlockDbItem(string name)
            : this(string.Empty, string.Empty, name)
        {
        }

        public HealthRequirementBlockDbItem(string airports, string healthEntryRequirements, string name)
           : this(airports, healthEntryRequirements, string.Empty, name)
        {
        }

        public HealthRequirementBlockDbItem(string airports, string healthEntryRequirements, string isDefault, string name)
            : base(name, ID.NewID, Constants.TemplateIds.HealthEntryRequirementsBlock)
        {
            Add(Constants.Fields.HealthEntryRequirementsBlock.Airports, airports);
            Add(Constants.Fields.HealthEntryRequirementsBlock.HealthEntryRequirements, healthEntryRequirements);
            Add(Constants.Fields.HealthEntryRequirementsBlock.IsDefault, isDefault);
        }

        public HealthRequirementBlockDbItem(string name, ID id)
            : base(name, id, Constants.TemplateIds.HealthEntryRequirementsBlock)
        {
            Add(Constants.Fields.HealthEntryRequirementsBlock.Airports, string.Empty);
            Add(Constants.Fields.HealthEntryRequirementsBlock.HealthEntryRequirements, string.Empty);
            Add(Constants.Fields.HealthEntryRequirementsBlock.IsDefault, string.Empty);
        }
    }
}
