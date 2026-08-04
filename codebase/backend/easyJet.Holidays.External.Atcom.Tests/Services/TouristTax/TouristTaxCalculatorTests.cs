using easyJet.Holidays.External.Atcom.Services.TouristTax;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using FluentAssertions;
using Moq;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Threading.Tasks;
using Xunit;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;

namespace easyJet.Holidays.External.Atcom.Tests.Services.TouristTax;

public class TouristTaxCalculatorTests
{
    private TouristTaxCalculator CreateSut(
        Mock<IPaxCalculator> paxFlat = null,
        Mock<IRoomCalculator> roomBased = null,
        Mock<IPercentageCalculator> percentageBased = null,
        Mock<INoTaxCalculator> noTax = null,
        Mock<ITouristTaxRepository> repo = null,
        Mock<IReferenceDataService> referenceDataService = null)
    {
        paxFlat ??= new Mock<IPaxCalculator>(MockBehavior.Strict);
        roomBased ??= new Mock<IRoomCalculator>(MockBehavior.Strict);
        percentageBased ??= new Mock<IPercentageCalculator>(MockBehavior.Strict);
        noTax ??= new Mock<INoTaxCalculator>(MockBehavior.Strict);
        repo ??= new Mock<ITouristTaxRepository>(MockBehavior.Strict);
        referenceDataService ??= new Mock<IReferenceDataService>(MockBehavior.Loose);

        return new TouristTaxCalculator(paxFlat.Object, roomBased.Object, percentageBased.Object, noTax.Object, repo.Object, referenceDataService.Object);
    }

    private static TouristTaxOffer CreateTouristTaxOffer(string geography, string id = "O1")
    {
        var from = DateOnly.FromDateTime(DateTime.UtcNow.Date);
        return new TouristTaxOffer(
            id,
            geography,
            7,
            1000m,
            from,
            from.AddDays(7),
            3,
            1,
            new List<AdultPax> { new(), new() }.AsReadOnly(),
            new List<ChildPax>().AsReadOnly()
        );
    }

    [Fact]
    public async Task HydrateOfferWIthTouristTax_WhenConfigNull_UsesNoTax()
    {
        // Arrange
        var noTax = new Mock<INoTaxCalculator>(MockBehavior.Strict);
        var repo = new Mock<ITouristTaxRepository>(MockBehavior.Strict);
        var referenceData = new Mock<IReferenceDataService>(MockBehavior.Strict);
        var ttOffer = CreateTouristTaxOffer("XXNULL", "O-NULL");
        var request = new TouristTaxRequest(new ReadOnlyCollection<TouristTaxOffer>(new List<TouristTaxOffer> { ttOffer }));

        repo.Setup(r => r.GetConfig(ttOffer)).ReturnsAsync((IEnumerable<TouristTaxRule>)null);
        noTax.Setup(n => n.Calculate(ttOffer)).Returns(new OfferTax(ttOffer.OfferId));
        referenceData.Setup(r => r.GetTouristTaxSettings()).Returns(Task.FromResult<easyJet.Holidays.Api.Domain.Data.Settings.TouristTaxSettings>(null));

        var sut = CreateSut(noTax: noTax, repo: repo, referenceDataService: referenceData);

        // Act
        var response = await sut.CalculateTouristTax(request);

        // Assert
        noTax.Verify(n => n.Calculate(ttOffer), Times.Once);
        repo.Verify(r => r.GetConfig(ttOffer), Times.Once);
        response.OfferTaxes.Should().HaveCount(1);
        response.OfferTaxes[0].OfferId.Should().Be(ttOffer.OfferId);
        response.OfferTaxes[0].TouristTax.Should().Be(0);
        response.OfferTaxes[0].TouristTaxPP.Should().Be(0);
    }

