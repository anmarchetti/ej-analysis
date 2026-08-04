using Sitecore.FakeDb;

namespace easyJet.Foundation.Presentation.Tests.Infrastructure
{
    public class PartialDesignDbTemplate : DbTemplate
    {
        public PartialDesignDbTemplate(string name)
            : base(name, Templates.PartialDesign.Id)
        {
        }
    }
}
