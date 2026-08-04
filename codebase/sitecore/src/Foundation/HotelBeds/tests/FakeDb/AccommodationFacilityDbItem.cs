using easyJet.Foundation.Destinations;
using Sitecore.FakeDb;

namespace easyJet.Foundation.HotelBeds.Tests.FakeDb
{
    public class AccommodationFacilityDbItem : DbItem
    {
        public AccommodationFacilityDbItem(string name)
            : base(name)
        {
            Add(Destinations.Constants.Fields.BaseFacilityItem.FacilityType, string.Empty);
            Add(Destinations.Constants.Fields.BaseFacilityItem.Number, string.Empty);
            Add(Destinations.Constants.Fields.BaseFacilityItem.Order, string.Empty);
            Add(Destinations.Constants.Fields.BaseFacilityItem.IndYesOrNo, string.Empty);
            Add(Destinations.Constants.Fields.BaseFacilityItem.IndFee, string.Empty);
            Add(Destinations.Constants.Fields.BaseFacilityItem.IndLogic, string.Empty);
            Add(Destinations.Constants.Fields.BaseFacilityItem.Voucher, string.Empty);
            Add(Destinations.Constants.Fields.AccommodationFacilityItem.Distance, string.Empty);
            Add(Destinations.Constants.Fields.AccommodationFacilityItem.AgeFrom, string.Empty);
            Add(Destinations.Constants.Fields.AccommodationFacilityItem.AgeTo, string.Empty);
            Add(Destinations.Constants.Fields.AccommodationFacilityItem.TextValue, string.Empty);
            Add(Destinations.Constants.Fields.AccommodationFacilityItem.DateFrom, string.Empty);
            Add(Destinations.Constants.Fields.AccommodationFacilityItem.DateTo, string.Empty);
            Add(Destinations.Constants.Fields.AccommodationFacilityItem.TimeFrom, string.Empty);
            Add(Destinations.Constants.Fields.AccommodationFacilityItem.TimeTo, string.Empty);
            Add(Destinations.Constants.Fields.BaseFacilityItem.Currency, string.Empty);
            Add(Destinations.Constants.Fields.BaseFacilityItem.ApplicationType, string.Empty);
            Add(Destinations.Constants.Fields.BaseAppearance.ShowOnSite, string.Empty);
        }
    }
}