    [Fact]
    public async Task HydrateOfferWIthTouristTax_WhenPaxFlatBased_Config_CallsPaxFlat()
    {
        var paxCalculator = new Mock<IPaxCalculator>(MockBehavior.Strict);
        var repo = new Mock<ITouristTaxRepository>(MockBehavior.Strict);
        var noTaxCalculator = new Mock<INoTaxCalculator>(MockBehavior.Strict);
        var referenceData = new Mock<IReferenceDataService>(MockBehavior.Strict);
        var touristTaxOffer = CreateTouristTaxOffer("ESFU13", "O-PAX");
        var request = new TouristTaxRequest(new ReadOnlyCollection<TouristTaxOffer>(new List<TouristTaxOffer> { touristTaxOffer }));

        var cfg = new TouristTaxRule { ApplicationType = nameof(PaxBased) };
        repo.Setup(r => r.GetConfig(touristTaxOffer)).ReturnsAsync(new[] { cfg });
        paxCalculator.Setup(p => p.Calculate(touristTaxOffer, cfg)).ReturnsAsync(new OfferTax(touristTaxOffer.OfferId) { TouristTax = 26, TouristTaxPP = 629 });
        referenceData.Setup(r => r.GetTouristTaxSettings()).Returns(Task.FromResult<easyJet.Holidays.Api.Domain.Data.Settings.TouristTaxSettings>(null));

        var sut = CreateSut(paxFlat: paxCalculator, noTax: noTaxCalculator, repo: repo, referenceDataService: referenceData);

        var response = await sut.CalculateTouristTax(request);

        paxCalculator.Verify(p => p.Calculate(touristTaxOffer, cfg), Times.Once);
        noTaxCalculator.Verify(n => n.Calculate(It.IsAny<TouristTaxOffer>()), Times.Never);
        response.OfferTaxes.Should().ContainSingle();
        response.OfferTaxes[0].TouristTax.Should().Be(26);
        response.OfferTaxes[0].TouristTaxPP.Should().Be(629);
    }

    [Fact]
    public async Task HydrateOfferWIthTouristTax_WhenRoomBased_Config_CallsRoomBased()
    {
        var room = new Mock<IRoomCalculator>(MockBehavior.Strict);
        var repo = new Mock<ITouristTaxRepository>(MockBehavior.Strict);
        var noTax = new Mock<INoTaxCalculator>(MockBehavior.Strict);
        var referenceData = new Mock<IReferenceDataService>(MockBehavior.Strict);
        var ttOffer = CreateTouristTaxOffer("GBSS45", "O-ROOM");
        var request = new TouristTaxRequest(new ReadOnlyCollection<TouristTaxOffer>(new List<TouristTaxOffer> { ttOffer }));

        var cfg = new TouristTaxRule { ApplicationType = nameof(RoomBased) };
        repo.Setup(r => r.GetConfig(ttOffer)).ReturnsAsync(new[] { cfg });
        room.Setup(r => r.Calculate(ttOffer, cfg)).ReturnsAsync(new OfferTax(ttOffer.OfferId) { TouristTax = 59, TouristTaxPP = 159 });
        referenceData.Setup(r => r.GetTouristTaxSettings()).Returns(Task.FromResult<easyJet.Holidays.Api.Domain.Data.Settings.TouristTaxSettings>(null));

        var sut = CreateSut(roomBased: room, noTax: noTax, repo: repo, referenceDataService: referenceData);

        var response = await sut.CalculateTouristTax(request);

        room.Verify(r => r.Calculate(ttOffer, cfg), Times.Once);
        noTax.Verify(n => n.Calculate(It.IsAny<TouristTaxOffer>()), Times.Never);
        response.OfferTaxes.Should().ContainSingle();
        response.OfferTaxes[0].TouristTax.Should().Be(59);
        response.OfferTaxes[0].TouristTaxPP.Should().Be(159);
    }

