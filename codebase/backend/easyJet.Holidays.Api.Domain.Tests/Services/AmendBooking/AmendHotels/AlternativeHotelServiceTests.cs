using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Hotel;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Mappers.Interfaces;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Interfaces;
using easyJet.Holidays.Api.Domain.Interfaces.Hotels;
using easyJet.Holidays.Api.Domain.Services.AmendBooking.Hotels;
using easyJet.Holidays.Api.Domain.Services.Offers;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using FluentAssertions;
using FluentAssertions.Execution;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.AmendBooking.AmendHotels;

public class AlternativeHotelServiceTests
{
    private readonly Mock<IHotelsService> _hotelsServiceMock;
    private readonly Mock<IOffersAggregator> _offersAggregatorMock;
    private readonly Mock<IValidateBookingResponseMapper> _validateBookingResponseMapperMock;
    private readonly AlternativeHotelService _alternativeHotelService;
    private readonly Mock<IPricesService> _pricesServiceMock;
    private readonly Mock<IReferenceDataService> _referenceDataServiceMock;

    public AlternativeHotelServiceTests()
    {
        _hotelsServiceMock = new Mock<IHotelsService>();
        _offersAggregatorMock = new Mock<IOffersAggregator>();
        _validateBookingResponseMapperMock = new Mock<IValidateBookingResponseMapper>();
        _pricesServiceMock = new Mock<IPricesService>();
        _referenceDataServiceMock = new Mock<IReferenceDataService>();

        _alternativeHotelService = new AlternativeHotelService(
            _hotelsServiceMock.Object,
            _offersAggregatorMock.Object,
            _validateBookingResponseMapperMock.Object,
            _pricesServiceMock.Object,
            _referenceDataServiceMock.Object);
    }

    [Fact]
    public async Task EnrichHotelsInformation_ShouldCallSearchAndCombine()
    {
        // Arrange
        var searchOffersResponse = new SearchOffersResponse
        {
            Offers = new List<Offer>
            {
                new() {Accom = new Accom {Code = "Accom1"}},
                new() {Accom = new Accom {Code = "Accom2"}}
            }
        };
        var hotels = new List<Hotel> {new(), new()};

        _hotelsServiceMock.Setup(x => x.Search(It.IsAny<string[]>())).ReturnsAsync(hotels);
        _offersAggregatorMock.Setup(x => x.Combine(It.IsAny<SearchOffersResponse>(), It.IsAny<IEnumerable<Hotel>>(), It.IsAny<BaseSearchRequest>()));

        // Act
        await _alternativeHotelService.EnrichHotelsInformation(searchOffersResponse);

        // Assert
        _hotelsServiceMock.Verify(x => x.Search(It.Is<string[]>(ids => ids.SequenceEqual(new[] {"Accom1", "Accom2"}))), Times.Once);
        _offersAggregatorMock.Verify(x => x.Combine(searchOffersResponse, hotels, It.IsAny<BaseSearchRequest>()), Times.Once);
    }

    [Fact]
    public void BuildAmendHotelListResponse_ShouldReturnCorrectResponse()
    {
        // Arrange
        var booking = new BookingResponse
        {
            BookingReference = "BR123",
            ExtraLuggageInfo = new ExtraLuggageInfo
            {
                Items = new List<ExtraLuggageItem>
                {
                    new() {Price = 10}
                }
            },
            SeatSelection = new List<SeatMap>
            {
                new()
                {
                    Seats = new List<Seat>
                    {
                        new() {Price = 20}
                    }
                }
            },
            PaymentInfo = new PriceInfo
            {
                BookingPriceEx = 100
            },
            PriceBreakdown = []
        };
        var alternativeHotelList = new SearchOffersResponse
        {
            Offers = new List<Offer>
            {
                new()
                {
                    Accom = new Accom {Code = "A1"},
                    Hotel = new OfferHotel(),
                    Transfers = new List<TransferItem>(),
                    Price = 150,
                    PricePP = 150
                }
            },
            Status = new Status
            {
                Total = 1
            }
        };

        _validateBookingResponseMapperMock.Setup(x => x.CalculatePrices(booking, 150)).Returns((20, 10, 0, 180));

        // Act
        var result = _alternativeHotelService.BuildAmendHotelListResponse(booking, alternativeHotelList);

        // Assert
        using (new AssertionScope())
        {
            result.BookingRef.Should().Be("BR123");
            result.AmendHotelOffers.Should().HaveCount(1);            
            var amendHotelOffer = result.AmendHotelOffers.First();
            amendHotelOffer.Accom.Code.Should().Be("A1");
            amendHotelOffer.AmendmentChargesInfo.FullAmendmentCharges.Should().Be(80);
            amendHotelOffer.AmendmentChargesInfo.SeatsPrice.Should().Be(20);
            amendHotelOffer.AmendmentChargesInfo.ExtraLuggagePrice.Should().Be(10);
        }
    }

