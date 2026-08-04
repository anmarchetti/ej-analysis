using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using FluentAssertions;
using System.Collections.ObjectModel;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests;

public class PromotionCollectionsTests
{
    [Fact]
    public void EnrichOfferWithCollectionsKeys_WhenChildrenIsNull_ReturnsNull()
    {
        // Arrange
        var promotionCollections = new PromotionCollections
        {
            Promotions = null
        };
        var offer = new Offer
        {
            Accom = new Accom
            {
                Prom = "PROMO123"
            }
        };

        // Act
        var result = promotionCollections.EnrichOfferWithCollectionsKeys(offer);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public void EnrichOfferWithCollectionsKeys_WhenChildrenIsEmpty_ReturnsNull()
    {
        // Arrange
        var promotionCollections = new PromotionCollections
        {
            Promotions = new ReadOnlyCollection<KeyedPromotion>(Enumerable.Empty<KeyedPromotion>().ToList())
        };
        var offer = new Offer
        {
            Accom = new Accom
            {
                Prom = "PROMO123"
            }
        };

        // Act
        var result = promotionCollections.EnrichOfferWithCollectionsKeys(offer);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public void EnrichOfferWithCollectionsKeys_WhenMatchingPromotions_ReturnsKeys()
    {
        // Arrange
        var promotionCollections = new PromotionCollections
        {
            Promotions = new ReadOnlyCollection<KeyedPromotion>(new List<KeyedPromotion> { new KeyedPromotion("Collection1", "PROMO123,PROMO456", "0", "Promotion 1", "Tooltip 1", "icon1", "Tracking Promotion 1") })
        };
        var offer = new Offer
        {
            Accom = new Accom
            {
                Prom = "PROMO123"
            }
        };

        // Act
        var result = promotionCollections.EnrichOfferWithCollectionsKeys(offer);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(1);
        result.Should().Contain("Collection1");
    }

    [Fact]
    public void EnrichOfferWithCollectionsKeys_WhenMultipleMatchingPromotions_ReturnsAllKeys()
    {
        // Arrange
        var promotionCollections = new PromotionCollections
        {
            Promotions = new ReadOnlyCollection<KeyedPromotion>(
                new List<KeyedPromotion> 
                {
                    new KeyedPromotion("Collection1", "PROMO123,PROMO456", "0", "Promotion 1", "Tooltip 1", "icon1", "Tracking Promotion 1"),
                    new KeyedPromotion("Collection2", "PROMO123,PROMO789", "1", "Promotion 2", "Tooltip 2", "icon2", "Tracking Promotion 2")
                })
        };
        var offer = new Offer
        {
            Accom = new Accom
            {
                Prom = "PROMO123"
            }
        };

        // Act
        var result = promotionCollections.EnrichOfferWithCollectionsKeys(offer);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(2);
        result.Should().Contain(new[] { "Collection1", "Collection2" });
    }

    [Fact]
    public void EnrichOfferWithCollectionsKeys_WhenNoMatchingPromotions_ReturnsNull()
    {
        // Arrange
        var promotionCollections = new PromotionCollections
        {
            Promotions = new ReadOnlyCollection<KeyedPromotion>(
                new List<KeyedPromotion> 
                {
                    new KeyedPromotion("Collection1", "PROMO123,PROMO456", "0", "Promotion 1", "Tooltip 1", "icon1", "Tracking Promotion 1"),
                    new KeyedPromotion("Collection2", "PROMO789,PROMO321", "1", "Promotion 2", "Tooltip 2", "icon2", "Tracking Promotion 2")
                })
        };
        var offer = new Offer
        {
            Accom = new Accom
            {
                Prom = "NOMATCH"
            }
        };

        // Act
        var result = promotionCollections.EnrichOfferWithCollectionsKeys(offer);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public void GetShowNewLabel_WhenValueIsOne_ReturnsTrue()
    {
        // Arrange
        var promotion = new KeyedPromotion("Key1", "PROMO123", "1", "Title", "Tooltip", "Icon", "Title");

        // Act
        var result = promotion.GetShowNewLabel;

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public void GetShowNewLabel_WhenValueIsZero_ReturnsFalse()
    {
        // Arrange
        var promotion = new KeyedPromotion("Key1", "PROMO123", "0", "Title", "Tooltip", "Icon", "Title");

        // Act
        var result = promotion.GetShowNewLabel;

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public void GetShowNewLabel_WhenValueIsEmpty_ReturnsFalse()
    {
        // Arrange
        var promotion = new KeyedPromotion("Key1", "PROMO123", "", "Title", "Tooltip", "Icon", "Title");

        // Act
        var result = promotion.GetShowNewLabel;

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public void GetShowNewLabel_WhenValueIsNull_ReturnsFalse()
    {
        // Arrange
        var promotion = new KeyedPromotion("Key1", "PROMO123", null, "Title", "Tooltip", "Icon", "Title");

        // Act
        var result = promotion.GetShowNewLabel;

        // Assert
        result.Should().BeFalse();
    }
    
        [Fact]
    public void EnrichBookingResponseWithCollectionsKeys_WhenChildrenIsNull_ReturnsNull()
    {
        // Arrange
        var promotionCollections = new PromotionCollections
        {
            Promotions = null
        };
        var bookingResponse = new BookingResponse
        {
            Prom = "PROMO123"
        };

        // Act
        var result = promotionCollections.EnrichBookingResponseWithCollectionsKeys(bookingResponse);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public void EnrichBookingResponseWithCollectionsKeys_WhenChildrenIsEmpty_ReturnsNull()
    {
        // Arrange
        var promotionCollections = new PromotionCollections
        {
            Promotions = new ReadOnlyCollection<KeyedPromotion>(Enumerable.Empty<KeyedPromotion>().ToList())
        };
        var bookingResponse = new BookingResponse
        {
            Prom = "PROMO123"
        };

        // Act
        var result = promotionCollections.EnrichBookingResponseWithCollectionsKeys(bookingResponse);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public void EnrichBookingResponseWithCollectionsKeys_WhenMatchingPromotions_ReturnsKeys()
    {
        // Arrange
        var promotionCollections = new PromotionCollections
        {
            Promotions = new ReadOnlyCollection<KeyedPromotion>(new List<KeyedPromotion> { new KeyedPromotion("Collection1", "PROMO123,PROMO456", "0", "Promotion 1", "Tooltip 1", "icon1", "Tracking Promotion 1") })
        };
        var bookingResponse = new BookingResponse
        {
            Prom = "PROMO123"
        };

        // Act
        var result = promotionCollections.EnrichBookingResponseWithCollectionsKeys(bookingResponse);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(1);
        result.Should().Contain("Collection1");
    }

    [Fact]
    public void EnrichBookingResponseWithCollectionsKeys_WhenMultipleMatchingPromotions_ReturnsAllKeys()
    {
        // Arrange
        var promotionCollections = new PromotionCollections
        {
            Promotions = new ReadOnlyCollection<KeyedPromotion>(
                new List<KeyedPromotion> 
                {
                    new KeyedPromotion("Collection1", "PROMO123,PROMO456", "0", "Promotion 1", "Tooltip 1", "icon1", "Tracking Promotion 1"),
                    new KeyedPromotion("Collection2", "PROMO123,PROMO789", "1", "Promotion 2", "Tooltip 2", "icon2", "Tracking Promotion 2")
                })
        };
        var bookingResponse = new BookingResponse
        {
            Prom = "PROMO123"
        };

        // Act
        var result = promotionCollections.EnrichBookingResponseWithCollectionsKeys(bookingResponse);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(2);
        result.Should().Contain(new[] { "Collection1", "Collection2" });
    }

    [Fact]
    public void EnrichBookingResponseWithCollectionsKeys_WhenNoMatchingPromotions_ReturnsNull()
    {
        // Arrange
        var promotionCollections = new PromotionCollections
        {
            Promotions = new ReadOnlyCollection<KeyedPromotion>(
                new List<KeyedPromotion> 
                {
                    new KeyedPromotion("Collection1", "PROMO123,PROMO456", "0", "Promotion 1", "Tooltip 1", "icon1", "Tracking Promotion 1"),
                    new KeyedPromotion("Collection2", "PROMO789,PROMO321", "1", "Promotion 2", "Tooltip 2", "icon2", "Tracking Promotion 2")
                })
        };
        var bookingResponse = new BookingResponse
        {
            Prom = "NOMATCH"
        };

        // Act
        var result = promotionCollections.EnrichBookingResponseWithCollectionsKeys(bookingResponse);

        // Assert
        result.Should().BeNull();
    }
}