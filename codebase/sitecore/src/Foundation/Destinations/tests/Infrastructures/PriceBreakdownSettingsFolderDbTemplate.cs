using Sitecore.FakeDb;

namespace easyJet.Foundation.Destinations.Tests.Infrastructures
{
    public class PriceBreakdownSettingsFolderDbTemplate : DbTemplate
    {
        public PriceBreakdownSettingsFolderDbTemplate(string name)
            : base(name, Constants.TemplateIds.PriceBreakdownSettingsFolder)
        {
        }
    }
}
