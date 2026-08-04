using Sitecore.Data;
using Sitecore.FakeDb;

namespace easyJet.Foundation.HotelBeds.Tests.FakeDb
{
    public class DataFolderDbItem : DbItem
    {
        public DataFolderDbItem(string name)
            : base(name)
        {
            TemplateID = ID.Parse("{81BF68AE-91FD-4535-9D77-989773789AB6}"); // Data Folder Template ID
        }
    }
}
