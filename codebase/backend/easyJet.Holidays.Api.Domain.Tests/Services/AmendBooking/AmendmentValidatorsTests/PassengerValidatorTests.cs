using easyJet.Holidays.Api.Domain.Data.AirportParking;
using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Errors;
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
    public class PassengerValidatorTests
    {
        private Mock<IReferenceDataService> _referenceDataServiceMock = new();
        private IOptions<ApiSettings> _apiSettings;
        private IOptions<AtcomSettings> _atcomSettings;
        private PassengerValidator _sut;
        private BookingResponse _bookingResponse;
        private List<Memo> _memos = new();

        public PassengerValidatorTests()
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

            _atcomSettings = Options.Create(new AtcomSettings
            {
                WarningCodesDisruptingAmendments = new AtcomWarningsHandledForAmendments
                {
                    Name = new List<string>()
                }
            });

            _referenceDataServiceMock
                .Setup(x => x.GetAmendBookingSetting())
                .ReturnsAsync(DefaultAmendBookingSetting());

            _bookingResponse = DefaultBookingResponse();

            _sut = new PassengerValidator(_apiSettings, _atcomSettings);
        }

        [Fact]
        public async Task AmendPassengerValidation_DisabledByCMS()
        {
            var amendBookingSettings = DefaultAmendBookingSetting();
            amendBookingSettings.IsAmendPassengerNameEnable = false;
            _referenceDataServiceMock
                .Setup(x => x.GetAmendBookingSetting())
                .ReturnsAsync(amendBookingSettings);

            await _sut.Validate(_bookingResponse, _memos, await _referenceDataServiceMock.Object.GetAmendBookingSetting());

            var expectedStatuses = new List<AmendBookingStatus>
            {
                AmendBookingStatus.AmendPassengerDisabledOnSite
            };

            using (new AssertionScope())
            {
                _bookingResponse.AmendmentInfo.AmendBookingStatus.Should().BeEquivalentTo(expectedStatuses);

                _bookingResponse.AmendmentInfo.Route.Should().Be(true);
                _bookingResponse.AmendmentInfo.Transfer.AmendAllow.Should().Be(true);
                _bookingResponse.AmendmentInfo.Transfer.DowngradeAllow.Should().Be(true);
                _bookingResponse.AmendmentInfo.Pax.AmendAllow.Should().Be(false);
                _bookingResponse.AmendmentInfo.Pax.AmendNameOnly.Should().Be(false);
                _bookingResponse.AmendmentInfo.Seats.Should().Be(true);
            }
        }

        [Fact]
        public async Task AmendPassengerValidation_DisabledByCMS_TimeBound()
        {
            var amendBookingSettings = DefaultAmendBookingSetting();
            amendBookingSettings.AmendPassengerThresholdHours = 10000;
            _referenceDataServiceMock
                .Setup(x => x.GetAmendBookingSetting())
                .ReturnsAsync(amendBookingSettings);

            await _sut.Validate(_bookingResponse, _memos, await _referenceDataServiceMock.Object.GetAmendBookingSetting());

            var expectedStatuses = new List<AmendBookingStatus>
            {
                AmendBookingStatus.AmendPassengersDisabledByTimeBound
            };

            using (new AssertionScope())
            {
                _bookingResponse.AmendmentInfo.AmendBookingStatus.Should().BeEquivalentTo(expectedStatuses);

                _bookingResponse.AmendmentInfo.Route.Should().Be(true);
                _bookingResponse.AmendmentInfo.Transfer.AmendAllow.Should().Be(true);
                _bookingResponse.AmendmentInfo.Transfer.DowngradeAllow.Should().Be(true);
                _bookingResponse.AmendmentInfo.Pax.AmendAllow.Should().Be(false);
                _bookingResponse.AmendmentInfo.Pax.AmendNameOnly.Should().Be(false);
                _bookingResponse.AmendmentInfo.Seats.Should().Be(true);
            }
        }

        [Fact]
        public async Task ValidatePaxAmendmends_DisabledForDiHotels_AmendDisabled()
        {
            var amendBookingSettings = DefaultAmendBookingSetting();
            amendBookingSettings.EnablePassengerAmendForDynamicInventoryHotels = false;
            _referenceDataServiceMock
                .Setup(x => x.GetAmendBookingSetting())
                .ReturnsAsync(amendBookingSettings);

            await _sut.Validate(_bookingResponse, _memos, await _referenceDataServiceMock.Object.GetAmendBookingSetting());


            var expectedStatuses = new List<AmendBookingStatus>
            {
                AmendBookingStatus.AmendPassengerDisabledOnSiteForDIHotels
            };

            _bookingResponse.AmendmentInfo.AmendBookingStatus.Should().BeEquivalentTo(expectedStatuses);

            using (new AssertionScope())
            {
                _bookingResponse.AmendmentInfo.Route.Should().BeTrue();
                _bookingResponse.AmendmentInfo.Transfer.AmendAllow.Should().BeTrue();
                _bookingResponse.AmendmentInfo.Transfer.DowngradeAllow.Should().BeTrue();
                _bookingResponse.AmendmentInfo.Seats.Should().BeTrue();
                _bookingResponse.AmendmentInfo.ChangeDates.Should().BeTrue();
                _bookingResponse.AmendmentInfo.SpecialRequest.Should().BeTrue();

                _bookingResponse.AmendmentInfo.Pax.AmendAllow.Should().BeFalse();
                _bookingResponse.AmendmentInfo.Pax.AmendNameOnly.Should().BeFalse();
            }
        }

        [Fact]
        public async Task ValidatePaxAmendmends_BookingHasInventoryError_AmendDisabled()
        {
            var inventoryErrorCode = "Inv_code";
            _atcomSettings.Value.WarningCodesDisruptingAmendments.Name = new List<string> { inventoryErrorCode };
            _bookingResponse.ApiWarnings = [new ApiError { Code = inventoryErrorCode }];

            await _sut.Validate(_bookingResponse, _memos, await _referenceDataServiceMock.Object.GetAmendBookingSetting());

            var expectedStatuses = new List<AmendBookingStatus>
            {
                AmendBookingStatus.AmendPassengerDisabledByInventoryError
            };

            _bookingResponse.AmendmentInfo.AmendBookingStatus.Should().BeEquivalentTo(expectedStatuses);

            using (new AssertionScope())
            {
                _bookingResponse.AmendmentInfo.Pax.AmendAllow.Should().BeFalse();
                _bookingResponse.AmendmentInfo.Pax.AmendNameOnly.Should().BeFalse();
            }
        }

        [Fact]
        public async Task AmendPassengerValidation_WhenBookingHasAirportParking_DisableAmend()
        {
            _bookingResponse.AirportParking = new AirportParkingItem() { Title = "Airport Parking", };

            await _sut.Validate(_bookingResponse, _memos, await _referenceDataServiceMock.Object.GetAmendBookingSetting());

            _bookingResponse.AmendmentInfo.AmendBookingStatus.Should().Contain(AmendBookingStatus.AmendPassengerDisabledByAirportParking);
            _bookingResponse.AmendmentInfo.Pax.AmendAllow.Should().BeFalse();
            _bookingResponse.AmendmentInfo.Pax.AmendNameOnly.Should().BeFalse();
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
                EnablePassengerAmendForDynamicInventoryHotels = true,
                EnableSSRAmendForDynamicInventoryHotels = true,


                IsChangeDatesEnable = true,
                ChangeDatesThresholdHoursBeforeDeparture = 672,
                AmendChangeDateCount = 1,
                EnableForDirectlyContractedBookings = true
            };
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
                        Code = "Z01",
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
                    Seats = true,
                    SpecialRequest = true
                }
            };
        }
    }
}