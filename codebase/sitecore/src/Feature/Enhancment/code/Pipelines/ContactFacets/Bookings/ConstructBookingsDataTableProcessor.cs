using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Reflection;
using easyJet.Foundation.XConnect.Common.Facets.Booking;
using Sitecore.Cintel.Reporting;
using Sitecore.Cintel.Reporting.Processors;

namespace easyJet.Feature.SitecoreEnhancment.Pipelines.ContactFacets.Bookings
{
    public class ConstructBookingsDataTableProcessor : ReportProcessorBase
    {
        public override void Process(ReportProcessorArgs args)
        {
            args.ResultTableForView = new DataTable();
            args.ResultTableForView.Columns.Add(new ViewField<string>("BookingRef").ToColumn());
            args.ResultTableForView.Columns.Add(new ViewField<string>("HotelName").ToColumn());
            args.ResultTableForView.Columns.Add(new ViewField<string>("Theme").ToColumn());
            args.ResultTableForView.Columns.Add(new ViewField<string>("Type").ToColumn());
            args.ResultTableForView.Columns.Add(new ViewField<string>("Status").ToColumn());
            args.ResultTableForView.Columns.Add(new ViewField<string>("AdultsCount").ToColumn());
            args.ResultTableForView.Columns.Add(new ViewField<string>("ChildrenCount").ToColumn());
            args.ResultTableForView.Columns.Add(new ViewField<string>("InfantsCount").ToColumn());
            args.ResultTableForView.Columns.Add(new ViewField<string>("Region").ToColumn());
            args.ResultTableForView.Columns.Add(new ViewField<string>("Country").ToColumn());
            args.ResultTableForView.Columns.Add(new ViewField<string>("Resort").ToColumn());

            args.ResultTableForView.Columns.Add(new ViewField<string>("BookingStartDate").ToColumn());
            args.ResultTableForView.Columns.Add(new ViewField<string>("BookingEndDate").ToColumn());
            args.ResultTableForView.Columns.Add(new ViewField<string>("CreatedDate").ToColumn());
            args.ResultTableForView.Columns.Add(new ViewField<string>("UpdatedDate").ToColumn());

            args.ResultTableForView.Columns.Add(new ViewField<string>("MarketCode").ToColumn());
            args.ResultTableForView.Columns.Add(new ViewField<string>("Language").ToColumn());
            args.ResultTableForView.Columns.Add(new ViewField<string>("Currency").ToColumn());

            AddFlightColumns(false, args.ResultTableForView);
            AddFlightColumns(true, args.ResultTableForView);
        }

        private void AddFlightColumns(bool outBound, DataTable dataTable)
        {
            var prefix = outBound ? "Outbound" : "Inbound";
            foreach (var fieldName in GetFlightFieldNames())
            {
                dataTable.Columns.Add(new ViewField<string>(prefix + fieldName).ToColumn());
            }

            dataTable.Columns.Add(new ViewField<string>(prefix + "Style").ToColumn());
        }

        private IEnumerable<string> GetFlightFieldNames()
        {
            return typeof(Flight).GetMembers().Where(p => p.MemberType == MemberTypes.Property).Select(field => field.Name);
        }
    }
}