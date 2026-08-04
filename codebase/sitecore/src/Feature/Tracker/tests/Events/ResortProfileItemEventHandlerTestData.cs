using System.Collections.Generic;
using Sitecore.Data;
using Sitecore.Data.Events;
using Sitecore.NSubstituteUtils;

namespace easyJet.Feature.Tracker.Tests.Events
{
    public class ResortProfileItemEventHandlerTestData
    {
        public static IEnumerable<object[]> ValidItems()
        {
            var fakeMasterDB = FakeUtil.FakeDatabase("master");

            // Resort + RegionPage
            var resortUnderRegion = new FakeItem(database: fakeMasterDB);
            resortUnderRegion.WithTemplate(Foundation.Destinations.Constants.TemplateIds.Resort);
            resortUnderRegion.WithParent(new FakeItem().WithTemplate(Foundation.Destinations.Constants.TemplateIds.RegionPage));
            yield return new object[] { new ItemCreatedEventArgs(resortUnderRegion.ToSitecoreItem()) };

            // Resort + RegionCityPage
            var resortUnderCityRegion = new FakeItem(database: fakeMasterDB);
            resortUnderCityRegion.WithTemplate(Foundation.Destinations.Constants.TemplateIds.Resort);
            resortUnderCityRegion.WithParent(new FakeItem().WithTemplate(Foundation.Destinations.Constants.TemplateIds.RegionCityPage));
            yield return new object[] { new ItemCreatedEventArgs(resortUnderCityRegion.ToSitecoreItem()) };

            // Resort + VirtualRegion
            var resortUnderVirtualRegion = new FakeItem(database: fakeMasterDB);
            resortUnderVirtualRegion.WithTemplate(Foundation.Destinations.Constants.TemplateIds.Resort);
            resortUnderVirtualRegion.WithParent(new FakeItem().WithTemplate(Foundation.Destinations.Constants.TemplateIds.VirtualRegion));
            yield return new object[] { new ItemCreatedEventArgs(resortUnderVirtualRegion.ToSitecoreItem()) };

            // VirtualResort + RegionPage
            var virtualResortUnderRegion = new FakeItem(database: fakeMasterDB);
            virtualResortUnderRegion.WithTemplate(Foundation.Destinations.Constants.TemplateIds.VirtualResort);
            virtualResortUnderRegion.WithParent(new FakeItem().WithTemplate(Foundation.Destinations.Constants.TemplateIds.RegionPage));
            yield return new object[] { new ItemCreatedEventArgs(virtualResortUnderRegion.ToSitecoreItem()) };

            // VirtualResort + RegionCityPage
            var virtualResortUnderCityRegion = new FakeItem(database: fakeMasterDB);
            virtualResortUnderCityRegion.WithTemplate(Foundation.Destinations.Constants.TemplateIds.VirtualResort);
            virtualResortUnderCityRegion.WithParent(new FakeItem().WithTemplate(Foundation.Destinations.Constants.TemplateIds.RegionCityPage));
            yield return new object[] { new ItemCreatedEventArgs(virtualResortUnderCityRegion.ToSitecoreItem()) };

            // VirtualResort + VirtualRegion
            var virtualResortUnderVirtualRegion = new FakeItem(database: fakeMasterDB);
            virtualResortUnderVirtualRegion.WithTemplate(Foundation.Destinations.Constants.TemplateIds.VirtualResort);
            virtualResortUnderVirtualRegion.WithParent(new FakeItem().WithTemplate(Foundation.Destinations.Constants.TemplateIds.VirtualRegion));
            yield return new object[] { new ItemCreatedEventArgs(virtualResortUnderVirtualRegion.ToSitecoreItem()) };
        }

        public static IEnumerable<object[]> InvalidItems()
        {
            var fakeMasterDB = FakeUtil.FakeDatabase("master");

            // Wrong database
            var fakeWebDB = FakeUtil.FakeDatabase("web");
            var resortOnWebDb = new FakeItem(database: fakeWebDB);
            resortOnWebDb.WithTemplate(Foundation.Destinations.Constants.TemplateIds.Resort);
            resortOnWebDb.WithParent(new FakeItem().WithTemplate(Foundation.Destinations.Constants.TemplateIds.RegionPage));
            yield return new object[] { new ItemCreatedEventArgs(resortOnWebDb.ToSitecoreItem()) };

            // Wrong template (Hotel instead of Resort)
            var hotelItem = new FakeItem(database: fakeMasterDB);
            hotelItem.WithTemplate(Foundation.Destinations.Constants.TemplateIds.Accommodation);
            hotelItem.WithParent(new FakeItem().WithTemplate(Foundation.Destinations.Constants.TemplateIds.RegionPage));
            yield return new object[] { new ItemCreatedEventArgs(hotelItem.ToSitecoreItem()) };

            // Wrong parent template (Country instead of Region)
            var resortUnderCountry = new FakeItem(database: fakeMasterDB);
            resortUnderCountry.WithTemplate(Foundation.Destinations.Constants.TemplateIds.Resort);
            resortUnderCountry.WithParent(new FakeItem().WithTemplate(Foundation.Destinations.Constants.TemplateIds.Country));
            yield return new object[] { new ItemCreatedEventArgs(resortUnderCountry.ToSitecoreItem()) };

            // Unrelated template + unrelated parent
            var randomItem = new FakeItem(database: fakeMasterDB);
            randomItem.WithTemplate(ID.NewID);
            randomItem.WithParent(new FakeItem().WithTemplate(ID.NewID));
            yield return new object[] { new ItemCreatedEventArgs(randomItem.ToSitecoreItem()) };
        }
    }
}