    [Fact]
    public void CreateAlternativeHotelsSearchRequest_ShouldReturnCorrectRequest()
    {
        // Arrange
        var bookingResponse = new BookingResponse
        {
            Package = new BookingPackage()
            {
                Accom = new BookingAccommodation()
                {
                    Code = "A1",
                    StartDate = "2023-07-01",
                    EndDate = "2023-07-08",
                    Rooms = new List<Unit>
                    {
                        new()
                        {
                            Occupation = new Occupation
                            {
                                PaxIds = new List<int> {1, 2}
                            }
                        }
                    }
                },
                Transport = new Transport
                {
                    Routes = new List<Route>
                    {
                        new()
                        {
                            DepPt = "DPT1",
                            ArrPt = "APT1",
                            DepDate = new DateTime(2023, 7, 1, 10, 0, 0),
                            ArrDate = new DateTime(2023, 7, 1, 12, 0, 0),
                            Car = "C",
                            FltNo = "C123",
                            Direction = Direction.Outbound,
                            TotalPrice = 100
                        },
                        new()
                        {
                            DepDate = new DateTime(2023, 7, 8, 14, 0, 0),
                            ArrDate = new DateTime(2023, 7, 8, 16, 0, 0),
                            Car = "C",
                            FltNo = "C456",
                            Direction = Direction.Inbound,
                            TotalPrice = 68
                        }
                    }
                }
            },
            Guests = new List<PersonWithDetails>
            {
                new() {Type = PersonType.Adult},
                new() {Type = PersonType.Child}
            },
            MarketCode = "MC"
        };

        // Act
        var result = _alternativeHotelService.CreateAlternativeHotelsSearchRequest(bookingResponse);

        // Assert
        using (new AssertionScope())
        {
            result.RoomComposition.Should().ContainKey(1);
            result.RoomComposition[1].Should().Be("1,2");
            result.Adults.Should().Be(1);
            result.Children.Should().Be(1);
            result.Infants.Should().Be(0);
            result.DepartureAirportCode.Should().Be("DPT1");
            result.ArrivalAirportCode.Should().Be("APT1");
            result.OutboundDepartureDate.Should().Be("2023-07-01:1000");
            result.OutboundArrivalDate.Should().Be("2023-07-01:1200");
            result.OutboundFlightNumber.Should().Be("C123");
            result.InboundDepartureDate.Should().Be("2023-07-08:1400");
            result.InboundArrivalDate.Should().Be("2023-07-08:1600");
            result.InboundFlightNumber.Should().Be("C456");
            result.AccomCode.Should().Be("A1");
            result.BookingStartDate.Should().Be("2023-07-01");
            result.Duration.Should().Be(7); // Assuming CalculateDuration() returns 7 for the given dates
            result.MarketCode.Should().Be("MC");
            result.RouteTotalPrice.Should().Be(168);
        }
    }

