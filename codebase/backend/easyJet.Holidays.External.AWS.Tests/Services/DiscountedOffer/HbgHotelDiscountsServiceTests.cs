using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.RoomVariants;
using easyJet.Holidays.Api.Domain.Interfaces.DiscountedOffer;
using easyJet.Holidays.External.AWS.Services.DiscountedOffer;
using FluentAssertions;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.AWS.Tests.Services.HbgHotelDiscountsService;

public class HbgHotelDiscountsServiceTests
{
    private static Offer BuildOffer(string accomCode, DateTime? date = null, int stay = 7)
    {
        return new Offer
        {
            Accom = new Accom { Code = accomCode, Unit = new List<Unit>() },
            Date = date,
            Stay = (byte?)stay
        };
    }

    private static Api.Domain.Data.DynamoDB.DiscountedOffer.HbgHotelDiscount BuildDiscount(string accomCode, int discount, DateOnly from, DateOnly to)
    {
        // Strings parsed by read-only DateOnly accessors used in service matching logic
        return new Api.Domain.Data.DynamoDB.DiscountedOffer.HbgHotelDiscount
        {
            AccommodationCode = accomCode,
            Discounts = new List<Api.Domain.Data.DynamoDB.DiscountedOffer.Discount>
            {
                new Api.Domain.Data.DynamoDB.DiscountedOffer.Discount
                {
                    DiscountPercentage = discount,
                    TravelWindowFrom = from.ToString("yyyy-MM-dd"),
                    TravelWindowTo = to.ToString("yyyy-MM-dd"),
                    GiataCode = 0,
                    AccommodationName = string.Empty
                }
            }
        };
    }

    [Fact]
    public async Task Enrich_WithPackagesSearchRequest_AppliesDiscount_WhenMatch()
    {
        // Arrange
        var repo = new Mock<IHbgHotelDiscountsRepository>();
        var start = new DateTime(2024, 05, 10);
        var request = new PackagesSearchRequest
        {
            StartDate = start.ToString("yyyy-MM-dd"),
            Duration = new List<int> { 7 },
            FlexibleDays = 0
        };
        var offers = new List<Offer> { BuildOffer("ABC", start, 7), BuildOffer("XYZ", start, 7) };

        var discounts = new List<Api.Domain.Data.DynamoDB.DiscountedOffer.HbgHotelDiscount>
        {
            // travel window covers derived start/end date
            BuildDiscount("abc",12, DateOnly.FromDateTime(start.AddDays(-1)), DateOnly.FromDateTime(start.AddDays(7)))
        };

        repo.Setup(r => r.GetAll()).ReturnsAsync(discounts);
        var sut = new AWS.Services.DiscountedOffer.HbgHotelDiscountsService(repo.Object);

        // Act
        await sut.EnrichOffersWithDiscounts(offers);

        // Assert
        offers[0].DiscountPercentage.Should().Be(12);
        offers[1].DiscountPercentage.Should().BeNull();
    }

    [Fact]
    public async Task Enrich_WithPackagesSearchRequest_NoMatch_DoesNotChangeOffers()
    {
        var repo = new Mock<IHbgHotelDiscountsRepository>();
        var start = new DateTime(2024, 05, 10);
        var request = new PackagesSearchRequest
        {
            StartDate = start.ToString("yyyy-MM-dd"),
            Duration = new List<int> { 7 },
            FlexibleDays = 0
        };
        var offers = new List<Offer> { BuildOffer("ABC", start, 7) };
        var discounts = new List<Api.Domain.Data.DynamoDB.DiscountedOffer.HbgHotelDiscount>
        {
            // travel window excludes end date
            BuildDiscount("ABC",10, DateOnly.FromDateTime(start.AddDays(1)), DateOnly.FromDateTime(start.AddDays(5)))
        };

        repo.Setup(r => r.GetAll()).ReturnsAsync(discounts);
        var sut = new AWS.Services.DiscountedOffer.HbgHotelDiscountsService(repo.Object);

        await sut.EnrichOffersWithDiscounts(offers);

        offers[0].DiscountPercentage.Should().BeNull();
    }

