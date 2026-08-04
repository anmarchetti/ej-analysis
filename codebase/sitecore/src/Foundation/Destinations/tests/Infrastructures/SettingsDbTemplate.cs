using easyJet.Foundation.Multisite;
using Sitecore.FakeDb;

namespace easyJet.Foundation.Destinations.Tests.Infrastructures
{
    public class SettingsDbTemplate : DbTemplate
    {
        public SettingsDbTemplate(string name)
            : base(name, Templates.Settings.Id)
        {
        }
    }
}
