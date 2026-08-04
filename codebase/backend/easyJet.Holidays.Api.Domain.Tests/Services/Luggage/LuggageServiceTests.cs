using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking.Extras;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.RoomVariants;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.Api.Domain.Data.ReferenceData.Luggage;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Data.Settings.Ancillaries;
using easyJet.Holidays.Api.Domain.Services.Luggage;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using Accom = easyJet.Holidays.Api.Domain.Data.PackageOffers.Accom;
using Offer = easyJet.Holidays.Api.Domain.Data.PackageOffers.Offer;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Luggage;

public class LuggageServiceTests
{
    private const string HoldLuggageCategoryCode = "BAGE";
    private const string ExtraHoldluggageCategoryCode = "ADDB";
    private const string CabinBagsCategoryCode = "CABI";
    private const string PrePaidExcessWeightCategoryCode = "WGT";
    private const string SmallSportsEquipmentCategoryCode = "SEC";
    private const string Bag23KgCode = "LUG";
    private const string Bag15KgCode = "LUS";
    private const string ExtraHoldBaggage15kgCode = "LUSE";
    private const string ExtraHoldBaggage23kgCode = "LUGE";
    private const string LargeCabinBagCode = "SCB1";
    private const string LargeSportsEquipmentCategoryCode = "SEO";
    private const string BikeCode = "BIKE";
    private const string CanoeKayakCode = "CANO";
    private const string HandGliderCode = "HGLD";
    private const string WindsurferCode = "Windsurfer";
    private const string PrePaidExcessWeight3kg = "WGT";
    private const string GolfBagCode = "GOLF";
    private const string OtherSmallSportsEquipmentCode = "OSSE";
    private const string SkisAndBootsCode = "SKBT";
    private const string SnowboardCode = "SNBD";

    private readonly Mock<IReferenceDataService> _referenceDataServiceMock;
    private readonly Mock<ILuggageValidatorService> _rulesValidatorServiceMock;
    private readonly Mock<IFlightExtraService> _flightExtraServiceMock;
    private readonly IFixture _fixture;

    private readonly ILuggageService _sut;

    public LuggageServiceTests()
    {
        _fixture = FixtureUtils.AutoMoqFixture();
        _referenceDataServiceMock = new Mock<IReferenceDataService>();
        _referenceDataServiceMock
            .Setup(x => x.GetLuggage())
            .ReturnsAsync(GetDefaultLuggageConfiguration());
        _referenceDataServiceMock
            .Setup(x => x.GetComplimentarySettings(It.IsAny<string>()))
            .ReturnsAsync(GetDefaultComplimentarySettings());
        _referenceDataServiceMock
            .Setup(x => x.GetLuggageSettings())
            .ReturnsAsync(GetDefaultSettings());
        _rulesValidatorServiceMock = new Mock<ILuggageValidatorService>();
        _flightExtraServiceMock = new Mock<IFlightExtraService>();
        _flightExtraServiceMock
            .Setup(x => x.GetFlightExtras(It.IsAny<Offer>(), It.IsAny<IEnumerable<PersonWithDetails>>()))
            .ReturnsAsync(GetDefaultExtras());

        _sut = new LuggageService(
            _referenceDataServiceMock.Object,
            _rulesValidatorServiceMock.Object,
            new PassengerIndexCalculator(),
            _flightExtraServiceMock.Object,
            _fixture.Create<ILogger<LuggageService>>()
        );
    }

    #region Complimentary Luggage

    [Fact]
    public async Task GetComplimentaryLuggageOffer_WhenComplimentarySettingsNotFound_ShouldNotThrowLuggageException()
    {
        // Arrange
        var promoCode = "NONEXISTING_PROMOTION";
        var offer = GetValidOffer();
        offer.Accom.Prom = promoCode;

        // Act
        Func<Task> act = async () => await _sut.GetComplimentaryLuggage(offer);

        // Assert
        await act.Should().NotThrowAsync<LuggageException>();
    }

    [Fact]
    public async Task GetComplimentaryLuggageOffer_WhenInternalFallbackCodeNotFound_ShouldThrowLuggageException()
    {
        // Arrange
        var promoCode = "EUCO";
        var offer = GetValidOffer();
        offer.Accom.Prom = promoCode;
        offer.Transport.Routes.ForEach(x => x.IsExternal = false);
        var complimentarySettings = GetDefaultComplimentarySettings();
        complimentarySettings.ComplimentaryIndex["EUCO"].InternalFallbackCode = null;

        _referenceDataServiceMock
            .Setup(x => x.GetComplimentarySettings(It.IsAny<string>()))
            .ReturnsAsync(complimentarySettings);

        // Act
        Func<Task> act = async () => await _sut.GetComplimentaryLuggage(offer);

        // Assert
        await act.Should().ThrowAsync<LuggageException>();
    }

    [Fact]
    public async Task GetComplimentaryLuggageOffer_WhenBeachPromotion_ShouldReturnComplimentaryLuggage()
    {
        // Arrange
        var promoCode = "EUBO";
        var offer = GetValidOffer();

        // Act
        var luggage = (await _sut.GetComplimentaryLuggage(offer)).ToList();

        // Assert
        var beachComplimentLuggage = GetExpectedBeachComplimentLuggage();
        luggage.Should().BeEquivalentTo(beachComplimentLuggage);
    }

    [Fact]
    public async Task GetComplimentaryLuggageOffer_WhenCityPromotion_ShouldReturnEmptyComplimentaryLuggage()
    {
        // Arrange
        var promoCode = "EUCO";
        var offer = GetValidOffer();
        offer.Accom.Prom = promoCode;

        // Act
        var luggage = await _sut.GetComplimentaryLuggage(offer);

        // Assert
        luggage.Should().HaveCount(0);
    }

    [Fact]
    public async Task GetComplimentaryLuggageOffer_WhenCityPromotionAndInternal_ShouldReturnBeachComplimentaryLuggage()
    {
        // Arrange
        var promoCode = "EUCO";
        var offer = GetValidOffer();
        offer.Accom.Prom = promoCode;
        offer.Transport.Routes.ForEach(x => x.IsExternal = false);

        // Act
        var luggage = await _sut.GetComplimentaryLuggage(offer);

        // Assert
        var beachComplimentLuggage = GetExpectedBeachComplimentLuggage();
        luggage.Should().BeEquivalentTo(beachComplimentLuggage);
    }

    #endregion

    #region Extra Hold Luggage

    [Fact]
    public async Task GetHoldLuggageOffer_WhenRouteInternal_ShouldReturnEmptyLuggage()
    {
        // Arrange
        var offer = GetValidOffer();
        offer.Transport.Routes.ForEach(x => x.IsExternal = false);
        var request = GetValidRequest();

        // Act
        var luggage = await _sut.GetHoldLuggageOffer(offer, request);

        // Assert
        luggage.Should().BeEmpty();
    }

    [Fact]
    public async Task GetHoldLuggageOffer_WhenInboundRouteNotFound_ShouldThrowException()
    {
        // Arrange
        var offer = GetValidOffer();
        offer.Transport.Routes.ForEach(x => x.Direction = Direction.Outbound);
        var request = GetValidRequest();

        // Act
        Func<Task> act = async () => await _sut.GetHoldLuggageOffer(offer, request);

        // Assert
        await act.Should().ThrowAsync<LuggageException>();
    }

    [Fact]
    public async Task GetHoldLuggageOffer_WhenOutboundRouteNotFound_ShouldThrowException()
    {
        // Arrange
        var offer = GetValidOffer();
        offer.Transport.Routes.ForEach(x => x.Direction = Direction.Inbound);
        var request = GetValidRequest();

        // Act
        Func<Task> act = async () => await _sut.GetHoldLuggageOffer(offer, request);

        // Assert
        await act.Should().ThrowAsync<LuggageException>();
    }

