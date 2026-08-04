using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.XConnect.Common.Facets.Booking;
using easyJet.Foundation.XConnect.Common.Services;
using Sitecore.Cintel.Reporting;
using Sitecore.Cintel.Reporting.Processors;
using Sitecore.XConnect;

namespace easyJet.Feature.SitecoreEnhancment.Pipelines.ContactFacets.Bookings
{
    public class GetBookingsProcessor : ReportProcessorBase
    {
        private const string HiddenStyle = "display: none;";
        private const string DefaultLanguage = "en_EN";
        private const string DefaultMarket = "UK";
        private const string DefaultCurrency = "GBP";

        private readonly IXdbService xdbService;

        public GetBookingsProcessor(IXdbService xdbService)
        {
            this.xdbService = xdbService;
        }

        public override void Process(ReportProcessorArgs args)
        {
            Guid contactId = args.ReportParameters.ContactId;
            var resultTableForView = args.ResultTableForView;
            var contactExpandOptions = new ContactExpandOptions(BookingsFacet.DefaultFacetKey);
            var contactExecutionOptions = new ContactExecutionOptions(contactExpandOptions);
            var contactReference = new ContactReference(contactId);
            var contact = xdbService.GetTargetContact(contactReference, contactExecutionOptions, TimeSpan.FromMilliseconds(2000));
            var bookings = contact?.GetFacet<BookingsFacet>(BookingsFacet.DefaultFacetKey)?.Bookings;

            if (bookings != null)
            {
                foreach (var booking in bookings)
                {
                    var dataRow = resultTableForView.NewRow();
                    dataRow["BookingRef"] = booking.Key;
                    dataRow["HotelName"] = booking.Value?.Accommodation?.Name;
                    dataRow["Theme"] = booking.Value?.Theme;
                    dataRow["Type"] = booking.Value?.Type;
                    dataRow["Status"] = booking.Value?.Status;
                    dataRow["AdultsCount"] = booking.Value?.AdultsCount;
                    dataRow["ChildrenCount"] = booking.Value?.ChildrenCount;
                    dataRow["InfantsCount"] = booking.Value?.InfantsCount;
                    dataRow["Region"] = booking.Value?.Accommodation?.Region;
                    dataRow["Country"] = booking.Value?.Accommodation?.Country;
                    dataRow["Resort"] = booking.Value?.Accommodation?.Resort;
                    dataRow["BookingStartDate"] = booking.Value?.BookingStartDate;
                    dataRow["BookingEndDate"] = booking.Value?.BookingEndDate;
                    dataRow["CreatedDate"] = booking.Value?.CreatedDate;
                    dataRow["UpdatedDate"] = booking.Value?.UpdatedDate;
                    dataRow["MarketCode"] = booking.Value?.MarketCode ?? DefaultMarket;
                    dataRow["Language"] = booking.Value?.Language ?? DefaultLanguage;
                    dataRow["Currency"] = booking.Value?.Currency ?? DefaultCurrency;

                    FillFlight(true, booking.Value?.Flights, dataRow);
                    FillFlight(false, booking.Value?.Flights, dataRow);
                    resultTableForView.Rows.Add(dataRow);
                }
            }

            args.QueryResult = resultTableForView;
        }

        private void FillFlight(bool outbound, IEnumerable<Flight> flights, System.Data.DataRow row)
        {
            var prefix = outbound ? "Outbound" : "Inbound";
            var style = $"{prefix}Style";
            var flight = ExtractFlight(outbound, flights);

            if (flight != null)
            {
                foreach (var field in GetFlightProperties())
                {
                    row[prefix + field.Name] = field.GetValue(flight, null);
                }

                row[style] = string.Empty;
            }
            else
            {
                row[style] = HiddenStyle;
            }
        }

        private Flight ExtractFlight(bool outbound, IEnumerable<Flight> flights)
        {
            if (flights != null)
            {
                var flightsEnumerated = flights.ToList();

                if (!flightsEnumerated.Any())
                {
                    return null;
                }

                return flightsEnumerated.FirstOrDefault(flight => flight.IsOutboundDirection == outbound);
            }

            return null;
        }

        private IEnumerable<System.Reflection.PropertyInfo> GetFlightProperties()
        {
            return typeof(Flight).GetProperties();
        }
    }
}