    [Fact]
    public async Task HydrateOfferWIthTouristTax_WhenPercentageBased_Config_CallsPercentage()
    {
        var percent = new Mock<IPercentageCalculator>(MockBehavior.Strict);
        var repo = new Mock<ITouristTaxRepository>(MockBehavior.Strict);
        var noTax = new Mock<INoTaxCalculator>(MockBehavior.Strict);
        var referenceData = new Mock<IReferenceDataService>(MockBehavior.Strict);
        var ttOffer = CreateTouristTaxOffer("ITFU66", "O-PCT");
        var request = new TouristTaxRequest(new ReadOnlyCollection<TouristTaxOffer>(new List<TouristTaxOffer> { ttOffer }));

        var cfg = new TouristTaxRule { ApplicationType = nameof(PercentageBased) };
        repo.Setup(r => r.GetConfig(ttOffer)).ReturnsAsync(new[] { cfg });
        percent.Setup(p => p.Calculate(ttOffer, cfg)).ReturnsAsync(new OfferTax(ttOffer.OfferId) { TouristTax = 29, TouristTaxPP = 129 });
        referenceData.Setup(r => r.GetTouristTaxSettings()).Returns(Task.FromResult<easyJet.Holidays.Api.Domain.Data.Settings.TouristTaxSettings>(null));

        var sut = CreateSut(percentageBased: percent, noTax: noTax, repo: repo, referenceDataService: referenceData);

        var response = await sut.CalculateTouristTax(request);

        percent.Verify(p => p.Calculate(ttOffer, cfg), Times.Once);
        noTax.Verify(n => n.Calculate(It.IsAny<TouristTaxOffer>()), Times.Never);
        response.OfferTaxes.Should().ContainSingle();
        response.OfferTaxes[0].TouristTax.Should().Be(29);
        response.OfferTaxes[0].TouristTaxPP.Should().Be(129);
    }

    [Fact]
    public async Task HydrateOfferWIthTouristTax_WhenUnknown_Config_UsesNoTax()
    {
        var noTax = new Mock<INoTaxCalculator>(MockBehavior.Strict);
        var repo = new Mock<ITouristTaxRepository>(MockBehavior.Strict);
        var referenceData = new Mock<IReferenceDataService>(MockBehavior.Strict);
        var ttOffer = CreateTouristTaxOffer("UNKNOWN", "O-UNK");
        var request = new TouristTaxRequest(new ReadOnlyCollection<TouristTaxOffer>(new List<TouristTaxOffer> { ttOffer }));

        var cfg = new TouristTaxRule { ApplicationType = "SomethingElse" };
        repo.Setup(r => r.GetConfig(ttOffer)).ReturnsAsync(new[] { cfg });
        noTax.Setup(n => n.Calculate(ttOffer)).Returns(new OfferTax(ttOffer.OfferId) { TouristTax = 0, TouristTaxPP = 0 });
        referenceData.Setup(r => r.GetTouristTaxSettings()).Returns(Task.FromResult<easyJet.Holidays.Api.Domain.Data.Settings.TouristTaxSettings>(null));

        var sut = CreateSut(noTax: noTax, repo: repo, referenceDataService: referenceData);

        var response = await sut.CalculateTouristTax(request);

        noTax.Verify(n => n.Calculate(ttOffer), Times.Once);
        response.OfferTaxes.Should().ContainSingle();
        response.OfferTaxes[0].TouristTax.Should().Be(0);
        response.OfferTaxes[0].TouristTaxPP.Should().Be(0);
    }

    [Fact]
    public async Task CalculateTouristTax_WhenConfigEmpty_UsesNoTax()
    {
        var noTax = new Mock<INoTaxCalculator>(MockBehavior.Strict);
        var repo = new Mock<ITouristTaxRepository>(MockBehavior.Strict);
        var referenceData = new Mock<IReferenceDataService>(MockBehavior.Strict);
        var ttOffer = CreateTouristTaxOffer("EMPTY", "O-EMPTY");
        var request = new TouristTaxRequest(new ReadOnlyCollection<TouristTaxOffer>(new List<TouristTaxOffer> { ttOffer }));

        repo.Setup(r => r.GetConfig(ttOffer)).ReturnsAsync(Array.Empty<TouristTaxRule>());
        noTax.Setup(n => n.Calculate(ttOffer)).Returns(new OfferTax(ttOffer.OfferId));
        referenceData.Setup(r => r.GetTouristTaxSettings()).Returns(Task.FromResult<easyJet.Holidays.Api.Domain.Data.Settings.TouristTaxSettings>(null));

        var sut = CreateSut(noTax: noTax, repo: repo, referenceDataService: referenceData);

        var response = await sut.CalculateTouristTax(request);

        repo.Verify(r => r.GetConfig(ttOffer), Times.Once);
        noTax.Verify(n => n.Calculate(ttOffer), Times.Once);
        response.OfferTaxes.Should().ContainSingle();
        response.OfferTaxes[0].OfferId.Should().Be(ttOffer.OfferId);
        response.OfferTaxes[0].TouristTax.Should().Be(0);
        response.OfferTaxes[0].TouristTaxPP.Should().Be(0);
    }

