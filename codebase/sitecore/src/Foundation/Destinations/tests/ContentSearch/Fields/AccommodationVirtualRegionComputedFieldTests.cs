using System.Collections.Generic;
using System.Linq;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.ContentSearch.Fields;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using FluentAssertions;
using Newtonsoft.Json;
using NSubstitute;
using Sitecore.ContentSearch;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentSearch.Fields
{
    public class AccommodationVirtualRegionComputedFieldTests
    {
        private readonly AccommodationVirtualRegionComputedField computedField;
        private readonly ICustomCacheRepository cache;

        public AccommodationVirtualRegionComputedFieldTests()
        {
            cache = Substitute.For<ICustomCacheRepository>();
            computedField = new AccommodationVirtualRegionComputedField(cache);
        }

        [Theory]
        [AutoData]
        public void ComputeField_ShouldReturnCachedCodes_IfCacheHasResult(CachedVirtualRegions cachedItem)
        {
            // Arrange
            cachedItem.IsCached = true;
            cache.GetItem<CachedVirtualRegions>(Arg.Any<string>()).Returns(cachedItem);

            // Region -> Resort -> Accommdation item tree sturcture.
            var accommodationItem = new FakeItem();
            var resortItem = new FakeItem();
            var regionItem = new FakeItem();
            regionItem.WithChild(resortItem);
            resortItem.WithChild(accommodationItem);

            // Act
            var actual = JsonConvert.DeserializeObject<IEnumerable<VirtualRegion>>(computedField.ComputeField(new SitecoreIndexableItem(accommodationItem)) as string);

            // Assert
            actual.Should().NotBeNull();
            actual.Should().HaveCount(cachedItem.VirtualRegionsCodes.Count());
        }

        [Fact]
        public void ComputeField_ShouldBeNull_IfParentIsVirtualCountry()
        {
            // Arrange
            // Region -> Resort -> Accommdation item tree sturcture.
            var accommodationItem = new FakeItem();
            var resortItem = new FakeItem();
            var regionItem = new FakeItem();
            var countryItem = new FakeItem().WithTemplate(Constants.TemplateIds.VirtualCountry);
            countryItem.WithChild(regionItem);
            regionItem.WithChild(resortItem);
            resortItem.WithChild(accommodationItem);

            // Act
            var actual = computedField.ComputeField(new SitecoreIndexableItem(accommodationItem));

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [AutoData]
        public void ComputeField_ShouldReturnAllVirtualRegionsFromCache_IfCountyIsNotVirtualCountry(CachedVirtualRegionsItem cachedItem)
        {
            // Arrange
            cachedItem.IsCached = true;
            cache.GetItem<CachedVirtualRegionsItem>(Arg.Any<string>()).Returns(cachedItem);
            string regionCode = cachedItem.VirtualRegions.First().RelatedRegion[0];

            // Region -> Resort -> Accommdation item tree sturcture.
            var accommodationItem = new FakeItem();
            var resortItem = new FakeItem();
            var regionItem = new FakeItem().WithField(Constants.Fields.DatasourceItem.Code, regionCode);
            var countryItem = new FakeItem();
            countryItem.WithChild(regionItem);
            regionItem.WithChild(resortItem);
            resortItem.WithChild(accommodationItem);

            // Act
            var actual = JsonConvert.DeserializeObject<IEnumerable<VirtualRegion>>(computedField.ComputeField(new SitecoreIndexableItem(accommodationItem)) as string);

            // Assert
            actual.Should().NotBeNull();
            actual.Should().HaveCount(1);
        }
    }
}
