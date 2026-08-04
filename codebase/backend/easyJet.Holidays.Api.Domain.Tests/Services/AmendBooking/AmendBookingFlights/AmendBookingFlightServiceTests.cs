using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Dates;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Mappers;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.AlternativeFlights;
using easyJet.Holidays.Api.Domain.Data.Themes;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking.Repository;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Interfaces.Mappers;
using easyJet.Holidays.Api.Domain.Interfaces.Offers;
using easyJet.Holidays.Api.Domain.Services.AmendBooking;
using easyJet.Holidays.Api.Domain.Services.AmendBooking.Flight.AlternativeFlightsCachePriceHandler;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using FluentAssertions.Execution;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.AmendBooking.AmendBookingFlights
{
    public class AmendBookingFlightServiceTests
    {
        private IFixture _fixture { get; set; }
        private Mock<IBookingRepository> _bookingRepositoryMock = new();
        private readonly Mock<IAuthenticationService> _authenticationServiceMock = new();
        private Mock<IAccommodationOfferService> _accommOfferServiceMock = new();
        private readonly Mock<ILogger<AmendBookingFlightsService>> _loggerMock;
        private readonly IAmendBookingFlightsService _amendBookingFlightsService;
        private readonly Mock<IAlternativeFlightsCachePriceService> _alternativeFlightsCachePriceChain = new();
        private readonly Mock<IBookingResponseOfferMapper> _bookingResponseOfferMapperMock = new();
        private readonly Mock<IHotelThemeService> _hotelThemeService = new();
        private readonly Mock<IAmendPromocodeHandlerService> _amendPromocodeHandlerService = new();
        private readonly Mock<IAmendTransportBuildService> _amendTransportBuilder = new();
        private readonly Mock<IAirportsMapper> _airportsMapper = new();
        private readonly Mock<IAmendBookingRepository> _amendBookingRepositoryMock = new();

        private readonly ITestOutputHelper _testOutput;

        public AmendBookingFlightServiceTests(ITestOutputHelper testOutput)
        {
            _testOutput = testOutput;

            _fixture = FixtureUtils.AutoMoqFixture();

            _loggerMock = _fixture.Freeze<Mock<ILogger<AmendBookingFlightsService>>>();

            _hotelThemeService.Setup(x => x.GetPackageThemeType("EULU")).ReturnsAsync(PackageThemeType.Lake);
            _hotelThemeService.Setup(x => x.GetPackageThemeType("EUCU")).ReturnsAsync(PackageThemeType.City);
            _hotelThemeService.Setup(x => x.GetPackageThemeType("EUBU")).ReturnsAsync(PackageThemeType.Beach);

            _amendBookingFlightsService = new AmendBookingFlightsService(
                _bookingRepositoryMock.Object,
                _accommOfferServiceMock.Object,
                _loggerMock.Object,
                _bookingResponseOfferMapperMock.Object,
                _hotelThemeService.Object,
                _airportsMapper.Object,
                _amendPromocodeHandlerService.Object,
                _amendTransportBuilder.Object,
                _alternativeFlightsCachePriceChain.Object,
                _amendBookingRepositoryMock.Object);
        }

        [Fact]
        public async Task GetAlternativeFlights_InvalidInput_ThrowException()
        {
            //Act
            Func<Task<AmendFlightOfferResponse>> act = () => _amendBookingFlightsService.GetAlternativeFlights(String.Empty);

            //Assert
            await act.Should().ThrowAsync<ArgumentNullException>();
        }

        [Theory]
        [MemberData(nameof(GetAlternativeFlightsTestData))]
        public async Task GetAlternativeFlight_ValidBookingRef_ReturnAltFlight(
            string testReason,
            string bookingRef,
            int altFlightCount,
            int verifyTransferUpdate,
            int verifyPromoCodeUpdate,
            bool isOfferContainsSeats,
            BookingResponse bookingResponse,
            SearchOffersResponse searchOffersResponse)
        {
            _testOutput.WriteLine($"{nameof(GetAlternativeFlight_ValidBookingRef_ReturnAltFlight)} - {testReason}");

            // Arrange
            _bookingRepositoryMock
                .Setup(x => x.GetBaseBooking(It.IsAny<string>(), It.IsAny<GetBookingOptions>()))
                .ReturnsAsync(bookingResponse);

            _accommOfferServiceMock
                .Setup(x => x.AlternativeFlights(It.IsAny<AmendFlightSearchRequest>(), It.IsAny<PackageThemeType>()))
                .ReturnsAsync(searchOffersResponse);

            //Act
            var result = await _amendBookingFlightsService.GetAlternativeFlights(bookingRef);

            //Asserts
            result.Offers.Count.Should().Be(altFlightCount);
            result.Offers.ToArray()[0].SeatSelection?.Any().Should().Be(isOfferContainsSeats);
        }

        [Fact]
        public async Task GetAlternativeFlightFullPrice_NullInput_ReturnNull()
        {
            //Arrange
            //Act
            var result = await _amendBookingFlightsService.GetAlternativeFlightFullPrice(new AlternativeFlightFullPriceRequest());

            //Assert
            using (new AssertionScope())
            {
                result.Should().BeNull();
            }
        }

        [Fact]
        public async Task GetAlternativeFlightFullPrice_EmptyAlternativePackages_ReturnNull()
        {
            //Arrange
            //Act
            var result = await _amendBookingFlightsService.GetAlternativeFlightFullPrice(new AlternativeFlightFullPriceRequest
            { AlternativePackages = new List<AlternativePackage>() });

            //Assert
            using (new AssertionScope())
            {
                result.Should().BeNull();
            }
        }

        [Theory]
        [MemberData(nameof(GetAlternativeFlightFullPriceNoPromocodeOriginallyData))]
        public async Task GetAlternativeFlightFullPrice_ValidInputNoPromoCodeInOriginalBooking_ReturnResponseWithEmptyList(
            AlternativeFlightFullPriceRequest alternativeFlightFullPriceRequest, AlternativeFlightFullPriceResponse expectedResult, BookingResponse bookingResponse,
            ValidateAmendBookingResponse validateAmendBookingResponse)
        {
            // Arrange
            _bookingRepositoryMock.Setup(x => x.GetBooking(It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync(bookingResponse);

            //Act
            var result = await _amendBookingFlightsService.GetAlternativeFlightFullPrice(alternativeFlightFullPriceRequest);

            //Assert
            using (new AssertionScope())
            {
                result.Should().BeEquivalentTo(new AlternativeFlightFullPriceResponse { AmendTransports = Enumerable.Empty<AmendTransport>() });
            }
        }

        [Theory]
        [MemberData(nameof(GetAlternativeFlightFullPriceNoPromocodeOriginallyData))]
        public async Task GetAlternativeFlightFullPrice_ValidInputNoPromoCodeInOriginalBooking_ReturnAlternativeFlightFullPriceResponse(
            AlternativeFlightFullPriceRequest alternativeFlightFullPriceRequest, AlternativeFlightFullPriceResponse expectedResult, BookingResponse bookingResponse,
            ValidateAmendBookingResponse validateAmendBookingResponse)
        {
            // Arrange
            _bookingRepositoryMock.Setup(x => x.GetBooking(It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync(bookingResponse);
            _amendBookingRepositoryMock
                .Setup(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), It.IsAny<bool>()))
                .ReturnsAsync(validateAmendBookingResponse).Verifiable();

            _amendTransportBuilder.Setup(x => x.BuildAmendTransport(It.IsAny<BookingResponse>(), It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<AlternativePackage>()))
                .ReturnsAsync(new AmendTransport
                {
                    AmendmentCharges = 10,
                    PackagePrice = 10,
                    PackagePricePP = 5,
                    PromoCodeBreakDown = new PromoCodeBreakDown()
                })
                .Verifiable();

            //Act
            var result = await _amendBookingFlightsService.GetAlternativeFlightFullPrice(alternativeFlightFullPriceRequest);

            //Assert
            using (new AssertionScope())
            {
                result.Should().BeEquivalentTo(expectedResult);
                _bookingRepositoryMock.Verify(x => x.GetBooking(It.IsAny<string>(), It.IsAny<string>()), Times.Once);
                _amendBookingRepositoryMock.Verify(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), It.IsAny<bool>()), Times.Once);
            }
        }

        [Theory]
        [MemberData(nameof(GetAlternativeFlightFullPriceWithAtcomErrors))]
        public async Task GetAlternativeFlightFullPrice_ValidInputPromoCodeValidationErrorAtcom_ReturnAlternativeFlightFullPriceResponse(
            AlternativeFlightFullPriceRequest alternativeFlightFullPriceRequest, AlternativeFlightFullPriceResponse expectedResult, BookingResponse bookingResponse,
            ValidateAmendBookingResponse validateAmendBookingResponse, string valdiatePromocode)
        {
            // Arrange
            _bookingRepositoryMock.Setup(x => x.GetBooking(It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync(bookingResponse);
            //_promotionValidatorServiceMock.Setup(x => x.ValidateByAtcomPromoCode(It.IsAny<Offer>(), It.IsAny<string>(), It.IsAny<string>()))
            //    .ReturnsAsync(new ValidatePromotion { VoucherCode = valdiatePromocode }).Verifiable();
            _amendBookingRepositoryMock
                .Setup(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), It.IsAny<bool>()))
                .ReturnsAsync(validateAmendBookingResponse).Verifiable();

            //Act
            var result = await _amendBookingFlightsService.GetAlternativeFlightFullPrice(alternativeFlightFullPriceRequest);

            //Assert
            using (new AssertionScope())
            {
                _bookingRepositoryMock.Verify(x => x.GetBooking(It.IsAny<string>(), It.IsAny<string>()), Times.Once);
                _amendBookingRepositoryMock.Verify(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), It.IsAny<bool>()), Times.Once);
            }
        }

        [Theory]
        [MemberData(nameof(GetAlternativeFlightFullPriceWithSitecoreErrors))]
        public async Task GetAlternativeFlightFullPrice_ValidInputPromoCodeValidationErrorSitecore_ReturnAlternativeFlightFullPriceResponse(
            AlternativeFlightFullPriceRequest alternativeFlightFullPriceRequest, AlternativeFlightFullPriceResponse expectedResult, BookingResponse bookingResponse,
            ValidateAmendBookingResponse validateAmendBookingResponse)
        {
            // Arrange
            _bookingRepositoryMock.Setup(x => x.GetBooking(It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync(bookingResponse);
            _authenticationServiceMock.Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>())).ReturnsAsync(true);
            _amendBookingRepositoryMock
                .Setup(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), It.IsAny<bool>()))
                .ReturnsAsync(validateAmendBookingResponse).Verifiable();

            //Act
            var result = await _amendBookingFlightsService.GetAlternativeFlightFullPrice(alternativeFlightFullPriceRequest);

            //Assert
            using (new AssertionScope())
            {
                _bookingRepositoryMock.Verify(x => x.GetBooking(It.IsAny<string>(), It.IsAny<string>()), Times.Once);
                _amendBookingRepositoryMock.Verify(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), It.IsAny<bool>()), Times.Once);
            }
        }

        [Fact]
        public async Task GetAlternativeFlightFullPrice_ValidInput_AtcomReturnsError_ReturnEmptyResult()
        {
            // Arrange
            _bookingRepositoryMock.Setup(x => x.GetBooking(It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync(new BookingResponse { Package = new BookingPackage() });
            _authenticationServiceMock.Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>())).ReturnsAsync(true);

            _amendBookingRepositoryMock
                .Setup(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), It.IsAny<bool>()))
                .Returns(Task.FromResult<ValidateAmendBookingResponse>(null));
            _amendTransportBuilder.Setup(x => x.BuildAmendTransport(It.IsAny<BookingResponse>(), It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<AlternativePackage>())).Verifiable();

            //Act
            var result = await _amendBookingFlightsService.GetAlternativeFlightFullPrice(new AlternativeFlightFullPriceRequest { AlternativePackages = new List<AlternativePackage> { new AlternativePackage { Transport = new Transport() } } });

            //Assert
            using (new AssertionScope())
            {
                result.AmendTransports.Should().BeEmpty();
                _bookingRepositoryMock.Verify(x => x.GetBooking(It.IsAny<string>(), It.IsAny<string>()), Times.Once);
                _amendBookingRepositoryMock.Verify(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), It.IsAny<bool>()), Times.Once);
                _amendTransportBuilder.Verify(x => x.BuildAmendTransport(It.IsAny<BookingResponse>(), It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<AlternativePackage>()), Times.Never);
            }
        }


        [Fact]
        public async Task GetAlternativeFlights_ChangeDateFlow_EmptyAvailableFlightList()
        {
            _fixture.Behaviors.Add(new OmitOnRecursionBehavior());

            var accom = _fixture
                .Build<Accom>()
                .With(x => x.Prom, "EULU")
                .Create();

            var offer = _fixture
                .Build<Offer>()
                .With(x => x.Accom, accom)
                .Create<Offer>();


            var amendDatesRequest = _fixture.Build<AmendDatesOffer>()
                .OmitAutoProperties()
                .With(x => x.Offer, offer)
                .Create();

            var availableOffers = _fixture.CreateMany<Offer>(0).ToList();

            var searchOfferResponse = _fixture
                    .Build<SearchOffersResponse>()
                    .With(x => x.Offers, availableOffers)
                    .Create();

            _accommOfferServiceMock.Setup(x => x.AlternativeFlights(It.IsAny<AmendFlightSearchRequest>(), It.IsAny<PackageThemeType>()))
                .ReturnsAsync(searchOfferResponse);
            _bookingRepositoryMock.Setup(x => x.GetBaseBooking(It.IsAny<string>(), null)).ReturnsAsync(new BookingResponse());

            var result = await _amendBookingFlightsService.GetAlternativeFlights(amendDatesRequest);

            result.Should().BeNull();

            _accommOfferServiceMock.Verify(x => x.AlternativeFlights(It.IsAny<AmendFlightSearchRequest>(), It.IsAny<PackageThemeType>()), Times.Once);
        }

        [Fact]
        public async Task GetAlternativeFlights_ChangeDateFlow_DelteCurrentFlight_ReturnNull()
        {
            _fixture.Behaviors.Add(new OmitOnRecursionBehavior());

            var accom = _fixture
                .Build<Accom>()
                .With(x => x.Prom, "EULU")
                .Create();

            var offer = _fixture
                .Build<Offer>()
                .With(x => x.Accom, accom)
                .Create<Offer>();

            var altFlightOffer = _fixture
                .Build<Offer>()
                .With(x => x.Accom, accom)
                .Create();


            var amendDatesRequest = _fixture.Build<AmendDatesOffer>()
                .OmitAutoProperties()
                .With(x => x.Offer, offer)
                .Create();

            var searchOfferResponse = _fixture
                .Build<SearchOffersResponse>()
                .With(x => x.Offers, new List<Offer> { offer, altFlightOffer })
                .Create();

            _accommOfferServiceMock.Setup(x => x.AlternativeFlights(It.IsAny<AmendFlightSearchRequest>(), It.IsAny<PackageThemeType>()))
                .ReturnsAsync(searchOfferResponse);
            _bookingRepositoryMock.Setup(x => x.GetBaseBooking(It.IsAny<string>(), null)).ReturnsAsync(new BookingResponse());

            var result = await _amendBookingFlightsService.GetAlternativeFlights(amendDatesRequest);


            using (new AssertionScope())
            {
                result.Should().NotBeEmpty();
                result.First().Offer.Transport.OutboundFlight.FltNo.Should().Be(altFlightOffer.Transport.OutboundFlight.FltNo);
                result.First().Offer.Transport.ReturnFlight.FltNo.Should().Be(altFlightOffer.Transport.ReturnFlight.FltNo);
                result.First().Offer.Transport.OutboundFlight.FltNo.Should().NotBe(offer.Transport.OutboundFlight.FltNo);
                result.First().Offer.Transport.ReturnFlight.FltNo.Should().NotBe(offer.Transport.ReturnFlight.FltNo);

            }

            _accommOfferServiceMock.Verify(x => x.AlternativeFlights(It.IsAny<AmendFlightSearchRequest>(), It.IsAny<PackageThemeType>()), Times.Once);
        }

        [Fact]
        public async Task GetAlternativeFlights_ChangeDateFlow_Success()
        {
            _fixture.Behaviors.Add(new OmitOnRecursionBehavior());

            var accom = _fixture
                .Build<Accom>()
                .With(x => x.Prom, "EULU")
                .Create();

            var offer = _fixture
                .Build<Offer>()
                .With(x => x.Accom, accom)
                .Create<Offer>();


            var amendDatesRequest = _fixture.Build<AmendDatesOffer>()
                .OmitAutoProperties()
                .With(x => x.Offer, offer)
                .Create();

            var availableOffers = _fixture.CreateMany<Offer>(10).ToList();

            var searchOfferResponse = _fixture
                .Build<SearchOffersResponse>()
                .With(x => x.Offers, availableOffers)
                .Create();

            _accommOfferServiceMock.Setup(x => x.AlternativeFlights(It.IsAny<AmendFlightSearchRequest>(), It.IsAny<PackageThemeType>()))
                .ReturnsAsync(searchOfferResponse);
            _bookingRepositoryMock.Setup(x => x.GetBaseBooking(It.IsAny<string>(), null)).ReturnsAsync(new BookingResponse());

            var result = await _amendBookingFlightsService.GetAlternativeFlights(amendDatesRequest);

            result.Should().NotBeEmpty();
            result.Count().Should().Be(10);

            _accommOfferServiceMock.Verify(x => x.AlternativeFlights(It.IsAny<AmendFlightSearchRequest>(), It.IsAny<PackageThemeType>()), Times.Once);
        }

        [Fact]
        public async Task GetAlternativeFlights_AtcomOfferServiceReturnsNull_Null()
        {
            _fixture.Behaviors.Add(new OmitOnRecursionBehavior());

            var accom = _fixture
                .Build<Accom>()
                .With(x => x.Prom, "EULU")
                .Create();

            var offer = _fixture
                .Build<Offer>()
                .With(x => x.Accom, accom)
                .Create<Offer>();


            var amendDatesRequest = _fixture.Build<AmendDatesOffer>()
                .OmitAutoProperties()
                .With(x => x.Offer, offer)
                .Create();

            var availableOffers = _fixture.CreateMany<Offer>(10).ToList();

            _accommOfferServiceMock.Setup(x => x.AlternativeFlights(It.IsAny<AmendFlightSearchRequest>(), It.IsAny<PackageThemeType>()))
                .Returns(Task.FromResult<SearchOffersResponse>(new SearchOffersResponse { Offers = new List<Offer>() }));
            _bookingRepositoryMock.Setup(x => x.GetBaseBooking(It.IsAny<string>(), null)).ReturnsAsync(new BookingResponse());

            var result = await _amendBookingFlightsService.GetAlternativeFlights(amendDatesRequest);

            result.Should().BeNull();

            _accommOfferServiceMock.Verify(x => x.AlternativeFlights(It.IsAny<AmendFlightSearchRequest>(), It.IsAny<PackageThemeType>()), Times.Once);
        }

        [Theory]
        [MemberData(nameof(GetAlternativeFlightDifferentThanRequest))]
        public async Task GetAlternativeFlightFullPrice_ValidInput_ReturnNull_AtcomDifferentRoutes(BookingResponse bookingResponse, AlternativeFlightFullPriceRequest alternativeFlightFullPriceRequest, ValidateAmendBookingResponse validateAmendBookingResponse)
        {
            _testOutput.WriteLine("Alternative flight removed when atcom responds with different flight");

            // Arrange
            _bookingRepositoryMock.Setup(x => x.GetBooking(It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync(bookingResponse).Verifiable();
            _authenticationServiceMock.Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>())).ReturnsAsync(true).Verifiable();
            _amendBookingRepositoryMock
                .Setup(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), It.IsAny<bool>()))
                .ReturnsAsync(validateAmendBookingResponse).Verifiable();

            //Act
            var result = await _amendBookingFlightsService.GetAlternativeFlightFullPrice(alternativeFlightFullPriceRequest);

            //Assert
            using (new AssertionScope())
            {
                result.Should().NotBeNull();
                result.AmendTransports.Should().BeEmpty();
                _bookingRepositoryMock.Verify(x => x.GetBooking(It.IsAny<string>(), It.IsAny<string>()), Times.Once);
                _amendBookingRepositoryMock.Verify(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), It.IsAny<bool>()), Times.Once);
            }
        }

        public static IEnumerable<object[]> GetAlternativeFlightsTestData()
        {
            yield return new object[]
            {
                "Valid booking without seats and promo code.",
                "Test_ref",
                1,
                0,
                0,
                false,
                new BookingResponse()
                {
                    Prom = "EULU",
                    Package = new BookingPackage
                    {
                        Accom = new BookingAccommodation
                        {
                            Code = "Test_Code",
                            Rooms = new List<Unit>(),
                            StartDate = "2023-09-10",
                            EndDate = "2023-09-01"
                        },
                        Transport = new Transport
                        {
                            Routes = new List<Route>
                            {
                                new Route
                                {
                                    FltNo = "out01",
                                    Car = "Car01"
                                },
                                new Route
                                {
                                    FltNo = "inb01",
                                    Car = "Car01"
                                }
                            }
                        }
                    },
                    Transfers = new List<TransferItem>()
                },
                new SearchOffersResponse
                {
                    Offers = new List<Offer>
                    {
                        new Offer
                        {
                            Price = 10,
                            Transport = new Transport
                            {
                                Routes = new List<Route>
                                {
                                    new Route
                                    {
                                        FltNo = "out01",
                                        Car = "Car01"
                                    },
                                    new Route
                                    {
                                        FltNo = "inb01",
                                        Car = "Car01"
                                    }
                                }
                            }
                        },
                        new Offer
                        {
                            Price = 20,
                            Transport = new Transport
                            {
                                Routes = new List<Route>
                                {
                                    new Route
                                    {
                                        FltNo = "out02",
                                        Car = "Car02"
                                    },
                                    new Route
                                    {
                                        FltNo = "inb02",
                                        Car = "Car02"
                                    }
                                }
                            }
                        }
                    }
                }
            };
            yield return new object[]
            {
                "Valid booking without seats and promo code. Booking is city holiday and Default transfer. Update transfer.",
                "Test_ref",
                1,
                1,
                0,
                false,
                new BookingResponse()
                {
                    Prom = "EUCU",
                    Package = new BookingPackage
                    {
                        Accom = new BookingAccommodation
                        {
                            Code = "Test_Code",
                            Rooms = new List<Unit>(),
                            StartDate = "2023-09-10",
                            EndDate = "2023-09-01"
                        },
                        Transport = new Transport
                        {
                            Routes = new List<Route>
                            {
                                new Route
                                {
                                    FltNo = "out01",
                                    Car = "Car01"
                                },
                                new Route
                                {
                                    FltNo = "inb01",
                                    Car = "Car01"
                                }
                            }
                        }
                    },
                    Transfers = new List<TransferItem>
                    {
                        new TransferItem
                        {
                            Code = "JUMB011161NS"
                        }
                    }
                },
                new SearchOffersResponse
                {
                    Offers = new List<Offer>
                    {
                        new Offer
                        {
                            Price = 10,
                            Transport = new Transport
                            {
                                Routes = new List<Route>
                                {
                                    new Route
                                    {
                                        FltNo = "out01",
                                        Car = "Car01"
                                    },
                                    new Route
                                    {
                                        FltNo = "inb01",
                                        Car = "Car01"
                                    }
                                }
                            }
                        },
                        new Offer
                        {
                            Price = 20,
                            Transport = new Transport
                            {
                                Routes = new List<Route>
                                {
                                    new Route
                                    {
                                        FltNo = "out02",
                                        Car = "Car02"
                                    },
                                    new Route
                                    {
                                        FltNo = "inb02",
                                        Car = "Car02"
                                    }
                                }
                            }
                        }
                    }
                }
            };

            yield return new object[]
            {
                "Valid booking without seats and promo code. Booking is beach holiday and has Default transfer.",
                "Test_ref",
                1,
                0,
                0,
                false,
                new BookingResponse()
                {
                    Prom = "EUBU",
                    Package = new BookingPackage
                    {
                        Accom = new BookingAccommodation
                        {
                            Code = "Test_Code",
                            Rooms = new List<Unit>(),
                            StartDate = "2023-09-10",
                            EndDate = "2023-09-01"
                        },
                        Transport = new Transport
                        {
                            Routes = new List<Route>
                            {
                                new Route
                                {
                                    FltNo = "out01",
                                    Car = "Car01"
                                },
                                new Route
                                {
                                    FltNo = "inb01",
                                    Car = "Car01"
                                }
                            }
                        }
                    },
                    Transfers = new List<TransferItem>
                    {
                        new TransferItem
                        {
                            Code = "JUMB011161NS"
                        }
                    }
                },
                new SearchOffersResponse
                {
                    Offers = new List<Offer>
                    {
                        new Offer
                        {
                            Price = 10,
                            Transport = new Transport
                            {
                                Routes = new List<Route>
                                {
                                    new Route
                                    {
                                        FltNo = "out01",
                                        Car = "Car01"
                                    },
                                    new Route
                                    {
                                        FltNo = "inb01",
                                        Car = "Car01"
                                    }
                                }
                            }
                        },
                        new Offer
                        {
                            Price = 20,
                            Transport = new Transport
                            {
                                Routes = new List<Route>
                                {
                                    new Route
                                    {
                                        FltNo = "out02",
                                        Car = "Car02"
                                    },
                                    new Route
                                    {
                                        FltNo = "inb02",
                                        Car = "Car02"
                                    }
                                }
                            }
                        }
                    }
                }
            };

            yield return new object[]
            {
                "Valid booking without seats and with promo code. Enrich flight info with promo code price.",
                "Test_ref",
                1,
                0,
                1,
                false,
                new BookingResponse()
                {
                    Prom = "EUBU",
                    DiscountCode = "OrangeSale150",
                    Package = new BookingPackage
                    {
                        Accom = new BookingAccommodation
                        {
                            Code = "Test_Code",
                            Rooms = new List<Unit>(),
                            StartDate = "2023-09-10",
                            EndDate = "2023-09-01"
                        },
                        Transport = new Transport
                        {
                            Routes = new List<Route>
                            {
                                new Route
                                {
                                    FltNo = "out01",
                                    Car = "Car01"
                                },
                                new Route
                                {
                                    FltNo = "inb01",
                                    Car = "Car01"
                                }
                            }
                        }
                    },
                    Transfers = new List<TransferItem>
                    {
                        new TransferItem
                        {
                            Code = "JUMB011161NS"
                        }
                    }
                },
                new SearchOffersResponse
                {
                    Offers = new List<Offer>
                    {
                        new Offer
                        {
                            Price = 10,
                            Transport = new Transport
                            {
                                Routes = new List<Route>
                                {
                                    new Route
                                    {
                                        FltNo = "out01",
                                        Car = "Car01"
                                    },
                                    new Route
                                    {
                                        FltNo = "inb01",
                                        Car = "Car01"
                                    }
                                }
                            }
                        },
                        new Offer
                        {
                            Price = 20,
                            Transport = new Transport
                            {
                                Routes = new List<Route>
                                {
                                    new Route
                                    {
                                        FltNo = "out02",
                                        Car = "Car02"
                                    },
                                    new Route
                                    {
                                        FltNo = "inb02",
                                        Car = "Car02"
                                    }
                                }
                            }
                        }
                    }
                }
            };

            yield return new object[]
            {
                "Valid booking with seats. Enrich alt flight with seats price.",
                "Test_ref",
                1,
                0,
                0,
                true,
                new BookingResponse()
                {
                    Prom = "EUBU",
                    Package = new BookingPackage
                    {
                        Accom = new BookingAccommodation
                        {
                            Code = "Test_Code",
                            Rooms = new List<Unit>(),
                            StartDate = "2023-09-10",
                            EndDate = "2023-09-01"
                        },
                        Transport = new Transport
                        {
                            Routes = new List<Route>
                            {
                                new Route
                                {
                                    FltNo = "out01",
                                    Car = "Car01"
                                },
                                new Route
                                {
                                    FltNo = "inb01",
                                    Car = "Car01"
                                }
                            }
                        }
                    },
                    Transfers = new List<TransferItem>
                    {
                        new TransferItem
                        {
                            Code = "JUMB011161NS"
                        }
                    },
                    SeatSelection = new List<SeatMap>
                    {
                        new SeatMap
                        {
                            FlightNumber = "out01",
                            Seats = new List<Seat>
                            {
                                new Seat
                                {
                                    Price = 50
                                }
                            }
                        }
                    }
                },
                new SearchOffersResponse
                {
                    Offers = new List<Offer>
                    {
                        new Offer
                        {
                            Price = 10,
                            Transport = new Transport
                            {
                                Routes = new List<Route>
                                {
                                    new Route
                                    {
                                        FltNo = "out01",
                                        Car = "Car01"
                                    },
                                    new Route
                                    {
                                        FltNo = "inb01",
                                        Car = "Car01"
                                    }
                                }
                            }
                        },
                        new Offer
                        {
                            Price = 20,
                            Transport = new Transport
                            {
                                Routes = new List<Route>
                                {
                                    new Route
                                    {
                                        FltNo = "out01",
                                        Car = "Car01"
                                    },
                                    new Route
                                    {
                                        FltNo = "inb02",
                                        Car = "Car02"
                                    }
                                }
                            }
                        }
                    }
                }
            };
        }

        public static IEnumerable<object[]> GetAlternativeFlightFullPriceWithAtcomErrors()
        {
            yield return new object[]
            {
                new AlternativeFlightFullPriceRequest
                {
                    BookingReference = "any",
                    AlternativePackages = new List<AlternativePackage>
                    {
                        new AlternativePackage
                        {
                            AlternativePackagePrice = 10,
                            AlternativePackagePricePerPerson = 5,
                            Duration = 1,
                            Transport = new Transport
                            {
                                Routes = new List<Route>
                                {
                                    new Route
                                    {
                                        FltNo = "EZY1",
                                        ArrDate = DateTimeOffset.MinValue,
                                        DepDate = DateTimeOffset.MinValue,
                                        ArrPt = "A",
                                        DepPt = "B"
                                    },
                                    new Route
                                    {
                                        FltNo = "EZY2",
                                        ArrDate = DateTimeOffset.MinValue,
                                        DepDate = DateTimeOffset.MinValue,
                                        ArrPt = "A",
                                        DepPt = "B"
                                    }
                                }
                            }
                        }
                    },
                },
                new AlternativeFlightFullPriceResponse
                {
                    AmendTransports = new List<AmendTransport>
                    {
                        new AmendTransport
                        {
                            AmendmentCharges = 10,
                            PromoCodeBreakDown = new PromoCodeBreakDown
                            {
                                PromoCodeStatus = PromoCodeStatus.PROMOCODE_REMOVED,
                                Due = 20,
                                Errors = new List<ApiError>() {new ApiError {Code = "code-1"}}
                            },
                            PackagePrice = 10,
                            PackagePricePP = 5,
                            Routes = new List<Route>
                            {
                                new Route
                                {
                                    FltNo = "EZY1",
                                    ArrDate = DateTimeOffset.MinValue,
                                    DepDate = DateTimeOffset.MinValue,
                                    ArrPt = "A",
                                    DepPt = "B"
                                },
                                new Route
                                {
                                    FltNo = "EZY2",
                                    ArrDate = DateTimeOffset.MinValue,
                                    DepDate = DateTimeOffset.MinValue,
                                    ArrPt = "A",
                                    DepPt = "B"
                                }
                            }
                        }
                    }
                },
                new BookingResponse
                {
                    Package = new BookingPackage
                    {
                        Accom = new BookingAccommodation
                        {
                            Id = "id",
                            Code = "code",
                            Hotel = new OfferHotel
                            {
                                Theme = new (),
                                Type = new ()
                            },
                            Rooms = new List<Unit>(),
                        }
                    },
                    PriceBreakdown = new PriceCategory[]
                    {
                        new PriceCategory
                        {
                            Amount = 10,
                            Code = "holiday",
                            Name = "holiday",
                            Quantity = 1,
                        },
                        new PriceCategory
                        {
                            Amount = -20,
                            Code = "promo code",
                            Name = "promo code",
                            Quantity = 1,
                        }
                    },
                    DiscountCode = "PROMOCODE200"
                },
                new ValidateAmendBookingResponse
                {
                    ApiErrors = new ApiError[] {new ApiError {Code = "code-1"}},
                    PaymentInfo = new PriceInfo
                    {
                        AmendmentCharges = 10,
                        TotalPrice = 10,
                        PricePP = 5,
                    },
                    PriceBreakdown = new PriceCategory[]
                    {
                        new PriceCategory
                        {
                            Amount = 10,
                            Code = "holiday",
                            Name = "holiday",
                            Quantity = 1,
                        },
                    },
                    Transport = new Transport
                    {
                        Routes = new List<Route>
                        {
                            new Route
                            {
                                FltNo = "EZY1",
                                ArrDate = DateTimeOffset.MinValue,
                                DepDate = DateTimeOffset.MinValue,
                                ArrPt = "A",
                                DepPt = "B"
                            },
                            new Route
                            {
                                FltNo = "EZY2",
                                ArrDate = DateTimeOffset.MinValue,
                                DepDate = DateTimeOffset.MinValue,
                                ArrPt = "A",
                                DepPt = "B"
                            }
                        }
                    }
                },
                "PROMOCODE100"
            };
        }

        public static IEnumerable<object[]> GetAlternativeFlightFullPriceWithSitecoreErrors()
        {
            yield return new object[]
            {
                new AlternativeFlightFullPriceRequest
                {
                    BookingReference = "any",
                    AlternativePackages = new List<AlternativePackage>
                    {
                        new AlternativePackage
                        {
                            AlternativePackagePrice = 10,
                            AlternativePackagePricePerPerson = 10,
                            Duration = 1,
                            Transport = new Transport
                            {
                                Routes = new List<Route>
                                {
                                    new Route
                                    {
                                        FltNo = "EZY1",
                                        ArrDate = DateTimeOffset.MinValue,
                                        DepDate = DateTimeOffset.MinValue,
                                        ArrPt = "A",
                                        DepPt = "B"
                                    },
                                    new Route
                                    {
                                        FltNo = "EZY2",
                                        ArrDate = DateTimeOffset.MinValue,
                                        DepDate = DateTimeOffset.MinValue,
                                        ArrPt = "A",
                                        DepPt = "B"
                                    }
                                }
                            }
                        }
                    },
                },
                new AlternativeFlightFullPriceResponse
                {
                    AmendTransports = new List<AmendTransport>
                    {
                        new AmendTransport
                        {
                            AmendmentCharges = 10,
                            PromoCodeBreakDown = new PromoCodeBreakDown
                            {
                                PromoCodeStatus = PromoCodeStatus.PROMOCODE_REMOVED,
                                Due = 20,
                                Errors = new List<ApiError>() {new ApiError {Code = "sitecore error"}}
                            },
                            PackagePrice = 10,
                            PackagePricePP = 5,
                            Routes = new List<Route>
                            {
                                new Route
                                {
                                    FltNo = "EZY1",
                                    ArrDate = DateTimeOffset.MinValue,
                                    DepDate = DateTimeOffset.MinValue,
                                    ArrPt = "A",
                                    DepPt = "B"
                                },
                                new Route
                                {
                                    FltNo = "EZY2",
                                    ArrDate = DateTimeOffset.MinValue,
                                    DepDate = DateTimeOffset.MinValue,
                                    ArrPt = "A",
                                    DepPt = "B"
                                }
                            }
                        }
                    }
                },
                new BookingResponse
                {
                    Package = new BookingPackage
                    {
                        Accom = new BookingAccommodation
                        {
                            Id = "id",
                            Code = "code",
                            Hotel = new OfferHotel
                            {
                                Theme = new (),
                                Type = new ()
                            },
                            Rooms = new List<Unit>(),
                        }
                    },
                    PriceBreakdown = new PriceCategory[]
                    {
                        new PriceCategory
                        {
                            Amount = 10,
                            Code = "holiday",
                            Name = "holiday",
                            Quantity = 1,
                        },
                        new PriceCategory
                        {
                            Amount = -20,
                            Code = "promo code",
                            Name = "promo code",
                            Quantity = 1,
                        }
                    },
                    DiscountCode = "PROMOCODE200"
                },
                new ValidateAmendBookingResponse
                {
                    PaymentInfo = new PriceInfo
                    {
                        AmendmentCharges = 10,
                        TotalPrice = 10,
                        PricePP = 5,
                    },
                    PriceBreakdown = new PriceCategory[]
                    {
                        new PriceCategory
                        {
                            Amount = 10,
                            Code = "holiday",
                            Name = "holiday",
                            Quantity = 1,
                        },
                    },
                    Transport = new Transport
                    {
                        Routes = new List<Route>
                        {
                            new Route
                            {
                                FltNo = "EZY1",
                                ArrDate = DateTimeOffset.MinValue,
                                DepDate = DateTimeOffset.MinValue,
                                ArrPt = "A",
                                DepPt = "B"
                            },
                            new Route
                            {
                                FltNo = "EZY2",
                                ArrDate = DateTimeOffset.MinValue,
                                DepDate = DateTimeOffset.MinValue,
                                ArrPt = "A",
                                DepPt = "B"
                            }
                        }
                    }
                }
            };
        }

        public static IEnumerable<object[]> GetAlternativeFlightFullPriceNoPromocodeOriginallyData()
        {
            yield return new object[]
            {
                new AlternativeFlightFullPriceRequest
                {
                    BookingReference = "any",
                    AlternativePackages = new List<AlternativePackage>
                    {
                        new AlternativePackage
                        {
                            AlternativePackagePrice = 10,
                            AlternativePackagePricePerPerson = 5,
                            Duration = 1,
                            Transport = new Transport
                            {
                                Routes = new List<Route>
                                {
                                    new Route
                                    {
                                        Id= "routeId1",
                                        FltNo = "EZY1",
                                        ArrDate = DateTimeOffset.MinValue,
                                        DepDate = DateTimeOffset.MinValue,
                                        ArrPt = "A",
                                        DepPt = "B"
                                    },
                                    new Route
                                    {
                                        FltNo = "EZY2",
                                        ArrDate = DateTimeOffset.MinValue,
                                        DepDate = DateTimeOffset.MinValue,
                                        ArrPt = "A",
                                        DepPt = "B"
                                    }
                                }
                            }
                        }
                    },
                },
                new AlternativeFlightFullPriceResponse
                {
                    AmendTransports = new List<AmendTransport>
                    {
                        new AmendTransport
                        {
                            AmendmentCharges = 10,
                            PackagePrice = 10,
                            PackagePricePP = 5,
                            PromoCodeBreakDown =
                                new PromoCodeBreakDown
                                {
                                    Due = 0,
                                    Errors = null,
                                    PromoCode = null,
                                    PromoCodeStatus = PromoCodeStatus.NO_PROMOCODE
                                }
                        }
                    }
                },
                new BookingResponse
                {
                    Package = new BookingPackage
                    {
                        Accom = new BookingAccommodation
                        {
                            Id = "id",
                            Code = "code",
                            Hotel = new OfferHotel
                            {
                                Theme = new (),
                                Type = new()
                            },
                            Rooms = new List<Unit>(),
                        }
                    },
                    PriceBreakdown = new PriceCategory[]
                    {
                        new PriceCategory
                        {
                            Amount = 10,
                            Code = "holiday",
                            Name = "holiday",
                            Quantity = 1,
                        },
                    },
                    DiscountCode = ""
                },
                new ValidateAmendBookingResponse
                {
                    PriceBreakdown = new PriceCategory[]
                    {
                        new PriceCategory
                        {
                            Amount = 10,
                            Code = "holiday",
                            Name = "holiday",
                            Quantity = 1,
                        },
                    },
                    PaymentInfo = new PriceInfo
                    {
                        AmendmentCharges = 10,
                        TotalPrice = 10,
                        PricePP = 5
                    },
                    Transport = new Transport
                    {
                        Routes = new List<Route>
                        {
                            new Route
                            {
                                FltNo = "EZY1",
                                ArrDate = DateTimeOffset.MinValue,
                                DepDate = DateTimeOffset.MinValue,
                                ArrPt = "A",
                                DepPt = "B"
                            },
                            new Route
                            {
                                FltNo = "EZY2",
                                ArrDate = DateTimeOffset.MinValue,
                                DepDate = DateTimeOffset.MinValue,
                                ArrPt = "A",
                                DepPt = "B"
                            }
                        }
                    },
                    SeatSelection = new List<SeatMap>
                    {
                        new SeatMap
                        {
                            SectorId = "1",
                            FlightNumber = "EZY1",
                            IsSeatReservationPossible = true,
                            Seats = new List<Seat>
                            {
                                new Seat
                                {
                                    PaxIndex = 1,
                                    SeatNumber = "23C",
                                    PriceBand = "Up Front",
                                    Price = 100.00m
                                },
                                new Seat
                                {
                                    PaxIndex = 2,
                                    SeatNumber = "23D",
                                    PriceBand = "Up Front",
                                    Price = 100.00m
                                }
                            }
                        },
                        new SeatMap
                        {
                            SectorId = "2",
                            FlightNumber = "EZY2",
                            IsSeatReservationPossible = false,
                        }
                    }
                }
            };
        }

        public static IEnumerable<object[]> GetAlternativeFlightDifferentThanRequest()
        {
            yield return new object[]
            {
                new BookingResponse
                {
                    Package = new BookingPackage
                    {
                        Accom = new BookingAccommodation
                        {
                            Id = "id",
                            Code = "code",
                            Hotel = new OfferHotel
                            {
                                Theme = new PackageTheme { },
                                Type = new ThemeType { }
                            },
                            Rooms = new List<Unit>(),
                        }
                    },
                    PriceBreakdown = new PriceCategory[]
                    {
                        new PriceCategory
                        {
                            Amount = 10,
                            Code = "holiday",
                            Name = "holiday",
                            Quantity = 1,
                        }
                    }
                },
                new AlternativeFlightFullPriceRequest
                {
                    BookingReference = "any",
                    AlternativePackages = new List<AlternativePackage>
                    {
                        new AlternativePackage
                        {
                            AlternativePackagePrice = 10,
                            AlternativePackagePricePerPerson = 10,
                            Duration = 1,
                            Transport = new Transport
                            {
                                Routes = new List<Route>
                                {
                                    new Route
                                    {
                                        FltNo = "EZY1",
                                        ArrDate = DateTimeOffset.MinValue,
                                        DepDate = DateTimeOffset.MinValue,
                                        ArrPt = "A",
                                        DepPt = "B"
                                    },
                                    new Route
                                    {
                                        FltNo = "EZY2",
                                        ArrDate = DateTimeOffset.MinValue,
                                        DepDate = DateTimeOffset.MinValue,
                                        ArrPt = "A",
                                        DepPt = "B"
                                    }
                                }
                            }
                        }
                    },
                },
                new ValidateAmendBookingResponse
                {
                    PaymentInfo = new PriceInfo
                    {
                        AmendmentCharges = 10,
                        TotalPrice = 10,
                        PricePP = 5,
                    },
                    PriceBreakdown = new PriceCategory[]
                    {
                        new PriceCategory
                        {
                            Amount = 10,
                            Code = "holiday",
                            Name = "holiday",
                            Quantity = 1,
                        },
                    },
                    Transport = new Transport
                    {
                        Routes = new List<Route>
                        {
                            new Route
                            {
                                FltNo = "EZY21",
                                ArrDate = DateTimeOffset.MinValue,
                                DepDate = DateTimeOffset.MinValue,
                                ArrPt = "A",
                                DepPt = "diffrent"
                            },
                            new Route
                            {
                                FltNo = "EZY12",
                                ArrDate = DateTimeOffset.MinValue,
                                DepDate = DateTimeOffset.MinValue,
                                ArrPt = "diffrent",
                                DepPt = "B"
                            }
                        }
                    }
                }
            };
        }
    }
}