using easyJet.Foundation.Destinations.ContentSearch.Settings;
using easyjet.Foundation.Testing.Attributes;
using FluentAssertions;
using Sitecore.Configuration;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentSearch.Settings
{
    public class SearchSettingsTests
    {
        [Theory]
        [AutoDbData]
        public void Ctor_FieldShouldBeEqualToExpectedValue(Db db, string expectedIndexName)
        {
            // Arrange
            using (new SettingsSwitcher("ContentSearch.Destinations.IndexName", expectedIndexName))
            {
                // Act
                var actual = new DestinationSearchSettings();

                // Assert
                actual.DefaultIndexName.Should().BeEquivalentTo($"sitecore_{db.Database.Name}_index");
                actual.IndexName.Should().BeEquivalentTo(expectedIndexName);
            }
        }
    }
}
