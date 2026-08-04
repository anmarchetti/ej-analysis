using easyJet.Holidays.Api.Domain.Data.AirportParking;
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
    public class DatesValidatorTests
    {
        private Mock<IReferenceDataService> _referenceDataServiceMock = new();
        private Mock<ILuggageService> _luggageServiceMock = new();
        private IOptions<ApiSettings> _apiSettings;
        private DatesValidator _sut;
        private List<Memo> _memos = new();

        public DatesValidatorTests()
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

            _referenceDataServiceMock
                .Setup(x => x.GetAmendBookingSetting())
                .ReturnsAsync(DefaultAmendBookingSetting());

            _sut = new DatesValidator(_apiSettings, _luggageServiceMock.Object);
        }

        [Fact]
        public async Task AmendDatesValidation_DisabledByCMS_TimeBound()
        {
            var bookingResponse = DefaultBookingResponse();

            var amendBookingSetting = DefaultAmendBookingSetting();
            amendBookingSetting.ChangeDatesThresholdHoursBeforeDeparture = 1000;

            _referenceDataServiceMock
                .Setup(x => x.GetAmendBookingSetting())
                .ReturnsAsync(amendBookingSetting);

            await _sut.Validate(bookingResponse, _memos, await _referenceDataServiceMock.Object.GetAmendBookingSetting());

            var expectedStatuses = new List<AmendBookingStatus>
            {
                AmendBookingStatus.ChangeDateDisabledByTimeBound
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
                bookingResponse.AmendmentInfo.ChangeDates.Should().Be(false);
            }
        }

        [Fact]
        public async Task ValidateChangeDate_DCHotel_AmendDisabled()
        {
            var bookingResponse = DefaultBookingResponse();

            var amendBookingSetting = DefaultAmendBookingSetting();
            amendBookingSetting.EnableForDirectlyContractedBookings = false;

            _referenceDataServiceMock
                .Setup(x => x.GetAmendBookingSetting())
                .ReturnsAsync(amendBookingSetting);

            await _sut.Validate(bookingResponse, _memos, await _referenceDataServiceMock.Object.GetAmendBookingSetting());

            var expectedStatuses = new List<AmendBookingStatus>
            {
                AmendBookingStatus.ChangeDateDisabledBySitecoreForDCHotels
            };

            bookingResponse.AmendmentInfo.AmendBookingStatus.Should().BeEquivalentTo(expectedStatuses);

            using (new AssertionScope())
            {
                bookingResponse.AmendmentInfo.Route.Should().BeTrue();
                bookingResponse.AmendmentInfo.Transfer.AmendAllow.Should().BeTrue();
                bookingResponse.AmendmentInfo.Transfer.DowngradeAllow.Should().BeTrue();
                bookingResponse.AmendmentInfo.Seats.Should().BeTrue();
                bookingResponse.AmendmentInfo.ChangeDates.Should().BeFalse();
                bookingResponse.AmendmentInfo.SpecialRequest.Should().BeTrue();

                bookingResponse.AmendmentInfo.Pax.AmendAllow.Should().BeTrue();
                bookingResponse.AmendmentInfo.Pax.AmendNameOnly.Should().BeTrue();
            }
        }

        [Fact]
        public async Task ValidateChangeDateAmendmends_OverLimit_AmendChangeDateDisabled()
        {
            var bookingResponse = DefaultBookingResponse();

            var memo = new List<Memo>
        {
            new Memo
            {
                Code = "AMD8"
            }
        };

            await _sut.Validate(bookingResponse, memo, await _referenceDataServiceMock.Object.GetAmendBookingSetting());

            var expectedStatuses = new List<AmendBookingStatus>
            {
                AmendBookingStatus.ChangeDateDisabledByChangeCountLimit
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
                bookingResponse.AmendmentInfo.SpecialRequest.Should().BeTrue();

                bookingResponse.AmendmentInfo.ChangeDates.Should().BeFalse();
            }
        }

        [Fact]
        public async Task ValidateChangeDate_LuggageContainsSportEquipment_AmendmentDisabled()
        {
            // Assert
            var bookingResponse = DefaultBookingResponse();

            _luggageServiceMock
                .Setup(x => x.ContainsSportEquipment(It.IsAny<IEnumerable<ExtraLuggageItem>>()))
                .ReturnsAsync(true);

            // Act
            await _sut.Validate(bookingResponse, _memos, await _referenceDataServiceMock.Object.GetAmendBookingSetting());

            // Assert
            using (new AssertionScope())
            {
                bookingResponse.AmendmentInfo.AmendBookingStatus
                    .Should()
                    .Contain(AmendBookingStatus.ChangeDateDisabledBySportEquipment);

                bookingResponse.AmendmentInfo.ChangeDates.Should().BeFalse();
            }
        }

        [Fact]
        public async Task ValidateChangeDate_WhenBookingHasAirportParking_DisablesAmend()
        {
            var bookingResponse = DefaultBookingResponse();
            bookingResponse.AirportParking = new AirportParkingItem() { Title = "Airport Parking" };

            await _sut.Validate(bookingResponse, _memos, DefaultAmendBookingSetting());

            bookingResponse.AmendmentInfo.ChangeDates.Should().BeFalse();
            bookingResponse.AmendmentInfo.AmendBookingStatus
                .Should()
                .Contain(AmendBookingStatus.ChangeDateDisabledByAirportParking);
        }

        [Fact]
        public async Task ValidateChangeDate_WhenBookingDoesNotHaveAirportParking_DoesNotIncludeDisabledByAirportParking()
        {
            var bookingResponse = DefaultBookingResponse();

            await _sut.Validate(bookingResponse, _memos, DefaultAmendBookingSetting());

            bookingResponse.AmendmentInfo.ChangeDates.Should().BeTrue();
            bookingResponse.AmendmentInfo.AmendBookingStatus
                .Should().NotContain(AmendBookingStatus.ChangeDateDisabledByAirportParking);
        }

        private static BookingResponse DefaultBookingResponse()
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
                        Id = "Z01",
                        Code = "Z01"
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
                    SpecialRequest = true,
                    Seats = true
                }
            };
        }

        private static AmendBookingSetting DefaultAmendBookingSetting()
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

                IsChangeDatesEnable = true,
                ChangeDatesThresholdHoursBeforeDeparture = 672,
                AmendChangeDateCount = 1,
                EnablePassengerAmendForDynamicInventoryHotels = true,
                EnableSSRAmendForDynamicInventoryHotels = true,
                EnableForDirectlyContractedBookings = true
            };
        }
    }
}