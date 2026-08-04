using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Services.AmendBooking.AmendmentValidators;
using easyJet.Holidays.Api.Domain.Services.Luggage;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using FluentAssertions;
using FluentAssertions.Execution;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.AmendBooking.AmendmentValidatorsTests
{
    public class TransferValidatorTests
    {
        private Mock<IReferenceDataService> _referenceDataServiceMock = new();
        private Mock<ILuggageService> _luggageServiceMock = new();
        private IOptions<ApiSettings> _apiSettings;
        private TransferValidator _sut;

        public TransferValidatorTests()
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
        public async Task AmendTransferValidation_DisabledByCms()
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

            var memos = new List<Memo>();

            _referenceDataServiceMock
                .Setup(x => x.GetAmendBookingSetting())
                .ReturnsAsync(new AmendBookingSetting
                {
                    IsAmendFlightsEnabled = true,
                    AmendFlightsThresholdHours = 672,
                    AmendFlightCount = 1,

                    IsAmendTransfersEnabled = false,
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

            _sut = new TransferValidator(_apiSettings, _luggageServiceMock.Object);

            await _sut.Validate(bookingResponse, memos, await _referenceDataServiceMock.Object.GetAmendBookingSetting());

            var expectedStatuses = new List<AmendBookingStatus>
            {
                AmendBookingStatus.AmendTransfersDisabledOnSite
            };

            using (new AssertionScope())
            {
                bookingResponse.AmendmentInfo.AmendBookingStatus.Should().BeEquivalentTo(expectedStatuses);

                bookingResponse.AmendmentInfo.Route.Should().Be(true);
                bookingResponse.AmendmentInfo.Transfer.AmendAllow.Should().Be(false);
                bookingResponse.AmendmentInfo.Transfer.DowngradeAllow.Should().Be(false);
                bookingResponse.AmendmentInfo.Pax.AmendAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Pax.AmendNameOnly.Should().Be(true);
                bookingResponse.AmendmentInfo.Seats.Should().Be(true);
            }
        }

        [Fact]
        public async Task AmendTransferValidation_DisabledByCms_TimeBound()
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

            var memos = new List<Memo>();

            _referenceDataServiceMock
                .Setup(x => x.GetAmendBookingSetting())
                .ReturnsAsync(new AmendBookingSetting
                {
                    IsAmendFlightsEnabled = true,
                    AmendFlightsThresholdHours = 672,
                    AmendFlightCount = 1,

                    IsAmendTransfersEnabled = true,
                    AmendTransfersThresholdHours = 10000,
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

            _sut = new TransferValidator(_apiSettings, _luggageServiceMock.Object);

            await _sut.Validate(bookingResponse, memos, await _referenceDataServiceMock.Object.GetAmendBookingSetting());

            var expectedStatuses = new List<AmendBookingStatus>
            {
                AmendBookingStatus.AmendTransfersDisabledByTimeBound
            };

            using (new AssertionScope())
            {
                bookingResponse.AmendmentInfo.AmendBookingStatus.Should().BeEquivalentTo(expectedStatuses);

                bookingResponse.AmendmentInfo.Route.Should().Be(true);
                bookingResponse.AmendmentInfo.Transfer.AmendAllow.Should().Be(false);
                bookingResponse.AmendmentInfo.Transfer.DowngradeAllow.Should().Be(false);
                bookingResponse.AmendmentInfo.Pax.AmendAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Pax.AmendNameOnly.Should().Be(true);
                bookingResponse.AmendmentInfo.Seats.Should().Be(true);
            }
        }

        [Fact]
        public async Task AmendTransferValidation_DisabledByCms_CanAmendOnlyOnce()
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
            new Memo { Code = "AMD2"}
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

            _sut = new TransferValidator(_apiSettings, _luggageServiceMock.Object);

            await _sut.Validate(bookingResponse, memos, await _referenceDataServiceMock.Object.GetAmendBookingSetting());

            var expectedStatuses = new List<AmendBookingStatus>
            {
                AmendBookingStatus.AmendTransferDisabledByChangeCountLimit
            };

            using (new AssertionScope())
            {
                bookingResponse.AmendmentInfo.AmendBookingStatus.Should().BeEquivalentTo(expectedStatuses);

                bookingResponse.AmendmentInfo.Route.Should().Be(true);
                bookingResponse.AmendmentInfo.Transfer.AmendAllow.Should().Be(false);
                bookingResponse.AmendmentInfo.Transfer.DowngradeAllow.Should().Be(false);
                bookingResponse.AmendmentInfo.Pax.AmendAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Pax.AmendNameOnly.Should().Be(true);
                bookingResponse.AmendmentInfo.Seats.Should().Be(true);
            }
        }

        [Fact]
        public async Task AmendTransferValidation_LuggageContainsSportEquipment_AmendmentDisabled()
        {
            // Assert
            var bookingResponse = DefaultBookingResponse();

            _luggageServiceMock
                .Setup(x => x.ContainsSportEquipment(It.IsAny<IEnumerable<ExtraLuggageItem>>()))
                .ReturnsAsync(true);
            _referenceDataServiceMock
                .Setup(x => x.GetAmendBookingSetting())
                .ReturnsAsync(DefaultAmendBookingSetting());

            _sut = new TransferValidator(_apiSettings, _luggageServiceMock.Object);

            // Act
            await _sut.Validate(bookingResponse, new List<Memo>(), await _referenceDataServiceMock.Object.GetAmendBookingSetting());

            // Assert
            using (new AssertionScope())
            {
                bookingResponse.AmendmentInfo.AmendBookingStatus
                    .Should()
                    .Contain(AmendBookingStatus.AmendTransfersDisabledBySportEquipment);

                bookingResponse.AmendmentInfo.Transfer.AmendAllow.Should().BeFalse();
                bookingResponse.AmendmentInfo.Transfer.DowngradeAllow.Should().BeFalse();
            }
        }

        private BookingResponse DefaultBookingResponse()
        {
            return new BookingResponse
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
        }

        private AmendBookingSetting DefaultAmendBookingSetting()
        {
            return new AmendBookingSetting
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
            };
        }
    }
}