    [Fact]
    public void CreateAlternativeHotelRoomsSearchRequest_ShouldReturnValidRequest()
    {
        // Arrange
        var bookingResponse = new BookingResponse
        {
            Guests = new List<PersonWithDetails>
            {
                new() {Type = PersonType.Adult},
                new() {Type = PersonType.Child, Age = 7},
                new() {Type = PersonType.Infant}
            },
            Package = new BookingPackage
            {
                Accom = new BookingAccommodation()
                {
                    Rooms = new List<Unit>
                    {
                        new() {Occupation = new Occupation {PaxIds = new List<int> {1, 2}}},
                        new() {Occupation = new Occupation {PaxIds = new List<int> {3}}}
                    }
                },
                Transport = new Transport
                {
                    Routes = new List<Route>
                    {
                        new()
                        {
                            DepPt = "LGW",
                            ArrPt = "JFK",
                            DepDate = new DateTime(2024, 07, 01, 12, 30, 00),
                            ArrDate = new DateTime(2024, 07, 01, 15, 00, 00),
                            Car = "EJ",
                            FltNo = "123",
                            Direction = Direction.Outbound
                        },
                        new()
                        {
                            DepDate = new DateTime(2024, 07, 10, 20, 00, 00),
                            ArrDate = new DateTime(2024, 07, 11, 08, 00, 00),
                            Car = "EJ",
                            FltNo = "124",
                            Direction = Direction.Inbound
                        }
                    }
                }
            },
            MarketCode = "UK"
        };

        var amendHotelOffer = new AmendHotelOffer
        {
            Accom = new Accom()
            {
                PackageId = "pkg123"
            }
        };

        // Act
        var result = _alternativeHotelService.CreateAlternativeHotelRoomsSearchRequest(bookingResponse, amendHotelOffer);

        // Assert
        using (new AssertionScope())
        {
            result.Should().NotBeNull();
            result.PkgId.Should().Be(amendHotelOffer.Accom.PackageId);
            result.Adults.Should().Be(1);
            result.Children.Should().Be(1);
            result.Infants.Should().Be(1);
            result.ChildAges.Should().ContainSingle().Which.Should().Be("7");
            result.DepartureAirportCode.Should().Be("LGW");
            result.ArrivalAirportCode.Should().Be("JFK");
            result.OutboundDepartureDate.Should().Be("2024-07-01:1230");
            result.OutboundArrivalDate.Should().Be("2024-07-01:1500");
            result.OutboundFlightNumber.Should().Be("EJ123");
            result.InboundDepartureDate.Should().Be("2024-07-10:2000");
            result.InboundArrivalDate.Should().Be("2024-07-11:0800");
            result.InboundFlightNumber.Should().Be("EJ124");
            result.MarketCode.Should().Be("UK");
            result.RoomComposition.Should().HaveCount(2);
            result.RoomComposition[1].Should().Be("1,2");
            result.RoomComposition[2].Should().Be("3");
        }
    }
    
    [Fact]
    public async Task BuildAmendHotel_ShouldReturnNull_WhenValidateAmendBookingResponseIsNull()
    {
        // Arrange
        var bookingResponse = new BookingResponse();
        ValidateAmendBookingResponse validateAmendBookingResponse = null;
        var alternativePackage = new AmendHotelOffer();

        // Act
        var result = await _alternativeHotelService.BuildAmendHotel(bookingResponse, validateAmendBookingResponse, alternativePackage, null);

        // Assert
        result.Should().BeNull();
    }
    
    [Fact]
    public async Task BuildAmendHotel_ShouldReturnAmendHotelResponse_WhenInputsAreValid()
    {
        // Arrange
        var bookingResponse = new BookingResponse { BookingReference = "BR123", PaymentInfo = new PriceInfo { TotalPrice = 0}};
        var validateAmendBookingResponse = new ValidateAmendBookingResponse
        {
            PaymentInfo = new PriceInfo() { AmendmentCharges = 50 }
        };
        var alternativePackage = new AmendHotelOffer
        {
            AmendmentChargesInfo = new AmendmentChargesInfo
            {
                FullAmendmentCharges = 30
            },
            Accom = new Accom() { Code = "AC123" }
        };

        var expectedAmendHotelOffer = new AmendHotelOffer { Accom = alternativePackage.Accom };
        var offerHotelInfo = new OfferHotel();

        _validateBookingResponseMapperMock.Setup(x => x.MapToAmendmentHotelOffer(validateAmendBookingResponse, bookingResponse, null))
            .ReturnsAsync(expectedAmendHotelOffer);

        _hotelsServiceMock.Setup(x => x.Search(It.IsAny<string[]>()))
            .ReturnsAsync(new[] { new Hotel() });

        _offersAggregatorMock.Setup(x => x.EnrichAccomWithHotelInfo(alternativePackage.Accom, It.IsAny<Hotel[]>()))
            .ReturnsAsync(offerHotelInfo);

        // Act
        var result = await _alternativeHotelService.BuildAmendHotel(bookingResponse, validateAmendBookingResponse, alternativePackage, null);

        // Assert
        using (new AssertionScope())
        {
            result.Should().NotBeNull();
            result.BookingReference.Should().Be(bookingResponse.BookingReference);
            result.AmendHotelOffer.Should().Be(expectedAmendHotelOffer);
            result.AmendHotelOffer.Hotel.Should().Be(offerHotelInfo);
        }

        _validateBookingResponseMapperMock.Verify(x => x.MapToAmendmentHotelOffer(validateAmendBookingResponse, bookingResponse, null), Times.Once);
        _hotelsServiceMock.Verify(x => x.Search(It.IsAny<string[]>()), Times.Once);
        _offersAggregatorMock.Verify(x => x.EnrichAccomWithHotelInfo(alternativePackage.Accom, It.IsAny<Hotel[]>()), Times.Once);
    }
    
