using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Moq;
using Xunit;
using DiscountedService = easyJet.Holidays.External.AWS.Services.DiscountedOffer.HbgHotelDiscountsService;
using easyJet.Holidays.Api.Domain.Interfaces.DiscountedOffer;
using easyJet.Holidays.Api.Domain.Data.DynamoDB.DiscountedOffer;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.RoomVariants;
using System.Globalization;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;

namespace easyJet.Holidays.External.AWS.HBGHotelDiscountsSync.Tests.Services;

/// <summary>
/// Tests covering enrichment logic of discounted offer HbgHotelDiscountsService (DiscountedOffer namespace).
/// </summary>
public class HbgHotelDiscountsEnrichmentServiceTests
{
    private static Offer CreateOffer(string code, DateTime? date = null, byte? stay = null) => new()
    {
        Id = Guid.NewGuid().ToString(),
        Accom = new Accom { Code = code, Unit = new List<Unit>() }, // ensure Unit collection present (service checks for existing discounts)
        Date = date,
        Stay = stay,
        DiscountPercentage = null
    };

    private static HbgHotelDiscount CreateDiscount(string code, int discount, DateOnly from, DateOnly to) => new()
    {
        AccommodationCode = code,
        Discounts = new List<Discount>
        {
            new Discount
            {
                DiscountPercentage = discount,
                TravelWindowFrom = from.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                TravelWindowTo = to.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                GiataCode = 0,
                AccommodationName = string.Empty
            }
        }
    };

    [Fact]
    public void Constructor_Throws_ForNullRepository() =>
        Assert.Throws<ArgumentNullException>(() => new DiscountedService(null!));

    [Fact]
    public async Task EnrichOffersWithDiscounts_AppliesDiscounts_CaseInsensitiveMatch()
    {
        var travelDate = DateTime.UtcNow.Date;
        var stay = (byte)7;
        var offers = new List<Offer>
        {
            CreateOffer("ACC1", travelDate, stay),
            CreateOffer("acc2", travelDate, stay),
            CreateOffer("ACC3", travelDate, stay)
        };
        var derivedStart = DateOnly.FromDateTime(travelDate);
        var derivedEnd = derivedStart.AddDays(stay);
        var discounts = new List<HbgHotelDiscount>
        {
            // broader window still contains derived window
            CreateDiscount("acc1", 10, derivedStart.AddDays(-1), derivedEnd.AddDays(1)),
            CreateDiscount("ACC2", 20, derivedStart, derivedEnd),
            CreateDiscount("OTHER", 99, derivedStart, derivedEnd)
        };
        var repo = new Mock<IHbgHotelDiscountsRepository>();
        repo.Setup(r => r.GetAll()).ReturnsAsync(discounts);
        var service = new DiscountedService(repo.Object);

        await service.EnrichOffersWithDiscounts(offers);

        offers.Single(o => o.Accom.Code == "ACC1").DiscountPercentage.Should().Be(10);
        offers.Single(o => o.Accom.Code == "acc2").DiscountPercentage.Should().Be(20);
        offers.Single(o => o.Accom.Code == "ACC3").DiscountPercentage.Should().BeNull();
        repo.Verify(r => r.GetAll(), Times.Once);
    }

    [Fact]
    public async Task EnrichOffersWithDiscounts_IgnoresDiscount_WhenOutsideWindow()
    {
        var travelDate = DateTime.UtcNow.Date;
        var stay = (byte)7;
        var offers = new List<Offer> { CreateOffer("ACC1", travelDate, stay), CreateOffer("ACC2", travelDate, stay) };
        var start = DateOnly.FromDateTime(travelDate);
        var end = start.AddDays(stay);
        var discounts = new List<HbgHotelDiscount>
        {
            // end before search end -> should not match
            CreateDiscount("ACC1", 15, start, end.AddDays(-2)),
            // start after search start -> should not match
            CreateDiscount("ACC2", 25, start.AddDays(1), end)
        };
        var repo = new Mock<IHbgHotelDiscountsRepository>();
        repo.Setup(r => r.GetAll()).ReturnsAsync(discounts);
        var service = new DiscountedService(repo.Object);

        await service.EnrichOffersWithDiscounts(offers);
        offers.All(o => o.DiscountPercentage is null).Should().BeTrue();
    }

    [Fact]
    public async Task EnrichOffersWithDiscounts_AppliesDiscounts_WhenDatesWithinWindow()
    {
        var travelDate = DateTime.UtcNow.Date;
        var stay = (byte)5;
        var offers = new List<Offer>
        {
            CreateOffer("ACC1", travelDate, stay),
            CreateOffer("ACC2", travelDate, stay)
        };
        var start = DateOnly.FromDateTime(travelDate);
        var end = start.AddDays(stay);
        var discounts = new List<HbgHotelDiscount>
        {
            CreateDiscount("ACC1", 11, start, end),
            CreateDiscount("ACC2", 22, start.AddDays(-2), end.AddDays(2))
        };
        var repo = new Mock<IHbgHotelDiscountsRepository>();
        repo.Setup(r => r.GetAll()).ReturnsAsync(discounts);
        var service = new DiscountedService(repo.Object);

        await service.EnrichOffersWithDiscounts(offers);
        offers.Single(o => o.Accom.Code == "ACC1").DiscountPercentage.Should().Be(11);
        offers.Single(o => o.Accom.Code == "ACC2").DiscountPercentage.Should().Be(22);
    }