    [Fact]
    public async Task GetHoldLuggageOffer_WhenInboundLuggageExtraNotFound_ShouldThrowException()
    {
        // Arrange
        var offer = GetValidOffer();
        offer.Transport.Routes.First().RouteId = "11";
        var request = GetValidRequest();

        // Act
        Func<Task> act = async () => await _sut.GetHoldLuggageOffer(offer, request);

        // Assert
        await act.Should().ThrowAsync<LuggageException>();
    }

    [Fact]
    public async Task GetHoldLuggageOffer_WhenOutboundLuggageExtraNotFound_ShouldThrowException()
    {
        // Arrange
        var offer = GetValidOffer();
        offer.Transport.Routes.Skip(1).First().RouteId = "22";
        var request = GetValidRequest();

        // Act
        Func<Task> act = async () => await _sut.GetHoldLuggageOffer(offer, request);

        // Assert
        await act.Should().ThrowAsync<LuggageException>();
    }

    [Fact]
    public async Task GetHoldLuggageOffer_WhenExtraNotMatchWithCode_ShouldThrowException()
    {
        // Arrange
        var offer = GetValidOffer();
        var request = GetValidRequest();
        request.Luggage = new List<string> { "LUGE-1" };
        var extras = GetDefaultExtras();
        var wrongExtra = extras[0].FlightExtraCategories[0].FlightExtras.First(x => x.FlightExtraCode == "LUGE");
        wrongExtra.FlightExtraCode = "WRONG_CODE";

        _flightExtraServiceMock
            .Setup(x => x.GetFlightExtras(It.IsAny<Offer>(), It.IsAny<IEnumerable<PersonWithDetails>>()))
            .ReturnsAsync(extras);

        // Act
        var act = async () => (await _sut.GetHoldLuggageOffer(offer, request)).ToArray();

        // Assert
        await act.Should().ThrowAsync<ArgumentException>().WithMessage("*No FlightExtra*");
    }

    [Fact]
    public async Task GetHoldLuggageOffer_WhenNoLuggageRequested_ShouldReturnEmpty()
    {
        // Arrange
        var offer = GetValidOffer();
        var request = GetValidRequest();
        request.Luggage = new List<string>();

        // Act
        var luggage = await _sut.GetHoldLuggageOffer(offer, request);

        // Assert
        luggage.Should().BeEmpty();
    }

    [Fact]
    public async Task GetHoldLuggageOffer_WhenLuggageRequested_ShouldReturnHoldLuggage()
    {
        // Arrange
        var offer = GetValidOffer();
        var request = GetValidRequest();

        // Act
        var luggage = (await _sut.GetHoldLuggageOffer(offer, request)).ToList();

        // Assert
        var holdLuggageItems = GetExpectedHoldLuggageItems();
        luggage.Should().BeEquivalentTo(holdLuggageItems);
    }

    [Fact]
    public async Task GetHoldLuggageOffer_WhenEvenLuggageRequested_ShouldReturnCorrectPassengerBinding()
    {
        // Arrange
        var offer = GetValidOffer();
        var occupation = offer.Accom.Unit.First().Occupation;
        occupation.Adults = 2;
        occupation.Children = 0;
        occupation.Infants = 0;
        var request = GetValidRequest();
        request.Room = new List<RoomAllocation>
        {
            new()
            {
                Adults = 2,
                Children = 0,
                Infants = 0
            }
        };
        request.Luggage = new List<string> { "LUGE-3" };

        // Act
        var luggage = (await _sut.GetHoldLuggageOffer(offer, request)).ToList();

        // Assert
        luggage.Should().BeEquivalentTo(new List<ExtraLuggageItem>
        {
            // outbound
            new()
            {
                ItemCode = "LUGE",
                Quantity = 1,
                RouteId = "1",
                PassengerId = "1",
                ItemCategoryCode = "ADDB",
                Price = 25
            },
            new()
            {
                ItemCode = "LUGE",
                Quantity = 1,
                RouteId = "1",
                PassengerId = "2",
                ItemCategoryCode = "ADDB",
                Price = 25
            },
            new()
            {
                ItemCode = "LUGE",
                Quantity = 1,
                RouteId = "1",
                PassengerId = "1",
                ItemCategoryCode = "ADDB",
                Price = 25
            },
            // inbound
            new()
            {
                ItemCode = "LUGE",
                Quantity = 1,
                RouteId = "2",
                PassengerId = "1",
                ItemCategoryCode = "ADDB",
                Price = 26
            },
            new()
            {
                ItemCode = "LUGE",
                Quantity = 1,
                RouteId = "2",
                PassengerId = "2",
                ItemCategoryCode = "ADDB",
                Price = 26
            },
            new()
            {
                ItemCode = "LUGE",
                Quantity = 1,
                RouteId = "2",
                PassengerId = "1",
                ItemCategoryCode = "ADDB",
                Price = 26
            }
        });
    }

    #endregion

    #region Large Cabin Bag Luggage

    [Fact]
    public async Task GetLargeCabinBagLuggageOffer_WhenRouteInternal_ShouldReturnEmptyLuggage()
    {
        // Arrange
        var offer = GetValidOffer();
        offer.Transport.Routes.ForEach(x => x.IsExternal = false);
        var request = GetValidRequest();

        // Act
        var luggage = await _sut.GetLargeCabinBagLuggageOffer(offer, request);

        // Assert
        luggage.Should().BeEmpty();
    }

