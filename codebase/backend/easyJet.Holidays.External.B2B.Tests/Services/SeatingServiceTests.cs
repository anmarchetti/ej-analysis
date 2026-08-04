using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.Api.Domain.Data.Seats;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.B2B.Models;
using easyJet.Holidays.External.B2B.Models.Seats;
using easyJet.Holidays.External.B2B.Services;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Models.Api.Payload;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using System.Collections.ObjectModel;
using Xunit;
using AircraftType = easyJet.Holidays.Api.Domain.Data.ReferenceData.AircraftType;
using Benefit = easyJet.Holidays.External.B2B.Models.Seats.Benefit;
using Product = easyJet.Holidays.Api.Domain.Data.Seats.Product;
using Seat = easyJet.Holidays.Api.Domain.Data.DynamoDB.Bookings.Seat;

namespace easyJet.Holidays.External.B2B.Tests.Services;

public class SeatingServiceTests
{
    private readonly SeatingService _seatingService;
    private readonly Mock<IFlightSeatPlanCacheService> _flightSeatPlanCacheServiceMock = new();
    private readonly Mock<ILogger<SeatingService>> _loggerMock = new();
    private readonly Mock<IApiService> _apiServiceMock = new();
    private readonly Mock<IReferenceDataService> _referenceDataServiceMock = new();
    private readonly Mock<IHttpContextAccessor> _contextAccessorMock = new();
    private readonly Mock<ILanguageService> _languageServiceMock = new();

    private readonly List<Seat> _cachedSeatPlan;

    #region Test Data

    private readonly GetSeatsMapRequest _getSeatsMapRequest = new()
    {
        FlightNumber = 1020,
        DepAirportCode = "LGW",
        ArrAirportCode = "HAM",
        DepartureDate = "2022-12-01"
    };

    private readonly List<Offer> _offers = new()
    {
        new Offer
        {
            Accom = new()
            {
                Prom = "WINTER2022"
            },
            Transport = new Transport
            {
                Routes = new List<Route>
                {
                    new()
                    {
                        FltNo = "EZY1020",
                        Car = "EZY",
                        DepDate = DateTimeOffset.Parse("2022-12-01"),
                        DepPt = "LGW",
                        ArrPt = "HAM",
                        Direction = Direction.Outbound
                    },
                    new()
                    {
                        FltNo = "EZY1030",
                        Car = "EZY",
                        DepDate = DateTimeOffset.Parse("2022-12-10"),
                        DepPt = "HAM",
                        ArrPt = "LGW",
                        Direction = Direction.Inbound
                    }
                }
            },
            Currency = Currency.GBP
        },
        new Offer
        {
            Accom = new()
            {
                Prom = "WINTER2022"
            },
            Transport = new Transport
            {
                Routes = new List<Route>
                {
                    new()
                    {
                        FltNo = "EZY2020",
                        Car = "EZY",
                        DepDate = DateTimeOffset.Parse("2022-11-01"),
                        DepPt = "LGW",
                        ArrPt = "HAM",
                        Direction = Direction.Outbound
                    },
                    new()
                    {
                        FltNo = "EZY2030",
                        Car = "EZY",
                        DepDate = DateTimeOffset.Parse("2022-11-10"),
                        DepPt = "HAM",
                        ArrPt = "LGW",
                        Direction = Direction.Inbound
                    }
                }
            },
            Currency = Currency.GBP
        }
    };

    private readonly List<string> _outboundSeatNumbers = new() { "1A", "2B" };
    private readonly List<string> _inboundSeatNumbers = new() { "3A", "4B" };
    private readonly Route _route = new()
    {
        FltNo = "EZY1020",
        Car = "EZY",
        DepDate = DateTimeOffset.Parse("2022-12-01"),
        DepPt = "LGW",
        ArrPt = "HAM",
        Direction = Direction.Outbound
    };

    private readonly AircraftTypes _aircraftTypes = new()
    {
        Children = new List<AircraftType>
        {
            new()
            {
                Code = "319",
                Name = "Airbus A319"
            },
            new()
            {
                Code = "320B",
                Name = "Airbus A320 (Spaceflex) + Airbus A320N"
            },
            new()
            {
                Code = "321N",
                Name = "Airbus A321NX"
            },
            new()
            {
                Code = "M180",
                Name = "Airbus A320 (Original easyJet Style)"
            }
        }
    };

    private readonly PromotionCollections _promotionCollections = new()
    {
        Promotions = new ReadOnlyCollection<KeyedPromotion>(new List<KeyedPromotion>()
        {
            new(Key:"WINTER2022", PromotionCodes: "Winter Sale", ShowNewLabel: "1", Title: "Get 30% off on all flights", TooltipText:"", Icon:"", TrackingId: "Get 30% off on all flights")
        })
    };

