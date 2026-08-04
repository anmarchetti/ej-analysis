using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Mappers.Interfaces;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.RoomAndBoard;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.AlternativeFlights;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.RoomVariants;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking.Repository;
using easyJet.Holidays.Api.Domain.Interfaces.Hotels;
using easyJet.Holidays.Api.Domain.Interfaces.Mappers;
using easyJet.Holidays.Api.Domain.Interfaces.Offers;
using easyJet.Holidays.Api.Domain.Services.AmendBooking;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using FluentAssertions.Execution;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;

namespace easyJet.Holidays.Api.Domain.Tests.Services.AmendBooking.AmendRoomAndBoard
{
    public class AmendBookingRoomAndBoardServiceTests
    {
        private readonly IAmendBookingRoomAndBoardService _amendBookingRoomAndBoardService;
        private Mock<IBookingRepository> _bookingRepositoryMock = new();
        private Mock<IAccommodationOfferService> _accommOfferServiceMock = new();
        private readonly Mock<IHotelThemeService> _hotelThemeService = new();
        private readonly ITestOutputHelper _testOutput;
        private readonly Mock<IValidateBookingResponseMapper> _validateBookingResponseMapperMock = new();
        private readonly Mock<IAmendPromocodeHandlerService> _amendPromocodeHandlerServiceMock = new();
        private readonly Mock<IHotelsService> _hotelsServiceMock = new();
        private readonly Mock<IOfferHotelMapper> _offerHotelMapper = new();

        private readonly Mock<IAmendBookingRepository> _amendBookingRepositoryMock = new();

        public AmendBookingRoomAndBoardServiceTests(ITestOutputHelper testOutput)
        {
            _testOutput = testOutput;

            FixtureUtils.AutoMoqFixture();

            Options.Create(new AtcomSettings
            {
                Transfers = new()
                {
                    Types = new()
                    {
                        SyntheticNoTransfer = "DEFAULT",
                        DefaultNoTransferCode = "H",
                    }
                },
                PromotionsCodeName = "Promotions"
            });

            _hotelThemeService.Setup(x => x.GetPackageThemeType("EULU")).ReturnsAsync(PackageThemeType.Lake);
            _hotelThemeService.Setup(x => x.GetPackageThemeType("EUCU")).ReturnsAsync(PackageThemeType.City);
            _hotelThemeService.Setup(x => x.GetPackageThemeType("EUBU")).ReturnsAsync(PackageThemeType.Beach);

            _amendBookingRoomAndBoardService = new AmendBookingRoomAndBoardService(
                _accommOfferServiceMock.Object,
                _bookingRepositoryMock.Object,
                _hotelThemeService.Object,
                _validateBookingResponseMapperMock.Object,
                _amendPromocodeHandlerServiceMock.Object,
                _hotelsServiceMock.Object,
                _offerHotelMapper.Object,
                _amendBookingRepositoryMock.Object);
        }

        [Theory]
        [MemberData(nameof(GetAlternativeRoomsTestData))]
        public async Task GetAlternativeRoomAndBoards_ValidBookingRef_ReturnAltRoomAndBoards(
            string testReason,
            string bookingRef,
            int altRoomsCount,
            int verifyTransferUpdate,
            BookingResponse bookingResponse,
            SearchOffersResponse searchOffersResponse,
            RoomVariantsResponse roomVariantsResponse)
        {
            _testOutput.WriteLine($"{nameof(GetAlternativeRoomAndBoards_ValidBookingRef_ReturnAltRoomAndBoards)} - {testReason}");

            // Arrange
            _bookingRepositoryMock
                .Setup(x => x.GetBaseBooking(It.IsAny<string>(), It.IsAny<GetBookingOptions>()))
                .ReturnsAsync(bookingResponse);

            _accommOfferServiceMock
                .Setup(x => x.AlternativeFlights(It.IsAny<AmendFlightSearchRequest>(), It.IsAny<PackageThemeType>()))
                .ReturnsAsync(searchOffersResponse);

            var validateAmendBookingResponse = new ValidateAmendBookingResponse();
            var amendmentRoomVariant = new AmendRoomVariant
            {
                FullAmendmentCharges = 10,
                Units =
                [
                    new()
                    {
                        Availability = 1,
                        RoomType = new(),
                        BoardType = new(),
                        Occupation = new() { ChildAges = [] }
                    }
                ],
                RoomType = "Room",
                BoardType = "B0"
            };

            _accommOfferServiceMock.Setup(x => x.RoomVariants(It.IsAny<RoomVariantsSearchRequest>())).ReturnsAsync(roomVariantsResponse);
            _hotelsServiceMock.Setup(x => x.Search(It.IsAny<string[]>())).ReturnsAsync(new List<Hotel>());
            //_referenceDataServiceMock.Setup(x => x.GetRoomType(It.IsAny<string>())).ReturnsAsync(new RoomType());

            _amendBookingRepositoryMock.Setup(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), It.IsAny<bool>()))
                .ReturnsAsync(validateAmendBookingResponse);
            _validateBookingResponseMapperMock.Setup(x =>
                    x.MapToRoomVariant(It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<BookingResponse>(), It.IsAny<AmendRoomValidationRequest>()))
                .Returns(amendmentRoomVariant);

            //Act
            var result = await _amendBookingRoomAndBoardService.GetAvailableRoomAndBoards(bookingRef);

            //Asserts
            result.RoomVariants.ToList().Count.Should().Be(altRoomsCount);