    [Fact]
    public async Task NoContext_SkipsOffersMissingDateOrStay()
    {
        var today = DateTime.UtcNow.Date;
        var offers = new List<Offer>
        {
            CreateOffer("ACC1", today, 7),
            CreateOffer("ACC2", null, 7), // missing date
            CreateOffer("ACC3", today, null) // missing stay
        };
        var start = DateOnly.FromDateTime(today);
        var end = start.AddDays(7);
        var discounts = new List<HbgHotelDiscount> { CreateDiscount("ACC1", 33, start, end) };
        var repo = new Mock<IHbgHotelDiscountsRepository>();
        repo.Setup(r => r.GetAll()).ReturnsAsync(discounts);
        var service = new DiscountedService(repo.Object);

        await service.EnrichOffersWithDiscounts(offers);
        offers.Single(o => o.Accom.Code == "ACC1").DiscountPercentage.Should().Be(33);
        offers.Single(o => o.Accom.Code == "ACC2").DiscountPercentage.Should().BeNull();
        offers.Single(o => o.Accom.Code == "ACC3").DiscountPercentage.Should().BeNull();
    }

    [Fact]
    public async Task OfferWithExistingAtcomDiscount_Skipped()
    {
        var today = DateTime.UtcNow.Date;
        var offers = new List<Offer>
        {
            CreateOffer("ACC1", today, 7),
            CreateOffer("ACC2", today, 7)
        };
        // simulate existing discount at unit level for ACC1
        offers[0].Accom.Unit.Add(new Unit { Code = "U1", Discount = 99 });
        var start = DateOnly.FromDateTime(today);
        var end = start.AddDays(7);
        var discounts = new List<HbgHotelDiscount>
        {
            CreateDiscount("ACC1", 10, start, end),
            CreateDiscount("ACC2", 20, start, end)
        };
        var repo = new Mock<IHbgHotelDiscountsRepository>();
        repo.Setup(r => r.GetAll()).ReturnsAsync(discounts);
        var service = new DiscountedService(repo.Object);

        await service.EnrichOffersWithDiscounts(offers);
        offers.Single(o => o.Accom.Code == "ACC1").DiscountPercentage.Should().BeNull(); // skipped due to existing unit discount
        offers.Single(o => o.Accom.Code == "ACC2").DiscountPercentage.Should().Be(20);
    }

    [Fact]
    public async Task OfferWithExistingAtcomPerPersonDiscount_Skipped()
    {
        var today = DateTime.UtcNow.Date;
        var offers = new List<Offer>
        {
            CreateOffer("ACC1", today, 7),
            CreateOffer("ACC2", today, 7)
        };
        offers[0].Accom.Unit.Add(new Unit { Code = "U1", DiscountPP = 50 });
        var start = DateOnly.FromDateTime(today);
        var end = start.AddDays(7);
        var discounts = new List<HbgHotelDiscount>
        {
            CreateDiscount("ACC1", 10, start, end),
            CreateDiscount("ACC2", 20, start, end)
        };
        var repo = new Mock<IHbgHotelDiscountsRepository>();
        repo.Setup(r => r.GetAll()).ReturnsAsync(discounts);
        var service = new DiscountedService(repo.Object);

        await service.EnrichOffersWithDiscounts(offers);
        offers.Single(o => o.Accom.Code == "ACC1").DiscountPercentage.Should().BeNull(); // skipped due to existing unit discount per person
        offers.Single(o => o.Accom.Code == "ACC2").DiscountPercentage.Should().Be(20);
    }

    [Fact]
    public async Task EmptyOffers_EarlyReturn_DoesNotCallRepository()
    {
        var repo = new Mock<IHbgHotelDiscountsRepository>();
        repo.Setup(r => r.GetAll()).ReturnsAsync(new List<HbgHotelDiscount>());
        var service = new DiscountedService(repo.Object);
        var offers = new List<Offer>();

        await service.EnrichOffersWithDiscounts(offers);
        repo.Verify(r => r.GetAll(), Times.Never);
    }

    [Fact]
    public async Task EmptyRepository_NoDiscountApplied()
    {
        var repo = new Mock<IHbgHotelDiscountsRepository>();
        repo.Setup(r => r.GetAll()).ReturnsAsync(new List<HbgHotelDiscount>());
        var service = new DiscountedService(repo.Object);
        var offers = new List<Offer> { CreateOffer("ACC1") };

        await service.EnrichOffersWithDiscounts(offers);
        offers.Single().DiscountPercentage.Should().BeNull();
        repo.Verify(r => r.GetAll(), Times.Once);
    }

    [Fact]
    public async Task EnrichOffersWithDiscounts_NullOffers_Throw()
    {
        var repo = new Mock<IHbgHotelDiscountsRepository>();
        var service = new DiscountedService(repo.Object);
        await Assert.ThrowsAsync<ArgumentNullException>(() => service.EnrichOffersWithDiscounts(null!));
    }
}
