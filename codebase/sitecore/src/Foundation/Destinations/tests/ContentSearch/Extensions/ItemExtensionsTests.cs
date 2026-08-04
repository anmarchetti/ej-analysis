using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.ContentSearch.Extensions;
using FluentAssertions;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentSearch.Extensions
{
    public class ItemExtensionsTests
    {
        [Fact]
        public void IsDestinationItem_ShouldReturnFalse_WhenItemIsNull()
        {
            // Arrange
            Item item = null;

            // Act
            var result = item.IsDestinationItem();

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public void IsVirtualDestinationItem_ShouldReturnFalse_WhenItemIsNull()
        {
            // Arrange
            Item item = null;

            // Act
            var result = item.IsVirtualDestinationItem();

            // Assert
            result.Should().BeFalse();
        }

        [Theory]
        [AutoData]
        public void IsVirtualDestinationItem_ShouldReturnTrue_WhenItemIsVirtualCountry_WithDefaultFlags(Db db)
        {
            // Arrange
            var dbItem = new DbItem("VirtualCountry", ID.NewID, Constants.TemplateIds.VirtualCountry);
            db.Add(dbItem);

            // Act
            var result = db.GetItem(dbItem.ID).IsVirtualDestinationItem();

            // Assert
            result.Should().BeTrue();
        }

        [Theory]
        [AutoData]
        public void IsVirtualDestinationItem_ShouldReturnTrue_WhenItemIsVirtualRegion_WithDefaultFlags(Db db)
        {
            // Arrange
            var dbItem = new DbItem("VirtualRegion", ID.NewID, Constants.TemplateIds.VirtualRegion);
            db.Add(dbItem);

            // Act
            var result = db.GetItem(dbItem.ID).IsVirtualDestinationItem();

            // Assert
            result.Should().BeTrue();
        }

        [Theory]
        [AutoData]
        public void IsVirtualDestinationItem_ShouldReturnTrue_WhenItemIsVirtualResort_WithDefaultFlags(Db db)
        {
            // Arrange
            var dbItem = new DbItem("VirtualResort", ID.NewID, Constants.TemplateIds.VirtualResort);
            db.Add(dbItem);

            // Act
            var result = db.GetItem(dbItem.ID).IsVirtualDestinationItem();

            // Assert
            result.Should().BeTrue();
        }

        [Theory]
        [AutoData]
        public void IsVirtualDestinationItem_ShouldReturnFalse_WhenItemIsVirtualCountry_WithCountryExcluded(Db db)
        {
            // Arrange
            var dbItem = new DbItem("VirtualCountry", ID.NewID, Constants.TemplateIds.VirtualCountry);
            db.Add(dbItem);

            // Act
            var result = db.GetItem(dbItem.ID).IsVirtualDestinationItem(VirtualDestinationTypes.Region | VirtualDestinationTypes.Resort);

            // Assert
            result.Should().BeFalse();
        }

        [Theory]
        [AutoData]
        public void IsVirtualDestinationItem_ShouldReturnTrue_WhenItemIsVirtualRegion_WithCountryExcluded(Db db)
        {
            // Arrange
            var dbItem = new DbItem("VirtualRegion", ID.NewID, Constants.TemplateIds.VirtualRegion);
            db.Add(dbItem);

            // Act
            var result = db.GetItem(dbItem.ID).IsVirtualDestinationItem(VirtualDestinationTypes.Region | VirtualDestinationTypes.Resort);

            // Assert
            result.Should().BeTrue();
        }

        [Theory]
        [AutoData]
        public void IsVirtualDestinationItem_ShouldReturnTrue_WhenItemIsVirtualResort_WithCountryExcluded(Db db)
        {
            // Arrange
            var dbItem = new DbItem("VirtualResort", ID.NewID, Constants.TemplateIds.VirtualResort);
            db.Add(dbItem);

            // Act
            var result = db.GetItem(dbItem.ID).IsVirtualDestinationItem(VirtualDestinationTypes.Region | VirtualDestinationTypes.Resort);

            // Assert
            result.Should().BeTrue();
        }

        [Theory]
        [AutoData]
        public void IsVirtualDestinationItem_ShouldReturnTrue_WhenItemIsVirtualCountry_WithOnlyCountryFlag(Db db)
        {
            // Arrange
            var dbItem = new DbItem("VirtualCountry", ID.NewID, Constants.TemplateIds.VirtualCountry);
            db.Add(dbItem);

            // Act
            var result = db.GetItem(dbItem.ID).IsVirtualDestinationItem(VirtualDestinationTypes.Country);

            // Assert
            result.Should().BeTrue();
        }

        [Theory]
        [AutoData]
        public void IsVirtualDestinationItem_ShouldReturnFalse_WhenItemIsVirtualRegion_WithOnlyCountryFlag(Db db)
        {
            // Arrange
            var dbItem = new DbItem("VirtualRegion", ID.NewID, Constants.TemplateIds.VirtualRegion);
            db.Add(dbItem);

            // Act
            var result = db.GetItem(dbItem.ID).IsVirtualDestinationItem(VirtualDestinationTypes.Country);

            // Assert
            result.Should().BeFalse();
        }

        [Theory]
        [AutoData]
        public void IsVirtualDestinationItem_ShouldReturnTrue_WhenItemIsVirtualRegion_WithOnlyRegionFlag(Db db)
        {
            // Arrange
            var dbItem = new DbItem("VirtualRegion", ID.NewID, Constants.TemplateIds.VirtualRegion);
            db.Add(dbItem);

            // Act
            var result = db.GetItem(dbItem.ID).IsVirtualDestinationItem(VirtualDestinationTypes.Region);

            // Assert
            result.Should().BeTrue();
        }

        [Theory]
        [AutoData]
        public void IsVirtualDestinationItem_ShouldReturnTrue_WhenItemIsVirtualResort_WithOnlyResortFlag(Db db)
        {
            // Arrange
            var dbItem = new DbItem("VirtualResort", ID.NewID, Constants.TemplateIds.VirtualResort);
            db.Add(dbItem);

            // Act
            var result = db.GetItem(dbItem.ID).IsVirtualDestinationItem(VirtualDestinationTypes.Resort);

            // Assert
            result.Should().BeTrue();
        }

        [Theory]
        [AutoData]
        public void IsVirtualDestinationItem_ShouldReturnFalse_WhenItemIsVirtualResort_WithOnlyRegionFlag(Db db)
        {
            // Arrange
            var dbItem = new DbItem("VirtualResort", ID.NewID, Constants.TemplateIds.VirtualResort);
            db.Add(dbItem);

            // Act
            var result = db.GetItem(dbItem.ID).IsVirtualDestinationItem(VirtualDestinationTypes.Region);

            // Assert
            result.Should().BeFalse();
        }

        [Theory]
        [AutoData]
        public void IsVirtualDestinationItem_ShouldReturnTrue_WhenItemIsVirtualCountry_WithAllFlag(Db db)
        {
            // Arrange
            var dbItem = new DbItem("VirtualCountry", ID.NewID, Constants.TemplateIds.VirtualCountry);
            db.Add(dbItem);

            // Act
            var result = db.GetItem(dbItem.ID).IsVirtualDestinationItem(VirtualDestinationTypes.All);

            // Assert
            result.Should().BeTrue();
        }

        [Theory]
        [AutoData]
        public void IsVirtualDestinationItem_ShouldReturnFalse_WhenItemIsNotVirtualDestination(Db db)
        {
            // Arrange
            var dbItem = new DbItem("RegularItem", ID.NewID, ID.NewID);
            db.Add(dbItem);

            // Act
            var result = db.GetItem(dbItem.ID).IsVirtualDestinationItem();

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public void IsAccommodationChildItem_ShouldReturnFalse_WhenItemIsNull()
        {
            // Arrange
            Item item = null;

            // Act
            var result = item.IsAccommodationChildItem();

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public void IsHotelItem_ShouldReturnFalse_IfItemIsNull()
        {
            // Act
            var actual = ItemExtensions.IsHotelItem(null);

            // Assert
            actual.Should().BeFalse();
        }

        [Fact]
        public void IsHotelItem_ShouldReturnTrue_IfItemTemplateIsAccommodation()
        {
            // Arrange
            var item = new FakeItem()
                .WithTemplate(Constants.TemplateIds.Accommodation)
                .ToSitecoreItem();

            // Act
            var actual = item.IsHotelItem();

            // Assert
            actual.Should().BeTrue();
        }

        [Fact]
        public void IsHotelItem_ShouldReturnFalse_IfItemTemplateIsNotAccommodation()
        {
            // Arrange
            var item = new FakeItem()
                .WithTemplate(ID.NewID)
                .ToSitecoreItem();

            // Act
            var actual = item.IsHotelItem();

            // Assert
            actual.Should().BeFalse();
        }
    }
}