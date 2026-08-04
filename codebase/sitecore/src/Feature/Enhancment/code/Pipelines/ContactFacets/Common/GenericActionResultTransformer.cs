using System.Data;
using Sitecore.Cintel.Client;
using Sitecore.Cintel.Client.Transformers;
using Sitecore.Cintel.Commons;
using Sitecore.Cintel.Endpoint.Transfomers;
using Sitecore.Diagnostics;

namespace easyJet.Feature.SitecoreEnhancment.Pipelines.ContactFacets.Common
{
    public class GenericActionResultTransformer : IIntelResultTransformer, IResultTransformer<DataTable>
    {
        private readonly ResultSetExtender resultSetExtender;

        public GenericActionResultTransformer()
        {
            resultSetExtender = ClientFactory.Instance.GetResultSetExtender();
        }

        public GenericActionResultTransformer(ResultSetExtender resultSetExtender)
        {
            this.resultSetExtender = resultSetExtender;
        }

        public object Transform(ResultSet<DataTable> resultSet)
        {
            Assert.ArgumentNotNull(resultSet, "resultSet");
            resultSetExtender.AddRecency(resultSet, "VisitStartDateTime");
            return resultSet;
        }
    }
}