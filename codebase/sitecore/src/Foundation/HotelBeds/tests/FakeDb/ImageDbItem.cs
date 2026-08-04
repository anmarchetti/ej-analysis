using easyJet.Foundation.Destinations;
using Sitecore.FakeDb;

namespace easyJet.Foundation.HotelBeds.Tests.FakeDb
{
    public class ImageDbItem : DbItem
    {
        public ImageDbItem(string name)
            : base(name)
        {
            Add(Destinations.Constants.Fields.ExternalImageItem.Small, string.Empty);
            Add(Destinations.Constants.Fields.ExternalImageItem.Medium, string.Empty);
            Add(Destinations.Constants.Fields.ExternalImageItem.Large, string.Empty);
            Add(Destinations.Constants.Fields.DatasourceItem.Code, string.Empty);
            Add(Destinations.Constants.Fields.StandardFields.SortOrder, string.Empty);
        }
    }
}