    [Fact]
    public async Task CalculateTouristTax_WhenFeatureDisabled_UsesNoTaxAndSkipsRepository()
    {
        var noTax = new Mock<INoTaxCalculator>(MockBehavior.Strict);
        var repo = new Mock<ITouristTaxRepository>(MockBehavior.Strict);
        var referenceData = new Mock<IReferenceDataService>(MockBehavior.Strict);

        var offer1 = CreateTouristTaxOffer("ESFU13", "O-DIS1");
        var offer2 = CreateTouristTaxOffer("ITFU66", "O-DIS2");
        var request = new TouristTaxRequest(new ReadOnlyCollection<TouristTaxOffer>(new List<TouristTaxOffer> { offer1, offer2 }));

        referenceData
            .Setup(r => r.GetTouristTaxSettings())
            .Returns(Task.FromResult(new easyJet.Holidays.Api.Domain.Data.Settings.TouristTaxSettings { IsTouristTaxEnabled = false }));

        noTax.Setup(n => n.Calculate(offer1)).Returns(new OfferTax(offer1.OfferId));
        noTax.Setup(n => n.Calculate(offer2)).Returns(new OfferTax(offer2.OfferId));

        var sut = CreateSut(noTax: noTax, repo: repo, referenceDataService: referenceData);

        var response = await sut.CalculateTouristTax(request);

        // Repository should not be queried when feature is disabled
        repo.Verify(r => r.GetConfig(It.IsAny<TouristTaxOffer>()), Times.Never);
        noTax.Verify(n => n.Calculate(offer1), Times.Once);
        noTax.Verify(n => n.Calculate(offer2), Times.Once);
        response.OfferTaxes.Should().HaveCount(2);
        response.OfferTaxes.Select(o => o.OfferId).Should().BeEquivalentTo(new[] { offer1.OfferId, offer2.OfferId });
    }

    [Fact]
    public async Task CalculateTouristTax_WhenMultipleRules_LastRuleWins()
    {
        var pax = new Mock<IPaxCalculator>(MockBehavior.Strict);
        var room = new Mock<IRoomCalculator>(MockBehavior.Strict);
        var pct = new Mock<IPercentageCalculator>(MockBehavior.Strict);
        var noTax = new Mock<INoTaxCalculator>(MockBehavior.Strict);
        var repo = new Mock<ITouristTaxRepository>(MockBehavior.Strict);
        var referenceData = new Mock<IReferenceDataService>(MockBehavior.Strict);

        var ttOffer = CreateTouristTaxOffer("MIX", "O-MULTI");
        var request = new TouristTaxRequest(new ReadOnlyCollection<TouristTaxOffer>(new List<TouristTaxOffer> { ttOffer }));

        var r1 = new TouristTaxRule { ApplicationType = nameof(PaxBased) };
        var r2 = new TouristTaxRule { ApplicationType = nameof(RoomBased) };
        var r3 = new TouristTaxRule { ApplicationType = nameof(PercentageBased) };

        repo.Setup(r => r.GetConfig(ttOffer)).ReturnsAsync(new[] { r1, r2, r3 });
        pax.Setup(p => p.Calculate(ttOffer, r1)).ReturnsAsync(new OfferTax(ttOffer.OfferId) { TouristTax = 10m, TouristTaxPP = 1m });
        room.Setup(rm => rm.Calculate(ttOffer, r2)).ReturnsAsync(new OfferTax(ttOffer.OfferId) { TouristTax = 20m, TouristTaxPP = 2m });
        pct.Setup(p => p.Calculate(ttOffer, r3)).ReturnsAsync(new OfferTax(ttOffer.OfferId) { TouristTax = 30m, TouristTaxPP = 3m });
        referenceData.Setup(r => r.GetTouristTaxSettings()).Returns(Task.FromResult<easyJet.Holidays.Api.Domain.Data.Settings.TouristTaxSettings>(null));

        var sut = CreateSut(paxFlat: pax, roomBased: room, percentageBased: pct, noTax: noTax, repo: repo, referenceDataService: referenceData);

        var response = await sut.CalculateTouristTax(request);

        pax.Verify(p => p.Calculate(ttOffer, r1), Times.Once);
        room.Verify(rm => rm.Calculate(ttOffer, r2), Times.Once);
        pct.Verify(p => p.Calculate(ttOffer, r3), Times.Once);

        response.OfferTaxes.Should().ContainSingle();
        response.OfferTaxes[0].TouristTax.Should().Be(30m);
        response.OfferTaxes[0].TouristTaxPP.Should().Be(3m);
    }

