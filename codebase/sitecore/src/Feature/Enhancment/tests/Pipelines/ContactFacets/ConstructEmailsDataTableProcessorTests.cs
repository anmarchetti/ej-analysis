using easyJet.Feature.SitecoreEnhancment.Pipelines.ContactFacets.EmailsList;
using FluentAssertions;
using Sitecore.Cintel.Reporting;
using Xunit;

namespace easyJet.Feature.SitecoreEnhancment.Pipelines.ContactFacets
{
    public class ConstructEmailsDataTableProcessorTests
    {
        [Fact]
        public void ConstructTable_Success()
        {
            var args = new ReportProcessorArgs(new ViewParameters() { ViewName = "test table name" });

            var processor = new ConstructEmailsDataTableProcessor();

            processor.Process(args);

            args.ResultTableForView.Should().NotBeNull();
            args.ResultTableForView.Columns["Id"].Should().NotBeNull();
            args.ResultTableForView.Columns["BodyPreview"].Should().NotBeNull();
            args.ResultTableForView.Columns["Body"].Should().NotBeNull();
            args.ResultTableForView.Columns["SentDate"].Should().NotBeNull();
            args.ResultTableForView.Columns["Subject"].Should().NotBeNull();
        }
    }
}