    private readonly Benefits _benefits = new()
    {
        Children = new List<Holidays.Api.Domain.Data.ReferenceData.Benefit>
        {
            new()
            {
                Name = "One small cabin bag",
                Code = "B0001",
                Description = "Maximum size 45 x 36 x 20 cm.\r\nMust fit under the seat in front of you.",
                Icon = "B0001 icon",
                IsVisibleOnSeatMapPlan = true
            },
            new()
            {
                Name = "One large cabin bag",
                Code = "B0002",
                Description = "Maximum size 56 x 45 x 25 cm.\r\nSubject to available space",
                Icon = "B0002 icon",
                IsVisibleOnSeatMapPlan = true
            },
            new()
            {
                Name = "One large cabin bag",
                Code = "B0003",
                Description = "Maximum size 56 x 45 x 25 cm.",
                Icon = "B0003 icon",
                IsVisibleOnSeatMapPlan = true
            },
            new()
            {
                Name = "Speedy Boarding",
                Code = "B0006",
                Description = "Be amongst the first to board, or board at your leisure.",
                IsVisibleOnSeatMapPlan = false
            },
            new()
            {
                Name = "Dedicated Bag Drop",
                Code = "B0007",
                Description = "Priority Bag Drop desks in the check-in area.",
                IsVisibleOnSeatMapPlan = false
            }
        }
    };

