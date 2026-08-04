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
    public class AccommodationVirtualResortComputedFieldTests
    {
        private readonly AccommodationVirtualResortComputedField computedField;
        private readonly ICustomCacheRepository cache;

        public AccommodationVirtualResortComputedFieldTests()
        {
            cache = Substitute.For<ICustomCacheRepository>();
            computedField = new AccommodationVirtualResortComputedField(cache);
        }

        [Theory]
        [AutoData]
        public void ComputeField_ShouldReturnCachedResult_WhenResultCacheHasData(CachedVirtualResorts cachedItem)
        {
            // Arrange
            cachedItem.IsCached = true;
            cache.GetItem<CachedVirtualResorts>(Arg.Any<string>()).Returns(cachedItem);

            // Region -> Resort -> Accommodation item tree structure.
            var accommodationItem = new FakeItem();
            var resortItem = new FakeItem();
            var regionItem = new FakeItem();
            regionItem.WithChild(resortItem);
            resortItem.WithChild(accommodationItem);

            // Act
            var actual = JsonConvert.DeserializeObject<IEnumerable<VirtualResort>>(
                computedField.ComputeField(new SitecoreIndexableItem(accommodationItem)) as string);

            // Assert
            actual.Should().NotBeNull();
            actual.Should().HaveCount(cachedItem.VirtualResorts.Count());
        }

        [Fact]
        public void ComputeField_ShouldReturnNull_WhenParentIsVirtualRegion()
        {
            // Arrange
            // Region -> Resort -> Accommodation item tree structure.
            var accommodationItem = new FakeItem();
            var resortItem = new FakeItem();
            var regionItem = new FakeItem().WithTemplate(Constants.TemplateIds.VirtualRegion);
            regionItem.WithChild(resortItem);
            resortItem.WithChild(accommodationItem);

            // Act
            var actual = computedField.ComputeField(new SitecoreIndexableItem(accommodationItem));

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [AutoData]
        public void ComputeField_ShouldReturnMatchingVirtualResorts_WhenCodeMatches(CachedVirtualResortsItem cachedItem)
        {
            // Arrange
            cachedItem.IsCached = true;
            cache.GetItem<CachedVirtualResortsItem>(Arg.Any<string>()).Returns(cachedItem);
            string resortCode = cachedItem.VirtualResorts.First().RelatedResorts[0];

            // Region -> Resort -> Accommodation item tree structure.
            var accommodationItem = new FakeItem();
            var resortItem = new FakeItem().WithField(Constants.Fields.DatasourceItem.Code, resortCode);
            var regionItem = new FakeItem();
            regionItem.WithChild(resortItem);
            resortItem.WithChild(accommodationItem);

            // Act
            var actual = JsonConvert.DeserializeObject<IEnumerable<VirtualResort>>(
                computedField.ComputeField(new SitecoreIndexableItem(accommodationItem)) as string);

            // Assert
            actual.Should().NotBeNull();
            actual.Should().HaveCount(1);
        }

        [Fact]
        public void ComputeField_ShouldReturnNull_WhenCodeDoesNotMatch()
        {
            // Arrange
            var cachedItem = new CachedVirtualResortsItem
            {
                IsCached = true,
                VirtualResorts = new List<VirtualResortItem>
                {
                    new VirtualResortItem { Code = "VR1", Name = "VR 1", RelatedResorts = new[] { "RES1" } }
                }
            };
            cache.GetItem<CachedVirtualResortsItem>(Arg.Any<string>()).Returns(cachedItem);

            // Region -> Resort -> Accommodation item tree structure.
            var accommodationItem = new FakeItem();
            var resortItem = new FakeItem().WithField(Constants.Fields.DatasourceItem.Code, "RES_OTHER");
            var regionItem = new FakeItem();
            regionItem.WithChild(resortItem);
            resortItem.WithChild(accommodationItem);

            // Act
            var actual = computedField.ComputeField(new SitecoreIndexableItem(accommodationItem));

            // Assert
            actual.Should().BeNull();
        }

        [Fact]
        public void ComputeField_ShouldReturnOnlyMatching_WhenMultipleVirtualResortsExist()
        {
            // Arrange
            var cachedItem = new CachedVirtualResortsItem
            {
                IsCached = true,
                VirtualResorts = new List<VirtualResortItem>
                {
                    new VirtualResortItem { Code = "VR1", Name = "Matching", RelatedResorts = new[] { "RES1" } },
                    new VirtualResortItem { Code = "VR2", Name = "Not Matching", RelatedResorts = new[] { "RES_OTHER" } },
                    new VirtualResortItem { Code = "VR3", Name = "Also Matching", RelatedResorts = new[] { "RES1", "RES2" } },
                }
            };
            cache.GetItem<CachedVirtualResortsItem>(Arg.Any<string>()).Returns(cachedItem);

            // Region -> Resort -> Accommodation item tree structure.
            var accommodationItem = new FakeItem();
            var resortItem = new FakeItem().WithField(Constants.Fields.DatasourceItem.Code, "RES1");
            var regionItem = new FakeItem();
            regionItem.WithChild(resortItem);
            resortItem.WithChild(accommodationItem);

            // Act
            var actual = JsonConvert.DeserializeObject<List<VirtualResort>>(
                computedField.ComputeField(new SitecoreIndexableItem(accommodationItem)) as string);

            // Assert
            actual.Should().HaveCount(2);
            actual.Select(x => x.Code).Should().BeEquivalentTo("VR1", "VR3");
        }

        [Fact]
        public void ComputeField_ShouldReturnNull_WhenIntermediateCacheHasEmptyList()
        {
            // Arrange
            var cachedItem = new CachedVirtualResortsItem
            {
                IsCached = true,
                VirtualResorts = new List<VirtualResortItem>()
            };
            cache.GetItem<CachedVirtualResortsItem>(Arg.Any<string>()).Returns(cachedItem);

            // Region -> Resort -> Accommodation item tree structure.
            var accommodationItem = new FakeItem();
            var resortItem = new FakeItem().WithField(Constants.Fields.DatasourceItem.Code, "RES1");
            var regionItem = new FakeItem();
            regionItem.WithChild(resortItem);
            resortItem.WithChild(accommodationItem);

            // Act
            var actual = computedField.ComputeField(new SitecoreIndexableItem(accommodationItem));

            // Assert
            actual.Should().BeNull();
        }

        [Fact]
        public void ComputeField_ShouldStoreResultInCache_WhenNotCached()
        {
            // Arrange
            var cachedItem = new CachedVirtualResortsItem
            {
                IsCached = true,
                VirtualResorts = new List<VirtualResortItem>
                {
                    new VirtualResortItem { Code = "VR1", Name = "VR 1", RelatedResorts = new[] { "RES1" } }
                }
            };
            cache.GetItem<CachedVirtualResortsItem>(Arg.Any<string>()).Returns(cachedItem);

            // Region -> Resort -> Accommodation item tree structure.
            var accommodationItem = new FakeItem();
            var resortItem = new FakeItem().WithField(Constants.Fields.DatasourceItem.Code, "RES1");
            var regionItem = new FakeItem();
            regionItem.WithChild(resortItem);
            resortItem.WithChild(accommodationItem);

            // Act
            computedField.ComputeField(new SitecoreIndexableItem(accommodationItem));

            // Assert
            cache.Received(1).StoreItem(
                Arg.Is<string>(k => k.StartsWith("virtual-resorts-results-")),
                Arg.Any<CachedVirtualResorts>(),
                Arg.Any<int>());
        }

        [Fact]
        public void Constructor_ShouldCreateDefaultCacheRepository()
        {
            // Act
            var field = new AccommodationVirtualResortComputedField();

            // Assert
            field.Should().NotBeNull();
        }

        [Fact]
        public void ComputeField_ShouldCacheVirtualResortChildren()
        {
            // Arrange
            var virtualResortsCache = new CachedVirtualResortsItem
            {
                IsCached = true,
                VirtualResorts = new List<VirtualResortItem>
                {
                    new VirtualResortItem
                    {
                        Code = "VR1",
                        Name = "Virtual Resort 1",
                        RelatedResorts = new[] { "RES1" }
                    }
                }
            };

            cache.GetItem<CachedVirtualResortsItem>(Arg.Any<string>()).Returns(virtualResortsCache);
            cache.GetItem<CachedVirtualResorts>(Arg.Any<string>()).Returns((CachedVirtualResorts)null);

            var accommodationItem = new FakeItem();
            var resortItem = new FakeItem().WithField(Constants.Fields.DatasourceItem.Code, "RES1");
            var regionItem = new FakeItem();
            regionItem.WithChild(resortItem);
            resortItem.WithChild(accommodationItem);

            // Act
            computedField.ComputeField(new SitecoreIndexableItem(accommodationItem));

            // Assert
            cache.Received(1).StoreItem(
                Arg.Is<string>(k => k.StartsWith("virtual-resorts-results-")),
                Arg.Any<CachedVirtualResorts>(),
                Arg.Any<int>());
        }

        [Fact]
        public void ComputeField_ShouldInvokeGetRelatedResorts_DuringMapping()
        {
            // Arrange
            var virtualResortsCache = new CachedVirtualResortsItem
            {
                IsCached = true,
                VirtualResorts = new List<VirtualResortItem>
                {
                    new VirtualResortItem
                    {
                        Code = "VR1",
                        Name = "Virtual Resort 1",
                        RelatedResorts = new[] { "RES1", "RES2" }
                    }
                }
            };

            cache.GetItem<CachedVirtualResortsItem>(Arg.Any<string>()).Returns(virtualResortsCache);
            cache.GetItem<CachedVirtualResorts>(Arg.Any<string>()).Returns((CachedVirtualResorts)null);

            var accommodationItem = new FakeItem();
            var resortItem = new FakeItem().WithField(Constants.Fields.DatasourceItem.Code, "RES1");
            var regionItem = new FakeItem();
            regionItem.WithChild(resortItem);
            resortItem.WithChild(accommodationItem);

            // Act
            var result = computedField.ComputeField(new SitecoreIndexableItem(accommodationItem));

            // Assert
            result.Should().NotBeNull();
            var deserialized = JsonConvert.DeserializeObject<IEnumerable<VirtualResort>>(result as string);
            deserialized.Should().HaveCount(1);
        }
    }
}