    [Fact]
    public async Task EnrichOffersWithTouristTax_WithOffers_PopulatesTaxFields()
    {
        var paxCalculator = new Mock<IPaxCalculator>(MockBehavior.Strict);
        var repo = new Mock<ITouristTaxRepository>(MockBehavior.Strict);
        var referenceData = new Mock<IReferenceDataService>(MockBehavior.Strict);

        var offer = new Offer
        {
            Id = "TEST-OFFER-1",
            Date = DateTime.UtcNow,
            Stay = 7,
            Hotel = new OfferHotel { StarRating = "4" },
            Accom = new Accom
            {
                Resort = "ESFU13",
                Unit = new List<Unit>
                {
                    new() { Price = 500m, Occupation = new Occupation { Adults = 2, ChildAges = new List<uint> { 5, 8 } } }
                }
            }
        };

        var offers = new ReadOnlyCollection<Offer>(new List<Offer> { offer });

        var cfg = new TouristTaxRule { ApplicationType = nameof(PaxBased) };
        repo.Setup(r => r.GetConfig(It.IsAny<TouristTaxOffer>())).ReturnsAsync(new[] { cfg });
        paxCalculator.Setup(p => p.Calculate(It.IsAny<TouristTaxOffer>(), cfg))
            .ReturnsAsync(new OfferTax("TEST-OFFER-1")
            {
                TouristTax = 50m,
                TouristTaxPP = 25m,
                TouristTaxLocal = 45m,
                TouristTaxPPLocal = 22.5m,
                ExchangeRate = 0.9m,
                Currency = "EUR"
            });
        referenceData.Setup(r => r.GetTouristTaxSettings()).Returns(Task.FromResult<easyJet.Holidays.Api.Domain.Data.Settings.TouristTaxSettings>(null));

        var sut = CreateSut(paxFlat: paxCalculator, repo: repo, referenceDataService: referenceData);

        await sut.EnrichOffersWithTouristTax(offers);

        offer.TouristTax.Should().Be(50m);
        offer.TouristTaxPP.Should().Be(25m);
        offer.TouristTaxLocal.Should().Be(45m);
        offer.TouristTaxPPLocal.Should().Be(22.5m);
        offer.ExchangeRate.Should().Be(0.9m);
        offer.TouristTaxCurrency.Code.Should().Be("EUR");
    }

