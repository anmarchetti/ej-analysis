using System;
using System.Collections.Generic;
using easyJet.Feature.SitecoreEnhancment.Pipelines.ContactFacets.Bookings;
using easyJet.Foundation.XConnect.Common.Facets.Booking;
using easyJet.Foundation.XConnect.Common.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Cintel.Reporting;
using Sitecore.XConnect;
using tests.Pipelines.ContactFacets.Base;
using Xunit;

namespace easyJet.Feature.SitecoreEnhancment.Pipelines.ContactFacets
{
    public class GetBookingsProcessorTests : BaseContactFacetTests
    {
        private readonly IXdbService xdbService;
        private readonly ConstructBookingsDataTableProcessor constructBookingsDataTableProcessor;
        private readonly GetBookingsProcessor getBookingsProcessor;

        protected override string FacetKey => BookingsFacet.DefaultFacetKey;

        public GetBookingsProcessorTests()
        {
            xdbService = Substitute.For<IXdbService>();
            getBookingsProcessor = new GetBookingsProcessor(xdbService);
            constructBookingsDataTableProcessor = new ConstructBookingsDataTableProcessor();
        }

        [Fact]
        public void GetBookings_TableIsEmpty_ContactIsNull()
        {
            var args = InitArgs();
            xdbService.GetTargetContact(Arg.Any<ContactReference>(), Arg.Any<ContactExecutionOptions>(), Arg.Any<TimeSpan>()).Returns((Contact)null);
            getBookingsProcessor.Process(args);

            args.ResultTableForView.Should().NotBeNull();
            args.ResultTableForView.Rows.Should().BeEmpty();
        }

        [Fact]
        public void GetBookings_TableIsFilled_ContactWithFacets()
        {
            var args = InitArgs();
            var contact = GetContactWithFacet();
            xdbService.GetTargetContact(Arg.Any<ContactReference>(), Arg.Any<ContactExecutionOptions>(), Arg.Any<TimeSpan>()).Returns(contact);
            getBookingsProcessor.Process(args);

            args.ResultTableForView.Should().NotBeNull();
            args.ResultTableForView.Rows.Count.Should().Be(1);
        }

        protected override Dictionary<string, Facet> GetFacets() => new Dictionary<string, Facet>
        {
            {
                FacetKey, new BookingsFacet()
                {
                    Bookings = new Dictionary<string, Booking>()
                    {
                        { "test", new Booking() },
                    }
                }
            }
        };

        private ReportProcessorArgs InitArgs()
        {
            var args = new ReportProcessorArgs(new ViewParameters { ViewName = "test table name" })
            {
                ReportParameters =
                {
                    ContactId = Guid.NewGuid()
                }
            };
            constructBookingsDataTableProcessor.Process(args);
            return args;
        }
    }
}