    [Theory]
    [MemberData(nameof(BuildPackageSearchRequest_TestData))]
    public async Task BuildPackageSearchRequest(SearchParameters parameters, BookingResponse booking, PackagesSearchRequest expectedResult)
    {
        // Arrange
        _referenceDataServiceMock.Setup(x => x.GetAmendBookingSetting()).ReturnsAsync(new AmendBookingSetting());

        // Act
        var result = await _alternativeHotelService.BuildPackageSearchRequest(parameters, booking);

        // Assert
        result.Should().BeEquivalentTo(expectedResult);
    }

    public static TheoryData<SearchParameters, BookingResponse, PackagesSearchRequest> BuildPackageSearchRequest_TestData()
    {
        var testCases = new TheoryData<SearchParameters, BookingResponse, PackagesSearchRequest>
        {
            {
                new SearchParameters
                {
                    BoardType = "Half Board",
                    Facilities = "Gym"
                    // StarRating and TripAdvisorRating are not set and should use defaults
                },
                new BookingResponse
                {
                    MarketCode = "CA"
                },
                new PackagesSearchRequest
                {
                    BoardType = "Half Board",
                    Facilities = "Gym",
                    MarketCode = "CA",
                    OrderBy = OrderByField.TripAdvisorWithoutSmartSeer,
                    Page = 1,
                    StarRating = null,
                    Take = 10,
                    TripAdvisorRating = 0
                }
            },
            {
                new SearchParameters
                {
                    BoardType = "All Inclusive",
                    Facilities = "Pool,Spa",
                    SortingBy = SortParameter.PriceDesc,
                    StarRating = "5",
                    TripAdvisorRating = 4
                },
                new BookingResponse
                {
                    MarketCode = "US"
                },
                new PackagesSearchRequest
                {
                    BoardType = "All Inclusive",
                    Facilities = "Pool,Spa",
                    MarketCode = "US",
                    OrderBy = OrderByField.Price,
                    OrderDirection = OrderByDirection.Desc,
                    Page = 1,
                    StarRating = "5",
                    Take = 10,
                    TripAdvisorRating = 4
                }
            },
            {
                new SearchParameters
                {
                    SortingBy = SortParameter.PriceAsc,
                    Page = 3,
                    PageSize = 20,
                },
                new BookingResponse
                {
                    MarketCode = "US"
                },
                new PackagesSearchRequest
                {
                    MarketCode = "US",
                    OrderBy = OrderByField.Price,
                    OrderDirection = OrderByDirection.Asc,
                    Page = 3,
                    Take = 20,
                }
            },
            {
                null,
                new BookingResponse
                {
                    MarketCode = "US"
                },
                new PackagesSearchRequest
                {
                    MarketCode = "US"
                }
            }
        };

        return testCases;
    }

    [Theory]
    [MemberData(nameof(BuildPackageSearchRequest_WithPriceFilter_TestData))]
    public async Task BuildPackageSearchRequest_WithPriceFilter(SearchParameters parameters, BookingResponse booking, 
        decimal fullOfferPrice, AmendBookingSetting amendSettings, PackagesSearchRequest expectedResult)
    {
        // Arrange
        _referenceDataServiceMock.Setup(x => x.GetAmendBookingSetting()).ReturnsAsync(amendSettings);
        _validateBookingResponseMapperMock.Setup(x => x.CalculatePrices(booking, 0)).Returns((0, 0, 0, fullOfferPrice));

        // Act
        var result = await _alternativeHotelService.BuildPackageSearchRequest(parameters, booking);

        // Assert
        result.Should().BeEquivalentTo(expectedResult);
    }