    [Fact]
    public async Task EnrichOffersWithTouristTax_WithHotelParameter_UsesProvidedHotel()
    {
        var paxCalculator = new Mock<IPaxCalculator>(MockBehavior.Strict);
        var repo = new Mock<ITouristTaxRepository>(MockBehavior.Strict);
        var referenceData = new Mock<IReferenceDataService>(MockBehavior.Strict);

        var offer = new Offer
        {
            Id = "TEST-OFFER-2",
            Date = DateTime.UtcNow,
            Stay = 5,
            Hotel = new OfferHotel { StarRating = "3" },
            Accom = new Accom
            {
                Resort = "ITFU66",
                Unit = new List<Unit>
                {
                    new() { Price = 800m, Occupation = new Occupation { Adults = 2, ChildAges = new List<uint>() } }
                }
            }
        };

        var offers = new ReadOnlyCollection<Offer>(new List<Offer> { offer });
        var hotelOverride = new OfferHotel { StarRating = "5" };

        var cfg = new TouristTaxRule { ApplicationType = nameof(PaxBased) };
        repo.Setup(r => r.GetConfig(It.IsAny<TouristTaxOffer>())).ReturnsAsync(new[] { cfg });
        paxCalculator.Setup(p => p.Calculate(It.Is<TouristTaxOffer>(o => o.StarRating == 5), cfg))
            .ReturnsAsync(new OfferTax("TEST-OFFER-2")
            {
                TouristTax = 100m,
                TouristTaxPP = 50m,
                Currency = "GBP"
            });
        referenceData.Setup(r => r.GetTouristTaxSettings()).Returns(Task.FromResult<easyJet.Holidays.Api.Domain.Data.Settings.TouristTaxSettings>(null));

        var sut = CreateSut(paxFlat: paxCalculator, repo: repo, referenceDataService: referenceData);

        await sut.EnrichOffersWithTouristTax(offers, hotelOverride);

        offer.TouristTax.Should().Be(100m);
        offer.TouristTaxPP.Should().Be(50m);
        paxCalculator.Verify(p => p.Calculate(It.Is<TouristTaxOffer>(o => o.StarRating == 5), cfg), Times.Once);
    }

    [Fact]
    public async Task EnrichOffersWithTouristTax_WithInvalidStarRating_DefaultsToOne()
    {
        var paxCalculator = new Mock<IPaxCalculator>(MockBehavior.Strict);
        var repo = new Mock<ITouristTaxRepository>(MockBehavior.Strict);
        var referenceData = new Mock<IReferenceDataService>(MockBehavior.Strict);

        var offer = new Offer
        {
            Id = "TEST-OFFER-3",
            Date = DateTime.UtcNow,
            Stay = 7,
            Hotel = new OfferHotel { StarRating = "invalid" },
            Accom = new Accom
            {
                Resort = "TEST",
                Unit = new List<Unit>
                {
                    new() { Price = 600m, Occupation = new Occupation { Adults = 1, ChildAges = new List<uint>() } }
                }
            }
        };

        var offers = new ReadOnlyCollection<Offer>(new List<Offer> { offer });

        var cfg = new TouristTaxRule { ApplicationType = nameof(PaxBased) };
        repo.Setup(r => r.GetConfig(It.IsAny<TouristTaxOffer>())).ReturnsAsync(new[] { cfg });
        paxCalculator.Setup(p => p.Calculate(It.Is<TouristTaxOffer>(o => o.StarRating == 1), cfg))
            .ReturnsAsync(new OfferTax("TEST-OFFER-3") { TouristTax = 10m, TouristTaxPP = 10m, Currency = "EUR" });
        referenceData.Setup(r => r.GetTouristTaxSettings()).Returns(Task.FromResult<easyJet.Holidays.Api.Domain.Data.Settings.TouristTaxSettings>(null));

        var sut = CreateSut(paxFlat: paxCalculator, repo: repo, referenceDataService: referenceData);

        await sut.EnrichOffersWithTouristTax(offers);

        paxCalculator.Verify(p => p.Calculate(It.Is<TouristTaxOffer>(o => o.StarRating == 1), cfg), Times.Once);
    }

