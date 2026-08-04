using easyJet.Foundation.Destinations;
using Sitecore.FakeDb;

namespace easyJet.Foundation.Atcom.Tests.Services.Sync
{
    public class FilledSettingsDbItem : DbItem
    {
        public FilledSettingsDbItem(string name)
            : base(name)
        {
            Add(Constants.Atcom.Fields.CodesToIgnore, "<file mediaid=\"{E20C17B3-8662-4E7E-ACEC-8B663B76E4C8}\" src=\"-/jssmedia/e20c17b386624e7eacec8b663b76e4c8.ashx\" />");
        }
    }
}