    [Fact]
    public async Task Enrich_WithOfferCollectionOnly_AppliesDiscount_WhenMatch()
    {
        var repo = new Mock<IHbgHotelDiscountsRepository>();
        var date = new DateTime(2024, 07, 15);
        var offers = new List<Offer>
        {
            BuildOffer("MATCH1", date,10),
            BuildOffer("NOMATCH", date,10)
        };
        var discounts = new List<Api.Domain.Data.DynamoDB.DiscountedOffer.HbgHotelDiscount>
        {
            BuildDiscount("match1",5, DateOnly.FromDateTime(date), DateOnly.FromDateTime(date.AddDays(10)))
        };

        repo.Setup(r => r.GetAll()).ReturnsAsync(discounts);
        var sut = new AWS.Services.DiscountedOffer.HbgHotelDiscountsService(repo.Object);

        await sut.EnrichOffersWithDiscounts(offers);

        offers.First(o => o.Accom.Code == "MATCH1").DiscountPercentage.Should().Be(5);
        offers.First(o => o.Accom.Code == "NOMATCH").DiscountPercentage.Should().BeNull();
    }

    [Fact]
    public async Task Enrich_WithOfferCollectionOnly_SkipsOffersWithoutDateOrStay()
    {
        var repo = new Mock<IHbgHotelDiscountsRepository>();
        var date = new DateTime(2024, 07, 20);
        var validOffer = BuildOffer("VALID", date, 5);
        var noDateOffer = BuildOffer("NODATE", null, 5);
        var noStayOffer = BuildOffer("NOSTAY", date, 0);
        noStayOffer.Stay = null; // explicit null
        var offers = new List<Offer> { validOffer, noDateOffer, noStayOffer };
        var discounts = new List<Api.Domain.Data.DynamoDB.DiscountedOffer.HbgHotelDiscount>
        {
            BuildDiscount("valid",15, DateOnly.FromDateTime(date), DateOnly.FromDateTime(date.AddDays(5)))
        };

        repo.Setup(r => r.GetAll()).ReturnsAsync(discounts);
        var sut = new AWS.Services.DiscountedOffer.HbgHotelDiscountsService(repo.Object);

        await sut.EnrichOffersWithDiscounts(offers);

        validOffer.DiscountPercentage.Should().Be(15);
        noDateOffer.DiscountPercentage.Should().BeNull();
        noStayOffer.DiscountPercentage.Should().BeNull();
    }

    [Fact]
    public async Task Enrich_EmptyOffers_DoesNotCallRepository()
    {
        var repo = new Mock<IHbgHotelDiscountsRepository>();
        var sut = new AWS.Services.DiscountedOffer.HbgHotelDiscountsService(repo.Object);
        var offers = new List<Offer>();

        await sut.EnrichOffersWithDiscounts(offers);

        repo.Verify(r => r.GetAll(), Times.Never);
    }

    [Fact]
    public async Task Enrich_DiscountRepositoryReturnsEmpty_NoChanges()
    {
        var repo = new Mock<IHbgHotelDiscountsRepository>();
        repo.Setup(r => r.GetAll()).ReturnsAsync(new List<Api.Domain.Data.DynamoDB.DiscountedOffer.HbgHotelDiscount>());
        var sut = new AWS.Services.DiscountedOffer.HbgHotelDiscountsService(repo.Object);
        var offers = new List<Offer> { BuildOffer("ABC", DateTime.UtcNow, 7) };

        await sut.EnrichOffersWithDiscounts(offers);

        offers[0].DiscountPercentage.Should().BeNull();
    }

    [Fact]
    public async Task Enrich_DiscountRepositoryReturnsNull_NoChanges()
    {
        var repo = new Mock<IHbgHotelDiscountsRepository>();
        repo.Setup(r => r.GetAll()).ReturnsAsync((List<Api.Domain.Data.DynamoDB.DiscountedOffer.HbgHotelDiscount>)null);
        var sut = new AWS.Services.DiscountedOffer.HbgHotelDiscountsService(repo.Object);
        var offers = new List<Offer> { BuildOffer("ABC", DateTime.UtcNow, 7) };

        await sut.EnrichOffersWithDiscounts(offers);

        offers[0].DiscountPercentage.Should().BeNull();
    }

