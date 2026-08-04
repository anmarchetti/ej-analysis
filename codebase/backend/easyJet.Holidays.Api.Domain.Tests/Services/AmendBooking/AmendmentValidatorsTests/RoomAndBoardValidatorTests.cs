using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Services.AmendBooking.AmendmentValidators;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using FluentAssertions;
using FluentAssertions.Execution;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.AmendBooking.AmendmentValidatorsTests
{
    public class RoomAndBoardValidatorTests
    {
        private readonly Mock<IReferenceDataService> _referenceDataServiceMock = new();
        private IOptions<ApiSettings> _apiSettings;
        private RoomAndBoardValidator _sut;

        public RoomAndBoardValidatorTests()
        {
            _apiSettings = Options.Create(new ApiSettings
            {
                AmendBookingMemo = new AmendBookingMemoSettings
                {
                    SpecialRequestChange = new MemoSettings
                    {
                        Code = "AMD9"
                    },
                    FlightTimeChange = new MemoSettings
                    {
                        Code = "AMD1"
                    },
                    TransferChange = new MemoSettings
                    {
                        Code = "AMD2"
                    },
                    HolidayDateChange = new MemoSettings
                    {
                        Code = "AMD8"
                    },
                    RoomTypeChange = new MemoSettings
                    {
                        Code = "AMD6"
                    },
                    BoardTypeChange = new MemoSettings
                    {
                        Code = "AMD5"
                    },
                    RoomAndBoardTypeChange = new MemoSettings
                    {
                        Code = "AMD10"
                    }
                },
                ExternalHotelsProviders = new Dictionary<ExternalHotelProviders, List<string>>
                {
                    { ExternalHotelProviders.DI, new List<string> { "TGX" } },
                    { ExternalHotelProviders.HBG, new List<string> { "HB3" } },
                }
            });
        }

        [Fact]
        public async Task AmendRoomAndBoardValidation_DisabledByCms()
        {
            var bookingResponse = new BookingResponse
            {
                IsExternalAgency = false,
                Package = new BookingPackage
                {
                    Transport = new Transport
                    {
                        Routes = new List<Route>
                    {
                        new Route
                        {
                            Direction = Direction.Outbound,
                            DepDate = DateTimeOffset.Now.AddHours(1000),
                            IsSeatReservationPossible = true
                        },
                        new Route
                        {
                            Direction = Direction.Inbound,
                            DepDate = DateTimeOffset.Now.AddHours(1000),
                            IsSeatReservationPossible = true
                        }
                    }
                    },
                    Accom = new BookingAccommodation
                    {
                        IsExt = false,
                        Code = "EZY1",
                        Rooms = new List<Unit>()
                    }
                },
                AmendmentInfo = new AmendmentsInfo
                {
                    Route = true,
                    Transfer = new AmendItem
                    {
                        AmendAllow = true,
                        DowngradeAllow = true
                    },
                    ChangeDates = true,
                    Memo = true,
                    Pax = new Pax
                    {
                        AmendAllow = true,
                        AmendNameOnly = true
                    },
                    Seats = true
                }
            };

            var memos = new List<Memo>();

            _referenceDataServiceMock
                .Setup(x => x.GetAmendBookingSetting())
                .ReturnsAsync(new AmendBookingSetting
                {
                    IsRoomAndBoardEnabled = false,
                    RoomAndBoardAmendCount = 1
                });

            _sut = new RoomAndBoardValidator(_apiSettings);

            await _sut.Validate(bookingResponse, memos, await _referenceDataServiceMock.Object.GetAmendBookingSetting());

            var expectedStatuses = new List<AmendBookingStatus>
            {
                AmendBookingStatus.AmendRoomAndBoardDisabledOnSite
            };

            using (new AssertionScope())
            {
                bookingResponse.AmendmentInfo.AmendBookingStatus.Should().BeEquivalentTo(expectedStatuses);

                bookingResponse.AmendmentInfo.Route.Should().Be(true);
                bookingResponse.AmendmentInfo.Transfer.AmendAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Transfer.DowngradeAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Pax.AmendAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Pax.AmendNameOnly.Should().Be(true);
                bookingResponse.AmendmentInfo.RoomAndBoard.Should().Be(false);
            }
        }

        [Fact]
        public async Task AmendAmendRoomAndBoardValidationValidation_DisabledByCms_TimeBound()
        {
            var bookingResponse = new BookingResponse
            {
                IsExternalAgency = false,
                Package = new BookingPackage
                {
                    Transport = new Transport
                    {
                        Routes = new List<Route>
                    {
                        new Route
                        {
                            Direction = Direction.Outbound,
                            DepDate = DateTimeOffset.Now.AddHours(1000),
                            IsSeatReservationPossible = true
                        },
                        new Route
                        {
                            Direction = Direction.Inbound,
                            DepDate = DateTimeOffset.Now.AddHours(1000),
                            IsSeatReservationPossible = true
                        }
                    }
                    },
                    Accom = new BookingAccommodation
                    {
                        IsExt = false,
                        Code = "EZY1",
                        Rooms = new List<Unit>()
                    }
                },
                AmendmentInfo = new AmendmentsInfo
                {
                    Route = true,
                    Transfer = new AmendItem
                    {
                        AmendAllow = true,
                        DowngradeAllow = true
                    },
                    ChangeDates = true,
                    Memo = true,
                    Pax = new Pax
                    {
                        AmendAllow = true,
                        AmendNameOnly = true
                    },
                    Seats = true
                }
            };

            var memos = new List<Memo>();

            _referenceDataServiceMock
                .Setup(x => x.GetAmendBookingSetting())
                .ReturnsAsync(new AmendBookingSetting
                {
                    RoomAndBoardThresholdHours = 1672,
                    IsRoomAndBoardEnabled = true,
                    RoomAndBoardAmendCount = 1
                });

            _sut = new RoomAndBoardValidator(_apiSettings);

            await _sut.Validate(bookingResponse, memos, await _referenceDataServiceMock.Object.GetAmendBookingSetting());

            var expectedStatuses = new List<AmendBookingStatus>
            {
                AmendBookingStatus.AmendRoomAndBoardDisabledByTimeBound
            };

            using (new AssertionScope())
            {
                bookingResponse.AmendmentInfo.AmendBookingStatus.Should().BeEquivalentTo(expectedStatuses);

                bookingResponse.AmendmentInfo.Route.Should().Be(true);
                bookingResponse.AmendmentInfo.Transfer.AmendAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Transfer.DowngradeAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Pax.AmendAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Pax.AmendNameOnly.Should().Be(true);
                bookingResponse.AmendmentInfo.RoomAndBoard.Should().Be(false);
            }
        }

        [Fact]
        public async Task AmendAmendRoomAndBoardValidationValidation_DisabledMultiRoomByCms()
        {
            var bookingResponse = new BookingResponse
            {
                IsExternalAgency = false,
                Package = new BookingPackage
                {
                    Transport = new Transport
                    {
                        Routes = new List<Route>
                        {
                            new Route
                            {
                                Direction = Direction.Outbound,
                                DepDate = DateTimeOffset.Now.AddHours(10000),
                                IsSeatReservationPossible = true
                            },
                            new Route
                            {
                                Direction = Direction.Inbound,
                                DepDate = DateTimeOffset.Now.AddHours(10000),
                                IsSeatReservationPossible = true
                            }
                        }
                    },
                    Accom = new BookingAccommodation
                    {
                        IsExt = false,
                        Code = "EZY1",
                        Rooms = new List<Unit>
                        {
                            new Unit(),
                            new Unit()
                        }
                    }
                },
                AmendmentInfo = new AmendmentsInfo
                {
                    RoomAndBoard = true
                }
            };

            _referenceDataServiceMock
                .Setup(x => x.GetAmendBookingSetting())
                .ReturnsAsync(new AmendBookingSetting
                {
                    RoomAndBoardThresholdHours = 672,
                    IsRoomAndBoardEnabled = true,
                    RoomAndBoardAmendCount = 1,
                    AllowMultiRoomAmendment = false
                });

            _sut = new RoomAndBoardValidator(_apiSettings);

            await _sut.Validate(bookingResponse, new List<Memo>(), await _referenceDataServiceMock.Object.GetAmendBookingSetting());

            var expectedStatuses = new List<AmendBookingStatus>
            {
                AmendBookingStatus.AmendRoomAndBoardDisabledByHavingMultipleRooms
            };

            using (new AssertionScope())
            {
                bookingResponse.AmendmentInfo.AmendBookingStatus.Should().BeEquivalentTo(expectedStatuses);

                bookingResponse.AmendmentInfo.RoomAndBoard.Should().Be(false);
            }
        }

        [Theory]
        [InlineData("AMD5", false)]
        [InlineData("AMD6", false)]
        [InlineData("AMD10", false)]
        [InlineData("AMD1", true)]
        public async Task AmendAmendRoomAndBoardValidationValidation_DisabledByCms_ChangeCountRestriction(string memoCode, bool isAccomChangeAvailable)
        {
            var bookingResponse = new BookingResponse
            {
                IsExternalAgency = false,
                Package = new BookingPackage
                {
                    Transport = new Transport
                    {
                        Routes = new List<Route>
                    {
                        new Route
                        {
                            Direction = Direction.Outbound,
                            DepDate = DateTimeOffset.Now.AddHours(1000),
                            IsSeatReservationPossible = true
                        },
                        new Route
                        {
                            Direction = Direction.Inbound,
                            DepDate = DateTimeOffset.Now.AddHours(1000),
                            IsSeatReservationPossible = true
                        }
                    }
                    },
                    Accom = new BookingAccommodation
                    {
                        IsExt = false,
                        Code = "EZY1",
                        Rooms = new List<Unit>()
                    }
                },
                AmendmentInfo = new AmendmentsInfo
                {
                    Route = true,
                    Transfer = new AmendItem
                    {
                        AmendAllow = true,
                        DowngradeAllow = true
                    },
                    ChangeDates = true,
                    Memo = true,
                    Pax = new Pax
                    {
                        AmendAllow = true,
                        AmendNameOnly = true
                    },
                    Seats = true,
                    RoomAndBoard = true
                }
            };

            var memos = new List<Memo> { new Memo { Code = memoCode } };

            _referenceDataServiceMock
                .Setup(x => x.GetAmendBookingSetting())
                .ReturnsAsync(new AmendBookingSetting
                {
                    RoomAndBoardThresholdHours = 672,
                    IsRoomAndBoardEnabled = true,
                    RoomAndBoardAmendCount = 1
                });

            _sut = new RoomAndBoardValidator(_apiSettings);

            await _sut.Validate(bookingResponse, memos, await _referenceDataServiceMock.Object.GetAmendBookingSetting());

            var expectedStatuses = new List<AmendBookingStatus>
            {
                AmendBookingStatus.AmendRoomAndBoardDisabledByChangeCountLimit
            };

            using (new AssertionScope())
            {
                if (!isAccomChangeAvailable)
                {
                    bookingResponse.AmendmentInfo.AmendBookingStatus.Should().BeEquivalentTo(expectedStatuses);
                }

                bookingResponse.AmendmentInfo.Route.Should().Be(true);
                bookingResponse.AmendmentInfo.Transfer.AmendAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Transfer.DowngradeAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Pax.AmendAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Pax.AmendNameOnly.Should().Be(true);
                bookingResponse.AmendmentInfo.RoomAndBoard.Should().Be(isAccomChangeAvailable);
            }
        }
    }
}