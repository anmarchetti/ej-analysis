using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.RoomVariants;
using easyJet.Holidays.Api.Domain.Services.Luggage;
using FluentAssertions;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Luggage;

public class LuggageOfferServiceTests
{
    private readonly Mock<ILuggageValidatorService> _luggageValidatorMock = new();
    private readonly Mock<ILuggageService> _luggageServiceMock = new();
    private ILuggageOfferService _sut;

    public LuggageOfferServiceTests()
    {
        _sut = new LuggageOfferService(
            _luggageValidatorMock.Object,
            _luggageServiceMock.Object
        );
    }

    public static IEnumerable<object[]> EnrichOffersWithLuggage_NullArguments()
    {
        // Null offers
        yield return new object[] { null, new AccommodationOfferRequest() };
        // Null request
        yield return new object[] { new List<Offer>(), null };
    }

    public static IEnumerable<object[]> EnrichOffersWithLuggage_InvalidArguments()
    {
        // Null promotion code
        yield return new object[]
        {
            new List<Offer>
            {
                new()
                {
                    Accom = new Accom { Prom = null, Unit = new List<Unit> { new() } },
                    Transport = new Transport { Routes = new List<Route> { new(), new() } }
                }
            },
            new AccommodationOfferRequest { Room = new List<RoomAllocation> { new() { Adults = 2 } } }
        };
        // Empty transport routes
        yield return new object[]
        {
            new List<Offer>
            {
                new()
                {
                    Accom = new Accom { Prom = "EUCO", Unit = new List<Unit> { new() } },
                    Transport = new Transport { Routes = new List<Route>() }
                }
            },
            new AccommodationOfferRequest { Room = new List<RoomAllocation> { new() { Adults = 2 } } }
        };
        // No guests
        yield return new object[]
        {
            new List<Offer>
            {
                new()
                {
                    Accom = new Accom { Prom = "EUCO" },
                    Transport = new Transport { Routes = new List<Route> { new(), new() } }
                }
            },
            new AccommodationOfferRequest { Room = new List<RoomAllocation>() }
        };
    }

    [Theory]
    [MemberData(nameof(EnrichOffersWithLuggage_NullArguments))]
    public async Task EnrichOffersWithLuggage_WhenArgumentsAreNull_ShouldThrowArgumentNullException(
        IEnumerable<Offer> offers, AccommodationOfferRequest request)
    {
        // Act
        Func<Task> act = async () => await _sut.EnrichOffersWithLuggage(offers, request);

        // Assert
        await act.Should().ThrowAsync<ArgumentNullException>();
    }

    [Theory]
    [MemberData(nameof(EnrichOffersWithLuggage_InvalidArguments))]
    public async Task EnrichOffersWithLuggage_WhenArgumentsAreInvalid_ShouldThrowArgumentException(
        IEnumerable<Offer> offers, AccommodationOfferRequest request)
    {
        // Act
        Func<Task> act = async () => await _sut.EnrichOffersWithLuggage(offers, request);

        // Assert
        await act.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task EnrichOffersWithLuggage_WhenArgumentsAreValid_ShouldCallServicesSequentially()
    {
        // Arrange
        var offer = new Offer
        {
            Accom = new Accom
            {
                Prom = "EUCO",
                Unit = new List<Unit>
                {
                    new() { Occupation = new Occupation { Adults = 1, Children = 1, Infants = 1 } }
                }
            },
            Transport = new Transport { Routes = new List<Route> { new() } },
            ExtraLuggageInfo = new ExtraLuggageInfo { Items = new List<ExtraLuggageItem>() }
        };
        var offers = new List<Offer> { offer };
        var request = new AccommodationOfferRequest { Room = new List<RoomAllocation> { new() { Adults = 1 } } };
        var complimentaryLuggage = new List<ExtraLuggageItem> { new() };
        var holdLuggage = new List<ExtraLuggageItem> { new() };
        var lcbLuggage = new List<ExtraLuggageItem> { new() };

        _luggageServiceMock
            .Setup(x => x.GetComplimentaryLuggage(It.IsAny<Offer>()))
            .ReturnsAsync(complimentaryLuggage);
        _luggageServiceMock
            .Setup(x => x.GetHoldLuggageOffer(
                It.IsAny<Offer>(),
                It.IsAny<AccommodationOfferRequest>())
            )
            .ReturnsAsync(holdLuggage);
        _luggageServiceMock
            .Setup(x => x.GetLargeCabinBagLuggageOffer(
                It.IsAny<Offer>(),
                It.IsAny<AccommodationOfferRequest>())
            )
            .ReturnsAsync(lcbLuggage);

        // Act
        await _sut.EnrichOffersWithLuggage(offers, request);

        // Assert
        _luggageServiceMock.Verify(
            x => x.GetComplimentaryLuggage(It.IsAny<Offer>()),
            Times.Once
        );
        _luggageServiceMock.Verify(
            x => x.GetHoldLuggageOffer(It.IsAny<Offer>(), It.IsAny<AccommodationOfferRequest>()),
            Times.Once
        );
        _luggageServiceMock.Verify(
            x => x.GetLargeCabinBagLuggageOffer(It.IsAny<Offer>(), It.IsAny<AccommodationOfferRequest>()),
            Times.Once
        );
        _luggageValidatorMock.Verify(
            x => x.ValidateAccommodationOffer(It.IsAny<Offer>()),
            Times.Once
        );

        offer.ExtraLuggageInfo.Items.Should().HaveCount(3);
        offer.ExtraLuggageInfo.Items.Should().Contain(complimentaryLuggage);
        offer.ExtraLuggageInfo.Items.Should().Contain(holdLuggage);
        offer.ExtraLuggageInfo.Items.Should().Contain(lcbLuggage);
    }
}