    public static TheoryData<SearchParameters, BookingResponse, decimal, AmendBookingSetting, PackagesSearchRequest> BuildPackageSearchRequest_WithPriceFilter_TestData()
    {
        var testCases = new TheoryData<SearchParameters, BookingResponse, decimal, AmendBookingSetting, PackagesSearchRequest>
        {
            {
                new SearchParameters
                {
                    PriceFrom = null,
                    PriceTo = null
                },
                new BookingResponse
                {
                    MarketCode = "EU"
                },
                200, //value doesn't matter if price filter is not applied
                new AmendBookingSetting(),
                new PackagesSearchRequest
                {
                    MarketCode = "EU",
                    PriceFrom = 0,
                    PriceTo = 0,
                    Page = 1,
                    Take = 10,
                    OrderBy = OrderByField.TripAdvisorWithoutSmartSeer
                }
            },
            {
                new SearchParameters
                {
                    PriceFrom = 100,
                    PriceTo = null
                },
                new BookingResponse
                {
                    MarketCode = "EU",
                    PaymentInfo = new PriceInfo
                    {
                        BookingPriceEx = 800
                    }                 
                },
                30,
                new AmendBookingSetting(),
                new PackagesSearchRequest
                {
                    MarketCode = "EU",
                    PriceFrom = 870,
                    PriceTo = 0,
                    Page = 1,
                    Take = 10,
                    OrderBy = OrderByField.TripAdvisorWithoutSmartSeer
                }
            },
            {
                new SearchParameters
                {
                    PriceFrom = null,
                    PriceTo = 300,
                },
                new BookingResponse
                {
                    MarketCode = "EU",
                    PaymentInfo = new PriceInfo
                    {
                        BookingPriceEx = 1200
                    }
                },
                -100, // promocode used
                new AmendBookingSetting(),
                new PackagesSearchRequest
                {
                    MarketCode = "EU",
                    PriceFrom = 0,
                    PriceTo = 1600,
                    Page = 1,
                    Take = 10,
                    OrderBy = OrderByField.TripAdvisorWithoutSmartSeer
                }
            },
            {
                new SearchParameters
                {
                    PriceFrom = -300,
                    PriceTo = null,
                },
                new BookingResponse
                {
                    MarketCode = "EU",
                    PaymentInfo = new PriceInfo
                    {
                        BookingPriceEx = 1200
                    }
                },
                0, //no extras, no promo
                new AmendBookingSetting(),
                new PackagesSearchRequest
                {
                    MarketCode = "EU",
                    PriceFrom = 900,
                    PriceTo = 0,
                    Page = 1,
                    Take = 10,
                    OrderBy = OrderByField.TripAdvisorWithoutSmartSeer
                }
            },
            {
                new SearchParameters
                {
                    PriceFrom = -200,
                    PriceTo = 100
                },
                new BookingResponse
                {
                    MarketCode = "EU",
                    PaymentInfo = new PriceInfo
                    {
                        BookingPriceEx = 1500
                    }
                },
                70,
                new AmendBookingSetting(),
                new PackagesSearchRequest
                {
                    MarketCode = "EU",
                    PriceFrom = 1230,
                    PriceTo = 1530,
                    Page = 1,
                    Take = 10,
                    OrderBy = OrderByField.TripAdvisorWithoutSmartSeer
                }
            },
            {
                new SearchParameters(),
                new BookingResponse
                {
                    MarketCode = "EU",
                    PaymentInfo = new PriceInfo
                    {
                        BookingPriceEx = 1300
                    }
                },
                0,
                new AmendBookingSetting
                {
                    AmendHotelUpsellLimit = 250,
                },
                new PackagesSearchRequest
                {
                    MarketCode = "EU",  
                    UpsellFrom = 1300,
                    UpsellTo = 1550,
                    Page = 1,
                    Take = 10,
                    OrderBy = OrderByField.TripAdvisorWithoutSmartSeer
                }
            },
            {
                new SearchParameters(),
                new BookingResponse
                {
                    MarketCode = "EU",
                    PaymentInfo = new PriceInfo
                    {
                        BookingPriceEx = 1300
                    }
                },
                20,
                new AmendBookingSetting
                {
                    AmendHotelUpsellLimit = 250,
                },
                new PackagesSearchRequest
                {
                    MarketCode = "EU",
                    UpsellFrom = 1280,
                    UpsellTo = 1530,
                    Page = 1,
                    Take = 10,
                    OrderBy = OrderByField.TripAdvisorWithoutSmartSeer
                }
            }
        };

        return testCases;
    }
}