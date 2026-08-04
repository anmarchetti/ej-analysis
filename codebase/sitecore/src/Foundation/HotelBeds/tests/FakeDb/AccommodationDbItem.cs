using easyJet.Foundation.Destinations;
using Sitecore.FakeDb;

namespace easyJet.Foundation.HotelBeds.Tests.FakeDb
{
    public class AccommodationDbItem : DbItem
    {
        public AccommodationDbItem(string name)
            : base(name)
        {
            TemplateID = Destinations.Constants.TemplateIds.Accommodation;
            Add(Destinations.Constants.Fields.AccommodationItem.Description, string.Empty);
            Add(Destinations.Constants.Fields.AccommodationItem.StarRating, string.Empty);
            Add(Destinations.Constants.Fields.AccommodationItem.Latitude, string.Empty);
            Add(Destinations.Constants.Fields.AccommodationItem.Longitude, string.Empty);
            Add(Destinations.Constants.Fields.AccommodationItem.Address, string.Empty);
            Add(Destinations.Constants.Fields.AccommodationItem.City, string.Empty);
            Add(Destinations.Constants.Fields.AccommodationItem.PostalCode, string.Empty);
            Add(Destinations.Constants.Fields.AccommodationItem.Website, string.Empty);
            Add(Destinations.Constants.Fields.AccommodationItem.Email, string.Empty);
            Add(Destinations.Constants.Fields.AccommodationItem.BookingPhone, string.Empty);
            Add(Destinations.Constants.Fields.AccommodationItem.ManagementPhone, string.Empty);
            Add(Destinations.Constants.Fields.AccommodationItem.HotelPhone, string.Empty);
            Add(Destinations.Constants.Fields.AccommodationItem.FaxNumber, string.Empty);
            Add(Destinations.Constants.Fields.AccommodationItem.GiataCode, string.Empty);
        }
    }
}