            //_itemSearchServiceMock
            //    .Verify(x => x.GetExtras(It.IsAny<Offer>()), Times.Exactly(verifyTransferUpdate));
        }

        [Fact]
        public async Task GetAlternativeRoomAndBoards_ValidBookingRef_CalculateUpsellAmount()
        {
            var bookingRef = "Booking_Test_Ref";

            var bookingResponse = new BookingResponse()
            {
                Prom = "EULU",
                Package = new()
                {
                    Accom = new()
                    {
                        Code = "Test_Code",
                        Rooms =
                        [
                            new()
                            {
                                Availability = 1,
                                Code = "Room",
                                Board = "B0",
                                RoomType = new() { Code = "Room" },
                                BoardType = new() { Code = "BB" },
                                Occupation = new() { ChildAges = [] }
                            }
                        ],
                        StartDate = "2023-09-10",
                        EndDate = "2023-09-01"
                    },
                    Transport = new()
                    {
                        Routes =
                        [
                            new() { FltNo = "out01", Car = "Car01" },

                            new() { FltNo = "inb01", Car = "Car01" }
                        ]
                    }
                },
                Transfers = new List<TransferItem>(),
                PaymentInfo = new()
                {
                    TotalPrice = 1000
                }
            };

            var searchOffersResponse = new SearchOffersResponse
            {
                Offers =
                [
                    new()
                    {
                        Accom = new()
                        {
                            Code = "Test_Code",
                            Unit =
                            [
                                new()
                                {
                                    Code = "Room",
                                    Board = "B0",
                                    Availability = 1,
                                    RoomType = new() { Code = "Room" },
                                    BoardType = new() { Code = "B0" },
                                    Occupation = new() { ChildAges = [] }
                                }
                            ],
                            PackageId = "packageId1"
                        },
                        Price = 10,
                        Transport = new()
                        {
                            Routes =
                            [
                                new() { FltNo = "out01", Car = "Car01" },
                                new() { FltNo = "inb01", Car = "Car01" }
                            ]
                        }
                    },

                    new()
                    {
                        Accom = new()
                        {
                            Code = "Test_Code",
                            Unit =
                            [
                                new()
                                {
                                    Code = "Room",
                                    Board = "B0",
                                    Availability = 1,
                                    RoomType = new (){ Code = "Room2" },
                                    BoardType = new () { Code = "BB" },
                                    Occupation = new() { ChildAges = [] }
                                }
                            ],
                            PackageId = "packageId1"
                        },
                        Price = 20,
                        Transport = new()
                        {
                            Routes =
                            [
                                new() { FltNo = "out02", Car = "Car02" },
                                new() { FltNo = "inb02", Car = "Car02" }
                            ]
                        }
                    }
                ]
            };

            var roomVariantsResponse = new RoomVariantsResponse
            {
                SearchOffersResponses =
                [
                    new()
                    {
                        Offers =
                        [
                            new()
                            {
                                Accom = new()
                                {
                                    Unit =
                                    [
                                        new() { Code = "DB01", Board = "AI", Occupation = new() { ChildAges = [] } }
                                    ]
                                },
                                Price = 1010,
                                Transport =
                                    new()
                                    {
                                        Routes =
                                        [
                                            new() { FltNo = "out01", Car = "Car01" },
                                            new() { FltNo = "inb01", Car = "Car01" }
                                        ]
                                    }
                            },

                            new()
                            {
                                Accom = new()
                                {
                                    Unit =
                                    [
                                        new() { Code = "DB01", Board = "AI+", Occupation = new() { ChildAges = [] } }
                                    ]
                                },
                                Price = 1020,
                                Transport = new()
                                {
                                    Routes =
                                    [
                                        new() { FltNo = "out02", Car = "Car02" },
                                        new() { FltNo = "inb02", Car = "Car02" }
                                    ]
                                }
                            }
                        ]
                    }
                ]
            };

            var validateAmendBookingResponse = new ValidateAmendBookingResponse();
            var amendmentRoomVariant = new AmendRoomVariant
            {
                FullAmendmentCharges = 10,
                Units =
                [
                    new()
                    {
                        Code = "Room",
                        Board = "B0",
                        Availability = 1,
                        RoomType = new(),
                        BoardType = new(),
                        Occupation = new() { ChildAges = [] }
                    }
                ],
                RoomType = "Room",
                BoardType = "B0"
            };

            // Arrange
            _bookingRepositoryMock
                .Setup(x => x.GetBaseBooking(It.IsAny<string>(), It.IsAny<GetBookingOptions>()))
                .ReturnsAsync(bookingResponse);

            _accommOfferServiceMock
                .Setup(x => x.AlternativeFlights(It.IsAny<AmendFlightSearchRequest>(), It.IsAny<PackageThemeType>()))
                .ReturnsAsync(searchOffersResponse);

            _accommOfferServiceMock.Setup(x => x.RoomVariants(It.IsAny<RoomVariantsSearchRequest>())).ReturnsAsync(roomVariantsResponse);
            _hotelsServiceMock.Setup(x => x.Search(It.IsAny<string[]>())).ReturnsAsync(new List<Hotel>());
            //_referenceDataServiceMock.Setup(x => x.GetRoomType(It.IsAny<string>())).ReturnsAsync(new RoomType());
            _amendBookingRepositoryMock.Setup(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), It.IsAny<bool>()))
                .ReturnsAsync(validateAmendBookingResponse);
            _validateBookingResponseMapperMock.Setup(x =>
                    x.MapToRoomVariant(It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<BookingResponse>(), It.IsAny<AmendRoomValidationRequest>()))
                .Returns(amendmentRoomVariant);

            //Act
            var result = await _amendBookingRoomAndBoardService.GetAvailableRoomAndBoards(bookingRef);

            //Asserts
            using (new AssertionScope())
            {
                result.UpsellAmount.Should().BeGreaterThan(0);
                result.UpsellAmount.Should().Be(10);
            }
        }

        [Fact]
        public async Task GetAlternativeRoomAndBoards_ValidBookingRef_UnitShouldHaveFreeChildInfo()
        {
            var bookingRef = "Booking_Test_Ref";

            var bookingResponse = new BookingResponse()
            {
                Prom = "EULU",
                Package = new()
                {
                    Accom = new()
                    {
                        Code = "Test_Code",
                        Rooms =
                        [
                            new()
                            {
                                Code = "Room",
                                Board = "B0",
                                Availability = 1,
                                RoomType = new(),
                                BoardType = new(),
                                Occupation = new() { ChildAges = [] }
                            }
                        ],
                        StartDate = "2023-09-10",
                        EndDate = "2023-09-01"
                    },
                    Transport = new()
                    {
                        Routes =
                        [
                            new() { FltNo = "out01", Car = "Car01" },

                            new() { FltNo = "inb01", Car = "Car01" }
                        ]
                    }
                },
                Transfers = new List<TransferItem>(),
                PaymentInfo = new()
                {
                    TotalPrice = 1000
                }
            };

            var searchOffersResponse = new SearchOffersResponse
            {
                Offers =
                [
                    new()
                    {
                        Accom = new()
                        {
                            Code = "Test_Code",
                            Unit =
                            [
                                new()
                                {
                                    Code = "Room",
                                    Board = "B0",
                                    Availability = 1,
                                    RoomType = new(),
                                    BoardType = new(),
                                    Occupation = new() { ChildAges = [] }
                                }
                            ],
                            PackageId = "packageId1"
                        },
                        Price = 10,
                        Transport = new()
                        {
                            Routes =
                            [
                                new() { FltNo = "out01", Car = "Car01" },
                                new() { FltNo = "inb01", Car = "Car01" }
                            ]
                        }
                    },

                    new()
                    {
                        Accom = new()
                        {
                            Code = "Test_Code",
                            Unit =
                            [
                                new()
                                {
                                    Code = "Room",
                                    Board = "B0",
                                    Availability = 1,
                                    RoomType = new(),
                                    BoardType = new(),
                                    Occupation = new() { ChildAges = [] }
                                }
                            ],
                            PackageId = "packageId1"
                        },
                        Price = 20,
                        Transport = new()
                        {
                            Routes =
                            [
                                new() { FltNo = "out02", Car = "Car02" },
                                new() { FltNo = "inb02", Car = "Car02" }
                            ]
                        }
                    }
                ]
            };

            var roomVariantsResponse = new RoomVariantsResponse
            {
                SearchOffersResponses =
                [
                    new()
                    {
                        Offers =
                        [
                            new()
                            {
                                Accom = new()
                                {
                                    Unit =
                                    [
                                        new()
                                        {
                                            Code = "DB01",
                                            Board = "AI",
                                            Occupation = new() { ChildAges = [] },
                                            FreeForKids = true
                                        }
                                    ]
                                },
                                Price = 1010,
                                Transport =
                                    new()
                                    {
                                        Routes =
                                        [
                                            new() { FltNo = "out01", Car = "Car01" },
                                            new() { FltNo = "inb01", Car = "Car01" }
                                        ]
                                    }
                            },

                            new()
                            {
                                Accom = new()
                                {
                                    Unit =
                                    [
                                        new()
                                        {
                                            Code = "DB01",
                                            Board = "AI+",
                                            Occupation = new() { ChildAges = [] },
                                            FreeForKids = true
                                        }
                                    ]
                                },
                                Price = 1020,
                                Transport = new()
                                {
                                    Routes =
                                    [
                                        new() { FltNo = "out02", Car = "Car02" },
                                        new() { FltNo = "inb02", Car = "Car02" }
                                    ]
                                }
                            }
                        ]
                    }
                ]
            };

            var validateAmendBookingResponse = new ValidateAmendBookingResponse();
            var amendmentRoomVariant = new AmendRoomVariant
            {
                FullAmendmentCharges = 10,
                Units =
                [
                    new()
                    {
                        Availability = 1,
                        RoomType = new(),
                        BoardType = new(),
                        Occupation = new() { ChildAges = [] }
                    }
                ],
                RoomType = "Room",
                BoardType = "B0"
            };

            // Arrange
            _bookingRepositoryMock
                .Setup(x => x.GetBaseBooking(It.IsAny<string>(), It.IsAny<GetBookingOptions>()))
                .ReturnsAsync(bookingResponse);

            _accommOfferServiceMock
                .Setup(x => x.AlternativeFlights(It.IsAny<AmendFlightSearchRequest>(), It.IsAny<PackageThemeType>()))
                .ReturnsAsync(searchOffersResponse);

            _accommOfferServiceMock.Setup(x => x.RoomVariants(It.IsAny<RoomVariantsSearchRequest>())).ReturnsAsync(roomVariantsResponse);
            _hotelsServiceMock.Setup(x => x.Search(It.IsAny<string[]>())).ReturnsAsync(new List<Hotel>());
            //_referenceDataServiceMock.Setup(x => x.GetRoomType(It.IsAny<string>())).ReturnsAsync(new RoomType());
            _amendBookingRepositoryMock.Setup(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), It.IsAny<bool>()))
                .ReturnsAsync(validateAmendBookingResponse);
            _validateBookingResponseMapperMock.Setup(x =>
                    x.MapToRoomVariant(It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<BookingResponse>(), It.IsAny<AmendRoomValidationRequest>()))
                .Returns(amendmentRoomVariant);

            //Act
            var result = await _amendBookingRoomAndBoardService.GetAvailableRoomAndBoards(bookingRef);

            //Asserts
            using (new AssertionScope())
            {
                result.UpsellAmount.Should().BeGreaterThan(0);
                result.UpsellAmount.Should().Be(10);
                result.RoomVariants.First().Units.First().FreeForKids.Should().BeTrue();
            }
        }

        [Fact]
        public async Task GetAlternativeRoomAndBoards_ValidBookingRef_CalculateUpsellAmountWithPromocodeBooking()
        {
            var bookingRef = "Booking_Test_Ref";

            var bookingResponse = new BookingResponse()
            {
                Prom = "EULU",
                Package = new()
                {
                    Accom = new()
                    {
                        Code = "Test_Code",
                        Rooms =
                        [
                            new()
                            {
                                Availability = 1,
                                Code = "Room",
                                Board = "B0",
                                RoomType = new () { Code = "Room" },
                                BoardType = new () { Code = "BB" },
                                Occupation = new() { ChildAges = [] }
                            }
                        ],
                        StartDate = "2023-09-10",
                        EndDate = "2023-09-01"
                    },
                    Transport = new()
                    {
                        Routes =
                        [
                            new() { FltNo = "out01", Car = "Car01" },

                            new() { FltNo = "inb01", Car = "Car01" }
                        ]
                    }
                },
                Transfers = new List<TransferItem>(),
                PaymentInfo = new()
                {
                    TotalPrice = 1000
                },
                PriceBreakdown =
                [
                    new PriceCategory
                {
                    Code = "Promotions",
                    Amount = 5
                }
                ]
            };

            var searchOffersResponse = new SearchOffersResponse
            {
                Offers =
                [
                    new()
                    {
                        Accom = new() { PackageId = "packageId1" },
                        Price = 10,
                        Transport = new()
                        {
                            Routes =
                            [
                                new() { FltNo = "out01", Car = "Car01" },
                                new() { FltNo = "inb01", Car = "Car01" }
                            ]
                        }
                    },

                    new()
                    {
                        Accom = new() { PackageId = "packageId1" },
                        Price = 20,
                        Transport = new()
                        {
                            Routes =
                            [
                                new() { FltNo = "out02", Car = "Car02" },
                                new() { FltNo = "inb02", Car = "Car02" }
                            ]
                        }
                    }
                ]
            };

            var roomVariantsResponse = new RoomVariantsResponse
            {
                SearchOffersResponses =
                [
                    new()
                    {
                        Offers =
                        [
                            new()
                            {
                                Accom = new() { Unit = [new() { Code = "DB01", Board = "AI" }] },
                                Price = 1010,
                                Transport = new()
                                {
                                    Routes =
                                    [
                                        new() { FltNo = "out01", Car = "Car01" },
                                        new() { FltNo = "inb01", Car = "Car01" }
                                    ]
                                }
                            },

                            new()
                            {
                                Accom = new() { Unit = [new() { Code = "DB01", Board = "AI+" }] },
                                Price = 1020,
                                Transport = new()
                                {
                                    Routes =
                                    [
                                        new() { FltNo = "out02", Car = "Car02" },
                                        new() { FltNo = "inb02", Car = "Car02" }
                                    ]
                                }
                            }
                        ]
                    }
                ]
            };

            var validateAmendBookingResponse = new ValidateAmendBookingResponse();
            var amendmentRoomVariant = new AmendRoomVariant
            {
                FullAmendmentCharges = 15,
                Units =
                [
                    new()
                    {
                        Availability = 1,
                        RoomType = new(),
                        BoardType = new(),
                        Occupation = new() { ChildAges = [] }
                    }
                ],
                RoomType = "Room",
                BoardType = "B0"
            };

            // Arrange
            _bookingRepositoryMock
                .Setup(x => x.GetBaseBooking(It.IsAny<string>(), It.IsAny<GetBookingOptions>()))
                .ReturnsAsync(bookingResponse);

            _accommOfferServiceMock
                .Setup(x => x.AlternativeFlights(It.IsAny<AmendFlightSearchRequest>(), It.IsAny<PackageThemeType>()))
                .ReturnsAsync(searchOffersResponse);

            _accommOfferServiceMock.Setup(x => x.RoomVariants(It.IsAny<RoomVariantsSearchRequest>())).ReturnsAsync(roomVariantsResponse);
            _hotelsServiceMock.Setup(x => x.Search(It.IsAny<string[]>())).ReturnsAsync(new List<Hotel>());
            //_referenceDataServiceMock.Setup(x => x.GetRoomType(It.IsAny<string>())).ReturnsAsync(new RoomType());
            _amendBookingRepositoryMock.Setup(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), It.IsAny<bool>()))
                .ReturnsAsync(validateAmendBookingResponse);
            _validateBookingResponseMapperMock.Setup(x =>
                    x.MapToRoomVariant(It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<BookingResponse>(), It.IsAny<AmendRoomValidationRequest>()))
                .Returns(amendmentRoomVariant);
            //Act
            var result = await _amendBookingRoomAndBoardService.GetAvailableRoomAndBoards(bookingRef);

            //Asserts
            using (new AssertionScope())
            {
                result.UpsellAmount.Should().BeGreaterThan(0);
                result.UpsellAmount.Should().Be(15);
            }
        }

        [Fact]
        public async Task GetAlternativeRoomAndBoards_ValidBookingRef_CanNoFindCurrentFlight_ThrowException()
        {
            var bookingResponse = new BookingResponse()
            {
                Prom = "EULU",
                Package = new()
                {
                    Accom = new()
                    {
                        Code = "Test_Code",
                        Rooms = [],
                        StartDate = "2023-09-10",
                        EndDate = "2023-09-01"
                    },
                    Transport = new()
                    {
                        Routes =
                        [
                            new() { FltNo = "out01", Car = "Car01" },

                            new() { FltNo = "inb01", Car = "Car01" }
                        ]
                    }
                },
                Transfers = new List<TransferItem>()
            };

            _accommOfferServiceMock
                .Setup(x => x.AlternativeFlights(It.IsAny<AmendFlightSearchRequest>(), It.IsAny<PackageThemeType>()))
                .ReturnsAsync(new SearchOffersResponse());

            _bookingRepositoryMock
                .Setup(x => x.GetBaseBooking(It.IsAny<string>(), It.IsAny<GetBookingOptions>()))
                .ReturnsAsync(bookingResponse);

            var result = () => _amendBookingRoomAndBoardService.GetAvailableRoomAndBoards(string.Empty);

            await result.Should().ThrowAsync<ApiException>().Where(x => x.Code.Code == ApiExceptionCodes.AmendRoomSearchError.Code);
        }

        [Fact]
        public async Task GetAlternativeRoomAndBoards_ValidBookingRef_CanNoFindAnyRooms_ThrowException()
        {
            var bookingResponse = new BookingResponse()
            {
                Prom = "EULU",
                Package = new()
                {
                    Accom = new()
                    {
                        Code = "Test_Code",
                        Rooms = [],
                        StartDate = "2023-09-10",
                        EndDate = "2023-09-01"
                    },
                    Transport = new()
                    {
                        Routes =
                        [
                            new() { FltNo = "out01", Car = "Car01" },

                            new() { FltNo = "inb01", Car = "Car01" }
                        ]
                    }
                },
                Transfers = new List<TransferItem>()
            };

            var altFlightResponse = new SearchOffersResponse
            {
                Offers =
                [
                    new()
                    {
                        Accom = new() { PackageId = "packageId1" },
                        Price = 10,
                        Transport = new()
                        {
                            Routes =
                            [
                                new() { FltNo = "out01", Car = "Car01" },
                                new() { FltNo = "inb01", Car = "Car01" }
                            ]
                        }
                    },

                    new()
                    {
                        Accom = new() { PackageId = "packageId1" },
                        Price = 20,
                        Transport = new()
                        {
                            Routes =
                            [
                                new() { FltNo = "out02", Car = "Car02" },
                                new() { FltNo = "inb02", Car = "Car02" }
                            ]
                        }
                    }
                ]
            };

            _accommOfferServiceMock
                .Setup(x => x.AlternativeFlights(It.IsAny<AmendFlightSearchRequest>(), It.IsAny<PackageThemeType>()))
                .ReturnsAsync(altFlightResponse);

            _bookingRepositoryMock
                .Setup(x => x.GetBaseBooking(It.IsAny<string>(), It.IsAny<GetBookingOptions>()))
                .ReturnsAsync(bookingResponse);

            _accommOfferServiceMock.Setup(x => x.RoomVariants(It.IsAny<RoomVariantsSearchRequest>())).ReturnsAsync(new RoomVariantsResponse());

            var result = () => _amendBookingRoomAndBoardService.GetAvailableRoomAndBoards(string.Empty);

            await result.Should().ThrowAsync<ApiException>().Where(x => x.Code.Code == ApiExceptionCodes.AmendRoomSearchError.Code);
        }

        [Fact]
        public async Task ValidateAlternativeRoomAndBoard_SelectedRoomVariantIsNull_ThrowException()
        {
            var request = new AmendRoomValidationRequest
            {
                BookingRef = "TestRef",
                SelectedRoomVariant = null,
                RoomVariants = []
            };

            var result = () => _amendBookingRoomAndBoardService.ValidateAlternativeRoomAndBoard(request);

            await result.Should().ThrowAsync<ArgumentNullException>();
        }

        [Fact]
        public async Task ValidateAlternativeRoomAndBoard_RoomVariantIsEmpty_ReturnEmptyArray()
        {
            var request = new AmendRoomValidationRequest
            {
                BookingRef = "TestRef",
                SelectedRoomVariant = new(),
                RoomVariants = []
            };

            var result = await _amendBookingRoomAndBoardService.ValidateAlternativeRoomAndBoard(request);

            result.Should().BeEmpty();
        }

        [Fact]
        public async Task ValidateAlternativeRoomAndBoard_SuccesValidation()
        {
            var request = new AmendRoomValidationRequest
            {
                BookingRef = "TestRef",
                SelectedRoomVariant = new()
                {
                    Units =
                    [
                        new()
                        {
                            Board = "BB",
                            Code = "SW01",
                            Occupation = new() { Adults = 2, Children = 0, Infants = 0, ChildAges = [] }
                        }
                    ]
                },
                RoomVariants = new List<AmendRoomVariant>
                {
                    new()
                    {
                        Units =
                        [
                            new()
                            {
                                Board = "AI",
                                Code = "DB01",
                                Occupation = new() { Adults = 2, Children = 0, Infants = 0, ChildAges = [] }
                            }
                        ]
                    },
                    new()
                    {
                        Units =
                        [
                            new()
                            {
                                Board = "HB",
                                Code = "DB01",
                                Occupation = new() { Adults = 2, Children = 0, Infants = 0, ChildAges = [] }
                            }
                        ]
                    }
                }
            };

            var booking = new BookingResponse()
            {
                Prom = "EULU",
                Package = new()
                {
                    Accom = new()
                    {
                        Code = "Test_Code",
                        Rooms =
                        [
                            new()
                            {
                                Board = "AI",
                                Code = "DB01",
                                Occupation = new() { Adults = 2, Children = 0, Infants = 0, ChildAges = [] }
                            }
                        ],
                        StartDate = "2023-09-10",
                        EndDate = "2023-09-01"
                    },
                    Transport = new()
                    {
                        Routes =
                        [
                            new() { FltNo = "out01", Car = "Car01" },

                            new() { FltNo = "inb01", Car = "Car01" }
                        ]
                    }
                },
                Transfers = new List<TransferItem>()
            };

            _bookingRepositoryMock
                .Setup(x => x.GetBooking(It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync(booking);

            _amendBookingRepositoryMock
                .Setup(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), It.IsAny<bool>()))
                .ReturnsAsync(new ValidateAmendBookingResponse());

            _validateBookingResponseMapperMock
                .Setup(x => x.MapToRoomVariant(It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<BookingResponse>(), It.IsAny<AmendRoomValidationRequest>()))
                .Returns(new AmendRoomVariant());

            var result = await _amendBookingRoomAndBoardService.ValidateAlternativeRoomAndBoard(request);

            result.Count().Should().Be(2);

            _bookingRepositoryMock
                .Verify(x => x.GetBooking(It.IsAny<string>(), It.IsAny<string>()), Times.Once);

            _amendBookingRepositoryMock
                .Verify(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), It.IsAny<bool>()), Times.Exactly(2));

            _validateBookingResponseMapperMock
                .Verify(x => x.MapToRoomVariant(It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<BookingResponse>(), It.IsAny<AmendRoomValidationRequest>()),
                    Times.Exactly(2));
        }

        [Fact]
        public async Task ValidateAlternativeRoomAndBoard_BookingWithPromocode_SuccesValidation()
        {
            var request = new AmendRoomValidationRequest
            {
                BookingRef = "TestRef",
                DiscountCode = "ORANGESALE",
                SelectedRoomVariant = new()
                {
                    Units =
                    [
                        new()
                        {
                            Board = "BB",
                            Code = "SW01",
                            Occupation = new() { Adults = 2, Children = 0, Infants = 0, ChildAges = [] }
                        }
                    ]
                },
                RoomVariants = new List<AmendRoomVariant>
                {
                    new()
                    {
                        Units =
                        [
                            new()
                            {
                                Board = "AI",
                                Code = "DB01",
                                Occupation = new() { Adults = 2, Children = 0, Infants = 0, ChildAges = [] }
                            }
                        ]
                    },
                    new()
                    {
                        Units =
                        [
                            new()
                            {
                                Board = "HB",
                                Code = "DB01",
                                Occupation = new() { Adults = 2, Children = 0, Infants = 0, ChildAges = [] }
                            }
                        ]
                    }
                }
            };

            var originalBooking = new BookingResponse()
            {
                Prom = "EULU",
                Package = new()
                {
                    Accom = new()
                    {
                        Code = "Test_Code",
                        Rooms =
                        [
                            new()
                            {
                                Board = "AI",
                                Code = "DB01",
                                Occupation = new() { Adults = 2, Children = 0, Infants = 0, ChildAges = [] }
                            }
                        ],
                        StartDate = "2023-09-10",
                        EndDate = "2023-09-01"
                    },
                    Transport = new()
                    {
                        Routes =
                        [
                            new() { FltNo = "out01", Car = "Car01" },

                            new() { FltNo = "inb01", Car = "Car01" }
                        ]
                    }
                },
                Transfers = new List<TransferItem>()
            };

            var validateBookingResponseWithoutPromocode = new ValidateAmendBookingResponse();

            var validateBookingResponseWithPromocode = new ValidateAmendBookingResponse();

            _bookingRepositoryMock
                .Setup(x => x.GetBooking(It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync(originalBooking);

            _amendBookingRepositoryMock
                .Setup(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), It.IsAny<bool>()))
                .ReturnsAsync(validateBookingResponseWithoutPromocode);

            _validateBookingResponseMapperMock
                .Setup(x => x.MapToRoomVariant(validateBookingResponseWithoutPromocode, originalBooking, request))
                .Returns(new AmendRoomVariant());

            _amendPromocodeHandlerServiceMock
                .Setup(x => x.HandlePromocode(It.IsAny<BookingResponse>(), originalBooking, validateBookingResponseWithoutPromocode))
                .ReturnsAsync(validateBookingResponseWithPromocode);

            _validateBookingResponseMapperMock
                .Setup(x => x.MapToRoomVariant(validateBookingResponseWithPromocode, originalBooking, request))
                .Returns(new AmendRoomVariant());

            var result = await _amendBookingRoomAndBoardService.ValidateAlternativeRoomAndBoard(request);

            result.Count().Should().Be(2);

            _bookingRepositoryMock
                .Verify(x => x.GetBooking(It.IsAny<string>(), It.IsAny<string>()), Times.Once);

            _amendBookingRepositoryMock
                .Verify(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), It.IsAny<bool>()), Times.Exactly(2));

            _validateBookingResponseMapperMock
                .Verify(x => x.MapToRoomVariant(validateBookingResponseWithoutPromocode, originalBooking, request),
                    Times.Exactly(2));

            _amendPromocodeHandlerServiceMock
                .Verify(x => x.HandlePromocode(It.IsAny<BookingResponse>(), originalBooking, validateBookingResponseWithoutPromocode), Times.Exactly(2));

            _validateBookingResponseMapperMock
                .Verify(x => x.MapToRoomVariant(validateBookingResponseWithPromocode, originalBooking, request), Times.Exactly(2));
        }

        [Fact]
        public async Task ValidateAlternativeRoomAndBoard_ErrorDuringValidation_ReturnEmptyArray()
        {
            var request = new AmendRoomValidationRequest
            {
                BookingRef = "TestRef",
                SelectedRoomVariant = new()
                {
                    Units =
                    [
                        new()
                        {
                            Board = "BB",
                            Code = "SW01",
                            Occupation = new() { Adults = 2, Children = 0, Infants = 0, ChildAges = [] }
                        }
                    ]
                },
                RoomVariants = new List<AmendRoomVariant>
                {
                    new()
                    {
                        Units =
                        [
                            new()
                            {
                                Board = "AI",
                                Code = "DB01",
                                Occupation = new() { Adults = 2, Children = 0, Infants = 0, ChildAges = [] }
                            }
                        ]
                    },
                    new()
                    {
                        Units =
                        [
                            new()
                            {
                                Board = "HB",
                                Code = "DB01",
                                Occupation = new() { Adults = 2, Children = 0, Infants = 0, ChildAges = [] }
                            }
                        ]
                    }
                }
            };

            var booking = new BookingResponse()
            {
                Prom = "EULU",
                Package = new()
                {
                    Accom = new()
                    {
                        Code = "Test_Code",
                        Rooms =
                        [
                            new()
                            {
                                Board = "AI",
                                Code = "DB01",
                                Occupation = new() { Adults = 2, Children = 0, Infants = 0, ChildAges = [] }
                            }
                        ],
                        StartDate = "2023-09-10",
                        EndDate = "2023-09-01"
                    },
                    Transport = new()
                    {
                        Routes =
                        [
                            new() { FltNo = "out01", Car = "Car01" },

                            new() { FltNo = "inb01", Car = "Car01" }
                        ]
                    }
                },
                Transfers = new List<TransferItem>()
            };

            _bookingRepositoryMock
                .Setup(x => x.GetBooking(It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync(booking);

            _amendBookingRepositoryMock
                .Setup(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), It.IsAny<bool>()))
                .ReturnsAsync((ValidateAmendBookingResponse)null);

            var result = await _amendBookingRoomAndBoardService.ValidateAlternativeRoomAndBoard(request);

            result.Count().Should().Be(0);

            _bookingRepositoryMock
                .Verify(x => x.GetBooking(It.IsAny<string>(), It.IsAny<string>()), Times.Once);

            _amendBookingRepositoryMock
                .Verify(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), It.IsAny<bool>()), Times.Exactly(2));

            _validateBookingResponseMapperMock
                .Verify(x => x.MapToRoomVariant(It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<BookingResponse>(), It.IsAny<AmendRoomValidationRequest>()),
                    Times.Never);
        }

        public static IEnumerable<object[]> GetAlternativeRoomsTestData()
        {
            yield return
            [
                "Valid booking without seats",
                "Test_ref",
                2,
                0,
                new BookingResponse()
                {
                    Prom = "EULU",
                    Package = new()
                    {
                        Accom = new()
                        {
                            Code = "Test_Code",
                            Rooms = [new() { Board = "B1", Code = "R1", Occupation = new() { ChildAges = [] } }],
                            StartDate = "2023-09-10",
                            EndDate = "2023-09-01"
                        },
                        Transport = new()
                        {
                            Routes =
                            [
                                new() { FltNo = "out01", Car = "Car01" },

                                new() { FltNo = "inb01", Car = "Car01" }
                            ]
                        }
                    },
                    Transfers = new List<TransferItem>(),
                    PaymentInfo = new()
                    {
                        TotalPrice = 1000
                    }
                },
                new SearchOffersResponse
                {
                    Offers =
                    [
                        new()
                        {
                            Accom = new() { PackageId = "packageId1" },
                            Price = 10,
                            Transport = new()
                            {
                                Routes =
                                [
                                    new() { FltNo = "out01", Car = "Car01" },
                                    new() { FltNo = "inb01", Car = "Car01" }
                                ]
                            }
                        },

                        new()
                        {
                            Accom = new() { PackageId = "packageId1" },
                            Price = 20,
                            Transport = new()
                            {
                                Routes =
                                [
                                    new() { FltNo = "out02", Car = "Car02" },
                                    new() { FltNo = "inb02", Car = "Car02" }
                                ]
                            }
                        }
                    ]
                },
                new RoomVariantsResponse
                {
                    SearchOffersResponses =
                    [
                        new()
                        {
                            Offers =
                            [
                                new()
                                {
                                    Accom =
                                        new() { Unit = [new() { Code = "DB01", Board = "AI" }] },
                                    Price = 10,
                                    Transport = new()
                                    {
                                        Routes =
                                        [
                                            new() { FltNo = "out01", Car = "Car01" },
                                            new() { FltNo = "inb01", Car = "Car01" }
                                        ]
                                    }
                                },

                                new()
                                {
                                    Accom = new() { Unit = [new() { Code = "DB01", Board = "AI+" }] },
                                    Price = 20,
                                    Transport = new()
                                    {
                                        Routes =
                                        [
                                            new() { FltNo = "out02", Car = "Car02" },
                                            new() { FltNo = "inb02", Car = "Car02" }
                                        ]
                                    }
                                }
                            ]
                        }
                    ]
                }
            ];
            yield return
            [
                "Valid booking, alt rooms has current offer, without seats",
                "Test_ref",
                2,
                0,
                new BookingResponse()
                {
                    Prom = "EULU",
                    Package = new()
                    {
                        Accom = new()
                        {
                            Code = "Test_Code",
                            Rooms =
                            [
                                new()
                                {
                                    Board = "AI",
                                    Code = "DB01",
                                    Occupation = new() { Adults = 2, Children = 0, Infants = 0, ChildAges = [] }
                                }
                            ],
                            StartDate = "2023-09-10",
                            EndDate = "2023-09-01"
                        },
                        Transport = new()
                        {
                            Routes =
                            [
                                new() { FltNo = "out01", Car = "Car01" },

                                new() { FltNo = "inb01", Car = "Car01" }
                            ]
                        }
                    },
                    Transfers = new List<TransferItem>(),
                    PaymentInfo = new()
                    {
                        TotalPrice = 1000
                    }
                },
                new SearchOffersResponse
                {
                    Offers =
                    [
                        new()
                        {
                            Accom = new() { PackageId = "packageId1" },
                            Price = 10,
                            Transport = new()
                            {
                                Routes =
                                [
                                    new() { FltNo = "out01", Car = "Car01" },
                                    new() { FltNo = "inb01", Car = "Car01" }
                                ]
                            }
                        },

                        new()
                        {
                            Accom = new() { PackageId = "packageId1" },
                            Price = 20,
                            Transport = new()
                            {
                                Routes =
                                [
                                    new() { FltNo = "out02", Car = "Car02" },
                                    new() { FltNo = "inb02", Car = "Car02" }
                                ]
                            }
                        }
                    ]
                },
                new RoomVariantsResponse
                {
                    SearchOffersResponses =
                    [
                        new()
                        {
                            Offers =
                            [
                                new()
                                {
                                    Accom =
                                        new() { Unit = [new() { Code = "DB02", Board = "AI" }] },
                                    Price = 10,
                                    Transport = new()
                                    {
                                        Routes =
                                        [
                                            new() { FltNo = "out01", Car = "Car01" },
                                            new() { FltNo = "inb01", Car = "Car01" }
                                        ]
                                    }
                                },

                                new()
                                {
                                    Accom = new() { Unit = [new() { Code = "DB01", Board = "AI+" }] },
                                    Price = 20,
                                    Transport = new()
                                    {
                                        Routes =
                                        [
                                            new() { FltNo = "out02", Car = "Car02" },
                                            new() { FltNo = "inb02", Car = "Car02" }
                                        ]
                                    }
                                }
                            ]
                        }
                    ],
                    AltBoards = [new()]
                }
            ];
        }

        public static IEnumerable<object[]> GetAlternativeFlightsTestDataForSeatPrices()
        {
            yield return
            [
                "Valid booking without seats",
                "Test_ref",
                new BookingResponse()
                {
                    Prom = "EULU",
                    Package = new()
                    {
                        Accom = new()
                        {
                            Code = "Test_Code",
                            Rooms =
                            [
                                new()
                                {
                                    Board = "board1",
                                    Code = "DB0111",
                                    Occupation = new() { Adults = 2, Children = 0, Infants = 0, ChildAges = [] }
                                }
                            ],
                            StartDate = "2023-09-10",
                            EndDate = "2023-09-01"
                        },
                        Transport = new()
                        {
                            Routes =
                            [
                                new() { FltNo = "out01", Car = "Car01" },

                                new() { FltNo = "inb01", Car = "Car01" }
                            ]
                        }
                    },
                    Transfers = new List<TransferItem>(),
                    PaymentInfo = new()
                    {
                        TotalPrice = 1000
                    }
                },
                new SearchOffersResponse
                {
                    Offers =
                    [
                        new()
                        {
                            Accom = new()
                            {
                                PackageId = "packageId2",
                                Unit = [new() { Board = "b03", Code = "code03" }]
                            },
                            Price = 20,
                            Transport = new()
                            {
                                Routes =
                                [
                                    new() { FltNo = "out01", Car = "Car01" },
                                    new() { FltNo = "inb01", Car = "Car01" }
                                ]
                            }
                        },

                        new()
                        {
                            Accom = new()
                            {
                                PackageId = "packageId3",
                                Unit = [new() { Board = "b03", Code = "code03" }]
                            },
                            Price = 20,
                            Transport = new()
                            {
                                Routes =
                                [
                                    new() { FltNo = "out02", Car = "Car02" },
                                    new() { FltNo = "inb02", Car = "Car02" }
                                ]
                            }
                        }
                    ]
                },
                new RoomVariantsResponse
                {
                    SearchOffersResponses =
                    [
                        new()
                        {
                            Offers =
                            [
                                new()
                                {
                                    Price = 20,
                                    Accom = new() { Unit = [new() { Board = "b02", Code = "code02" }] }
                                }
                            ]
                        }
                    ],
                    AltBoards = [new() { Price = 20 }]
                },
                new AmendRoomVariantsResponse
                {
                    RoomVariants = new List<AmendRoomVariant>
                    {
                        new()
                        {
                            OfferPrice = 20,
                        }
                    }
                }
            ];

            yield return
            [
                "Valid booking with seats",
                "Test_ref",
                new BookingResponse()
                {
                    Prom = "EULU",
                    SeatSelection =
                    [
                        new() { FlightNumber = "01", Seats = [new() { Price = 10 }] }
                    ],
                    Package = new()
                    {
                        Accom = new()
                        {
                            Code = "Test_Code",
                            Rooms =
                            [
                                new()
                                {
                                    Board = "board1",
                                    Code = "DB0111",
                                    Occupation = new() { Adults = 2, Children = 0, Infants = 0, ChildAges = [] }
                                }
                            ],
                            StartDate = "2023-09-10",
                            EndDate = "2023-09-01"
                        },
                        Transport = new()
                        {
                            Routes =
                            [
                                new() { FltNo = "out01", Car = "Car01" },

                                new() { FltNo = "inb01", Car = "Car01" }
                            ]
                        }
                    },
                    Transfers = new List<TransferItem>(),
                    PaymentInfo = new()
                    {
                        TotalPrice = 1000
                    }
                },
                new SearchOffersResponse
                {
                    Offers =
                    [
                        new()
                        {
                            Accom = new() { PackageId = "packageId2" },
                            Price = 20,
                            Transport = new()
                            {
                                Routes =
                                [
                                    new() { FltNo = "out01", Car = "Car01" },
                                    new() { FltNo = "inb01", Car = "Car01" }
                                ]
                            }
                        },

                        new()
                        {
                            Accom = new()
                            {
                                PackageId = "packageId3",
                                Unit = [new() { Board = "b03", Code = "code03" }]
                            },
                            Price = 20,
                            Transport = new()
                            {
                                Routes =
                                [
                                    new() { FltNo = "out02", Car = "Car02" },
                                    new() { FltNo = "inb02", Car = "Car02" }
                                ]
                            }
                        }
                    ]
                },
                new RoomVariantsResponse
                {
                    SearchOffersResponses =
                    [
                        new()
                        {
                            Offers =
                            [
                                new()
                                {
                                    Price = 20,
                                    Accom = new() { Unit = [new() { Board = "b02", Code = "code02" }] },
                                    Transport = new() { Routes = [new() { Car = "no", FltNo = "no01" }] }
                                }
                            ]
                        }
                    ],
                    AltBoards = [new() { Price = 20 }]
                },
                new AmendRoomVariantsResponse
                {
                    RoomVariants = new List<AmendRoomVariant>
                    {
                        new()
                        {
                            OfferPrice = 20,
                        }
                    }
                }
            ];
        }

        public static IEnumerable<object[]> GetAlternativeFlightsTestDataForTransportPrices()
        {
            yield return
            [
                "Valid booking with city holiday",
                "Test_ref",
                new BookingResponse()
                {
                    Prom = "EULU",
                    Package = new()
                    {
                        Accom = new()
                        {
                            Code = "Test_Code",
                            Rooms =
                            [
                                new()
                                {
                                    Board = "board1",
                                    Code = "DB0111",
                                    Occupation = new() { Adults = 2, Children = 0, Infants = 0, ChildAges = [] }
                                }
                            ],
                            StartDate = "2023-09-10",
                            EndDate = "2023-09-01"
                        },
                        Transport = new()
                        {
                            Routes =
                            [
                                new() { FltNo = "out01", Car = "Car01" },

                                new() { FltNo = "inb01", Car = "Car01" }
                            ]
                        }
                    },
                    Transfers = new List<TransferItem>
                    {
                        new()
                        {
                            Code = "SS"
                        }
                    },
                    PaymentInfo = new()
                    {
                        TotalPrice = 1000
                    }
                },
                new SearchOffersResponse
                {
                    Offers =
                    [
                        new()
                        {
                            Accom = new() { PackageId = "packageId2" },
                            Price = 10,
                            Transport = new()
                            {
                                Routes =
                                [
                                    new() { FltNo = "out01", Car = "Car01" },
                                    new() { FltNo = "inb01", Car = "Car01" }
                                ]
                            }
                        },

                        new()
                        {
                            Accom = new()
                            {
                                PackageId = "packageId3",
                                Unit = [new() { Board = "b03", Code = "code03" }]
                            },
                            Price = 20,
                            Transport = new()
                            {
                                Routes =
                                [
                                    new() { FltNo = "out02", Car = "Car02" },
                                    new() { FltNo = "inb02", Car = "Car02" }
                                ]
                            }
                        }
                    ]
                },
                new RoomVariantsResponse
                {
                    SearchOffersResponses =
                    [
                        new()
                        {
                            Offers =
                            [
                                new()
                                {
                                    Price = 10,
                                    Accom = new() { Unit = [new() { Board = "b02", Code = "code02" }] }
                                }
                            ]
                        }
                    ],
                    AltBoards = [new() { Price = 20 }]
                },
                new OfferExtras
                {
                    Transfers = new List<TransferItem>
                    {
                        new()
                        {
                            Price = 20,
                            Code = "SS"
                        }
                    }
                },
                new AmendRoomVariantsResponse
                {
                    RoomVariants = new List<AmendRoomVariant>
                    {
                        new()
                        {
                            OfferPrice = 30,
                        }
                    }
                }
            ];
        }
    }
}