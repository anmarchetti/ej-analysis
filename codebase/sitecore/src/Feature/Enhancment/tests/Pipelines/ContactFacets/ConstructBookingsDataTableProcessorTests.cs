using easyJet.Feature.SitecoreEnhancment.Pipelines.ContactFacets.Bookings;
using FluentAssertions;
using Sitecore.Cintel.Reporting;
using Xunit;

namespace easyJet.Feature.SitecoreEnhancment.Tests.Pipelines.ContactFacets
{
    public class ConstructBookingsDataTableProcessorTests
    {
        [Fact]
        public void ConstructTable_Success()
        {
            var args = new ReportProcessorArgs(new ViewParameters() { ViewName = "test table name" });

            var processor = new ConstructBookingsDataTableProcessor();

            processor.Process(args);

            args.ResultTableForView.Should().NotBeNull();
            args.ResultTableForView.Columns["BookingRef"].Should().NotBeNull();
            args.ResultTableForView.Columns["HotelName"].Should().NotBeNull();
            args.ResultTableForView.Columns["Theme"].Should().NotBeNull();
            args.ResultTableForView.Columns["Type"].Should().NotBeNull();
            args.ResultTableForView.Columns["Status"].Should().NotBeNull();
            args.ResultTableForView.Columns["AdultsCount"].Should().NotBeNull();
            args.ResultTableForView.Columns["ChildrenCount"].Should().NotBeNull();
            args.ResultTableForView.Columns["InfantsCount"].Should().NotBeNull();
            args.ResultTableForView.Columns["Region"].Should().NotBeNull();
            args.ResultTableForView.Columns["Country"].Should().NotBeNull();
            args.ResultTableForView.Columns["Resort"].Should().NotBeNull();
            args.ResultTableForView.Columns["BookingStartDate"].Should().NotBeNull();
            args.ResultTableForView.Columns["BookingEndDate"].Should().NotBeNull();
            args.ResultTableForView.Columns["CreatedDate"].Should().NotBeNull();
            args.ResultTableForView.Columns["UpdatedDate"].Should().NotBeNull();
        }
    }
}