    [Fact]
    public async Task Enrich_SkipsOffersWithExistingAtcomDiscount()
    {
        var repo = new Mock<IHbgHotelDiscountsRepository>();
        var start = new DateTime(2024, 08, 01);
        var request = new PackagesSearchRequest
        {
            StartDate = start.ToString("yyyy-MM-dd"),
            Duration = new List<int> { 7 }
        };
        var offerWithAtcomDiscount = BuildOffer("ACCOM1", start, 7);
        offerWithAtcomDiscount.Accom.Unit.Add(new Unit { Code = "U1", Discount = 99 });
        var offerWithoutAtcomDiscount = BuildOffer("ACCOM2", start, 7);
        var offers = new List<Offer> { offerWithAtcomDiscount, offerWithoutAtcomDiscount };

        var discounts = new List<Api.Domain.Data.DynamoDB.DiscountedOffer.HbgHotelDiscount>
        {
            BuildDiscount("accom1", 15, DateOnly.FromDateTime(start), DateOnly.FromDateTime(start.AddDays(7))),
            BuildDiscount("accom2", 20, DateOnly.FromDateTime(start), DateOnly.FromDateTime(start.AddDays(7)))
        };

        repo.Setup(r => r.GetAll()).ReturnsAsync(discounts);
        var sut = new AWS.Services.DiscountedOffer.HbgHotelDiscountsService(repo.Object);

        await sut.EnrichOffersWithDiscounts(offers);

        offerWithAtcomDiscount.DiscountPercentage.Should().BeNull();
        offerWithoutAtcomDiscount.DiscountPercentage.Should().Be(20);
    }

    [Fact]
    public async Task Enrich_SkipsOffersWithExistingAtcomPerPersonDiscount()
    {
        var repo = new Mock<IHbgHotelDiscountsRepository>();
        var start = new DateTime(2024, 09, 01);
        var request = new PackagesSearchRequest
        {
            StartDate = start.ToString("yyyy-MM-dd"),
            Duration = new List<int> { 7 }
        };
        var offerWithAtcomDiscountPP = BuildOffer("ACCOM3", start, 7);
        offerWithAtcomDiscountPP.Accom.Unit.Add(new Unit { Code = "U1", DiscountPP = 50 });
        var offerWithoutAtcomDiscount = BuildOffer("ACCOM4", start, 7);
        var offers = new List<Offer> { offerWithAtcomDiscountPP, offerWithoutAtcomDiscount };

        var discounts = new List<Api.Domain.Data.DynamoDB.DiscountedOffer.HbgHotelDiscount>
        {
            BuildDiscount("accom3", 10, DateOnly.FromDateTime(start), DateOnly.FromDateTime(start.AddDays(7))),
            BuildDiscount("accom4", 30, DateOnly.FromDateTime(start), DateOnly.FromDateTime(start.AddDays(7)))
        };

        repo.Setup(r => r.GetAll()).ReturnsAsync(discounts);
        var sut = new AWS.Services.DiscountedOffer.HbgHotelDiscountsService(repo.Object);

        await sut.EnrichOffersWithDiscounts(offers);

        offerWithAtcomDiscountPP.DiscountPercentage.Should().BeNull();
        offerWithoutAtcomDiscount.DiscountPercentage.Should().Be(30);
    }

    [Fact]
    public void Enrich_NullOffers_Throws()
    {
        var repo = new Mock<IHbgHotelDiscountsRepository>();
        var sut = new AWS.Services.DiscountedOffer.HbgHotelDiscountsService(repo.Object);
        Func<Task> act = async () => await sut.EnrichOffersWithDiscounts(null!);
        act.Should().ThrowAsync<ArgumentNullException>();
    }

    [Fact]
    public void Enrich_NullRequest_Throws()
    {
        var repo = new Mock<IHbgHotelDiscountsRepository>();
        var sut = new AWS.Services.DiscountedOffer.HbgHotelDiscountsService(repo.Object);
        Func<Task> act = async () => await sut.EnrichOffersWithDiscounts(new List<Offer> { BuildOffer("A") });
        act.Should().ThrowAsync<ArgumentNullException>();
    }

    [Fact]
    public void Enrich_NullAccommodationRequest_Throws()
    {
        var repo = new Mock<IHbgHotelDiscountsRepository>();
        var sut = new AWS.Services.DiscountedOffer.HbgHotelDiscountsService(repo.Object);
        Func<Task> act = async () => await sut.EnrichOffersWithDiscounts(new List<Offer> { BuildOffer("A") });
        act.Should().ThrowAsync<ArgumentNullException>();
    }
}
