using easyJet.Foundation.Destinations;
using Sitecore.FakeDb;

namespace easyJet.Foundation.Atcom.Tests.Services.Sync
{
    public class SettingsDbItem : DbItem
    {
        public SettingsDbItem(string name)
            : base(name)
        {
            Add(Constants.Atcom.Fields.CodesToIgnore, string.Empty);
        }
    }
}