    [Fact]
    public async Task GetLargeCabinBagLuggageOffer_WhenInboundRouteNotFound_ShouldThrowException()
    {
        // Arrange
        var offer = GetValidOffer();
        offer.Transport.Routes.ForEach(x => x.Direction = Direction.Outbound);
        var request = GetValidRequest();

        // Act
        Func<Task> act = async () => await _sut.GetLargeCabinBagLuggageOffer(offer, request);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task GetLargeCabinBagLuggageOffer_WhenOutboundRouteNotFound_ShouldThrowException()
    {
        // Arrange
        var offer = GetValidOffer();
        offer.Transport.Routes.ForEach(x => x.Direction = Direction.Inbound);
        var request = GetValidRequest();

        // Act
        var act = async () => await _sut.GetLargeCabinBagLuggageOffer(offer, request);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task GetLargeCabinBagLuggageOffer_WhenNoLcbRequested_ShouldReturnEmpty()
    {
        // Arrange
        var offer = GetValidOffer();
        var request = GetValidRequest();
        request.LcbIn = "";
        request.LcbOut = "";

        // Act
        var luggage = await _sut.GetLargeCabinBagLuggageOffer(offer, request);

        // Assert
        luggage.Should().BeEmpty();
    }

    [Fact]
    public async Task GetLargeCabinBagLuggageOffer_WhenExtraNotMatchWithCode_ShouldThrowException()
    {
        // Arrange
        var offer = GetValidOffer();
        var request = GetValidRequest();
        var extras = GetDefaultExtras();
        extras[0].FlightExtraCategories[2].FlightExtras.First().FlightExtraCode = "WRONG_CODE";

        _flightExtraServiceMock
            .Setup(x => x.GetFlightExtras(It.IsAny<Offer>(), It.IsAny<IEnumerable<PersonWithDetails>>()))
            .ReturnsAsync(extras);

        // Act
        var act = async () => (await _sut.GetLargeCabinBagLuggageOffer(offer, request)).ToArray();

        // Assert
        await act.Should().ThrowAsync<ArgumentException>().WithMessage("*No FlightExtra*");
    }

    [Fact]
    public async Task GetLargeCabinBagLuggageOffer_WhenOfferWithPromotionCollection_ShouldSetPriceToZero()
    {
        // Arrange
        var offer = GetValidOffer();
        var request = GetValidRequest();
        var extras = GetDefaultExtras();
        _referenceDataServiceMock
            .Setup(x => x.GetPromotionCollections())
            .ReturnsAsync(new PromotionCollections { Promotions = new([new("lux", "EUBX", default, default, default, default, default)]) });


        _flightExtraServiceMock
            .Setup(x => x.GetFlightExtras(It.IsAny<Offer>(), It.IsAny<IEnumerable<PersonWithDetails>>()))
            .ReturnsAsync(extras);

        // Act
        var luggage = await _sut.GetLargeCabinBagLuggageOffer(offer, request);

        // Assert
        luggage.All(l => Math.Abs(l.Price) < 0.0001).Should().BeTrue();
    }

    [Fact]
    public async Task GetLargeCabinBagLuggageOffer_WithNoPromotionCollection_ShouldSetPrice()
    {
        // Arrange
        var offer = GetValidOffer();
        var request = GetValidRequest();
        var extras = GetDefaultExtras();
        _referenceDataServiceMock
            .Setup(x => x.GetPromotionCollections())
            .ReturnsAsync(new PromotionCollections());


        _flightExtraServiceMock
            .Setup(x => x.GetFlightExtras(It.IsAny<Offer>(), It.IsAny<IEnumerable<PersonWithDetails>>()))
            .ReturnsAsync(extras);

        // Act
        var luggage = await _sut.GetLargeCabinBagLuggageOffer(offer, request);

        // Assert
        foreach (var item in luggage)
        {
            item.Price.Should().Be(75);
        }
    }

    [Theory]
    [InlineData("1|25", "1|2")]
    [InlineData("1|2", "25|2")]
    public async Task GetLargeCabinBagLuggageOffer_WhenInvalidPassengerId_ShouldThrowArgumentException(string lcbIn, string lcbOut)
    {
        // Arrange
        var offer = GetValidOffer();
        var request = GetValidRequest();
        request.LcbIn = lcbIn;
        request.LcbOut = lcbOut;

        // Act
        var act = async () => (await _sut.GetLargeCabinBagLuggageOffer(offer, request)).ToArray();

        // Assert
        await act.Should().ThrowAsync<ArgumentException>().WithMessage("Wrong passenger for LCB received");
    }

    [Fact]
    public async Task GetLargeCabinBagLuggageOffer_WhenLuggageRequested_ShouldReturnLcbLuggage()
    {
        // Arrange
        var offer = GetValidOffer();
        var request = GetValidRequest();

        // Act
        var luggage = (await _sut.GetLargeCabinBagLuggageOffer(offer, request)).ToList();

        // Assert
        var expectedLcbLuggage = GetExpectedLcbLuggage();
        luggage.Should().BeEquivalentTo(expectedLcbLuggage);
    }

    #endregion

    #region Sport Equipment

    [Fact]
    public async Task ContainsSportEquipment_WhenNoSportEquipment_ReturnsFalse()
    {
        var actual = await _sut.ContainsSportEquipment(new List<ExtraLuggageItem>
        {
            new () { ItemCategoryCode = "BAGE" }
        });

        actual.Should().BeFalse();
    }

    [Fact]
    public async Task ContainsSportEquipment_WhenSportEquipment_ReturnsTrue()
    {
        var actual = await _sut.ContainsSportEquipment(new List<ExtraLuggageItem>
        {
            new () { ItemCategoryCode = "BAGE" },
            new () { ItemCategoryCode = "SEO"}
        });

        actual.Should().BeTrue();
    }

    [Fact]
    public async Task ContainsSportEquipment_WhenEmptyLuggage_ReturnsFalse()
    {
        var actual = await _sut.ContainsSportEquipment(new List<ExtraLuggageItem>());

        actual.Should().BeFalse();
    }

    [Fact]
    public async Task ContainsSportEquipment_WhenNullLuggage_ReturnsFalse()
    {
        var actual = await _sut.ContainsSportEquipment(null);

        actual.Should().BeFalse();
    }

    #endregion

    private Offer GetValidOffer()
    {
        return new Offer
        {
            Accom = new Accom
            {
                Prom = "EUBO",
                Unit = new List<Unit>
                {
                    new () { Occupation = new Occupation { Adults = 1, Children = 1, Infants = 1 } }
                }
            },
            PromotionCollections = ["lux"],
            Transport = new Transport
            {
                Routes = new List<Route>
                {
                    new()
                    {
                        IsExternal = true,
                        RouteId = "1",
                        Id = "route_id",
                        FltNo = "flight_number_01",
                        DepPt = "departure_port_01",
                        ArrPt = "arrival_port_02",
                        DepDate = new DateTimeOffset(new DateTime(2023, 1, 1)),
                        Direction = Direction.Inbound
                    },
                    new()
                    {
                        IsExternal = true,
                        RouteId = "2",
                        Id = "route_id",
                        FltNo = "flight_number_02",
                        DepPt = "departure_port_02",
                        ArrPt = "arrival_port_01",
                        DepDate = new DateTimeOffset(new DateTime(2023, 1, 2)),
                        Direction = Direction.Outbound
                    }
                }
            }

        };
    }

    private AccommodationOfferRequest GetValidRequest()
    {
        return new AccommodationOfferRequest
        {
            Luggage = new List<string>
            {
                "LUGE-1|BIKE-1",
                "LUGE-1",
                "LUSE-1"
            },
            Room = new List<RoomAllocation>
            {
                new()
                {
                    Adults = 1,
                    Children = 1,
                    Infants = 1
                }
            },
            LcbOut = "1|2",
            LcbIn = "1|2"
        };
    }

    private Domain.Data.ReferenceData.Luggage.Luggage GetDefaultLuggageConfiguration()
    {
        return new()
        {
            LuggageCategories = new List<LuggageCategory>
            {
                new()
                {
                    Code = "CABI",
                    Type = "Cabin Bags",
                    LuggageItems = new List<LuggageItemBase>()
                    {
                        new LuggageItem()
                        {
                            IsLuggageItemEnabled = true,
                            Code = "SCB1"
                        }
                    }
                },
                new()
                {
                    Code = "BAGE",
                    Type = "Bag",
                    LuggageItems = new List<LuggageItemBase>()
                    {
                        new LuggageItem()
                        {
                            IsLuggageItemEnabled = true,
                            Code = "LUS"
                        },
                        new LuggageItem()
                        {
                            IsLuggageItemEnabled = true,
                            Code = "LUG"
                        }
                    }
                },
                new()
                {
                    Code = "ADDB",
                    Type = "Bag",
                    LuggageItems = new List<LuggageItemBase>()
                    {
                        new LuggageItem()
                        {
                            IsLuggageItemEnabled = true,
                            Code = "LUSE"
                        },
                        new LuggageItem()
                        {
                            IsLuggageItemEnabled = true,
                            Code = "LUGE"
                        }
                    }
                },
                new()
                {
                    Code = "SEO",
                    Type = "Sports Equipment",
                    LuggageItems = new List<LuggageItemBase>()
                    {
                        new LuggageItem()
                        {
                            IsLuggageItemEnabled = true,
                            Code = "BIKE"
                        },
                        new LuggageItem()
                        {
                            IsLuggageItemEnabled = true,
                            Code = "CANO"
                        }
                    }
                }
            }
        };
    }

    private FlightExtraCategoryList[] GetDefaultExtras()
    {
        return new FlightExtraCategoryList[]
        {
            new()
            {
                RouteId = "1",
                FlightNumber = "flight_number_01",
                FlightExtraCategories = new()
                {
                    new()
                    {
                        CategoryCode = "ADDB",
                        CategoryType = "Bag",
                        FlightExtras = new()
                        {
                            new()
                            {
                                AdultPrice = 25,
                                ChildPrice = 20,
                                FlightExtraCode = "LUGE"
                            },
                            new()
                            {
                                AdultPrice = 15,
                                ChildPrice = 10,
                                FlightExtraCode = "LUSE"
                            }
                        }
                    },
                    new()
                    {
                        CategoryCode = "SEO",
                        CategoryType = "Sports Equipment",
                        FlightExtras = new()
                        {
                            new()
                            {
                                AdultPrice = 35,
                                ChildPrice = 30,
                                FlightExtraCode = "BIKE"
                            },
                            new()
                            {
                                AdultPrice = 45,
                                ChildPrice = 40,
                                FlightExtraCode = "CANO"
                            }
                        }
                    },
                    new()
                    {
                        CategoryCode = "CABI",
                        CategoryType = "Large Cabin Bag",
                        FlightExtras = new()
                        {
                            new()
                            {
                                AdultPrice = 75,
                                ChildPrice = 75,
                                FlightExtraCode = "SCB1"
                            }
                        }
                    }
                }
            },
            new()
            {
                RouteId = "2",
                FlightNumber = "flight_number_02",
                FlightExtraCategories = new()
                {
                    new()
                    {
                        CategoryCode = "ADDB",
                        CategoryType = "Bag",
                        FlightExtras = new()
                        {
                            new()
                            {
                                AdultPrice = 26,
                                ChildPrice = 21,
                                FlightExtraCode = "LUGE"
                            },
                            new()
                            {
                                AdultPrice = 16,
                                ChildPrice = 11,
                                FlightExtraCode = "LUSE"
                            }
                        }
                    },
                    new()
                    {
                        CategoryCode = "SEO",
                        CategoryType = "Sports Equipment",
                        FlightExtras = new()
                        {
                            new()
                            {
                                AdultPrice = 36,
                                ChildPrice = 31,
                                FlightExtraCode = "BIKE"
                            },
                            new()
                            {
                                AdultPrice = 46,
                                ChildPrice = 41,
                                FlightExtraCode = "CANO"
                            }
                        }
                    },
                    new()
                    {
                        CategoryCode = "CABI",
                        CategoryType = "Large Cabin Bag",
                        FlightExtras = new()
                        {
                            new()
                            {
                                AdultPrice = 75,
                                ChildPrice = 75,
                                FlightExtraCode = "SCB1"
                            }
                        }
                    }
                }
            }
        };
    }

    private List<ExtraLuggageItem> GetExpectedBeachComplimentLuggage()
    {
        return new List<ExtraLuggageItem>()
        {
            // Adult
            new()
            {
                ItemCode = "LUG",
                Quantity = 1,
                RouteId = "1",
                PassengerId = "1",
                ItemCategoryCode = "BAGE",
                Price = 0,
                IsComplimentary = true
            },
            new()
            {
                ItemCode = "LUG",
                Quantity = 1,
                RouteId = "2",
                PassengerId = "1",
                ItemCategoryCode = "BAGE",
                Price = 0,
                IsComplimentary = true
            },
            // Child
            new()
            {
                ItemCode = "LUG",
                Quantity = 1,
                RouteId = "1",
                PassengerId = "2",
                ItemCategoryCode = "BAGE",
                Price = 0,
                IsComplimentary = true
            },
            new()
            {
                ItemCode = "LUG",
                Quantity = 1,
                RouteId = "2",
                PassengerId = "2",
                ItemCategoryCode = "BAGE",
                Price = 0,
                IsComplimentary = true
            },
            // Infant (no bags)
        };
    }

    private List<ExtraLuggageItem> GetExpectedHoldLuggageItems()
    {
        return new List<ExtraLuggageItem>
        {
            // adult
            new()
            {
                ItemCode = "LUGE",
                Quantity = 1,
                RouteId = "1",
                PassengerId = "1",
                ItemCategoryCode = "ADDB",
                Price = 25
            },
            new()
            {
                ItemCode = "LUGE",
                Quantity = 1,
                RouteId = "2",
                PassengerId = "1",
                ItemCategoryCode = "ADDB",
                Price = 26
            },
            new()
            {
                ItemCode = "BIKE",
                Quantity = 1,
                RouteId = "1",
                PassengerId = "1",
                ItemCategoryCode = "SEO",
                Price = 35
            },
            new()
            {
                ItemCode = "BIKE",
                Quantity = 1,
                RouteId = "2",
                PassengerId = "1",
                ItemCategoryCode = "SEO",
                Price = 36
            },
            // child
            new()
            {
                ItemCode = "LUGE",
                Quantity = 1,
                RouteId = "1",
                PassengerId = "2",
                ItemCategoryCode = "ADDB",
                Price = 20
            },
            new()
            {
                ItemCode = "LUGE",
                Quantity = 1,
                RouteId = "2",
                PassengerId = "2",
                ItemCategoryCode = "ADDB",
                Price = 21
            },
            // Infant
            new()
            {
                ItemCode = "LUSE",
                Quantity = 1,
                RouteId = "1",
                PassengerId = "3",
                ItemCategoryCode = "ADDB",
                Price = 0
            },
            new()
            {
                ItemCode = "LUSE",
                Quantity = 1,
                RouteId = "2",
                PassengerId = "3",
                ItemCategoryCode = "ADDB",
                Price = 0
            }
        };
    }

    private List<ExtraLuggageItem> GetExpectedLcbLuggage()
    {
        return new List<ExtraLuggageItem>()
        {
            // Adult
            new()
            {
                ItemCode = "SCB1",
                Quantity = 1,
                RouteId = "1",
                PassengerId = "1",
                ItemCategoryCode = "CABI",
                Price = 75
            },
            new()
            {
                ItemCode = "SCB1",
                Quantity = 1,
                RouteId = "2",
                PassengerId = "1",
                ItemCategoryCode = "CABI",
                Price = 75
            },
            // Child
            new()
            {
                ItemCode = "SCB1",
                Quantity = 1,
                RouteId = "1",
                PassengerId = "2",
                ItemCategoryCode = "CABI",
                Price = 75
            },
            new()
            {
                ItemCode = "SCB1",
                Quantity = 1,
                RouteId = "2",
                PassengerId = "2",
                ItemCategoryCode = "CABI",
                Price = 75
            },
            // Infant, no bags
        };
    }

    private LuggageSettings GetDefaultSettings()
    {
        return new LuggageSettings
        {
            LargeCabinBagCode = "SCB1",
            LargeCabinBagMaxPerPassenger = 1,
            EnableHoldLuggageBookingFlow = true,
            EnableSportsEquipmentBookingFlow = true,
            EnableCabinBagsBookingFlow = true,
            SportsEquipmentMaxPerPassenger = 1,
            HoldLuggageMaxPerPassenger = 1,
            SportsEquipmentLargeMaxPerBooking = 1,
            SportsEquipmentCategoryCodes = "SEO",
        };
    }

    private ComplimentarySettings GetDefaultComplimentarySettings()
    {
        return new ComplimentarySettings
        {
            ComplimentaryIndex = new Dictionary<string, PromotionComplements>
            {
                {
                    "EUBO",
                    new PromotionComplements
                    {
                        PromotionType = "beach-holiday",
                        Codes = new[] { "EUBO" },
                        InternalFallbackCode = "EUBO",
                        Comment = "Beach Holiday Complement",
                        Luggage = new[]
                        {
                            new ComplimentaryLuggage
                            {
                                Code = "LUG",
                                Quantity = (1, 1, 0)
                            }
                        }
                    }
                },
                {
                    "EUCO",
                    new PromotionComplements
                    {
                        PromotionType = "city-breaks",
                        Codes = new[] { "EUCO" },
                        InternalFallbackCode = "EUBO",
                        Comment = "City Breaks Complement",
                        Luggage = Array.Empty<ComplimentaryLuggage>()
                    }
                }
            }
        };
    }

    [Fact]
    public async Task ProcessLuggage_ProcessNullInput()
    {
        SetupDefaultBags();

        var sut = new LuggageService(_referenceDataServiceMock.Object, _rulesValidatorServiceMock.Object, new PassengerIndexCalculator(), _flightExtraServiceMock.Object, _fixture.Create<ILogger<LuggageService>>());
        var act = async () => await sut.ValidateBookingLuggage(null);

        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task ValidateBookingLuggage_ProcessNullInput()
    {
        SetupDefaultBags();

        var sut = new LuggageService(_referenceDataServiceMock.Object, _rulesValidatorServiceMock.Object, new PassengerIndexCalculator(), _flightExtraServiceMock.Object, _fixture.Create<ILogger<LuggageService>>());
        var act = () => sut.ValidateBookingLuggage(null);

        await act.Should().NotThrowAsync();
    }

    private static ExtraLuggageInfo CreateLuggageInfo()
    {
        return new ExtraLuggageInfo
        {
            Items = new List<ExtraLuggageItem>()
        };
    }

    private static void AddLuggageItem(ExtraLuggageInfo luggageInfo, string itemCategoryCode, string itemCode,
        string routeId = "1", int passengerId = 1, int quantity = 1)
    {
        luggageInfo.Items.Add(new ExtraLuggageItem
        {
            RouteId = routeId,
            ItemCode = itemCode,
            ItemCategoryCode = itemCategoryCode,
            PassengerId = passengerId.ToString(),
            Quantity = quantity
        });
    }

    private void SetupDefaultBags()
    {
        _referenceDataServiceMock.Setup(x => x.GetLuggageSettings()).ReturnsAsync(new LuggageSettings
        {
            DefaultFreeBagsPerNonInfantPassenger = new Dictionary<string, int> { { Bag23KgCode, 1 } },
            EnableHoldLuggageBookingFlow = true,
            EnableSportsEquipmentBookingFlow = true
        });
    }

    [Fact]
    public void CombineLuggageCodes_NoCombines()
    {
        //Arrange
        var atcomLuggageCodes = new List<PackageItem>()
        {
            new() { Code = Bag23KgCode, Quantity = 1, PassengerId = "1" },
            new() { Code = Bag15KgCode, Quantity = 1, PassengerId = "1" },
            new() { Code = PrePaidExcessWeight3kg, Quantity = 1, PassengerId = "1" },
            new() { Code = WindsurferCode, Quantity = 1, PassengerId = "1" },
            new() { Code = BikeCode, Quantity = 1, PassengerId = "1" }
        };

        Domain.Data.ReferenceData.Luggage.Luggage luggage = new()
        {
            LuggageCategories = new List<LuggageCategory>
            {
                new()
                {
                    Code = HoldLuggageCategoryCode,
                    Type = "Hold Luggage",
                    LuggageItems = new List<LuggageItemBase>
                    {
                        new LuggageItem() { Code = Bag23KgCode, IsLuggageItemEnabled = true },
                        new LuggageItem() { Code = Bag15KgCode, IsLuggageItemEnabled = true },
                        new LuggageItem() { Code = PrePaidExcessWeight3kg, IsLuggageItemEnabled = true },
                    }
                },
                new()
                {
                    Code = LargeSportsEquipmentCategoryCode,
                    Type = "Sports Equipment",
                    LuggageItems = new List<LuggageItemBase>
                    {
                        new LuggageItem() { Code = BikeCode, IsLuggageItemEnabled = true },
                        new LuggageItem() { Code = WindsurferCode, IsLuggageItemEnabled = true }
                    }
                }
            }
        };

        // Act
        var result = LuggageService.CombineLuggageCodes(atcomLuggageCodes, luggage);

        // Assert
        result.Should().HaveCount(5);
    }

    [Fact]
    public void CombineLuggageCodes_Single26KgLuggage_GetCombinedLuggageCode()
    {
        //Arrange
        var atcomLuggageCodes = new List<PackageItem>()
        {
            new() { Code = Bag23KgCode, Quantity = 1, PassengerId = "1" },
            new() { Code = Bag15KgCode, Quantity = 1, PassengerId = "1" },
            new() { Code = PrePaidExcessWeight3kg, Quantity = 1, PassengerId = "1" },
            new() { Code = PrePaidExcessWeight3kg, Quantity = 1, PassengerId = "1" },
            new() { Code = WindsurferCode, Quantity = 1, PassengerId = "1" },
            new() { Code = BikeCode, Quantity = 1, PassengerId = "1" }
        };

        //Arrange
        var test = new List<string>() { Bag23KgCode, Bag15KgCode, PrePaidExcessWeight3kg, PrePaidExcessWeight3kg, LargeSportsEquipmentCategoryCode, BikeCode };
        Domain.Data.ReferenceData.Luggage.Luggage luggage = new()
        {
            LuggageCategories = new List<LuggageCategory>
            {
                new()
                {
                    Code = HoldLuggageCategoryCode,
                    Type = "Hold Luggage",
                    LuggageItems = new List<LuggageItemBase>
                    {
                        new LuggageItem() { Code = Bag23KgCode, IsLuggageItemEnabled = true },
                        new LuggageItem() { Code = Bag15KgCode, IsLuggageItemEnabled = true },
                        new LuggageItem() { Code = PrePaidExcessWeight3kg, IsLuggageItemEnabled = true },
                        new CombinedLuggageItem()
                        {
                            Codes = new List<string>(){ Bag23KgCode, PrePaidExcessWeight3kg },
                            Name = "26 KG",
                            IsLuggageItemEnabled = true
                        }
                    }
                },
                new()
                {
                    Code = LargeSportsEquipmentCategoryCode,
                    Type = "Sports Equipment",
                    LuggageItems = new List<LuggageItemBase>
                    {
                        new LuggageItem() { Code = BikeCode, IsLuggageItemEnabled = true },
                        new LuggageItem() { Code = WindsurferCode, IsLuggageItemEnabled = true }
                    }
                }
            }
        };

        // Act
        var result = LuggageService.CombineLuggageCodes(atcomLuggageCodes, luggage);

        // Assert
        result.Should().HaveCount(5);
        result.First(i => i.Code.Count(c => c == '_') == 1).Quantity.Should().Be(1);
    }

    [Fact]
    public void CombineLuggageCodes_Single29KgLuggage_GetCombinedLuggageCode()
    {
        //Arrange
        var atcomLuggageCodes = new List<PackageItem>()
        {
            new() { Code = Bag23KgCode, Quantity = 1, PassengerId = "1" },
            new() { Code = Bag15KgCode, Quantity = 1, PassengerId = "1" },
            new() { Code = PrePaidExcessWeight3kg, Quantity = 1, PassengerId = "1" },
            new() { Code = PrePaidExcessWeight3kg, Quantity = 1, PassengerId = "1" },
            new() { Code = WindsurferCode, Quantity = 1, PassengerId = "1" },
            new() { Code = BikeCode, Quantity = 1, PassengerId = "1" }
        };

        //Arrange
        var test = new List<string>() { Bag23KgCode, Bag15KgCode, PrePaidExcessWeight3kg, PrePaidExcessWeight3kg, LargeSportsEquipmentCategoryCode, BikeCode };
        Domain.Data.ReferenceData.Luggage.Luggage luggage = new()
        {
            LuggageCategories = new List<LuggageCategory>
            {
                new()
                {
                    Code = HoldLuggageCategoryCode,
                    Type = "Hold Luggage",
                    LuggageItems = new List<LuggageItemBase>
                    {
                        new LuggageItem() { Code = Bag23KgCode, IsLuggageItemEnabled = true },
                        new LuggageItem() { Code = Bag15KgCode, IsLuggageItemEnabled = true },
                        new LuggageItem() { Code = PrePaidExcessWeight3kg, IsLuggageItemEnabled = true },
                        new CombinedLuggageItem()
                        {
                            Codes =
                            [
                                Bag23KgCode,
                                PrePaidExcessWeight3kg,
                                PrePaidExcessWeight3kg
                            ],
                            Name = "29 KG",
                            IsLuggageItemEnabled = true
                        }
                    }
                },
                new()
                {
                    Code = LargeSportsEquipmentCategoryCode,
                    Type = "Sports Equipment",
                    LuggageItems = new List<LuggageItemBase>
                    {
                        new LuggageItem() { Code = BikeCode, IsLuggageItemEnabled = true },
                        new LuggageItem() { Code = WindsurferCode, IsLuggageItemEnabled = true }
                    }
                }
            }
        };

        // Act
        var result = LuggageService.CombineLuggageCodes(atcomLuggageCodes, luggage);

        // Assert
        result.Should().HaveCount(4);
        result.First(i => i.Code.Count(c => c == '_') == 2).Quantity.Should().Be(1);
    }

    [Fact]
    public void CombineLuggageCodes_Double29KgLuggage_GetCombinedLuggageCode()
    {
        //Arrange
        var atcomLuggageCodes = new List<PackageItem>()
        {
            new() { Code = Bag23KgCode, Quantity = 1, PassengerId = "1"},
            new() { Code = Bag15KgCode, Quantity = 1, PassengerId = "1" },
            new() { Code = PrePaidExcessWeight3kg, Quantity = 1, PassengerId = "1" },
            new() { Code = PrePaidExcessWeight3kg, Quantity = 1, PassengerId = "1" },
            new() { Code = Bag23KgCode, Quantity = 1, PassengerId = "1" },
            new() { Code = PrePaidExcessWeight3kg, Quantity = 1, PassengerId = "1" },
            new() { Code = PrePaidExcessWeight3kg, Quantity = 1, PassengerId = "1" },
            new() { Code = WindsurferCode, Quantity = 1, PassengerId = "1" },
            new() { Code = BikeCode, Quantity = 1, PassengerId = "1" }
        };

        Domain.Data.ReferenceData.Luggage.Luggage luggage = new()
        {
            LuggageCategories = new List<LuggageCategory>
            {
                new()
                {
                    Code = HoldLuggageCategoryCode,
                    Type = "Hold Luggage",
                    LuggageItems = new List<LuggageItemBase>
                    {
                        new LuggageItem() { Code = Bag23KgCode, IsLuggageItemEnabled = true },
                        new LuggageItem() { Code = Bag15KgCode, IsLuggageItemEnabled = true },
                        new LuggageItem() { Code = PrePaidExcessWeight3kg, IsLuggageItemEnabled = true },
                        new CombinedLuggageItem()
                        {
                            Codes =
                            [
                                Bag23KgCode,
                                PrePaidExcessWeight3kg,
                                PrePaidExcessWeight3kg
                            ],
                            Name = "29 KG",
                            IsLuggageItemEnabled = true
                        }
                    }
                },
                new()
                {
                    Code = LargeSportsEquipmentCategoryCode,
                    Type = "Sports Equipment",
                    LuggageItems = new List<LuggageItemBase>
                    {
                        new LuggageItem() { Code = BikeCode, IsLuggageItemEnabled = true },
                        new LuggageItem() { Code = WindsurferCode, IsLuggageItemEnabled = true }
                    }
                }
            }
        };

        // Act
        var result = LuggageService.CombineLuggageCodes(atcomLuggageCodes, luggage);

        // Assert
        result.Should().HaveCount(4);
        result.First(i => i.Code.Count(c => c == '_') == 2).Quantity.Should().Be(2);
    }

    [Fact]
    public void CombineLuggageCodes_Double29KgLuggageAndSingle26KgLuggage_GetCombinedLuggageCode()
    {
        //Arrange
        var atcomLuggageCodes = new List<PackageItem>()
        {
            new() { Code = Bag23KgCode, Quantity = 1, PassengerId = "1" },
            new() { Code = Bag23KgCode, Quantity = 1, PassengerId = "1" },
            new() { Code = PrePaidExcessWeight3kg, Quantity = 1, PassengerId = "1" },
            new() { Code = Bag15KgCode, Quantity = 1, PassengerId = "1" },
            new() { Code = PrePaidExcessWeight3kg, Quantity = 1, PassengerId = "1" },
            new() { Code = PrePaidExcessWeight3kg, Quantity = 1, PassengerId = "1" },
            new() { Code = Bag23KgCode, Quantity = 1, PassengerId = "1" },
            new() { Code = PrePaidExcessWeight3kg, Quantity = 1, PassengerId = "1" },
            new() { Code = PrePaidExcessWeight3kg, Quantity = 1, PassengerId = "1" },
            new() { Code = WindsurferCode, Quantity = 1, PassengerId = "1" },
            new() { Code = BikeCode, Quantity = 1, PassengerId = "1" }
        };

        Domain.Data.ReferenceData.Luggage.Luggage luggage = new()
        {
            LuggageCategories = new List<LuggageCategory>
            {
                new()
                {
                    Code = HoldLuggageCategoryCode,
                    Type = "Hold Luggage",
                    LuggageItems = new List<LuggageItemBase>
                    {
                        new LuggageItem() { Code = Bag23KgCode, IsLuggageItemEnabled = true },
                        new LuggageItem() { Code = Bag15KgCode, IsLuggageItemEnabled = true },
                        new CombinedLuggageItem()
                        {
                            Codes = new List<string>()
                            {
                                Bag23KgCode,
                                PrePaidExcessWeight3kg,
                                PrePaidExcessWeight3kg
                            },
                            Name = "29 KG",
                            IsLuggageItemEnabled = true
                        },
                        new CombinedLuggageItem()
                        {
                            Codes = new List<string>()
                            {
                                Bag23KgCode,
                                PrePaidExcessWeight3kg
                            },
                            Name = "26 KG",
                            IsLuggageItemEnabled = true
                        }
                    }
                },
                new()
                {
                    Code = LargeSportsEquipmentCategoryCode,
                    Type = "Sports Equipment",
                    LuggageItems = new List<LuggageItemBase>
                    {
                        new LuggageItem() { Code = BikeCode, IsLuggageItemEnabled = true },
                        new LuggageItem() { Code = WindsurferCode, IsLuggageItemEnabled = true }
                    }
                }
            }
        };

        // Act
        var result = LuggageService.CombineLuggageCodes(atcomLuggageCodes, luggage);

        // Assert
        result.Should().HaveCount(5);
        result.First(i => i.Code.Count(c => c == '_') == 2).Quantity.Should().Be(2);
        result.First(i => i.Code.Count(c => c == '_') == 1).Quantity.Should().Be(1);
    }

    [Fact]
    public void CombineLuggageCodes_Double26KgLuggage_GetCombinedLuggageCode()
    {
        //Arrange
        var atcomLuggageCodes = new List<PackageItem>()
        {
            new() { Code = Bag23KgCode, Quantity = 1, PassengerId = "1" },
            new() { Code = Bag23KgCode, Quantity = 1, PassengerId = "1" },
            new() { Code = Bag15KgCode, Quantity = 1, PassengerId = "1" },
            new() { Code = PrePaidExcessWeight3kg, Quantity = 1, PassengerId = "1" },
            new() { Code = PrePaidExcessWeight3kg, Quantity = 1, PassengerId = "1" },
            new() { Code = WindsurferCode, Quantity = 1, PassengerId = "1" },
            new() { Code = BikeCode, Quantity = 1, PassengerId = "1" }
        };

        var luggage = GetLuggageConfig();

        // Act
        var result = LuggageService.CombineLuggageCodes(atcomLuggageCodes, luggage);

        // Assert
        result.Should().HaveCount(4);
        result.Sum(i => i.Quantity).Should().Be(5);
        result.Count(i => i.Code.Contains("_")).Should().Be(1);
    }

    [Fact]
    public void CombineLuggageCodes_Double26KgLuggageCalculatePrice_GetCombinedLuggageCode()
    {
        //Arrange
        var atcomLuggageCodes = new List<PackageItem>()
        {
            new() { Code = Bag23KgCode, Quantity = 1, PassengerId = "1", Price = 10},
            new() { Code = Bag23KgCode, Quantity = 1, PassengerId = "1", Price = 10 },
            new() { Code = Bag15KgCode, Quantity = 1, PassengerId = "1",  Price = 5 },
            new() { Code = PrePaidExcessWeight3kg, Quantity = 1, PassengerId = "1",  Price = 5 },
            new() { Code = PrePaidExcessWeight3kg, Quantity = 1, PassengerId = "1", Price = 5 },
            new() { Code = WindsurferCode, Quantity = 1, PassengerId = "1", Price = 5 },
            new() { Code = BikeCode, Quantity = 1, PassengerId = "1", Price = 5 }
        };

        var luggage = GetLuggageConfig();

        // Act
        var result = LuggageService.CombineLuggageCodes(atcomLuggageCodes, luggage);

        // Assert
        result.Should().HaveCount(4);
        result.Sum(i => i.Quantity).Should().Be(5);
        var combinedCode = result.First(i => i.Code.Contains("_"));

        combinedCode.Quantity.Should().Be(2);
        combinedCode.Price.Should().Be(15);

        var windsurferLuggage = result.First(i => i.Code == WindsurferCode);
        windsurferLuggage.Price.Should().Be(5);
        windsurferLuggage.Quantity.Should().Be(1);

        var bikeLuggage = result.First(i => i.Code == BikeCode);
        bikeLuggage.Price.Should().Be(5);
        bikeLuggage.Quantity.Should().Be(1);
    }

    [Fact]
    public void CombineLuggageCodes_Double26KgLuggageCalculateQuantity_GetCombinedLuggageCode()
    {
        //Arrange
        var atcomLuggageCodes = new List<PackageItem>()
        {
            new() { Code = Bag23KgCode, Quantity = 3, PassengerId = "1", Price = 10},
            new() { Code = Bag23KgCode, Quantity = 1, PassengerId = "1", Price = 10 },
            new() { Code = Bag15KgCode, Quantity = 1, PassengerId = "1",  Price = 5 },
            new() { Code = PrePaidExcessWeight3kg, Quantity = 1, PassengerId = "1",  Price = 5 },
            new() { Code = PrePaidExcessWeight3kg, Quantity = 1, PassengerId = "1", Price = 5 },
            new() { Code = WindsurferCode, Quantity = 1, PassengerId = "1", Price = 5 },
            new() { Code = BikeCode, Quantity = 1, PassengerId = "1", Price = 5 }
        };

        var luggage = GetLuggageConfig();

        // Act
        var result = LuggageService.CombineLuggageCodes(atcomLuggageCodes, luggage);

        // Assert
        result.Should().HaveCount(5);
        result.Sum(i => i.Quantity).Should().Be(7);
        var combinedCode = result.First(i => i.Code.Contains("_"));

        combinedCode.Quantity.Should().Be(2);
        combinedCode.Price.Should().Be(15);

        var largeLuggage = result.First(i => i.Code == Bag23KgCode);
        largeLuggage.Quantity.Should().Be(2);
        largeLuggage.Price.Should().Be(10);

        var windsurferLuggage = result.First(i => i.Code == WindsurferCode);
        windsurferLuggage.Price.Should().Be(5);
        windsurferLuggage.Quantity.Should().Be(1);

        var bikeLuggage = result.First(i => i.Code == BikeCode);
        bikeLuggage.Price.Should().Be(5);
        bikeLuggage.Quantity.Should().Be(1);
    }

    [Fact]
    public void CombineLuggageCodes_Double26KgLuggageCalculateQuantityWithDifferentPassengers_NoCombinedLuggageCode()
    {
        //Arrange
        var atcomLuggageCodes = new List<PackageItem>()
        {
            new() { Code = Bag23KgCode, Quantity = 3, PassengerId = "1", Price = 10},
            new() { Code = Bag23KgCode, Quantity = 1, PassengerId = "1", Price = 10 },
            new() { Code = Bag15KgCode, Quantity = 2, PassengerId = "1",  Price = 5 },
            new() { Code = PrePaidExcessWeight3kg, Quantity = 1, PassengerId = "2",  Price = 5 },
            new() { Code = PrePaidExcessWeight3kg, Quantity = 1, PassengerId = "2", Price = 5 },
            new() { Code = WindsurferCode, Quantity = 1, PassengerId = "1", Price = 5 },
            new() { Code = BikeCode, Quantity = 1, PassengerId = "2", Price = 5 }
        };

        var luggage = GetLuggageConfig();

        // Act
        var result = LuggageService.CombineLuggageCodes(atcomLuggageCodes, luggage);

        // Assert
        result.Should().HaveCount(5);
        result.Sum(i => i.Quantity).Should().Be(10);
        var combinedCode = result.FirstOrDefault(i => i.Code.Contains("_"));

        combinedCode.Should().BeNull();

        var firstPassengerLargeLuggage = result.First(i => i.Code == Bag23KgCode && i.PassengerId == "1");
        firstPassengerLargeLuggage.Quantity.Should().Be(4);
        firstPassengerLargeLuggage.Price.Should().Be(10);

        var secondPassengerLargeLuggage = result.FirstOrDefault(i => i.Code == Bag23KgCode && i.PassengerId == "2");
        secondPassengerLargeLuggage.Should().BeNull();

        var windsurferLuggage = result.First(i => i.Code == WindsurferCode);
        windsurferLuggage.PassengerId.Should().Be("1");
        windsurferLuggage.Price.Should().Be(5);
        windsurferLuggage.Quantity.Should().Be(1);

        var bikeLuggage = result.First(i => i.Code == BikeCode);
        bikeLuggage.PassengerId.Should().Be("2");
        bikeLuggage.Price.Should().Be(5);
        bikeLuggage.Quantity.Should().Be(1);
    }

    [Fact]
    public void CombineLuggageCodes_Double26KgLuggageCalculateQuantityWithDifferentPassengers_GetCombinedLuggageCode()
    {
        //Arrange
        var atcomLuggageCodes = new List<PackageItem>()
        {
            new() { Code = Bag23KgCode, Quantity = 1, PassengerId = "1", Price = 10},
            new() { Code = Bag23KgCode, Quantity = 1, PassengerId = "2", Price = 8 },
            new() { Code = Bag15KgCode, Quantity = 2, PassengerId = "1",  Price = 5 },
            new() { Code = PrePaidExcessWeight3kg, Quantity = 1, PassengerId = "1",  Price = 5 },
            new() { Code = PrePaidExcessWeight3kg, Quantity = 1, PassengerId = "2", Price = 3 },
            new() { Code = WindsurferCode, Quantity = 1, PassengerId = "1", Price = 5 },
            new() { Code = BikeCode, Quantity = 1, PassengerId = "2", Price = 5 }
        };

        var luggage = GetLuggageConfig();

        // Act
        var result = LuggageService.CombineLuggageCodes(atcomLuggageCodes, luggage);

        // Assert
        result.Should().HaveCount(5);
        result.Sum(i => i.Quantity).Should().Be(6);
        var firstPassengerCombinedCode = result.First(i => i.Code.Contains("_") && i.PassengerId == "1");
        firstPassengerCombinedCode.PassengerId.Should().Be("1");
        firstPassengerCombinedCode.Quantity.Should().Be(1);
        firstPassengerCombinedCode.Price.Should().Be(15);

        var secondPassengerCombinedCode = result.First(i => i.Code.Contains("_") && i.PassengerId == "2");
        secondPassengerCombinedCode.PassengerId.Should().Be("2");
        secondPassengerCombinedCode.Quantity.Should().Be(1);
        secondPassengerCombinedCode.Price.Should().Be(11);

        var firstPassengerLargeLuggage = result.FirstOrDefault(i => i.Code == Bag23KgCode && i.PassengerId == "1");
        firstPassengerLargeLuggage.Should().BeNull();

        var secondPassengerLargeLuggage = result.FirstOrDefault(i => i.Code == Bag23KgCode && i.PassengerId == "2");
        secondPassengerLargeLuggage.Should().BeNull();

        var windsurferLuggage = result.First(i => i.Code == WindsurferCode);
        windsurferLuggage.PassengerId.Should().Be("1");
        windsurferLuggage.Price.Should().Be(5);
        windsurferLuggage.Quantity.Should().Be(1);

        var bikeLuggage = result.First(i => i.Code == BikeCode);
        bikeLuggage.PassengerId.Should().Be("2");
        bikeLuggage.Price.Should().Be(5);
        bikeLuggage.Quantity.Should().Be(1);
    }

    [Fact]
    public void CombineLuggageCodes_ComplementaryLuggage_GetCombinedLuggageCategoryCode()
    {
        //Arrange
        var atcomLuggageCodes = new List<PackageItem>()
        {
            new() { Code = LuggageUtils.CombineCodes(new List<string>() {Bag23KgCode, PrePaidExcessWeight3kg}), Quantity = 3, PassengerId = "1", Price = 10},
        };

        var luggage = GetLuggageConfig();

        // Act
        var result = LuggageService.CombineLuggageCodes(atcomLuggageCodes, luggage);

        // Assert
        result.Should().HaveCount(1);
        result.Sum(i => i.Quantity).Should().Be(3);
        var combinedCode = result.First(i => i.Code.Contains("_"));

        combinedCode.Quantity.Should().Be(3);
        combinedCode.Price.Should().Be(10);
        combinedCode.LuggageCategory.Code.Should().Be("BAGE_WGT");
    }

    private static Domain.Data.ReferenceData.Luggage.Luggage GetLuggageConfig()
    {
        return new()
        {
            LuggageCategories = new List<LuggageCategory>
            {
                new()
                {
                    Code = CabinBagsCategoryCode,
                    Type = "Cabin Bags",
                    Name = "Cabin Bags",
                    LuggageItems = new List<LuggageItemBase>
                    {
                        new LuggageItem()
                        {
                            Code = LargeCabinBagCode,
                            IsLuggageItemEnabled = true,
                            Name = "Large Cabin Bags"
                        }
                    }
                },
                new()
                {
                    Code = ExtraHoldluggageCategoryCode,
                    Type = "Bag",
                    Name = "Extra Hold Luggage",
                    LuggageItems = new List<LuggageItemBase>
                    {
                        new LuggageItem()
                        {
                            Code = ExtraHoldBaggage15kgCode,
                            IsLuggageItemEnabled = true,
                            Name = "extra 15kg hold bag",
                            Description = "Maximum 15kg per bag, stored in the plane hold. Outbound and return."
                        },
                        new LuggageItem()
                        {
                            Code = ExtraHoldBaggage23kgCode,
                            IsLuggageItemEnabled = true,
                            Name = "extra 23kg hold bag",
                            Description = "Maximum 23kg per bag, stored in the plane hold. Outbound and return."
                        }
                    }
                },
                new()
                {
                    Code = HoldLuggageCategoryCode,
                    Type = "Bag",
                    Name = "Hold Luggage",
                    LuggageItems = new List<LuggageItemBase>
                    {
                        new LuggageItem()
                        {
                            Code = Bag23KgCode,
                            IsLuggageItemEnabled = true,
                            Name = "23kg hold bag",
                            Description = "Maximum 23kg per bag, stored in the plane hold. Outbound and return."
                        },
                        new LuggageItem()
                        {
                            Code = Bag15KgCode,
                            IsLuggageItemEnabled = true,
                            Name = "15kg hold bag",
                            Description = "Maximum 15kg per bag, stored in the plane hold. Outbound and return."
                        },
                        new CombinedLuggageItem()
                        {
                            Codes = new List<string>(){ Bag23KgCode, PrePaidExcessWeight3kg },
                            Name = "26 KG",
                            IsLuggageItemEnabled = true,
                            Description = "Maximum 26kg per bag, stored in the plane hold. Outbound and return."
                        }
                    }
                },
                new()
                {
                    Code = LargeSportsEquipmentCategoryCode,
                    Type = "Sports Equipment",
                    Name = "Large Sports Equipment",
                    LuggageItems = new List<LuggageItemBase>
                    {
                        new LuggageItem()
                        {
                            Code = BikeCode,
                            Name = "Bicycle",
                            IsLuggageItemEnabled = true
                        },
                        new LuggageItem()
                        {
                            Code = CanoeKayakCode,
                            Name = "Canoe/Kayak",
                            IsLuggageItemEnabled = true
                        },
                        new LuggageItem()
                        {
                            Code = HandGliderCode,
                            Name = "Hang glider",
                            IsLuggageItemEnabled = true
                        },
                        new LuggageItem()
                        {
                            Code = WindsurferCode,
                            Name = "Windsurfer",
                            IsLuggageItemEnabled = true
                        }
                    }
                },
                new()
                {
                    Code = PrePaidExcessWeightCategoryCode,
                    Type = "Pre Paid Excess Weight",
                    LuggageItems = new List<LuggageItemBase>
                    {
                        new LuggageItem()
                        {
                            Code = PrePaidExcessWeight3kg,
                            Name = "Pre Paid Excess Weight 3kg",
                            IsLuggageItemEnabled = true
                        }
                    }
                },
                new()
                {
                    Code = SmallSportsEquipmentCategoryCode,
                    Type = "Sports Equipment",
                    Name = "Small Sports Equipment",
                    LuggageItems = new List<LuggageItemBase>
                    {
                        new LuggageItem()
                        {
                            Code = GolfBagCode,
                            Name = "Golf Bag",
                            IsLuggageItemEnabled = true
                        },
                        new LuggageItem()
                        {
                            Code = OtherSmallSportsEquipmentCode,
                            Name = "Other small sports equipment",
                            IsLuggageItemEnabled = true
                        },
                        new LuggageItem()
                        {
                            Code = SkisAndBootsCode,
                            Name = "Skis and/or boots",
                            IsLuggageItemEnabled = true
                        },
                        new LuggageItem()
                        {
                            Code = SnowboardCode,
                            Name = "Snowboard",
                            IsLuggageItemEnabled = true
                        }
                    }
                }
            }
        };
    }
}