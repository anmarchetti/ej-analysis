using easyJet.Holidays.Api.Domain.Data.AirportParking;
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
    public class FlightValidatorTests
    {
        private Mock<IReferenceDataService> _referenceDataServiceMock = new();
        private IOptions<ApiSettings> _apiSettings;
        private FlightValidator _sut;
        private List<Memo> _memos;

        public FlightValidatorTests()
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

            _memos = new();
            _sut = new FlightValidator(_apiSettings);
        }

        [Fact]
        public async Task AmendFlightValidation_DisabledByCms()
        {
            var bookingResponse = DefaultBookingResponse();

            AmendBookingSetting amendBookingSetting = DefaultAmendBookingSetting();
            amendBookingSetting.IsAmendFlightsEnabled = false;

            _referenceDataServiceMock
                .Setup(x => x.GetAmendBookingSetting())
                .ReturnsAsync(amendBookingSetting);

            await _sut.Validate(bookingResponse, _memos, await _referenceDataServiceMock.Object.GetAmendBookingSetting());

            var expectedStatuses = new List<AmendBookingStatus>
            {
                AmendBookingStatus.AmendFlightsDisabledOnSite
            };

            using (new AssertionScope())
            {
                bookingResponse.AmendmentInfo.AmendBookingStatus.Should().BeEquivalentTo(expectedStatuses);

                bookingResponse.AmendmentInfo.Route.Should().Be(false);
                bookingResponse.AmendmentInfo.Transfer.AmendAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Transfer.DowngradeAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Pax.AmendAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Pax.AmendNameOnly.Should().Be(true);
                bookingResponse.AmendmentInfo.Seats.Should().Be(true);
            }
        }

        [Fact]
        public async Task AmendFlightValidation_DisabledByCms_TimeBound()
        {
            var bookingResponse = DefaultBookingResponse();

            AmendBookingSetting amendBookingSetting = DefaultAmendBookingSetting();
            amendBookingSetting.AmendFlightsThresholdHours = 10000;

            _referenceDataServiceMock
                .Setup(x => x.GetAmendBookingSetting())
                .ReturnsAsync(amendBookingSetting);

            await _sut.Validate(bookingResponse, _memos, await _referenceDataServiceMock.Object.GetAmendBookingSetting());

            var expectedStatuses = new List<AmendBookingStatus>
            {
                AmendBookingStatus.AmendFlightsDisabledByTimeBound
            };

            using (new AssertionScope())
            {
                bookingResponse.AmendmentInfo.AmendBookingStatus.Should().BeEquivalentTo(expectedStatuses);

                bookingResponse.AmendmentInfo.Route.Should().Be(false);
                bookingResponse.AmendmentInfo.Transfer.AmendAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Transfer.DowngradeAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Pax.AmendAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Pax.AmendNameOnly.Should().Be(true);
                bookingResponse.AmendmentInfo.Seats.Should().Be(true);
            }
        }

        [Fact]
        public async Task AmendFlightValidation_DisabledByCms_MultipleFlight()
        {
            var bookingResponse = DefaultBookingResponse();
            bookingResponse.Package.Transport.Routes.Add(new Route
            {
                Direction = Direction.Inbound,
                DepDate = DateTimeOffset.Now.AddHours(1000),
                IsSeatReservationPossible = true
            });

            await _sut.Validate(bookingResponse, _memos, await _referenceDataServiceMock.Object.GetAmendBookingSetting());

            var expectedStatuses = new List<AmendBookingStatus>
            {
                AmendBookingStatus.AmendFlightsDisabledAsMultipleFlightsPackage,
                AmendBookingStatus.AmendTransfersDisabledAsMultipleFlightsPackage
            };

            using (new AssertionScope())
            {
                bookingResponse.AmendmentInfo.AmendBookingStatus.Should().BeEquivalentTo(expectedStatuses);

                bookingResponse.AmendmentInfo.Route.Should().Be(false);
                bookingResponse.AmendmentInfo.Transfer.AmendAllow.Should().Be(false);
                bookingResponse.AmendmentInfo.Transfer.DowngradeAllow.Should().Be(false);
                bookingResponse.AmendmentInfo.Pax.AmendAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Pax.AmendNameOnly.Should().Be(true);
                bookingResponse.AmendmentInfo.Seats.Should().Be(true);
            }
        }

        [Fact]
        public async Task AmendFlightValidation_DisabledByCms_CanAmendOnlyOnce()
        {
            var bookingResponse = DefaultBookingResponse();
            var memos = new List<Memo> { new() { Code = "AMD1"} };

            await _sut.Validate(bookingResponse, memos, await _referenceDataServiceMock.Object.GetAmendBookingSetting());

            var expectedStatuses = new List<AmendBookingStatus>
            {
                AmendBookingStatus.AmendFlightDisabledByChangeCountLimit
            };

            using (new AssertionScope())
            {
                bookingResponse.AmendmentInfo.AmendBookingStatus.Should().BeEquivalentTo(expectedStatuses);

                bookingResponse.AmendmentInfo.Route.Should().Be(false);
                bookingResponse.AmendmentInfo.Transfer.AmendAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Transfer.DowngradeAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Pax.AmendAllow.Should().Be(true);
                bookingResponse.AmendmentInfo.Pax.AmendNameOnly.Should().Be(true);
                bookingResponse.AmendmentInfo.Seats.Should().Be(true);
            }
        }

        [Fact]
        public async Task AmendFlightValidation_WhenBookingHasAirportParking_DisableAmend()
        {
            var bookingResponse = DefaultBookingResponse();
            bookingResponse.AirportParking = new AirportParkingItem() { Title = "Airport Parking", };

            await _sut.Validate(bookingResponse, _memos, await _referenceDataServiceMock.Object.GetAmendBookingSetting());

            bookingResponse.AmendmentInfo.AmendBookingStatus.Should().Contain(AmendBookingStatus.AmendFlightsDisabledByAirportParking);
            bookingResponse.AmendmentInfo.Route.Should().Be(false);
        }

        [Fact]
        public async Task AmendFlightValidation_WhenBookingDoesNotHaveAirportParking_DoesNotIncludeDisabledByAirportParking()
        {
            var bookingResponse = DefaultBookingResponse();

            await _sut.Validate(bookingResponse, _memos, await _referenceDataServiceMock.Object.GetAmendBookingSetting());

            bookingResponse.AmendmentInfo.Route.Should().Be(true);
            bookingResponse.AmendmentInfo.AmendBookingStatus.Should().NotContain(AmendBookingStatus.AmendFlightsDisabledByAirportParking);
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
