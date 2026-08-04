using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.AirportParking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Services.Booking;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Interfaces.AirportParking;
using easyJet.Holidays.Api.Domain.Interfaces.ErrataInfo;
using easyJet.Holidays.Api.Domain.Interfaces.Hotels;
using easyJet.Holidays.Api.Domain.Interfaces.Mappers;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using easyJet.Holidays.Api.Domain.Services.Content;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.Transfers;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using Microsoft.Extensions.Logging;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Services.Vouchers;
using Xunit;
using BookingResponse = easyJet.Holidays.Api.Domain.Data.Booking.BookingResponse;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Booking
{
    public partial class BookingFetchServiceTests
    {
        private ApiSettings _apiSettings = new ApiSettings() { 
            BookingsMemos = new BookingsMemosSettings
            {
                FailedCancellation = new MemoSettings
                {
                    Code = "CF"
                }
            },
            Vouchers = new VoucherSettings() 
            { 
                BookingMemos = new BookingMemoSettings()
                {
                    MovedToCredit = new MemoSettings()
                    {
                        Code = "MovedToCreditCode",
                    },
                    MovedToCreditAndCash = new MemoSettings()
                    {
                        Code = "MovedToCreditAndCashCode"
                    }
                }
                
            } 
        };
        private AtcomSettings _atcomSettings = new AtcomSettings
        {
            Booking = new AtcomApiSettings
            {
                Host = "http://localhost",
                BaseUrl = "/b"
            },
            Search = new()
            {
                Uk = new()
                {
                    Host = "http://search-domain",
                    BaseUrl = "api/searchuk",
                },
                Ch = new()
                {
                    Host = "http://search-domain",
                    BaseUrl = "api/searchch",
                },
                De = new()
                {
                    Host = "http://search-domain",
                    BaseUrl = "api/searchde",
                },
                Fr = new()
                {
                    Host = "http://search-domain",
                    BaseUrl = "api/searchfr",
                }
            },
            EndpointTemplate = new AtcomEndpointTemplateSettings
            {
                SearchRoomVariants = "s_tp=6&{0}",
                BrandParam = "brnd={0}",
            },
            Transfers = new TransfersSettings(),
            ChangeBooking = new ChangeBookingSettings
            {
                IsActive = true,
                UseChangeExpirationDate = false,
                AllowedStatuses = ["BOOKING"],
                Memo = new AtcomMemoSettings
                {
                    BookingIsPrivateText = ""
                }
            },
            FraudCode = "FraudCode",
            BookingStatus = new BookingStatus()
            {
                Booking = "BOOKING",
                Canceled = "CANCELED",
            }
        };
        protected readonly IFixture _fixture;
        private readonly Mock<IBookingRepository> _bookingRepositoryMock;
        private readonly Mock<IHotelsService> _hotelsServiceMock;
        private readonly Mock<IAuthenticationService> _authenticationServiceMock;
        private readonly Mock<IBookingTokenService> _bookingTokenServiceMock;
        private readonly Mock<IBookingSpecialRequestService> _bookingSpecialRequestServiceMock;
        private readonly Mock<IContentService> _contentServiceMock;
        private readonly Mock<IBookingRefundEligibleService> _bookingRefundEligibleServiceMock;
        private readonly Mock<ITransferService> _transferServiceMock;
        private readonly Mock<ITradeAgentAuthenticationService> _tradeAgentAuthServiceMock;
        private readonly Mock<IErrataInfoService> _errataInfoServiceMock;
        private readonly Mock<ILanguageService> _languageServiceMock;
        private readonly Mock<IAirportsMapper> _airportsMapperMock;
        private readonly Mock<IB2BBookingService> _b2BBookingServiceMock;
        private readonly Mock<IAirportParkingService> _airportParkingServiceMock;
        private readonly Mock<IVouchersService> _voucherServiceMock;
        private readonly Mock<IBookingCancellationCreditRulesEngine> _bookingCancellationCreditRulesEngine;
        private readonly Mock<IBookingRefundService> _bookingRefundService;
        private readonly Mock<IBookingBlockCheckerService> _bookingBlockChecker;

        private readonly BookingFetchService _bookingFetchService;

        public BookingFetchServiceTests()
        {
            _fixture = FixtureUtils.AutoMoqFixture();
            _fixture.Inject(Options.Create(_atcomSettings));
            _fixture.Inject(Options.Create(_apiSettings));

            _bookingRepositoryMock = new Mock<IBookingRepository>();
            _hotelsServiceMock = new Mock<IHotelsService>();
            _authenticationServiceMock = new Mock<IAuthenticationService>();
            _bookingTokenServiceMock = new Mock<IBookingTokenService>();
            _bookingSpecialRequestServiceMock = new Mock<IBookingSpecialRequestService>();
            _contentServiceMock = new Mock<IContentService>();
            _bookingRefundEligibleServiceMock = new Mock<IBookingRefundEligibleService>();
            _transferServiceMock = new Mock<ITransferService>();
            _tradeAgentAuthServiceMock = new Mock<ITradeAgentAuthenticationService>();
            _errataInfoServiceMock = new Mock<IErrataInfoService>();
            _languageServiceMock = new Mock<ILanguageService>();
            _airportsMapperMock = new Mock<IAirportsMapper>();
            _b2BBookingServiceMock = new Mock<IB2BBookingService>();
            _airportParkingServiceMock = new Mock<IAirportParkingService>();
            _voucherServiceMock = new Mock<IVouchersService>();
            _bookingCancellationCreditRulesEngine = new Mock<IBookingCancellationCreditRulesEngine>();
            _bookingRefundService = new Mock<IBookingRefundService>();
            _bookingBlockChecker = new Mock<IBookingBlockCheckerService>();

            var atcomSettings = _fixture.Create<IOptions<AtcomSettings>>();
            var apiSettings = _fixture.Create<IOptions<ApiSettings>>();

            _bookingFetchService = new BookingFetchService(
               atcomSettings,
               apiSettings,
                _hotelsServiceMock.Object,
                _authenticationServiceMock.Object,
                _fixture.Create<ILogger<BookingFetchService>>(),
                _bookingRepositoryMock.Object,
                _bookingTokenServiceMock.Object,
                _bookingSpecialRequestServiceMock.Object,
                _contentServiceMock.Object,
                _bookingRefundEligibleServiceMock.Object,
                _transferServiceMock.Object,
                _tradeAgentAuthServiceMock.Object,
                _errataInfoServiceMock.Object,
                _languageServiceMock.Object,
                _airportsMapperMock.Object,
                _b2BBookingServiceMock.Object,
                _airportParkingServiceMock.Object,
               _voucherServiceMock.Object,
               _bookingCancellationCreditRulesEngine.Object,
               _bookingRefundService.Object,
               _bookingBlockChecker.Object
            );
        }

        [Theory]
        [MemberData(nameof(BookingStatusTestData))]
        public async Task BookingCanBeChanged_BookingStatus_Validates(
            string because, bool isValid, string bookingStatus)
        {
            // Arrange
            var settings = Options.Create(new AtcomSettings
            {
                ChangeBooking = new ChangeBookingSettings
                {
                    IsActive = true,
                    UseChangeExpirationDate = false,
                    AllowedStatuses = ["BOOKING"]
                }
            });

            var fixture = FixtureUtils.AutoMoqFixture();
            var bookingRepositoryMock = fixture.Freeze<Mock<IBookingRepository>>();
            bookingRepositoryMock.Setup(b => b.GetBookingMemo(It.IsAny<string>()))
                .ReturnsAsync([]);

            fixture.Inject(settings);

            var sut = fixture.Freeze<BookingFetchService>();

            var booking = new BookingResponse
            {
                BookingStatus = bookingStatus,
                PaymentInfo = new () { BalanceDueAmount = 0 },
                Package = new ()
                {
                    Transport = new ()
                    {
                        Routes =
                        [
                            new()
                            {
                                Direction = Direction.Outbound,
                                DepDate = new DateTimeOffset(3020, 08, 1, 0, 0, 0, TimeSpan.Zero)
                            }
                        ]
                    }
                }
            };

            // Act
            var result = await sut.BookingCanBeChanged(booking);

            // Assert
            result.Should().Be(isValid, because);
        }

        public static IEnumerable<object[]> BookingStatusTestData()
        {
            //because, isValid, status

            yield return ["BOOKING status can be changed", true, "BOOKING"];
            yield return ["booking status can not be changed(register sensitive)", false, "booking"];
            yield return ["OPTION status can not be changed", false, "OPTION"];
            yield return ["CANCELLED status can notbe changed", false, "CANCELLED"];
        }

        [Theory]
        [MemberData(nameof(BookingCanBeChangedTestData))]
        public async Task BookingCanBeChanged_OnlyCurrentBookingBalanceAndDate_Validates(
            string because, bool isValid,
            bool changeExpirationAllowed, DateTimeOffset changeExpires,
            decimal balance, DateTimeOffset depDate)
        {
            // Arrange
            var settings = Options.Create(new AtcomSettings
            {
                ChangeBooking = new ChangeBookingSettings
                {
                    IsActive = true,
                    ChangeAllowedExpirationDate = changeExpires,
                    UseChangeExpirationDate = changeExpirationAllowed,
                    AllowedStatuses = ["BOOKING"]
                }
            });

            var fixture = FixtureUtils.AutoMoqFixture();
            var bookingRepositoryMock = fixture.Freeze<Mock<IBookingRepository>>();
            bookingRepositoryMock.Setup(b => b.GetBookingMemo(It.IsAny<string>()))
                .ReturnsAsync([]);

            fixture.Inject(settings);

            var sut = fixture.Freeze<BookingFetchService>();

            var booking = new BookingResponse
            {
                BookingStatus = "BOOKING",
                PaymentInfo = new () { BalanceDueAmount = balance },
                Package = new ()
                {
                    Transport = new()
                    {
                        Routes =
                        [
                            new ()
                            {
                                Direction = Direction.Outbound, DepDate = depDate
                            }
                        ]
                    }
                }
            };

            // Act
            var result = await sut.BookingCanBeChanged(booking);

            // Assert
            result.Should().Be(isValid, because);
        }

        [Fact]
        public async Task EnrichAndSecureBookingResponse_ShouldEnrichBookingResponseWithAirportParking()
        {
            // arrange
            var bookingResponse = new BookingResponse
            {
                BookingReference = "ABC",
                PaymentInfo = new PriceInfo { BalanceDueAmount = 0 },
                Package =
                    new BookingPackage
                    {
                        Transport = new Transport { Routes = [] }, Accom = new BookingAccommodation()
                    },
                LeadPassenger = new LeadPassenger { Email = "foo@bar.com", },
                AirportParking = new Mock<AirportParkingItem>().Object,
                Currency = Currency.GBP
            };

            _languageServiceMock.Setup(s => s.GetCurrentLanguage()).Returns("english");
            _bookingRefundEligibleServiceMock.Setup(s => s.IsEligibleForFullRefund(It.IsAny<BookingResponse>(), null))
                .ReturnsAsync(new Mock<EligibleForRefund>().Object);
            _authenticationServiceMock.Setup(s => s.IsLoggedInAsLeadPax(It.IsAny<string>())).ReturnsAsync(true);
            _hotelsServiceMock.Setup(s => s.Search(It.IsAny<string[]>())).ReturnsAsync([]);
            _bookingRepositoryMock.Setup(s => s.GetBookingMemo(It.IsAny<string>())).ReturnsAsync([]);
            _bookingSpecialRequestServiceMock.Setup(s => s.GetSpecialRequestsByCodes(It.IsAny<IEnumerable<string>>()))
                .ReturnsAsync([]);

            // act
            await _bookingFetchService.EnrichAndSecureBookingResponse(bookingResponse);

            // assert
            _airportParkingServiceMock.Verify(s => s.EnrichBookingWithAirportParking(bookingResponse.AirportParking));
        }

        [Fact]
        public async Task EnrichAndSecureBookingResponse_CheckMemoValidation_WasCreditedAndWasRefundedIsTrue()
        {
            // Arrange
            var settings = Options.Create(new AtcomSettings
            {
                ChangeBooking = new ChangeBookingSettings
                {
                    IsActive = true,
                    ChangeAllowedExpirationDate = DateTimeOffset.Now.AddDays(15),
                    UseChangeExpirationDate = true,
                    AllowedStatuses = ["BOOKING"],
                    Memo =new AtcomMemoSettings()
                    {
                        BookingPrivacyCode = "BookingPrivacyCode"
                    }
                },
                BookingStatus = new BookingStatus()
                {
                    Booking = "BOOKING",
                    Canceled = "CANCELED",
                },
                FraudCode = "FraudCode",
            });

            var movedTocCreditCode = "MovedToCreditCode";
            var movedToCreditAndCash = "MovedToCreditAndCash";
            var apiSettings = Options.Create(new ApiSettings
            {
                Vouchers = new VoucherSettings()
                {
                    BookingMemos = new BookingMemoSettings()
                    {
                        MovedToCredit = new MemoSettings()
                        {
                            Code = movedTocCreditCode,
                        },
                        MovedToCreditAndCash = new MemoSettings()
                        {
                            Code = movedToCreditAndCash
                        },
                    }
                }
            });

            var fixture = FixtureUtils.AutoMoqFixture();
            var bookingRepositoryMock = fixture.Freeze<Mock<IBookingRepository>>();
            bookingRepositoryMock.Setup(b => b.GetBookingMemo(It.IsAny<string>())).ReturnsAsync([
                new() { Code = movedTocCreditCode },

                new() { Code = movedToCreditAndCash },

                new() { Code = "ExtraMemoCode" }
            ]);

            fixture.Inject(settings);
            fixture.Inject(apiSettings);

            var sut = fixture.Freeze<BookingFetchService>();

            var booking = new BookingResponse
            {
                BookingStatus = "BOOKING",
                PaymentInfo = new PriceInfo
                {
                    BalanceDueAmount = 1000
                },
                Package = new ()
                {
                    Transport = new ()
                    {
                        Routes =
                        [
                            new() { Direction = Direction.Outbound, DepDate = DateTimeOffset.Now.AddDays(20) }
                        ]
                    },
                    Accom = new BookingAccommodation()
                    {
                        Code = "AccomCode"
                    }
                },
                LeadPassenger = new LeadPassenger(new Person()
                {
                    Age = 22,
                    Sex = Sex.Male,
                    Type = PersonType.Adult
                }),
                Currency = Currency.GBP
            };

            // Act
            await sut.EnrichAndSecureBookingResponse(booking);

            // Assert
            booking.wasCredited.Should().Be(true);
            booking.WasRefunded.Should().Be(true);
        }

        public static IEnumerable<object[]> BookingCanBeChangedTestData()
        {
            //because, isValid
            //changeExpirationAllowed, changeExpires,
            //balance, depDate

            yield return
            [
                "full paid and exp date disabled",
                true,
                false,
                DateTimeOffset.Now.AddDays(15),
                0,
                DateTimeOffset.Now.AddDays(10)
            ];

            yield return
            [
                "not full paid and exp date disabled",
                false,
                false,
                DateTimeOffset.Now.AddDays(15),
                10,
                DateTimeOffset.Now.AddDays(10)
            ];

            yield return
            [
                "not full paid and departure date < change allowed date",
                false,
                true,
                DateTimeOffset.Now.AddDays(15),
                10,
                DateTimeOffset.Now.AddDays(10)
            ];

            yield return
            [
                "full paid and departure date < change allowed date",
                true,
                true,
                DateTimeOffset.Now.AddDays(15),
                0,
                DateTimeOffset.Now.AddDays(10)
            ];

            yield return
            [
                "full paid and departure date == change allowed date",
                false,
                true,
                DateTimeOffset.Now.AddDays(10),
                0,
                DateTimeOffset.Now.AddDays(10)
            ];

            yield return
            [
                "full paid and departure date > change allowed date",
                false,
                true,
                DateTimeOffset.Now.AddDays(5),
                0,
                DateTimeOffset.Now.AddDays(10)
            ];
        }
    }
}
