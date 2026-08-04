using System;
using System.Linq;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Sites;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Services
{
    public class OfferFiltersServiceTests
    {
        private readonly IHtmlCacheRepository cache;
        private readonly IDatabaseProvider databaseProvider;
        private readonly OfferFiltersService service;

        public OfferFiltersServiceTests()
        {
            cache = Substitute.For<IHtmlCacheRepository>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            service = new OfferFiltersService(databaseProvider, cache);
        }

        [Fact]
        public void GetOfferFilters_ShouldReturnOfferFiltersFromDataFolder()
        {
            // Arrange
            cache.GetOrAdd(Arg.Any<string>(), Arg.Any<Func<OfferFilters>>())
                .Returns(x => x.ArgAt<Func<OfferFilters>>(1).Invoke());

            var firstFilter = new FakeItem().WithTemplate(Constants.TemplateIds.OfferFilterTemplate)
                .WithField(Constants.Fields.OfferFilterItem.Name, "First name")
                .WithField(Constants.Fields.OfferFilterItem.Code, "FIRST")
                .WithField(Constants.Fields.OfferFilterItem.Enabled, Constants.Common.CheckboxTrueValue)
                .WithField(Constants.Fields.OfferFilterItem.Value, "first-value");

            var secondFilter = new FakeItem().WithTemplate(Constants.TemplateIds.OfferFilterTemplate)
                .WithField(Constants.Fields.OfferFilterItem.Name, "Second name")
                .WithField(Constants.Fields.OfferFilterItem.Code, "SECOND")
                .WithField(Constants.Fields.OfferFilterItem.Enabled, Constants.Common.CheckboxFalseValue)
                .WithField(Constants.Fields.OfferFilterItem.Value, "second-value");

            var offerFiltersFolder = new FakeItem().WithTemplate(Constants.TemplateIds.OfferFiltersFolder)
                .WithChild(firstFilter)
                .WithChild(secondFilter);

            databaseProvider.SelectSingleItem(Arg.Any<string>()).Returns(offerFiltersFolder);

            using (new FakeSiteContextSwitcher(CreateSiteContext()))
            {
                // Act
                var actual = service.GetOfferFilters();
                var filters = actual.Filters.ToArray();

                // Assert
                filters.Should().HaveCount(2);
                filters[0].Name.Should().Be("First name");
                filters[0].Code.Should().Be("FIRST");
                filters[0].Enabled.Should().BeTrue();
                filters[0].Value.Should().Be("first-value");
                filters[1].Name.Should().Be("Second name");
                filters[1].Code.Should().Be("SECOND");
                filters[1].Enabled.Should().BeFalse();
                filters[1].Value.Should().Be("second-value");
            }

            cache.Received(1).GetOrAdd("Desinations.Cache.OfferFilters", Arg.Any<Func<OfferFilters>>());
        }

        [Fact]
        public void GetOfferFiltersReorderingConfiguration_ShouldMapConfigurationAndSelectedFilters1()
        {
            // Arrange
            var firstFilter = new FakeItem().WithTemplate(Constants.TemplateIds.OfferFilterReordering)
                .WithField("Code", "HOTEL_THEME")
                .WithField("Title", "Hotel Theme");

            var secondFilter = new FakeItem().WithTemplate(Constants.TemplateIds.OfferFilterReordering)
                .WithField("Code", "BOARD")
                .WithField("Title", "Board Type");

            var configuration = new FakeItem().WithTemplate(Constants.TemplateIds.OfferFilterReorderingConfiguration)
                .WithField("EnableFiltersOrdering", "1")
                .WithField("ExperienceId", "exp-123")
                .WithField("SelectedFilters", $"{firstFilter.ID}|{secondFilter.ID}")
                .WithChild(firstFilter)
                .WithChild(secondFilter)
                .ToSitecoreItem();

            databaseProvider.SelectSingleItem(Arg.Any<string>()).Returns(configuration);

            using (new FakeSiteContextSwitcher(CreateSiteContext()))
            using (new DatabaseSwitcher(configuration.Database))
            {
                // Act
                var actual = service.GetOfferFiltersReorderingConfiguration();
                var filters = actual.Filters.ToArray();

                // Assert
                actual.IsEnabled.Should().BeTrue();
                actual.ExperienceId.Should().Be("exp-123");
            }
        }

        [Fact]
        public void GetOfferFiltersReorderingConfiguration_ShouldReturnDisabledConfiguration_WhenConfigurationItemMissing()
        {
            // Arrange
            databaseProvider.SelectSingleItem(Arg.Any<string>()).Returns((Sitecore.Data.Items.Item)null);

            using (new FakeSiteContextSwitcher(CreateSiteContext()))
            {
                // Act
                var actual = service.GetOfferFiltersReorderingConfiguration();

                // Assert
                actual.IsEnabled.Should().BeFalse();
                actual.ExperienceId.Should().BeNull();
                actual.Filters.Should().BeNull();
            }
        }

        private static FakeSiteContext CreateSiteContext()
        {
            return new FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                {
                    { "name", "website" },
                    { "database", "master" },
                    { "rootPath", "/sitecore/content" }
                });
        }
    }
}