    [Fact]
    public async Task EnrichOffersWithTouristTax_WithMultipleUnits_AggregatesPriceAndPax()
    {
        var paxCalculator = new Mock<IPaxCalculator>(MockBehavior.Strict);
        var repo = new Mock<ITouristTaxRepository>(MockBehavior.Strict);
        var referenceData = new Mock<IReferenceDataService>(MockBehavior.Strict);

        var offer = new Offer
        {
            Id = "TEST-OFFER-4",
            Date = DateTime.UtcNow,
            Stay = 7,
            Hotel = new OfferHotel { StarRating = "3" },
            Accom = new Accom
            {
                Resort = "MULTI",
                Unit = new List<Unit>
                {
                    new() { Price = 300m, Occupation = new Occupation { Adults = 2, ChildAges = new List<uint> { 5 } } },
                    new() { Price = 400m, Occupation = new Occupation { Adults = 2, ChildAges = new List<uint> { 10, 12 } } }
                }
            }
        };

        var offers = new ReadOnlyCollection<Offer>(new List<Offer> { offer });

        var cfg = new TouristTaxRule { ApplicationType = nameof(PaxBased) };
        repo.Setup(r => r.GetConfig(It.IsAny<TouristTaxOffer>())).ReturnsAsync(new[] { cfg });
        paxCalculator.Setup(p => p.Calculate(
            It.Is<TouristTaxOffer>(o => 
                o.AccommodationAmount == 700m && 
                o.AdultPaxes.Count == 4 && 
                o.ChildPaxes.Count == 3 &&
                o.NumberOfRooms == 2), 
            cfg))
            .ReturnsAsync(new OfferTax("TEST-OFFER-4") { TouristTax = 80m, TouristTaxPP = 11.43m, Currency = "EUR" });
        referenceData.Setup(r => r.GetTouristTaxSettings()).Returns(Task.FromResult<easyJet.Holidays.Api.Domain.Data.Settings.TouristTaxSettings>(null));

        var sut = CreateSut(paxFlat: paxCalculator, repo: repo, referenceDataService: referenceData);

        await sut.EnrichOffersWithTouristTax(offers);

        offer.TouristTax.Should().Be(80m);
        paxCalculator.Verify(p => p.Calculate(
            It.Is<TouristTaxOffer>(o => 
                o.AccommodationAmount == 700m && 
                o.AdultPaxes.Count == 4 && 
                o.ChildPaxes.Count == 3 &&
                o.NumberOfRooms == 2), 
            cfg), Times.Once);
    }

