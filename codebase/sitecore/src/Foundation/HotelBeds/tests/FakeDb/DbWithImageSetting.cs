using Sitecore.FakeDb;

namespace easyJet.Foundation.HotelBeds.Tests.FakeDb
{
    public class DbWithImageSetting : Db
    {
        private const string Setting = "http://test_url.com";

        public DbWithImageSetting()
        {
            Configuration.Settings["HotelBeds.SyncDataService.SyncAccommodationImages"] = true.ToString();
            Configuration.Settings["HotelBeds.ImageSizePrefixUrl.Small"] = Setting;
            Configuration.Settings["HotelBeds.ImageSizePrefixUrl.Medium"] = Setting;
            Configuration.Settings["HotelBeds.ImageSizePrefixUrl.Large"] = Setting;
        }
    }
}
