using System.Data;
using easyJet.Feature.SitecoreEnhancment.Pipelines.ContactFacets.Common;
using FluentAssertions;
using Sitecore.Cintel.Commons;
using Xunit;

namespace easyJet.Feature.SitecoreEnhancment.Pipelines.ContactFacets
{
    public class GenericActionResultTransformerTests
    {
        private readonly GenericActionResultTransformer transformer;

        public GenericActionResultTransformerTests()
        {
            transformer = new GenericActionResultTransformer();
        }

        [Fact]
        public void ExtendsRule_Success()
        {
            var tableArgs = new ResultSet<DataTable>(1, 1);
            var t = transformer.Transform(tableArgs);
            tableArgs.Should().NotBeNull();
        }
    }
}
