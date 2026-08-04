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
    public class SpecialRequestValidatorTests
    {
        private Mock<IReferenceDataService> _referenceDataServiceMock = new Mock<IReferenceDataService>();
        private IOptions<ApiSettings> _apiSettings;
        private IOptions<AtcomSettings> _atcomSettings;

        private SpecialRequestValidator _sut;

        public SpecialRequestValidatorTests()
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
        public async Task ValidateSpecialRequestAmendmends_DisabledByBookingStatus()
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
                        Code = "EZY1"
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
                },
                BookingStatus = "DisableStatus"
            };

            var memos = new List<Memo>
            {

            };

            _referenceDataServiceMock
                .Setup(x => x.GetAmendBookingSetting())
                .ReturnsAsync(new AmendBookingSetting
                {
                    IsAmendFlightsEnabled = true,
                    AmendFlightsThresholdHours = 672,
                    AmendFlightCount = 1,

                    IsAmendTransfersEnabled = true,
                    AmendTransfersThresholdHours = 672,
                    AmendTransferCount = 1,

                    IsAmendPassengerNameEnable = true,
                    AmendPassengerThresholdHours = 672,

                    IsEligibleToAmendSSRForDC = true,
                    IsEligibleToAmendSSRForHBG = true,
                    IsAmendSpecialRequestEnabled = true,
                    AmendSpecialRequestThresholdHours = 672,
                    AmendSpecialRequestCount = 1,
                    EnablePassengerAmendForDynamicInventoryHotels = true,
                    EnableSSRAmendForDynamicInventoryHotels = true,

                    IsChangeDatesEnable = true,
                    ChangeDatesThresholdHoursBeforeDeparture = 672,
                    AmendChangeDateCount = 1,
                    EnableForDirectlyContractedBookings = true
                });

            _atcomSettings = Options.Create<AtcomSettings>(new AtcomSettings
            {
                ChangeBooking = new ChangeBookingSettings
                {
                    AllowedStatuses = new List<string> { "AvailableStatus" }
                }
            });

            _sut = new SpecialRequestValidator(_atcomSettings, _apiSettings);
            await _sut.Validate(bookingResponse, memos, await _referenceDataServiceMock.Object.GetAmendBookingSetting());

            var expectedStatuses = new List<AmendBookingStatus>
            {
                AmendBookingStatus.SSRAmendAllowedOnyForActiveBookings
            };

            using (new AssertionScope())
            {
                bookingResponse.AmendmentInfo.AmendBookingStatus.Should().BeEquivalentTo(expectedStatuses);

                bookingResponse.AmendmentInfo.Route.Should().Be(true);
                bookingResponse.AmendmentInfo.Transfer.AmendAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Transfer.DowngradeAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Pax.AmendAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Pax.AmendNameOnly.Should().Be(true);
                bookingResponse.AmendmentInfo.Seats.Should().Be(true);
                bookingResponse.AmendmentInfo.ChangeDates.Should().Be(true);
                bookingResponse.AmendmentInfo.SpecialRequest.Should().Be(false);
            }
        }

        [Fact]
        public async Task ValidateSpecialRequestAmendmends_DisabledForHBG()
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
                        IsExt = true,
                        Code = "EZY1",
                        System = "HB3"
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

            var memos = new List<Memo>
            {

            };

            _referenceDataServiceMock
                .Setup(x => x.GetAmendBookingSetting())
                .ReturnsAsync(new AmendBookingSetting
                {
                    IsAmendFlightsEnabled = true,
                    AmendFlightsThresholdHours = 672,
                    AmendFlightCount = 1,

                    IsAmendTransfersEnabled = true,
                    AmendTransfersThresholdHours = 672,
                    AmendTransferCount = 1,

                    IsAmendPassengerNameEnable = true,
                    AmendPassengerThresholdHours = 672,

                    IsEligibleToAmendSSRForDC = true,
                    IsEligibleToAmendSSRForHBG = false,
                    IsAmendSpecialRequestEnabled = true,
                    AmendSpecialRequestThresholdHours = 672,
                    AmendSpecialRequestCount = 1,
                    EnablePassengerAmendForDynamicInventoryHotels = true,
                    EnableSSRAmendForDynamicInventoryHotels = true,


                    IsChangeDatesEnable = true,
                    ChangeDatesThresholdHoursBeforeDeparture = 672,
                    AmendChangeDateCount = 1,
                    EnableForDirectlyContractedBookings = true
                });

            _atcomSettings = Options.Create<AtcomSettings>(new AtcomSettings
            {

            });

            _sut = new SpecialRequestValidator(_atcomSettings, _apiSettings);
            await _sut.Validate(bookingResponse, memos, await _referenceDataServiceMock.Object.GetAmendBookingSetting());

            var expectedStatuses = new List<AmendBookingStatus>
            {
                AmendBookingStatus.SSRAmmendNotAllowedForHBG
            };

            using (new AssertionScope())
            {
                bookingResponse.AmendmentInfo.AmendBookingStatus.Should().BeEquivalentTo(expectedStatuses);

                bookingResponse.AmendmentInfo.Route.Should().Be(true);
                bookingResponse.AmendmentInfo.Transfer.AmendAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Transfer.DowngradeAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Pax.AmendAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Pax.AmendNameOnly.Should().Be(true);
                bookingResponse.AmendmentInfo.Seats.Should().Be(true);
                bookingResponse.AmendmentInfo.ChangeDates.Should().Be(true);
                bookingResponse.AmendmentInfo.SpecialRequest.Should().Be(false);
            }
        }

        [Fact]
        public async Task ValidateSpecialRequestAmendmends_DisabledForDCHotels()
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
                        Code = "EZY1"
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

            var memos = new List<Memo>
            {

            };

            _referenceDataServiceMock
                .Setup(x => x.GetAmendBookingSetting())
                .ReturnsAsync(new AmendBookingSetting
                {
                    IsAmendFlightsEnabled = true,
                    AmendFlightsThresholdHours = 672,
                    AmendFlightCount = 1,

                    IsAmendTransfersEnabled = true,
                    AmendTransfersThresholdHours = 672,
                    AmendTransferCount = 1,

                    IsAmendPassengerNameEnable = true,
                    AmendPassengerThresholdHours = 672,

                    IsEligibleToAmendSSRForDC = false,
                    IsEligibleToAmendSSRForHBG = true,
                    IsAmendSpecialRequestEnabled = true,
                    AmendSpecialRequestThresholdHours = 672,
                    AmendSpecialRequestCount = 1,
                    EnablePassengerAmendForDynamicInventoryHotels = true,
                    EnableSSRAmendForDynamicInventoryHotels = true,

                    IsChangeDatesEnable = true,
                    ChangeDatesThresholdHoursBeforeDeparture = 672,
                    AmendChangeDateCount = 1,
                    EnableForDirectlyContractedBookings = true
                });

            _atcomSettings = Options.Create<AtcomSettings>(new AtcomSettings
            {

            });

            _sut = new SpecialRequestValidator(_atcomSettings, _apiSettings);
            await _sut.Validate(bookingResponse, memos, await _referenceDataServiceMock.Object.GetAmendBookingSetting());

            var expectedStatuses = new List<AmendBookingStatus>
            {
                AmendBookingStatus.SSRAmendNotAllowedForDC
            };

            using (new AssertionScope())
            {
                bookingResponse.AmendmentInfo.AmendBookingStatus.Should().BeEquivalentTo(expectedStatuses);

                bookingResponse.AmendmentInfo.Route.Should().Be(true);
                bookingResponse.AmendmentInfo.Transfer.AmendAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Transfer.DowngradeAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Pax.AmendAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Pax.AmendNameOnly.Should().Be(true);
                bookingResponse.AmendmentInfo.Seats.Should().Be(true);
                bookingResponse.AmendmentInfo.ChangeDates.Should().Be(true);
                bookingResponse.AmendmentInfo.SpecialRequest.Should().Be(false);
            }
        }

        [Fact]
        public async Task ValidateSpecialRequestAmendmends_DisabledByCms()
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
                        Code = "EZY1"
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

            var memos = new List<Memo>
            {

            };

            _referenceDataServiceMock
                .Setup(x => x.GetAmendBookingSetting())
                .ReturnsAsync(new AmendBookingSetting
                {
                    IsAmendFlightsEnabled = true,
                    AmendFlightsThresholdHours = 672,
                    AmendFlightCount = 1,

                    IsAmendTransfersEnabled = true,
                    AmendTransfersThresholdHours = 672,
                    AmendTransferCount = 1,

                    IsAmendPassengerNameEnable = true,
                    AmendPassengerThresholdHours = 672,

                    IsEligibleToAmendSSRForDC = true,
                    IsEligibleToAmendSSRForHBG = true,
                    IsAmendSpecialRequestEnabled = false,
                    AmendSpecialRequestThresholdHours = 672,
                    AmendSpecialRequestCount = 1,
                    EnablePassengerAmendForDynamicInventoryHotels = true,
                    EnableSSRAmendForDynamicInventoryHotels = true,

                    IsChangeDatesEnable = true,
                    ChangeDatesThresholdHoursBeforeDeparture = 672,
                    AmendChangeDateCount = 1,
                    EnableForDirectlyContractedBookings = true
                });

            _atcomSettings = Options.Create<AtcomSettings>(new AtcomSettings
            {

            });

            _sut = new SpecialRequestValidator(_atcomSettings, _apiSettings);
            await _sut.Validate(bookingResponse, memos, await _referenceDataServiceMock.Object.GetAmendBookingSetting());

            var expectedStatuses = new List<AmendBookingStatus>
            {
                AmendBookingStatus.SSRAmendIsDisabled
            };

            using (new AssertionScope())
            {
                bookingResponse.AmendmentInfo.AmendBookingStatus.Should().BeEquivalentTo(expectedStatuses);

                bookingResponse.AmendmentInfo.Route.Should().Be(true);
                bookingResponse.AmendmentInfo.Transfer.AmendAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Transfer.DowngradeAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Pax.AmendAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Pax.AmendNameOnly.Should().Be(true);
                bookingResponse.AmendmentInfo.Seats.Should().Be(true);
                bookingResponse.AmendmentInfo.ChangeDates.Should().Be(true);
                bookingResponse.AmendmentInfo.SpecialRequest.Should().Be(false);
            }
        }

        [Fact]
        public async Task ValidateSpecialRequestAmendmends_DisabledByCms_TimeBound()
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
                        Code = "EZY1"
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

            var memos = new List<Memo>
            {

            };

            _referenceDataServiceMock
                .Setup(x => x.GetAmendBookingSetting())
                .ReturnsAsync(new AmendBookingSetting
                {
                    IsAmendFlightsEnabled = true,
                    AmendFlightsThresholdHours = 672,
                    AmendFlightCount = 1,

                    IsAmendTransfersEnabled = true,
                    AmendTransfersThresholdHours = 672,
                    AmendTransferCount = 1,

                    IsAmendPassengerNameEnable = true,
                    AmendPassengerThresholdHours = 672,

                    IsEligibleToAmendSSRForDC = true,
                    IsEligibleToAmendSSRForHBG = true,
                    IsAmendSpecialRequestEnabled = true,
                    AmendSpecialRequestThresholdHours = 10000,
                    AmendSpecialRequestCount = 1,
                    EnablePassengerAmendForDynamicInventoryHotels = true,
                    EnableSSRAmendForDynamicInventoryHotels = true,

                    IsChangeDatesEnable = true,
                    ChangeDatesThresholdHoursBeforeDeparture = 672,
                    AmendChangeDateCount = 1,
                    EnableForDirectlyContractedBookings = true
                });

            _atcomSettings = Options.Create<AtcomSettings>(new AtcomSettings
            {

            });

            _sut = new SpecialRequestValidator(_atcomSettings, _apiSettings);
            await _sut.Validate(bookingResponse, memos, await _referenceDataServiceMock.Object.GetAmendBookingSetting());

            var expectedStatuses = new List<AmendBookingStatus>
            {
                AmendBookingStatus.SSRAmendDepartureDate
            };

            using (new AssertionScope())
            {
                bookingResponse.AmendmentInfo.AmendBookingStatus.Should().BeEquivalentTo(expectedStatuses);

                bookingResponse.AmendmentInfo.Route.Should().Be(true);
                bookingResponse.AmendmentInfo.Transfer.AmendAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Transfer.DowngradeAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Pax.AmendAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Pax.AmendNameOnly.Should().Be(true);
                bookingResponse.AmendmentInfo.Seats.Should().Be(true);
                bookingResponse.AmendmentInfo.ChangeDates.Should().Be(true);
                bookingResponse.AmendmentInfo.SpecialRequest.Should().Be(false);
            }
        }

        [Fact]
        public async Task ValidateSpecialRequestAmendmends_DisabledByCms_CanAmendOnlyOnce()
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
                        Code = "EZY1"
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

            var memos = new List<Memo>
        {
            new Memo { Code = "AMD9"}
        };

            _referenceDataServiceMock
                .Setup(x => x.GetAmendBookingSetting())
                .ReturnsAsync(new AmendBookingSetting
                {
                    IsAmendFlightsEnabled = true,
                    AmendFlightsThresholdHours = 672,
                    AmendFlightCount = 1,

                    IsAmendTransfersEnabled = true,
                    AmendTransfersThresholdHours = 672,
                    AmendTransferCount = 1,

                    IsAmendPassengerNameEnable = true,
                    AmendPassengerThresholdHours = 672,

                    IsEligibleToAmendSSRForDC = true,
                    IsEligibleToAmendSSRForHBG = true,
                    IsAmendSpecialRequestEnabled = true,
                    AmendSpecialRequestThresholdHours = 672,
                    AmendSpecialRequestCount = 1,
                    EnablePassengerAmendForDynamicInventoryHotels = true,
                    EnableSSRAmendForDynamicInventoryHotels = true,

                    IsChangeDatesEnable = true,
                    ChangeDatesThresholdHoursBeforeDeparture = 672,
                    AmendChangeDateCount = 1,
                    EnableForDirectlyContractedBookings = true
                });

            _atcomSettings = Options.Create<AtcomSettings>(new AtcomSettings
            {

            });

            _sut = new SpecialRequestValidator(_atcomSettings, _apiSettings);
            await _sut.Validate(bookingResponse, memos, await _referenceDataServiceMock.Object.GetAmendBookingSetting());

            var expectedStatuses = new List<AmendBookingStatus>
            {
                AmendBookingStatus.AmendSpecialRequestDisabledByChangeCountLimit
            };

            using (new AssertionScope())
            {
                bookingResponse.AmendmentInfo.AmendBookingStatus.Should().BeEquivalentTo(expectedStatuses);

                bookingResponse.AmendmentInfo.Route.Should().Be(true);
                bookingResponse.AmendmentInfo.Transfer.AmendAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Transfer.DowngradeAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Pax.AmendAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Pax.AmendNameOnly.Should().Be(true);
                bookingResponse.AmendmentInfo.Seats.Should().Be(true);
                bookingResponse.AmendmentInfo.ChangeDates.Should().Be(true);
                bookingResponse.AmendmentInfo.SpecialRequest.Should().Be(false);
            }
        }

        [Fact]
        public async Task ValidateSpecialRequestAmendmends_DisabledByAtcom_AmendMemoDisabled()
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
                        Code = "EZY1"
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
                    Memo = false,
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
                    IsAmendFlightsEnabled = true,
                    AmendFlightsThresholdHours = 672,
                    AmendFlightCount = 1,

                    IsAmendTransfersEnabled = true,
                    AmendTransfersThresholdHours = 672,
                    AmendTransferCount = 1,

                    IsAmendPassengerNameEnable = true,
                    AmendPassengerThresholdHours = 672,

                    IsEligibleToAmendSSRForDC = true,
                    IsEligibleToAmendSSRForHBG = true,
                    IsAmendSpecialRequestEnabled = true,
                    AmendSpecialRequestThresholdHours = 672,
                    AmendSpecialRequestCount = 1,
                    EnablePassengerAmendForDynamicInventoryHotels = true,
                    EnableSSRAmendForDynamicInventoryHotels = true,

                    IsChangeDatesEnable = true,
                    ChangeDatesThresholdHoursBeforeDeparture = 672,
                    AmendChangeDateCount = 1,
                    EnableForDirectlyContractedBookings = true
                });

            _atcomSettings = Options.Create<AtcomSettings>(new AtcomSettings
            {

            });

            _sut = new SpecialRequestValidator(_atcomSettings, _apiSettings);
            await _sut.Validate(bookingResponse, memos, await _referenceDataServiceMock.Object.GetAmendBookingSetting());

            var expectedStatuses = new List<AmendBookingStatus>
            {
                AmendBookingStatus.AmendMemoDisabled
            };

            using (new AssertionScope())
            {
                bookingResponse.AmendmentInfo.AmendBookingStatus.Should().BeEquivalentTo(expectedStatuses);

                bookingResponse.AmendmentInfo.Route.Should().Be(true);
                bookingResponse.AmendmentInfo.Transfer.AmendAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Transfer.DowngradeAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Pax.AmendAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Pax.AmendNameOnly.Should().Be(true);
                bookingResponse.AmendmentInfo.Seats.Should().Be(true);
                bookingResponse.AmendmentInfo.ChangeDates.Should().Be(true);
                bookingResponse.AmendmentInfo.SpecialRequest.Should().Be(false);
            }
        }

        [Fact]
        public async Task ValidateSpecialRequestAmendmends_DisabledForDiHotels_AmendDisabled()
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
                        IsExt = true,
                        Code = "Z1",
                        System = "TGX"
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
                    IsAmendFlightsEnabled = true,
                    AmendFlightsThresholdHours = 672,
                    AmendFlightCount = 1,

                    IsAmendTransfersEnabled = true,
                    AmendTransfersThresholdHours = 672,
                    AmendTransferCount = 1,

                    IsAmendPassengerNameEnable = true,
                    AmendPassengerThresholdHours = 672,

                    IsEligibleToAmendSSRForDC = true,
                    IsEligibleToAmendSSRForHBG = true,
                    IsAmendSpecialRequestEnabled = true,
                    AmendSpecialRequestThresholdHours = 672,
                    AmendSpecialRequestCount = 1,
                    EnablePassengerAmendForDynamicInventoryHotels = true,

                    IsChangeDatesEnable = true,
                    ChangeDatesThresholdHoursBeforeDeparture = 672,
                    AmendChangeDateCount = 1,
                    EnableForDirectlyContractedBookings = true
                });

            _atcomSettings = Options.Create<AtcomSettings>(new AtcomSettings
            {

            });

            _sut = new SpecialRequestValidator(_atcomSettings, _apiSettings);
            await _sut.Validate(bookingResponse, memos, await _referenceDataServiceMock.Object.GetAmendBookingSetting());

            var expectedStatuses = new List<AmendBookingStatus>
            {
                AmendBookingStatus.SSRAmendIsDisabledOnSiteForDIHotels
            };

            bookingResponse.AmendmentInfo.AmendBookingStatus.Should().BeEquivalentTo(expectedStatuses);

            using (new AssertionScope())
            {
                bookingResponse.AmendmentInfo.Route.Should().BeTrue();
                bookingResponse.AmendmentInfo.Transfer.AmendAllow.Should().BeTrue();
                bookingResponse.AmendmentInfo.Transfer.DowngradeAllow.Should().BeTrue();
                bookingResponse.AmendmentInfo.Pax.AmendAllow.Should().BeTrue();
                bookingResponse.AmendmentInfo.Pax.AmendNameOnly.Should().BeTrue();
                bookingResponse.AmendmentInfo.Seats.Should().BeTrue();
                bookingResponse.AmendmentInfo.ChangeDates.Should().BeTrue();

                bookingResponse.AmendmentInfo.SpecialRequest.Should().BeFalse();
            }
        }
    }
}