    [Fact]
    public void Constructor_WithNullPaxCalculator_ThrowsArgumentNullException()
    {
        var room = new Mock<IRoomCalculator>();
        var pct = new Mock<IPercentageCalculator>();
        var noTax = new Mock<INoTaxCalculator>();
        var repo = new Mock<ITouristTaxRepository>();
        var refData = new Mock<IReferenceDataService>();

        var act = () => new TouristTaxCalculator(null, room.Object, pct.Object, noTax.Object, repo.Object, refData.Object);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void Constructor_WithNullRoomCalculator_ThrowsArgumentNullException()
    {
        var pax = new Mock<IPaxCalculator>();
        var pct = new Mock<IPercentageCalculator>();
        var noTax = new Mock<INoTaxCalculator>();
        var repo = new Mock<ITouristTaxRepository>();
        var refData = new Mock<IReferenceDataService>();

        var act = () => new TouristTaxCalculator(pax.Object, null, pct.Object, noTax.Object, repo.Object, refData.Object);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void Constructor_WithNullPercentageCalculator_ThrowsArgumentNullException()
    {
        var pax = new Mock<IPaxCalculator>();
        var room = new Mock<IRoomCalculator>();
        var noTax = new Mock<INoTaxCalculator>();
        var repo = new Mock<ITouristTaxRepository>();
        var refData = new Mock<IReferenceDataService>();

        var act = () => new TouristTaxCalculator(pax.Object, room.Object, null, noTax.Object, repo.Object, refData.Object);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void Constructor_WithNullNoTaxCalculator_ThrowsArgumentNullException()
    {
        var pax = new Mock<IPaxCalculator>();
        var room = new Mock<IRoomCalculator>();
        var pct = new Mock<IPercentageCalculator>();
        var repo = new Mock<ITouristTaxRepository>();
        var refData = new Mock<IReferenceDataService>();

        var act = () => new TouristTaxCalculator(pax.Object, room.Object, pct.Object, null, repo.Object, refData.Object);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void Constructor_WithNullRepository_ThrowsArgumentNullException()
    {
        var pax = new Mock<IPaxCalculator>();
        var room = new Mock<IRoomCalculator>();
        var pct = new Mock<IPercentageCalculator>();
        var noTax = new Mock<INoTaxCalculator>();
        var refData = new Mock<IReferenceDataService>();

        var act = () => new TouristTaxCalculator(pax.Object, room.Object, pct.Object, noTax.Object, null, refData.Object);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void Constructor_WithNullReferenceDataService_ThrowsArgumentNullException()
    {
        var pax = new Mock<IPaxCalculator>();
        var room = new Mock<IRoomCalculator>();
        var pct = new Mock<IPercentageCalculator>();
        var noTax = new Mock<INoTaxCalculator>();
        var repo = new Mock<ITouristTaxRepository>();

        var act = () => new TouristTaxCalculator(pax.Object, room.Object, pct.Object, noTax.Object, repo.Object, null);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public async Task CalculateTouristTax_WithMultipleOffers_ProcessesAllOffers()
    {
        var pax = new Mock<IPaxCalculator>(MockBehavior.Strict);
        var room = new Mock<IRoomCalculator>(MockBehavior.Strict);
        var repo = new Mock<ITouristTaxRepository>(MockBehavior.Strict);
        var referenceData = new Mock<IReferenceDataService>(MockBehavior.Strict);

        var offer1 = CreateTouristTaxOffer("GEO1", "OFFER-1");
        var offer2 = CreateTouristTaxOffer("GEO2", "OFFER-2");
        var offer3 = CreateTouristTaxOffer("GEO3", "OFFER-3");

        var request = new TouristTaxRequest(new ReadOnlyCollection<TouristTaxOffer>(
            new List<TouristTaxOffer> { offer1, offer2, offer3 }));

        var cfg1 = new TouristTaxRule { ApplicationType = nameof(PaxBased) };
        var cfg2 = new TouristTaxRule { ApplicationType = nameof(RoomBased) };
        var cfg3 = new TouristTaxRule { ApplicationType = nameof(PaxBased) };

        repo.Setup(r => r.GetConfig(offer1)).ReturnsAsync(new[] { cfg1 });
        repo.Setup(r => r.GetConfig(offer2)).ReturnsAsync(new[] { cfg2 });
        repo.Setup(r => r.GetConfig(offer3)).ReturnsAsync(new[] { cfg3 });

        pax.Setup(p => p.Calculate(offer1, cfg1)).ReturnsAsync(new OfferTax("OFFER-1") { TouristTax = 10m, TouristTaxPP = 5m });
        room.Setup(r => r.Calculate(offer2, cfg2)).ReturnsAsync(new OfferTax("OFFER-2") { TouristTax = 20m, TouristTaxPP = 10m });
        pax.Setup(p => p.Calculate(offer3, cfg3)).ReturnsAsync(new OfferTax("OFFER-3") { TouristTax = 30m, TouristTaxPP = 15m });

        referenceData.Setup(r => r.GetTouristTaxSettings()).Returns(Task.FromResult<easyJet.Holidays.Api.Domain.Data.Settings.TouristTaxSettings>(null));

        var sut = CreateSut(paxFlat: pax, roomBased: room, repo: repo, referenceDataService: referenceData);

        var response = await sut.CalculateTouristTax(request);

        response.OfferTaxes.Should().HaveCount(3);
        response.OfferTaxes[0].OfferId.Should().Be("OFFER-1");
        response.OfferTaxes[0].TouristTax.Should().Be(10m);
        response.OfferTaxes[1].OfferId.Should().Be("OFFER-2");
        response.OfferTaxes[1].TouristTax.Should().Be(20m);
        response.OfferTaxes[2].OfferId.Should().Be("OFFER-3");
        response.OfferTaxes[2].TouristTax.Should().Be(30m);
    }
}