    private readonly GetSeatsPlanResponse _getSeatsPlanResponse = new()
    {
        Payload = new XmlApiPayload<B2BApiResponse<GetSeatsPlanRoot>>
        {
            Body = new B2BApiResponse<GetSeatsPlanRoot>
            {
                Success = 1,
                DataListRoot = new GetSeatsPlanRoot
                {
                    SeatPlanResponse = new GetSeatsPlanRootBody
                    {
                        CurrencyCode = "GBP",
                        AircraftType = "320B",
                        IsWrapped = "Y",
                        Rows = new Row[]
                            {
                               new()
                                {
                                    RowNumber = 1,
                                    IsExitRow = true,
                                    PriceBandName = "Extra legroom",
                                    Blocks = new List<Block>
                                    {
                                        new()
                                        {
                                            Seats = new List<Models.Seats.Seat>
                                            {
                                                new()
                                                {
                                                    ChargeCodeId = 160,
                                                    IsWindowSeat = true,
                                                    IsExitRow = true,
                                                    Number = "1A",
                                                    Price = 49.99m,
                                                    PriceWithCreditCardFee = 49.99m,
                                                    PriceBand = "Extra legroom",
                                                    PriceBandId = 1,
                                                    SeatAccess = "Restricted",
                                                    IsBulkheadSeat = "True",
                                                    IsOccupiedByInfant = "False"
                                                },
                                                new()
                                                {
                                                    ChargeCodeId = 160,
                                                    IsMiddleSeat = true,
                                                    IsExitRow = true,
                                                    Number = "1B",
                                                    Price = 49.99m,
                                                    PriceWithCreditCardFee = 49.99m,
                                                    PriceBand = "Extra legroom",
                                                    PriceBandId = 1,
                                                    SeatAccess = "Restricted",
                                                    IsBulkheadSeat = "True",
                                                    IsOccupiedByInfant = "False"
                                                },
                                                new()
                                                {
                                                    ChargeCodeId = 160,
                                                    IsAisleSeat = true,
                                                    IsAvailable = true,
                                                    IsExitRow = true,
                                                    Number = "1C",
                                                    Price = 49.99m,
                                                    PriceWithCreditCardFee = 49.99m,
                                                    PriceBand = "Extra legroom",
                                                    PriceBandId = 1,
                                                    SeatAccess = "Restricted",
                                                    IsBulkheadSeat = "True",
                                                    IsOccupiedByInfant = "False"
                                                }
                                            }
                                        },
                                        new()
                                        {
                                            Seats = new List<Models.Seats.Seat>
                                            {
                                                new()
                                                {
                                                    ChargeCodeId = 160,
                                                    IsAisleSeat = true,
                                                    IsAvailable = true,
                                                    IsExitRow = true,
                                                    Number = "1D",
                                                    Price = 49.99m,
                                                    PriceWithCreditCardFee = 49.99m,
                                                    PriceBand = "Extra legroom",
                                                    PriceBandId = 1,
                                                    SeatAccess = "Restricted",
                                                    IsBulkheadSeat = "True",
                                                    IsOccupiedByInfant = "False"
                                                },
                                                new()
                                                {
                                                    ChargeCodeId = 160,
                                                    IsMiddleSeat = true,
                                                    IsAvailableForChild = true,
                                                    IsAvailableForInfant = true,
                                                    Number = "1E",
                                                    Price = 49.99m,
                                                    PriceWithCreditCardFee = 49.99m,
                                                    PriceBand = "Extra legroom",
                                                    PriceBandId = 1,
                                                    SeatAccess = "Regular",
                                                    IsBulkheadSeat = "True",
                                                    IsOccupiedByInfant = "False"
                                                },
                                                new()
                                                {
                                                    ChargeCodeId = 160,
                                                    IsWindowSeat = true,
                                                    IsAvailableForChild = true,
                                                    IsAvailableForInfant = true,
                                                    Number = "1F",
                                                    Price = 49.99m,
                                                    PriceWithCreditCardFee = 49.99m,
                                                    PriceBand = "Extra legroom",
                                                    PriceBandId = 1,
                                                    SeatAccess = "Regular",
                                                    IsBulkheadSeat = "True",
                                                    IsOccupiedByInfant = "False"
                                                }
                                            }
                                        }
                                    }
                                },
                                new()
                                {
                                    RowNumber = 4,
                                    PriceBandName = "Up Front",
                                    Blocks = new List<Block>
                                    {
                                        new()
                                        {
                                            Seats = new List<Models.Seats.Seat>
                                            {
                                                new()
                                                {
                                                    ChargeCodeId = 161,
                                                    IsAvailable = true,
                                                    IsWindowSeat = true,
                                                    IsAvailableForChild = true,
                                                    IsAvailableForInfant = true,
                                                    Number = "4A",
                                                    Price = 45.49m,
                                                    PriceWithCreditCardFee = 45.49m,
                                                    PriceBand = "Up Front",
                                                    PriceBandId = 2,
                                                    SeatAccess = "Regular",
                                                    IsBulkheadSeat = "False",
                                                    IsOccupiedByInfant = "False"
                                                },
                                                new()
                                                {
                                                    ChargeCodeId = 161,
                                                    IsAvailable = true,
                                                    IsMiddleSeat = true,
                                                    IsAvailableForChild = true,
                                                    IsAvailableForInfant = true,
                                                    Number = "4B",
                                                    Price = 45.49m,
                                                    PriceWithCreditCardFee = 45.49m,
                                                    PriceBand = "Up Front",
                                                    PriceBandId = 2,
                                                    SeatAccess = "Regular",
                                                    IsBulkheadSeat = "False",
                                                    IsOccupiedByInfant = "False"
                                                },
                                                new()
                                                {
                                                    ChargeCodeId = 161,
                                                    IsAisleSeat = true,
                                                    IsAvailable = true,
                                                    IsAvailableForChild = true,
                                                    IsAvailableForInfant = true,
                                                    Number = "4C",
                                                    Price = 45.49m,
                                                    PriceWithCreditCardFee = 45.49m,
                                                    PriceBand = "Up Front",
                                                    PriceBandId = 2,
                                                    SeatAccess = "Regular",
                                                    IsBulkheadSeat = "False",
                                                    IsOccupiedByInfant = "False"
                                                }
                                            }
                                        },
                                        new()
                                        {
                                            Seats = new List<Models.Seats.Seat>
                                            {
                                                new()
                                                {
                                                    ChargeCodeId = 161,
                                                    IsAisleSeat = true,
                                                    IsAvailable = true,
                                                    IsAvailableForChild = true,
                                                    IsAvailableForInfant = true,
                                                    Number = "4D",
                                                    Price = 45.49m,
                                                    PriceWithCreditCardFee = 45.49m,
                                                    PriceBand = "Up Front",
                                                    PriceBandId = 2,
                                                    SeatAccess = "Regular",
                                                    IsBulkheadSeat = "False",
                                                    IsOccupiedByInfant = "False"
                                                },
                                                new()
                                                {
                                                    ChargeCodeId = 161,
                                                    IsMiddleSeat = true,
                                                    IsAvailableForChild = true,
                                                    IsAvailableForInfant = true,
                                                    Number = "4E",
                                                    Price = 45.49m,
                                                    PriceWithCreditCardFee = 45.49m,
                                                    PriceBand = "Up Front",
                                                    PriceBandId = 2,
                                                    SeatAccess = "Regular",
                                                    IsBulkheadSeat = "False",
                                                    IsOccupiedByInfant = "False"
                                                },
                                                new()
                                                {
                                                    ChargeCodeId = 161,
                                                    IsWindowSeat = true,
                                                    IsAvailableForChild = true,
                                                    IsAvailableForInfant = true,
                                                    Number = "4F",
                                                    Price = 45.49m,
                                                    PriceWithCreditCardFee = 45.49m,
                                                    PriceBand = "Up Front",
                                                    PriceBandId = 2,
                                                    SeatAccess = "Regular",
                                                    IsBulkheadSeat = "False",
                                                    IsOccupiedByInfant = "False"
                                                }
                                            }
                                        }
                                    }
                                },
                                new()
                                {
                                    RowNumber = 5,
                                    PriceBandName = "",
                                    Blocks = new List<Block>
                                    {
                                        new()
                                        {
                                            Seats = new List<Models.Seats.Seat>
                                            {
                                                new()
                                                {
                                                    ChargeCodeId = 162,
                                                    IsWindowSeat = true,
                                                    IsAvailableForChild = true,
                                                    IsAvailableForInfant = true,
                                                    Number = "5A",
                                                    Price = 10.99m,
                                                    PriceWithCreditCardFee = 10.99m,
                                                    PriceBand = "",
                                                    PriceBandId = 3,
                                                    SeatAccess = "Regular",
                                                    IsBulkheadSeat = "False",
                                                    IsOccupiedByInfant = "False"
                                                },
                                                new()
                                                {
                                                    ChargeCodeId = 162,
                                                    IsMiddleSeat = true,
                                                    IsAvailableForChild = true,
                                                    IsAvailableForInfant = true,
                                                    Number = "5B",
                                                    Price = 10.99m,
                                                    PriceWithCreditCardFee = 10.99m,
                                                    PriceBand = "",
                                                    PriceBandId = 3,
                                                    SeatAccess = "Regular",
                                                    IsBulkheadSeat = "False",
                                                    IsOccupiedByInfant = "False"
                                                },
                                                new()
                                                {
                                                    ChargeCodeId = 162,
                                                    IsAisleSeat = true,
                                                    IsAvailableForChild = true,
                                                    IsAvailableForInfant = true,
                                                    Number = "5C",
                                                    Price = 10.99m,
                                                    PriceWithCreditCardFee = 10.99m,
                                                    PriceBand = "",
                                                    PriceBandId = 3,
                                                    SeatAccess = "Regular",
                                                    IsBulkheadSeat = "False",
                                                    IsOccupiedByInfant = "False"
                                                }
                                            }
                                        },
                                        new()
                                        {
                                            Seats = new List<Models.Seats.Seat>
                                            {
                                                new()
                                                {
                                                    ChargeCodeId = 162,
                                                    IsAisleSeat = true,
                                                    IsAvailableForChild = true,
                                                    IsAvailableForInfant = true,
                                                    Number = "5D",
                                                    Price = 10.99m,
                                                    PriceWithCreditCardFee = 10.99m,
                                                    PriceBand = "",
                                                    PriceBandId = 3,
                                                    SeatAccess = "Regular",
                                                    IsBulkheadSeat = "False",
                                                    IsOccupiedByInfant = "False"
                                                },
                                                new()
                                                {
                                                    ChargeCodeId = 162,
                                                    IsMiddleSeat = true,
                                                    IsAvailableForChild = true,
                                                    IsAvailableForInfant = true,
                                                    Number = "5E",
                                                    Price = 10.99m,
                                                    PriceWithCreditCardFee = 10.99m,
                                                    PriceBand = "",
                                                    PriceBandId = 3,
                                                    SeatAccess = "Regular",
                                                    IsBulkheadSeat = "False",
                                                    IsOccupiedByInfant = "False"
                                                },
                                                new()
                                                {
                                                    ChargeCodeId = 162,
                                                    IsWindowSeat = true,
                                                    IsAvailableForChild = true,
                                                    IsAvailableForInfant = true,
                                                    Number = "5F",
                                                    Price = 10.99m,
                                                    PriceWithCreditCardFee = 10.99m,
                                                    PriceBand = "",
                                                    PriceBandId = 3,
                                                    SeatAccess = "Regular",
                                                    IsBulkheadSeat = "False",
                                                    IsOccupiedByInfant = "False"
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                    },
                    Offers = new Offers
                    {
                        Fare = new Models.Seats.Fare
                        {
                            Benefits = new List<Benefit>
                                {
                                    new()
                                    {
                                        Key = "B0001",
                                        Quantity = 1
                                    }
                                },
                            DisplayName = "Standard",
                            FareClass = "Y"
                        },
                        AncillaryOffers = new List<Models.Seats.Product>
                            {
                                new()
                                {
                                    Benefits = new List<Benefit>
                                    {
                                        new()
                                        {
                                            Key = "B0003",
                                            Quantity = 1
                                        },
                                        new()
                                        {
                                            Key = "B0006",
                                            Quantity = 1
                                        },
                                        new()
                                        {
                                            Key = "B0007",
                                            Quantity = 1
                                        }
                                    },
                                    ChargeCode = "SSC1",
                                    ChargeCodeId = "160",
                                    DisplayName = "Extra Legroom"
                                },
                                new()
                                {
                                    Benefits = new List<Benefit>
                                    {
                                        new()
                                        {
                                            Key = "B0003",
                                            Quantity = 1
                                        },
                                        new()
                                        {
                                            Key = "B0006",
                                            Quantity = 1
                                        },
                                        new()
                                        {
                                            Key = "B0007",
                                            Quantity = 1
                                        }
                                    },
                                    ChargeCode = "SSC2",
                                    ChargeCodeId = "161",
                                    DisplayName = "Up Front"
                                }
                            }
                    }
                }
            }
        }
    };

    private readonly HashSet<int> _premiumSeatChargeCodes = new() { 160, 161, 242 };

    #endregion

    public SeatingServiceTests()
    {
        IFixture fixture = new Fixture();

        var b2BSettings = Options.Create(new B2BSettings
        {
            Url = "https://b2b.129.ejtest.com",
            Api = new B2BApiSettings { BasicService = "BasicService.asmx", MyService = "MyService.asmx" },
            PremiumSeatChargeCodeIds = _premiumSeatChargeCodes
        });

        var endpointsProviderMock = new Mock<EndpointsProvider>(b2BSettings, Options.Create(new EnvironmentBehaviourSettings()), null, null);

        _apiServiceMock
            .Setup(mock => mock.GetResponseContentAsync<GetSeatsPlanRequest, GetSeatsPlanResponse>(It.IsAny<GetSeatsPlanRequest>()))
            .ReturnsAsync(_getSeatsPlanResponse);

        _referenceDataServiceMock.Setup(mock => mock.GetAircraftTypes()).ReturnsAsync(_aircraftTypes);
        _referenceDataServiceMock.Setup(mock => mock.GetBenefits()).ReturnsAsync(_benefits);
        _referenceDataServiceMock.Setup(mock => mock.GetPromotionCollections()).ReturnsAsync(_promotionCollections);

        _seatingService = new SeatingService(
            _apiServiceMock.Object,
            b2BSettings,
            endpointsProviderMock.Object,
            _contextAccessorMock.Object,
            _referenceDataServiceMock.Object,
            _flightSeatPlanCacheServiceMock.Object,
            _loggerMock.Object,
            _languageServiceMock.Object
        );

        _cachedSeatPlan = new List<Seat>
        {
            new()
            {
                Number = "1A",
                Price = 8.5m,
                PriceBand = "Standard",
                Products = fixture.Create<List<Product>>()
            },
            new()
            {
                Number = "2B",
                Price = 8.5m,
                PriceBand = "Standard",
                Products = fixture.Create<List<Product>>()
            },
            new()
            {
                Number = "3A",
                Price = 8.5m,
                PriceBand = "Standard",
                Products = fixture.Create<List<Product>>()
            },
            new()
            {
                Number = "4B",
                Price = 8.5m,
                PriceBand = "Standard",
                Products = fixture.Create<List<Product>>()
            }
        };
    }

    [Fact]
    public async Task EnrichWithSeatsInfo_AddsSeatsSelection()
    {
        _flightSeatPlanCacheServiceMock
            .Setup(mock => mock.GetFlightSeatPlan(It.IsAny<string>()))
            .ReturnsAsync(_cachedSeatPlan);

        await _seatingService.EnrichWithCachedSeatsInfo(_offers, _outboundSeatNumbers, _inboundSeatNumbers);

        foreach (var offer in _offers)
        {
            var outboundFlightId = offer.Transport.Routes.Single(route => route.Direction == Direction.Outbound).FlightNumberWithoutCar;
            var inboundFlightId = offer.Transport.Routes.Single(route => route.Direction == Direction.Inbound).FlightNumberWithoutCar;
            offer.SeatSelection.Should().NotBeNullOrEmpty();

            var outboundSeatMap = offer.SeatSelection.SingleOrDefault(seatMap => seatMap.FlightNumber == outboundFlightId);
            outboundSeatMap.Should().NotBeNull();
            outboundSeatMap.Seats.Should().NotBeNullOrEmpty();
            var inboundSeatMap = offer.SeatSelection.SingleOrDefault(seatMap => seatMap.FlightNumber == inboundFlightId);
            inboundSeatMap.Should().NotBeNull();
            inboundSeatMap.Seats.Should().NotBeNullOrEmpty();

            outboundSeatMap.Seats.Select(seat => seat.SeatNumber).Should().BeEquivalentTo(_outboundSeatNumbers);
            inboundSeatMap.Seats.Select(seat => seat.SeatNumber).Should().BeEquivalentTo(_inboundSeatNumbers);

            outboundSeatMap.Seats.Union(inboundSeatMap.Seats).ToList().ForEach(seat =>
            {
                var cachedSeat = _cachedSeatPlan.Single(cachedSeat => cachedSeat.Number == seat.SeatNumber);
                seat.Price.Should().Be(cachedSeat.Price);
                seat.PriceBand.Should().Be(cachedSeat.PriceBand);
                seat.Products.Should().BeEquivalentTo(cachedSeat.Products);
            });
        }
    }

    [Fact]
    public async Task EnrichWithSeatsInfo_NoExceptionsWithNullInput()
    {
        Func<Task> act = () => _seatingService.EnrichWithCachedSeatsInfo(null, null, null);
        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task EnrichWithSeatsInfo_NoSeatsSelectionWithoutCachedSeatMap()
    {
        _flightSeatPlanCacheServiceMock
            .Setup(mock => mock.GetFlightSeatPlan(It.IsAny<string>()))
            .ThrowsAsync(new Exception());

        await _seatingService.EnrichWithCachedSeatsInfo(_offers, _outboundSeatNumbers, _inboundSeatNumbers);

        foreach (var offer in _offers)
        {
            offer.SeatSelection.Should().BeNull();
        }
    }

    [Fact]
    public async Task GetCachedSeatsInfo_ReturnsNullWithNullInput()
    {
        var result = await _seatingService.GetCachedSeatsInfo(null, null, null, null);
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetCachedSeatsInfo_ReturnsNullWithEmptyInput()
    {
        var result = await _seatingService.GetCachedSeatsInfo(_route, null, new List<string>(), null);
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetCachedSeatsInfo_ReturnsNullWithoutCachedSeatMap()
    {
        _flightSeatPlanCacheServiceMock
            .Setup(mock => mock.GetFlightSeatPlan(It.IsAny<string>()))
            .ThrowsAsync(new Exception());

        var result = await _seatingService.GetCachedSeatsInfo(_route, null, _inboundSeatNumbers, null);

        result.Should().BeNull();
    }

    [Fact]
    public async Task GetCachedSeatsInfo_ReturnsSeatMap()
    {
        _flightSeatPlanCacheServiceMock
            .Setup(mock => mock.GetFlightSeatPlan(It.IsAny<string>()))
            .ReturnsAsync(_cachedSeatPlan);

        var result = await _seatingService.GetCachedSeatsInfo(_route, null, _inboundSeatNumbers, null);

        result.Should().NotBeNull();
        result.FlightNumber.Should().Be(_route.FlightNumberWithoutCar);
        result.Seats.Select(seat => seat.SeatNumber).Should().BeEquivalentTo(_inboundSeatNumbers);
        result.Seats.ForEach(seat =>
        {
            var cachedSeat = _cachedSeatPlan.Single(cachedSeat => cachedSeat.Number == seat.SeatNumber);
            seat.Price.Should().Be(cachedSeat.Price);
            seat.PriceBand.Should().Be(cachedSeat.PriceBand);
            seat.Products.Should().BeEquivalentTo(cachedSeat.Products);
        });
    }

    [Fact]
    public async Task GetSeatsMap_ReturnsCorrectVisibleProducts()
    {
        var result = await _seatingService.GetSeatsMap(new GetSeatsMapRequest());

        result.VisibleProducts.Should().BeEquivalentTo(
            _benefits.Children.Where(b => b.IsVisibleOnSeatMapPlan).Select(b =>
                new Product
                {
                    Id = b.Code,
                    Name = b.Name,
                    Description = b.Description,
                    Icon = b.Icon
                }));
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task GetSeatsMap_ReturnsCorrectSeats(bool includeOnlyProductCodes)
    {
        var productsDictionary = GetProductsByChargeCode();

        var result = await _seatingService.GetSeatsMap(new GetSeatsMapRequest(), includeOnlyProductCodes);

        result.Rows.Count.Should().Be(_getSeatsPlanResponse.Payload.Body.DataListRoot.SeatPlanResponse.Rows.Length);

        foreach (var seatMapRow in result.Rows)
        {
            var originalRow = _getSeatsPlanResponse.Payload.Body.DataListRoot.SeatPlanResponse.Rows.Single(r => r.RowNumber == seatMapRow.RowNumber);
            seatMapRow.IsExitRow.Should().Be(originalRow.IsExitRow);
            seatMapRow.IsOverWing.Should().Be(originalRow.IsOverWing);
            seatMapRow.Blocks.Count.Should().Be(originalRow.Blocks.Count);

            var seats = seatMapRow.Blocks.SelectMany(b => b.Seats);
            var originalSeats = originalRow.Blocks.SelectMany(b => b.Seats);

            foreach (var seatMapSeat in seats)
            {
                var originalSeat = originalSeats.Single(s => s.Number == seatMapSeat.Number);

                seatMapSeat.IsExitRow.Should().Be(originalSeat.IsExitRow);
                seatMapSeat.IsAisleSeat.Should().Be(originalSeat.IsAisleSeat);
                seatMapSeat.IsAvailable.Should().Be(originalSeat.IsAvailable);
                seatMapSeat.IsBulkheadSeat.Should().Be(bool.Parse(originalSeat.IsBulkheadSeat));
                seatMapSeat.IsOccupiedByInfant.Should().Be(bool.Parse(originalSeat.IsOccupiedByInfant));
                seatMapSeat.Price.Should().Be(originalSeat.Price);
                seatMapSeat.PriceBand.Should().Be(originalSeat.PriceBand);
                seatMapSeat.PriceBandId.Should().Be(originalSeat.PriceBandId);
                seatMapSeat.SeatAccess.Should().Be(originalSeat.SeatAccess);
                seatMapSeat.ChargeCodeId.Should().Be(originalSeat.ChargeCodeId);
                seatMapSeat.IsPremiumSeat.Should().Be(_premiumSeatChargeCodes.Contains(seatMapSeat.ChargeCodeId));
                seatMapSeat.Products.Should().BeEquivalentTo(productsDictionary[originalSeat.ChargeCodeId]);
            }
        }

        Dictionary<int, List<Product>> GetProductsByChargeCode()
        {
            var offers = _getSeatsPlanResponse.Payload.Body.DataListRoot.Offers;
            Dictionary<int, List<Product>> result = new();

            var chargeCodes = _getSeatsPlanResponse.Payload.Body.DataListRoot.SeatPlanResponse.Rows
                .SelectMany(r => r.Blocks)
                .SelectMany(b => b.Seats)
                .Select(s => s.ChargeCodeId)
                .Distinct()
                .ToList();

            foreach (int chargeCode in chargeCodes)
            {
                var productIds = offers.Fare.Benefits
                    .Select(b => b.Key)
                    .Union(offers.AncillaryOffers
                        .Where(p => p.ChargeCodeId == chargeCode.ToString())
                        .SelectMany(p => p.Benefits.Select(b => b.Key)));

                var products = _benefits.Children
                    .Where(b => b.IsVisibleOnSeatMapPlan && productIds.Contains(b.Code))
                    .Select(b => new Product
                    {
                        Id = b.Code,
                        Name = includeOnlyProductCodes ? null : b.Name,
                        Description = includeOnlyProductCodes ? null : b.Description,
                        Icon = includeOnlyProductCodes ? null : b.Icon
                    })
                    .ToList();

                result.Add(chargeCode, products);
            }

            return result;
        }
    }

    [Fact]
    public async Task GetCachedSeatsMap_CachesNewValueIfCacheIsEmpty()
    {
        _flightSeatPlanCacheServiceMock
            .Setup(mock => mock.GetFlightSeatPlan(It.IsAny<string>()))
            .ReturnsAsync((List<Seat>)null);

        await _seatingService.GetCachedSeatsMap(_getSeatsMapRequest);

        _flightSeatPlanCacheServiceMock.Verify(x => x.CreateFlightSeatPlan(It.IsAny<string>(), It.IsAny<GetSeatsMapResponse>()), Times.Once);
    }

    [Fact]
    public async Task GetCachedSeatsMap_ForRoute_CachesNewValueIfCacheIsEmpty()
    {
        _flightSeatPlanCacheServiceMock
            .Setup(mock => mock.GetFlightSeatPlan(It.IsAny<string>()))
            .ReturnsAsync((List<Seat>)null);

        await _seatingService.GetCachedSeatsMap(_route, null);

        _flightSeatPlanCacheServiceMock.Verify(x => x.CreateFlightSeatPlan(It.IsAny<string>(), It.IsAny<GetSeatsMapResponse>()), Times.Once);
    }

    [Fact]
    public async Task GetCachedSeatsMap_ReturnsCachedValue()
    {
        _flightSeatPlanCacheServiceMock
            .Setup(mock => mock.GetFlightSeatPlan(It.IsAny<string>()))
            .ReturnsAsync(_cachedSeatPlan);

        var result = await _seatingService.GetCachedSeatsMap(_getSeatsMapRequest);
        result.Should().BeSameAs(_cachedSeatPlan);
    }

    [Fact]
    public async Task GetCachedSeatsMap_ForRoute_ReturnsCachedValue()
    {
        _flightSeatPlanCacheServiceMock
            .Setup(mock => mock.GetFlightSeatPlan(It.IsAny<string>()))
            .ReturnsAsync(_cachedSeatPlan);

        var result = await _seatingService.GetCachedSeatsMap(_route, null);
        result.Should().BeSameAs(_cachedSeatPlan);
    }

    [Fact]
    public async Task GetSeatsMap_AppliesLuxPromotion_ZeroPriceForRearStandardBand()
    {
        var luxPromotions = new PromotionCollections
        {
            Promotions = new ReadOnlyCollection<KeyedPromotion>(
                new List<KeyedPromotion>
                {
                    new(Key: "lux", PromotionCodes: "LUXPROMO,OTHER", ShowNewLabel: "1", Title: "", TooltipText: "", Icon: "", TrackingId: "")
                })
        };

        _referenceDataServiceMock.Setup(mock => mock.GetPromotionCollections()).ReturnsAsync(luxPromotions);

        var request = new GetSeatsMapRequest
        {
            Promo = "LUXPROMO"
        };

        var result = await _seatingService.GetSeatsMap(request);

        var rearStandardSeat = result.Rows
            .SelectMany(row => row.Blocks)
            .SelectMany(block => block.Seats)
            .Single(seat => seat.Number == "5A");

        var premiumSeat = result.Rows
            .SelectMany(row => row.Blocks)
            .SelectMany(block => block.Seats)
            .Single(seat => seat.Number == "4A");

        rearStandardSeat.Price.Should().Be(0);
        premiumSeat.Price.Should().Be(45.49m);
    }

    [Fact]
    public async Task GetCachedSeatsMap_AppliesLuxPromotion_ZeroPriceForRearStandardBand()
    {
        var luxPromotions = new PromotionCollections
        {
            Promotions = new ReadOnlyCollection<KeyedPromotion>(
                new List<KeyedPromotion>
                {
                    new(Key: "lux", PromotionCodes: "LUXPROMO", ShowNewLabel: "1", Title: "", TooltipText: "", Icon: "", TrackingId: "")
                })
        };

        var cachedSeats = new List<Seat>
        {
            new()
            {
                Number = "9C",
                Price = 12.34m,
                PriceBand = "Rear Standard",
                Products = new List<Product>()
            }
        };

        _referenceDataServiceMock.Setup(mock => mock.GetPromotionCollections()).ReturnsAsync(luxPromotions);
        _flightSeatPlanCacheServiceMock
            .Setup(mock => mock.GetFlightSeatPlan(It.IsAny<string>()))
            .ReturnsAsync(cachedSeats);

        var request = new GetSeatsMapRequest
        {
            FlightNumber = 1020,
            DepAirportCode = "LGW",
            ArrAirportCode = "HAM",
            DepartureDate = "2022-12-01",
            Promo = "LUXPROMO"
        };

        var result = await _seatingService.GetCachedSeatsMap(request);

        result.Should().ContainSingle();
        result[0].Price.Should().Be(0);
    }

    [Fact]
    public async Task GetSeatsMap_DoesNotApplyLuxPricing_WhenPromotionKeyIsNotLux()
    {
        var nonLuxPromotions = new PromotionCollections
        {
            Promotions = new ReadOnlyCollection<KeyedPromotion>(
                new List<KeyedPromotion>
                {
                    new(Key: "winter", PromotionCodes: "LUXPROMO", ShowNewLabel: "1", Title: "", TooltipText: "", Icon: "", TrackingId: "")
                })
        };

        _referenceDataServiceMock.Setup(mock => mock.GetPromotionCollections()).ReturnsAsync(nonLuxPromotions);

        var request = new GetSeatsMapRequest
        {
            Promo = "LUXPROMO"
        };

        var result = await _seatingService.GetSeatsMap(request);

        var rearStandardSeat = result.Rows
            .SelectMany(row => row.Blocks)
            .SelectMany(block => block.Seats)
            .Single(seat => seat.Number == "5A");

        rearStandardSeat.Price.Should().Be(10.99m);
    }
}