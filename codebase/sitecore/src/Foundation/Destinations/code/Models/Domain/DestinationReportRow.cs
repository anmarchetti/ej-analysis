using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class DestinationReportRow
    {
        public DestinationReportRow()
        {
        }

        public DestinationReportRow(Item destinationItem)
        {
            HotelCode = destinationItem[Constants.Fields.DatasourceItem.Code];
            GiataCode = destinationItem[Constants.Fields.AccommodationItem.GiataCode];
            HotelName = destinationItem[Constants.Fields.DatasourceItem.Name];
        }

        public string HotelCode { get; set; }

        public string GiataCode { get; set; }

        public string HotelName { get; set; }
    }
}