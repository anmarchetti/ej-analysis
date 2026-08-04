using AutoFixture;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Authentication.Agent;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.Payment;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Interfaces.Offers;
using easyJet.Holidays.Api.Domain.Interfaces.Payment;
using easyJet.Holidays.Api.Domain.Interfaces.PriceChanges;
using easyJet.Holidays.Api.Domain.Interfaces.Promotions;
using easyJet.Holidays.Api.Domain.Interfaces.Seats;
using easyJet.Holidays.Api.Domain.Interfaces.Transliteration;
using easyJet.Holidays.Api.Domain.Monitoring;
using easyJet.Holidays.Api.Domain.Monitoring.Analytics;
using easyJet.Holidays.Api.Domain.Services.AmendBooking.AmendmentValidators;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using easyJet.Holidays.Api.Domain.Services.Booking;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.Luggage;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Services.Offers;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Services.Transfers;
using easyJet.Holidays.Api.Domain.Services.Vouchers;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Api;
using easyJet.Holidays.External.Atcom.Mappers.ApiResponseValidators;
using easyJet.Holidays.External.Atcom.Mappers.Booking;
using easyJet.Holidays.External.Atcom.Services;
using easyJet.Holidays.External.Atcom.Services.Booking;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.EI.Api;
using easyJet.Holidays.External.EI.Services.Payment;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using System.Net;
using Xunit;
using EndpointsProvider = easyJet.Holidays.External.EI.Services.EndpointsProvider;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Booking
{
    public class BookingCreateServiceTests
    {

        private readonly BookingCreateService _sut;
        private readonly Mock<ITradeAgentAuthenticationService> _tradeAgentAuthService;

        public BookingCreateServiceTests()
        {
            #region Infrastructure setup

            var fixture = FixtureUtils.AutoMoqFixture();

            var connectionMock = fixture.Freeze<Mock<ConnectionInfo>>();
            connectionMock
                .SetupGet(cm => cm.RemoteIpAddress)
                .Returns(new IPAddress(2130706433));

            var contextMock = fixture.Freeze<Mock<HttpContext>>();
            contextMock
                .SetupGet(c => c.Connection)
                .Returns(connectionMock.Object);

            var hca = fixture.Freeze<Mock<IHttpContextAccessor>>();
            hca
                .SetupGet(x => x.HttpContext)
                .Returns(contextMock.Object);

            var atcomApiClient = fixture.Freeze<Mock<AtcomApiClient>>();

            _tradeAgentAuthService = new();

            var eiApiClient = fixture.Freeze<Mock<EiApiClient>>();

            fixture.Register<IApiService>(() => fixture.Create<AtcomApiService>());

            var atcomSettings = fixture.Freeze<Mock<IOptions<AtcomSettings>>>();
            atcomSettings.SetupGet(x => x.Value).Returns(new AtcomSettings
            {
                Booking = new()
                {
                    Host = "https://0f7cab97.ngrok.io",
                    BaseUrl = "/EZYDMO/VRPWebservice/AniteGateway/AniteGateway.aspx"
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
                CltInfo = new()
                {
                    TermCode = "ABCD",
                    Channel = "inhouse",
                    AgentGroups = new Dictionary<string, AtcomCltInfoAgentsSettings>
                    {
                        {
                            "default",
                            new AtcomCltInfoAgentsSettings
                            {
                                AgentsNames = new Dictionary<string, string> {
                                    {"CH", "WACHF" },
                                    {"UK", "WAGBP" }
                                },
                                UserNames = new Dictionary<string, string> {
                                    {"CH", "EZYVRPS" },
                                    {"UK", "EZYVRP" }
                                }
                            }
                        }
                    }
                },
                Payment = new()
                {
                    AuthSys = "test"
                },
                Transfers = new(),
                Extras = new()
                {
                    TransferTypeCode = "TF"
                },
                PaymentCodes = new()
                {
                {
                    "refund",
                    new()
                    {
                        Issued =  new() {Code = "CI", Group = "CA"},
                        Redeemed =  new() {Code = "CR", Group = "CA"}
                    }
                }, {
                    "goodwill",
                    new()
                    {
                        Issued =  new() {Code = "GI", Group = "CA"},
                        Redeemed =  new() {Code = "GR", Group = "CA"}
                    }
                }, {
                    "incentive",
                    new()
                    {
                        Issued =  new() {Code = "II", Group = "CA"},
                        Redeemed =  new() {Code = "IR", Group = "CA"}
                    }
                }, {
                    "giftcard",
                    new()
                    {
                        Issued =  new() {Code = "GI", Group = "CA"},
                        Redeemed =  new() {Code = "GR", Group = "CA"}
                    }
                }},
                EndpointTemplate = new()
                {
                    BrandParam = "brnd={0}"
                }
            });

            var headerSettings = fixture.Freeze<Mock<IOptions<HeadersSettings>>>();

            var paymentSettings = fixture.Freeze<Mock<IOptions<PaymentsSettings>>>();
            paymentSettings.SetupGet(x => x.Value).Returns(new PaymentsSettings
            {
                MakePayment = new()
                {
                    Host = "https://ei-api-sit1.gwy.test.easyjet.com",
                    Path = "/core/finance/payments/v1/make-payment-request"
                },
                CancelPayment = new()
                {
                    Host = "https://ei-api-sit1.gwy.test.easyjet.com",
                    Path = "/core/finance/payments/v1/cancel-payment-request"
                },
                RefundPayment = new()
                {
                    Host = "https://ei-api-sit1.gwy.test.easyjet.com",
                    Path = "/core/finance/payments/v1/refund-payment-request"
                },
                ApiKey = "D2FFC188-FA04-4815-851B-84CDA104CE9F",
                CustomerServiceUrl = "https://www.easyJet.com/en/help",
                ThreeDSCallbackHost = "https://localhost:44319",
                IdentifyNotificationUrl = "/api/v1.0/payment/identify",
                ChallengeNotificationUrl = "/api/v1.0/payment/challenge",
                ThreeDSOneNotificationUrl = "/api/v1.0/payment/3ds1",
                FrontendOrigin = "http://localhost:3000",
                XPosId = "DigitalHolidaysWeb",
                Channel = "Web",
                CallbackTemplate = "<html><head><script>window.frames.parent.postMessage({0}, '{1}');</script><head/><body></body></html>",
                Api = new()
                {
                    TimeoutMilliSeconds = 0
                }
            });

            fixture.Inject(Options.Create(new ApiSettings
            {
                Vouchers = new()
                {
                    BookingMemos = new()
                    {
                        Cred = new()
                        {
                            Code = "CRED"
                        },
                        MovedToCredit = new()
                        {
                            Code = "REP3"
                        }
                    },
                    Metadata = new()
                    {
                        { "currency", "GBP"}
                    },
                    Source = new()
                    {
                        BulkTool = "Bulk Tool",
                        CallCentre = "Call Centre",
                        Web = "Web"
                    },
                    Action = new()
                    {
                        Spend = "Spend",
                        CreditAndRefund = "Credit and refund",
                        UndoCredit = "Undo credit"

                    },
                    Types = new()
                    {
                        Refund = "refund",
                        Incentive = "incentive",
                        Goodwill = "goodwill",
                        GiftCard = "giftcard"
                    },
                    PromoVouchers = new()
                    {
                        Types = new() { "marketing" }
                    }
                }
            }));

            var referenceDataServiceMock = fixture.Freeze<Mock<IReferenceDataService>>();
            referenceDataServiceMock
               .Setup(x => x.GetSpecialRequestGroups())
               .ReturnsAsync(new List<SpecialRequestsGroup>
               {
                    new()
                    {
                        Code = "Group 1",
                        SpecialRequests = new()
                        {
                            new()
                            {
                                Code = "Group1Code1"
                            },
                            new()
                            {
                                Code = "Group1Code2"
                            }
                        }
                    },
               });

            referenceDataServiceMock
               .Setup(x => x.GetSpecialRequestContradictoryGroups())
               .ReturnsAsync(new List<SpecialRequestsGroup>());

            referenceDataServiceMock.Setup(service => service.GetSpecialRequestSettings()).ReturnsAsync(
                new SpecialRequestSettingsSitecore
                {
                    IsEligibleToAddSSRForHBG = "1",
                    IsSpecialRequestActiveString = "1",
                    IsEligibleToAddSSRForDC = "1"
                });

            fixture.Register<IPaymentsService>(() => new PaymentsService(
                new EiApiService(
                    eiApiClient.Object,
                    paymentSettings.Object
                ),
                fixture.Create<EndpointsProvider>(),
                hca.Object,
                paymentSettings.Object,
                fixture.Create<Logger<PaymentsService>>(),
                headerSettings.Object,
                fixture.Create<IMarketService>()
            ));

            fixture.Register<IBookingRepository>(() => new BookingRepository(
                new AtcomApiService(
                    atcomApiClient.Object,
                    atcomSettings.Object,
                    _tradeAgentAuthService.Object
                ),
                fixture.Create<External.Atcom.Services.EndpointsProvider>(),
                fixture.Create<AtcomRequestGenerator>(),
                hca.Object,
                fixture.Freeze<IOptions<AtcomSettings>>(),
                fixture.Create<ISettingsService>(),
                fixture.Create<IAuthenticationService>(),
                fixture.Create<ITransferService>(),
                fixture.Freeze<Mock<IPriceChangesService>>().Object,
                fixture.Freeze<Mock<IPricesService>>().Object,
                fixture.Freeze<IReferenceDataService>(),
                fixture.Create<ILogger<BookingRepository>>(),
                fixture.Create<RequestBookingMapper>(),
                fixture.Create<InfoBookingMapper>(),
                fixture.Create<ModifyBookingMapper>(),
                fixture.Create<ITradeAgentAuthenticationService>(),
                fixture.Create<ISeatingService>(),
                fixture.Freeze<ApiResponseValidators>(),
                fixture.Create<IMarketService>(),
                fixture.Freeze<IB2BBookingService>(),
                fixture.Freeze<IOfferPriceService>(),
                fixture.Create<IFlightExtraSearchService>(),
                fixture.Freeze<IValidationAmendmentsService>(),
                fixture.Freeze<ILuggageService>(),
                fixture.Create<PriceMapper>(),
                fixture.Create<ILuggageValidatorService>(),
                fixture.Freeze<ITransliterationService>(),
                fixture.Freeze<IMetricsService>(),
                fixture.Freeze<IOtelAnalyticsService>(),
                fixture.Freeze<IBookingResponsePromotionCollectionsService>()
            ));

            fixture.Register<IBookingPaymentsRepository>(() => new BookingPaymentsRepository(
             new AtcomApiService(
                 atcomApiClient.Object,
                 atcomSettings.Object,
                 _tradeAgentAuthService.Object
             ),
             fixture.Create<External.Atcom.Services.EndpointsProvider>(),
             fixture.Create<AtcomRequestGenerator>(),
             hca.Object,
             fixture.Freeze<IOptions<AtcomSettings>>(),
             fixture.Freeze<IOptions<ApiSettings>>(),
             fixture.Create<IAuthenticationService>(),
             fixture.Create<ILogger<BookingPaymentsRepository>>(),
             fixture.Create<RequestBookingMapper>(),
              fixture.Create<BookingPaymentsMapper>()
            ));

            fixture.Register<IBookingSpecialRequestService>(() => new BookingSpecialRequestService(
                fixture.Create<IBookingRepository>(),
                referenceDataServiceMock.Object,
                 fixture.Freeze<IOptions<AtcomSettings>>(),
                 fixture.Freeze<IOptions<ApiSettings>>(),
                 fixture.Freeze<ILogger<BookingSpecialRequestService>>(),
                fixture.Freeze<ISpecialRequestValidator>()
            ));

            fixture.Register<IBookingCreateService>(() => new BookingCreateService(
                  fixture.Create<IPaymentsService>(),
                  fixture.Freeze<IOptions<AtcomSettings>>(),
                  fixture.Freeze<IOptions<ApiSettings>>(),
                  fixture.Create<ILogger<BookingCreateService>>(),
                  fixture.Create<IBookingRepository>(),
                  fixture.Create<IBookingPaymentsRepository>(),
                  fixture.Create<IBookingFetchService>(),
                  fixture.Create<IVouchersService>(),
                  fixture.Create<ITransferService>(),
                  fixture.Create<IPromotionValidatorService>(),
                  fixture.Create<IVoucherPaymentFlowService>(),
                  fixture.Create<IBookingSpecialRequestService>(),
                  referenceDataServiceMock.Object,
                  fixture.Create<IBookingSessionService>(),
                  fixture.Create<IHttpContextAccessor>(),
                  fixture.Freeze<IOptions<HeadersSettings>>(),
                  _tradeAgentAuthService.Object,
                  fixture.Create<IAuthenticationService>(),
                  fixture.Create<IOfferPriceService>(),
                  fixture.Create<ILanguageService>(),
                  fixture.Create<IMarketService>()
               ));

            _sut = new(
                  fixture.Create<IPaymentsService>(),
                  fixture.Freeze<IOptions<AtcomSettings>>(),
                  fixture.Freeze<IOptions<ApiSettings>>(),
                  fixture.Create<ILogger<BookingCreateService>>(),
                  fixture.Create<IBookingRepository>(),
                  fixture.Create<IBookingPaymentsRepository>(),
                  fixture.Create<IBookingFetchService>(),
                  fixture.Create<IVouchersService>(),
                  fixture.Create<ITransferService>(),
                  fixture.Create<IPromotionValidatorService>(),
                  fixture.Create<IVoucherPaymentFlowService>(),
                  fixture.Create<IBookingSpecialRequestService>(),
                  referenceDataServiceMock.Object,
                  fixture.Create<IBookingSessionService>(),
                  fixture.Create<IHttpContextAccessor>(),
                  fixture.Freeze<IOptions<HeadersSettings>>(),
                  _tradeAgentAuthService.Object,
                  fixture.Create<IAuthenticationService>(),
                  fixture.Create<IOfferPriceService>(),
                  fixture.Create<ILanguageService>(),
                  fixture.Create<IMarketService>()
            );

            #endregion
        }

        [Fact]
        public void PriceValidationAction_AsTradeAgent_WithInvalidPayment_ShouldPass()
        {
            // Arrange
            _tradeAgentAuthService.Setup(
                serviceMock =>
                serviceMock.GetCurrentAgent()
            ).Returns(
                new AgentDetails
                {
                    Number = "12345",
                    Name = "RTY"
                }
            );
            _tradeAgentAuthService.Setup(
                serviceMock =>
                serviceMock.IsLoggedInAsTradeAgent()
            ).Returns(true);

            var requestToValidate = new BookingRequest { PaymentInfo = new CardPaymentInfo { Amount = 1234.56m }, Offer = new() { Price = 1234.56m } };

            var validateResponse = new ValidateBookingResponse { PaymentInfo = new() { TotalPrice = 1234.56m } };

            // Act
            _sut.PriceValidationAction(requestToValidate).Invoke(validateResponse);

            // Assert
            requestToValidate.PaymentInfo.Should().NotBeNull();
            requestToValidate.PaymentInfo.Amount.Should().Be(0);
            requestToValidate.PaymentInfo.CreditAmount.Should().Be(0);
        }

        [Fact]
        public void PriceValidationAction_AsCustomer_WithInvalidPayment_ShouldThrow()
        {
            // Arrange
            _tradeAgentAuthService.Setup(
                serviceMock =>
                serviceMock.IsLoggedInAsTradeAgent()
            ).Returns(
                false
            );
            var requestToValidate = new BookingRequest { PaymentInfo = new CardPaymentInfo { Amount = 1234.56m }, Offer = new() };

            var validateResponse = new ValidateBookingResponse { PaymentInfo = new() };

            // Act
            var action = _sut.PriceValidationAction(requestToValidate);

            // Assert
            action.Invoking(_ => action.Invoke(validateResponse)).Should().Throw<ApiException>().Match(x => x.First().Message == "Price is not valid");
        }
        
        [Fact]
        public void PriceValidationAction_AsCustomer_WithValidationPaymentPriceChange_ShouldThrow()
        {
            // Arrange
            _tradeAgentAuthService.Setup(
                serviceMock =>
                serviceMock.IsLoggedInAsTradeAgent()
            ).Returns(
                false
            );
            var requestToValidate = new BookingRequest { Offer = new() { Price = 1800}, PaymentInfo = new CardPaymentInfo { Amount = 2000m } };

            var validateResponse = new ValidateBookingResponse { PaymentInfo = new() { TotalPrice = 2000 } };

            // Act
            var action = _sut.PriceValidationAction(requestToValidate);
            try
            {
                action.Invoke(validateResponse);
            }
            catch (ApiException ex)
            {
                ex.Message.Should().Be("Price has changed");
                ex.InnerErrors.Should().NotBeEmpty();
                ex.InnerErrors[0].Code.Should().Be(ApiExceptionCodes.BookingPriceJumpError.Code);
                ex.InnerErrors[0].Message.Should().Be("2000");
            }
        }

        [Fact]
        public void PriceValidationAction_AsCustomer_WithValidationPaymentPriceTheSame_ShouldNotThrow()
        {
            // Arrange
            _tradeAgentAuthService.Setup(
                serviceMock =>
                serviceMock.IsLoggedInAsTradeAgent()
            ).Returns(
                false
            );
            var requestToValidate = new BookingRequest { Offer = new() { Price = 2000 }, PaymentInfo = new CardPaymentInfo { Amount = 2000m } };

            var validateResponse = new ValidateBookingResponse { PaymentInfo = new() { TotalPrice = 2000 } };

            // Act
            var action = _sut.PriceValidationAction(requestToValidate);

            action.Invoking(_ => action.Invoke(validateResponse)).Should().NotThrow<ApiException>();
        }

        [Theory]
        [MemberData(nameof(ThrowValidateException_ShouldThrowExceptionWithCorrectMessageData))]
        public void ThrowValidateException_ShouldThrowExceptionWithCorrectMessage(string customerPromocode, string atcomPromocode,
            string apiErrorMesage, string expectedErrorMessage)
        {
            // Arrange
            var innerError = new ApiError { Code = "E123", Message = apiErrorMesage, };
            var exception = new ApiException(ApiExceptionCodes.PromotionIsNotValid, [innerError], "Promo not valid");

            // Act & assert
            var action = () => BookingCreateService.ThrowValidateException(customerPromocode, atcomPromocode, exception);
            action.Should().Throw<ApiException>().Match(x => x.First().InnerErrors[0].Message == expectedErrorMessage);
        }

        public static TheoryData<string, string, string, string> ThrowValidateException_ShouldThrowExceptionWithCorrectMessageData()
        {
            return new()
            {
                {"JANSALE", "JANPROMO100", "Promocode JANPROMO100 is not valid for this booking", "Promocode JANSALE is not valid for this booking" },
                {"JANSALE", null, "An error message without promocode", "An error message without promocode" }
            };
        }
    }
}
