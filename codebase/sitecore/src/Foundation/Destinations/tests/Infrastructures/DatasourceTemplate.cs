using Sitecore.Data;
using Sitecore.FakeDb;

namespace easyJet.Foundation.Destinations.Tests.Infrastructures
{
    public class DatasourceTemplate : DbTemplate
    {
        public DatasourceTemplate(string name, ID id)
            : base(name, id)
        {
            Add(Constants.Fields.DatasourceItem.Code);
            Add(Constants.Fields.DatasourceItem.Name);
        }
    }
}
