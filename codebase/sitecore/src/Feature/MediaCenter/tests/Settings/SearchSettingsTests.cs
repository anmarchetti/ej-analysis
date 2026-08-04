using AutoFixture.Xunit2;
using easyJet.Feature.MediaCenter.ContentSearch.Settings;
using FluentAssertions;
using Sitecore.Configuration;
using Sitecore.FakeDb.Sites;
using Sitecore.Sites;
using Xunit;

namespace easyJet.Feature.MediaCenter.Tests.Settings
{
    public class SearchSettingsTests
    {
        [Theory]
        [AutoData]
        public void SearchSettingsConstructor_ShouldSetIndexNames_IfDatabaseExist(string indexName)
        {
            // Arrange
            var databaseName = "master";

            var fakeContext = new FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                {
                    { "name", "website" }, { "database", databaseName }
                });

            // Act
            using (new SiteContextSwitcher(fakeContext))
            using (new SettingsSwitcher("ContentSearch.Articles.IndexName", indexName))
            {
                var actual = new SearchSettings();

                // Assert
                actual.IndexName.Should().BeEquivalentTo(string.Format(indexName, databaseName));
                actual.DefaultIndexName.Should().BeEquivalentTo($"sitecore_{databaseName}_index");
            }
        }
    }
}
