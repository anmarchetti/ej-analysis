using System.Reflection;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.Gutters;
using FluentAssertions;
using Sitecore.Configuration;
using Sitecore.Data;
using Sitecore.FakeDb;
using Sitecore.Shell.Applications.ContentEditor.Gutters;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Gutters
{
    public class DestinationsGutterTests
    {
        [Theory]
        [AutoData]
        public void GetIconDescriptor_ShouldReturnIconDescriptorWithIcon_IfDestinationContainsPageComponentsFolder(Db db, string icon)
        {
            // Assert
            var destinationDbItem = new DbItem("Destination", ID.NewID, Constants.TemplateIds.Country);
            var pageComponetnsFolderDbItem = new DbItem("Page componetns", ID.NewID, Constants.TemplateIds.PageComponentsFolder);
            destinationDbItem.Add(pageComponetnsFolderDbItem);
            db.Add(destinationDbItem);

            using (new SettingsSwitcher("Destinations.RecentlyAddedDestinationIcon", icon))
            {
                var gutter = new DestinationsGutter();

                // Act
                var result = gutter.GetType().GetMethod("GetIconDescriptor", BindingFlags.NonPublic | BindingFlags.Instance).Invoke(gutter, new object[] { db.GetItem(destinationDbItem.ID) }) as GutterIconDescriptor;

                // Assert
                result.Icon.Should().Be(icon);
            }
        }

        [Theory]
        [AutoData]
        public void GetIconDescriptor_ShouldReturnDefaultIconDescriptor_IfHotelPageComponetnsFolderContainsAnyItems(Db db, string icon)
        {
            // Assert
            var destinationDbItem = new DbItem("Destination", ID.NewID, Constants.TemplateIds.Accommodation);
            var pageComponetnsFolderDbItem = new DbItem("Page componetns", ID.NewID, Constants.TemplateIds.PageComponentsFolder);
            pageComponetnsFolderDbItem.Children.Add(new DbItem("Item 1"));
            destinationDbItem.Add(pageComponetnsFolderDbItem);
            db.Add(destinationDbItem);

            using (new SettingsSwitcher("Destinations.RecentlyAddedDestinationIcon", icon))
            {
                var gutter = new DestinationsGutter();

                // Act
                var result = (gutter.GetType().GetMethod("GetIconDescriptor", BindingFlags.NonPublic | BindingFlags.Instance).Invoke(gutter, new object[] { db.GetItem(destinationDbItem.ID) }) as GutterIconDescriptor)?.Icon;

                // Assert
                result.Should().NotBeNull();
            }
        }
    }
}
