using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.Authentication.Agent;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Payment;
using easyJet.Holidays.Api.Domain.Data.ReferenceData.Luggage;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Exceptions;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Interfaces.Offers;
using easyJet.Holidays.Api.Domain.Interfaces.Payment;
using easyJet.Holidays.Api.Domain.Interfaces.PriceChanges;
using easyJet.Holidays.Api.Domain.Interfaces.Promotions;
using easyJet.Holidays.Api.Domain.Interfaces.Seats;
using easyJet.Holidays.Api.Domain.Interfaces.Transliteration;
using easyJet.Holidays.Api.Domain.Monitoring;
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
using easyJet.Holidays.External.EI.Api;
using easyJet.Holidays.External.EI.Services.Payment;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Force.DeepCloner;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using System.Text;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using Xunit;
using LuggageItem = easyJet.Holidays.Api.Domain.Data.ReferenceData.Luggage.LuggageItem;
using easyJet.Holidays.Api.Domain.Monitoring.Analytics;

namespace easyJet.Holidays.Api.ComponentTests.Booking
{
    public class BookingServiceMakePayment3DSTests : IDisposable
    {
        private IFixture _fixture;
        private Mock<AtcomApiClient> atcomApiClient;
        private Mock<ITradeAgentAuthenticationService> tradeAgentAuthService;
        private Mock<EiApiClient> eiApiClient;
        private IBookingCreateService sut;
        private Mock<IFlightExtraService> _flightExtraService = new Mock<IFlightExtraService>();

        public BookingServiceMakePayment3DSTests()
        {
            #region Infrastructure setup

            _fixture = FixtureUtils.AutoMoqFixture();

            var connectionMock = _fixture.Freeze<Mock<ConnectionInfo>>();
            connectionMock
                .SetupGet(cm => cm.RemoteIpAddress)
                .Returns(new System.Net.IPAddress(2130706433));

            var contextMock = _fixture.Freeze<Mock<HttpContext>>();
            contextMock
                .SetupGet(c => c.Connection)
                .Returns(connectionMock.Object);

            var hca = _fixture.Freeze<Mock<IHttpContextAccessor>>();
            hca
                .SetupGet(x => x.HttpContext)
                .Returns(contextMock.Object);

            atcomApiClient = _fixture.Freeze<Mock<AtcomApiClient>>();

            tradeAgentAuthService = new Mock<ITradeAgentAuthenticationService>();
            tradeAgentAuthService.Setup(s => s.GetCurrentAgent()).Returns(default(AgentDetails));

            eiApiClient = _fixture.Freeze<Mock<EiApiClient>>();

            var atcomSettings = _fixture.Freeze<Mock<IOptions<AtcomSettings>>>();
            atcomSettings.SetupGet(x => x.Value).Returns(new AtcomSettings
            {
                Booking = new AtcomApiSettings
                {
                    Host = "https://0f7cab97.ngrok.io",
                    BaseUrl = "/EZYDMO/VRPWebservice/AniteGateway/AniteGateway.aspx"
                },
                Search = new()
                {
                    Uk = new()
                    {
                        Host = "https://0f7cab97.ngrok.io",
                        BaseUrl = "/fcgi-bin/ezydmouk/avcache3_g"
                    },
                    Ch = new()
                    {
                        Host = "https://0f7cab97.ngrok.io",
                        BaseUrl = "/fcgi-bin/ezydmoch/avcache3_g"
                    },
                    De = new()
                    {
                        Host = "https://0f7cab97.ngrok.io",
                        BaseUrl = "/fcgi-bin/ezydmode/avcache3_g"
                    },
                    Fr = new()
                    {
                        Host = "https://0f7cab97.ngrok.io",
                        BaseUrl = "/fcgi-bin/ezydmofr/avcache3_g"
                    }
                },
                CltInfo = new AtcomCltInfoSettings
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
                Payment = new Payment
                {
                    AuthSys = "test"
                },
                Transfers = new TransfersSettings
                {
                },
                Extras = new ExtrasSettings
                {
                    TransferTypeCode = "TF"
                },
                PaymentCodes = new Dictionary<string, PaymentCodesSettings>{
                {
                    "refund",
                    new PaymentCodesSettings
                    {
                        Issued =  new PaymentTypeSettings {Code = "CI", Group = "CA"},
                        Redeemed =  new PaymentTypeSettings {Code = "CR", Group = "CA"}
                    }
                }, {
                    "goodwill",
                    new PaymentCodesSettings
                    {
                        Issued =  new PaymentTypeSettings {Code = "GI", Group = "CA"},
                        Redeemed =  new PaymentTypeSettings {Code = "GR", Group = "CA"}
                    }
                }, {
                    "incentive",
                    new PaymentCodesSettings
                    {
                        Issued =  new PaymentTypeSettings {Code = "II", Group = "CA"},
                        Redeemed =  new PaymentTypeSettings {Code = "IR", Group = "CA"}
                    }
                }, {
                    "giftcard",
                    new PaymentCodesSettings
                    {
                        Issued =  new PaymentTypeSettings {Code = "GI", Group = "CA"},
                        Redeemed =  new PaymentTypeSettings {Code = "GR", Group = "CA"}
                    }
                }},
                ErrorsToIgnoreInModifyCustPaymentResponse = new List<AtcomError>
                {
                    new AtcomError { Code = "E1369", Message = "Hotel Plaform Server Error 991 Internal server error" },
                    new AtcomError { Code = "E1369", Message = "Hotel Plaform Server Error 991 Another HBG error" }
                }
            });

            var paymentSettings = _fixture.Freeze<Mock<IOptions<PaymentsSettings>>>();
            paymentSettings.SetupGet(x => x.Value).Returns(new PaymentsSettings
            {
                MakePayment = new UrlSettings()
                {
                    Host = "https://ei-api-sit1.gwy.test.easyjet.com",
                    Path = "/core/finance/payments/v1/make-payment-request"
                },
                CancelPayment = new UrlSettings()
                {
                    Host = "https://ei-api-sit1.gwy.test.easyjet.com",
                    Path = "/core/finance/payments/v1/cancel-payment-request"
                },
                RefundPayment = new UrlSettings()
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
                Api = new PaymentsApiSettings
                {
                    TimeoutMilliSeconds = 0
                },
                ErrorCodes = new ErrorCodesSettings
                {
                    Fingerprint = "FCF",
                    Challenge = "CCF",
                    Authentication = "ACF"
                }
            });

            _fixture.Inject(Options.Create(new ApiSettings()
            {
                Vouchers = new VoucherSettings()
                {
                    BookingMemos = new BookingMemoSettings()
                    {
                        Cred = new MemoSettings()
                        {
                            Code = "CRED"
                        },
                        MovedToCredit = new MemoSettings()
                        {
                            Code = "REP3"
                        }
                    },
                    Metadata = new Dictionary<string, object> {
                        { "currency", "GBP"}
                    },
                    Source = new VoucherifySource
                    {
                        BulkTool = "Bulk Tool",
                        CallCentre = "Call Centre",
                        Web = "Web"
                    },
                    Action = new VoucherifyAction
                    {
                        Spend = "Spend",
                        CreditAndRefund = "Credit and refund",
                        UndoCredit = "Undo credit"

                    },
                    Types = new VoucherTypeSettings
                    {
                        Refund = "refund",
                        Incentive = "incentive",
                        Goodwill = "goodwill"
                    },
                    PromoVouchers = new VoucherReasonSettings()
                    {
                        Types = new List<string>() { "marketing" }
                    }
                }
            }));

            var referenceDataServiceMock = new Mock<IReferenceDataService>();
            referenceDataServiceMock.Setup(x => x.GetLuggageSettings()).ReturnsAsync(new LuggageSettings
            {
                DefaultFreeBagsPerNonInfantPassenger = new Dictionary<string, int> { { "LUG", 1 } },
                EnableHoldLuggageBookingFlow = true,
                EnableSportsEquipmentBookingFlow = true
            });
            referenceDataServiceMock.Setup(x => x.GetLuggage()).ReturnsAsync(new Luggage
            {
                LuggageCategories = new List<LuggageCategory> { new()
                {
                    Code = "BAGE",
                    LuggageItems = new List<LuggageItemBase>
                    {
                        new LuggageItem() { Code = "LUG" }
                    }
                } }
            });

            var headerSettings = _fixture.Freeze<Mock<IOptions<HeadersSettings>>>();

            _fixture.Inject(Options.Create(new LanguageSettings
            {
                MarketLanguages = new Dictionary<string, IEnumerable<string>>
                {
                    {"UK", new[] {"en" } }
                }
            }));

            var marketServiceMock = new Mock<IMarketService>();
            marketServiceMock.Setup(x => x.GetCurrentMarket()).Returns(new MarketSettings
            {
                Code = "UK",
                Currency = Currency.GBP
            });
            _fixture.Inject(marketServiceMock.Object);

            _fixture.Register<IPaymentsService>(() => new PaymentsService(
                new EiApiService(
                    eiApiClient.Object,
                    paymentSettings.Object
                ),
                _fixture.Create<easyJet.Holidays.External.EI.Services.EndpointsProvider>(),
                hca.Object,
                paymentSettings.Object,
                _fixture.Create<Logger<PaymentsService>>(),
                headerSettings.Object,
                _fixture.Create<IMarketService>()
            ));

            _fixture.Register<IBookingRepository>(() => new BookingRepository(
                new AtcomApiService(
                    atcomApiClient.Object,
                    atcomSettings.Object,
                    tradeAgentAuthService.Object
                ),
                _fixture.Create<EndpointsProvider>(),
                _fixture.Create<AtcomRequestGenerator>(),
                hca.Object,
                _fixture.Freeze<IOptions<AtcomSettings>>(),
                _fixture.Create<ISettingsService>(),
                _fixture.Create<IAuthenticationService>(),
                _fixture.Create<ITransferService>(),
                _fixture.Freeze<Mock<IPriceChangesService>>().Object,
                _fixture.Freeze<Mock<IPricesService>>().Object,
                referenceDataServiceMock.Object,
                _fixture.Create<ILogger<BookingRepository>>(),
                _fixture.Create<RequestBookingMapper>(),
                _fixture.Create<InfoBookingMapper>(),
                _fixture.Create<ModifyBookingMapper>(),
                 tradeAgentAuthService.Object,
                _fixture.Create<ISeatingService>(),
                _fixture.Freeze<ApiResponseValidators>(),
                _fixture.Freeze<IMarketService>(),
                _fixture.Freeze<IB2BBookingService>(),
                _fixture.Create<IOfferPriceService>(),
                _fixture.Create<IFlightExtraSearchService>(),
                _fixture.Freeze<IValidationAmendmentsService>(),
                new LuggageService(referenceDataServiceMock.Object, _fixture.Freeze<ILuggageValidatorService>(), _fixture.Freeze<IPassengerIndexCalculator>(), _fixture.Freeze<IFlightExtraService>(), _fixture.Create<ILogger<LuggageService>>()),
                _fixture.Create<PriceMapper>(),
                _fixture.Create<ILuggageValidatorService>(),
                 _fixture.Freeze<ITransliterationService>(),
                 _fixture.Freeze<IMetricsService>(),
                 _fixture.Freeze<IOtelAnalyticsService>(),
                 _fixture.Freeze<IBookingResponsePromotionCollectionsService>()
            ));
            _fixture.Register<IBookingPaymentsRepository>(() => new BookingPaymentsRepository(
                new AtcomApiService(
                    atcomApiClient.Object,
                    atcomSettings.Object,
                    tradeAgentAuthService.Object
                ),
                _fixture.Create<EndpointsProvider>(),
                _fixture.Create<AtcomRequestGenerator>(),
                hca.Object,
                _fixture.Freeze<IOptions<AtcomSettings>>(),
                _fixture.Freeze<IOptions<ApiSettings>>(),
                _fixture.Create<IAuthenticationService>(),
                _fixture.Create<ILogger<BookingPaymentsRepository>>(),
                _fixture.Create<RequestBookingMapper>(),
                _fixture.Create<BookingPaymentsMapper>()
            ));

            var languageServiceMock = new Mock<ILanguageService>();
            languageServiceMock.Setup(x => x.GetCurrentLanguage()).Returns("en");

            _fixture.Register(() => languageServiceMock.Object);

            _fixture.Register<IBookingCreateService>(() => new BookingCreateService(
                _fixture.Create<IPaymentsService>(),
                _fixture.Freeze<IOptions<AtcomSettings>>(),
                _fixture.Freeze<IOptions<ApiSettings>>(),
                _fixture.Create<ILogger<BookingCreateService>>(),
                _fixture.Create<IBookingRepository>(),
                _fixture.Create<IBookingPaymentsRepository>(),
                _fixture.Create<IBookingFetchService>(),
                _fixture.Create<IVouchersService>(),
                _fixture.Create<ITransferService>(),
                _fixture.Create<IPromotionValidatorService>(),
                _fixture.Create<IVoucherPaymentFlowService>(),
                _fixture.Create<IBookingSpecialRequestService>(),
                _fixture.Create<IReferenceDataService>(),
                _fixture.Create<IBookingSessionService>(),
                _fixture.Create<IHttpContextAccessor>(),
                _fixture.Create<IOptions<HeadersSettings>>(),
                tradeAgentAuthService.Object,
                _fixture.Create<IAuthenticationService>(),
                _fixture.Create<IOfferPriceService>(),
                _fixture.Create<ILanguageService>(),
                _fixture.Create<IMarketService>()
             ));
            sut = _fixture.Freeze<IBookingCreateService>();

            #endregion

            #region InfoBooking mock

            atcomApiClient
                .Setup(x => x.MakeCall(It.IsAny<HttpMethod>(), It.Is<Uri>(u => u.AbsoluteUri.Contains("/EZYDMO/VRPWebservice/AniteGateway/AniteGateway.aspx")), It.Is<string>(p => p.Contains("p2:InfoBookingRequest")), It.IsAny<string>(), It.IsAny<TimeSpan?>()))
                .ReturnsAsync(() => new MemoryStream(Encoding.UTF8.GetBytes(@"<p1:InfoBookingResponse xmlns:p1=""AtComRes/InfoBookingResponse"" xmlns:p2=""AtComRes/Common"" xmlns:xsi=""http://www.w3.org/2001/XMLSchema-instance"" xsi:schemaLocation=""AtComRes/InfoBookingResponse ../api/InfoBookingResponse/InfoBookingResponse.xsd"">
    <!-- Response returned from: EZYDMO -->
    <p2:Adm Xsd_Ver=""T3.20.4.8"">
        <p2:SessId>b21395b7-df22-433b-9791-87da692fc591@0</p2:SessId>
        <p2:ReqId>12345</p2:ReqId>
        <p2:Tm>2019-09-17T12:03:31.617+01:00</p2:Tm>
        <p2:Trk From=""atcomres"" To=""easyjet"" />
        <p2:Ser_Msg>
            <p2:Severity>WARN</p2:Severity>
            <p2:Code>W36242</p2:Code>
            <p2:Desc>Unable to find default baggage template</p2:Desc>
        </p2:Ser_Msg>
    </p2:Adm>
    <p2:CltInfo>
        <p2:Locale>en_EN</p2:Locale>
        <p2:CltSysContext>3</p2:CltSysContext>
        <p2:Agt_No>WAGBP</p2:Agt_No>
        <p2:TermCode>ABCDE</p2:TermCode>
        <p2:User_Name>EZYVRP</p2:User_Name>
        <p2:Chan>inhouse</p2:Chan>
        <p2:Channel_Type>VRP</p2:Channel_Type>
        <p2:User_Role>INTERNAL</p2:User_Role>
    </p2:CltInfo>
    <p2:BkgSts>BOOKING</p2:BkgSts>
    <p2:ResSts>CONFIRMED</p2:ResSts>
    <p2:HasAgt_Notice>false</p2:HasAgt_Notice>
    <p2:StsExpDateMax>2019-10-17T12:03:31.000+01:00</p2:StsExpDateMax>
    <p2:His>
        <p2:Bkg_Dt_Tm>2019-09-17T12:03:31.000+01:00</p2:Bkg_Dt_Tm>
    </p2:His>
    <p2:Bkg_Ent>
        <p2:Package>
            <p2:Accom>
                <p2:Id>1</p2:Id>
                <p2:St_Dt>2020-08-06</p2:St_Dt>
                <p2:End_Dt>2020-08-13</p2:End_Dt>
                <p2:HtlPrd>
                    <p2:Name>Majorca Atcore Test Accom</p2:Name>
                    <p2:Prom Code=""EZBO"" Issue=""1"" Name=""Beach - Other"" />
                    <p2:Acc_Cd Accom_Id=""17019/2"">ESMJ0001</p2:Acc_Cd>
                    <p2:Acc_InvState>INTERNAL</p2:Acc_InvState>
                    <p2:Hotel>
                        <p2:Add>
                            <p2:Name>Majorca Atcore Test Accom</p2:Name>
                            <p2:City>Alcudia</p2:City>
                            <p2:Region>Majorca</p2:Region>
                            <p2:CountryISOCode>ES</p2:CountryISOCode>
                        </p2:Add>
                        <p2:Star_Rating>2</p2:Star_Rating>
                        <p2:Loc>
                            <p2:Loc_Cd>ESMJAL</p2:Loc_Cd>
                            <p2:Loc_Tp>CITY</p2:Loc_Tp>
                            <p2:Loc_Name>Alcudia</p2:Loc_Name>
                        </p2:Loc>
                    </p2:Hotel>
                    <p2:Cat_Page>
                        <p2:Catalog Code=""EZBO"" Name=""easyJet Holidays Beach - Other"" />
                        <p2:Cat_Page_No>0</p2:Cat_Page_No>
                        <p2:Prc_Cat_Page_No>0</p2:Prc_Cat_Page_No>
                    </p2:Cat_Page>
                    <p2:Corporate_Cd>123456</p2:Corporate_Cd>
                </p2:HtlPrd>
                <p2:Rm_Cd>
                    <p2:Rm_No>1</p2:Rm_No>
                    <p2:Code>TW01</p2:Code>
                    <p2:Desc>Twin Room</p2:Desc>
                    <p2:Inf_Inc_Occ>true</p2:Inf_Inc_Occ>
                    <p2:Min_Pax>1</p2:Min_Pax>
                    <p2:Max_Pax>2</p2:Max_Pax>
                    <p2:Max_Adu>2</p2:Max_Adu>
                    <p2:Max_Chd>2</p2:Max_Chd>
                    <p2:Max_Inf>0</p2:Max_Inf>
                    <p2:BB_Cd>BB</p2:BB_Cd>
                    <p2:BB_Name>
                        <![CDATA[Bed & Breakfast]]>
                    </p2:BB_Name>
                    <p2:Ser_Sts>FIX</p2:Ser_Sts>
                    <p2:Ser_Sts>OPTION</p2:Ser_Sts>
                    <p2:Ser_Sts>QUOTE</p2:Ser_Sts>
                    <p2:SubServPaxs>
                        <p2:SubServPax>
                            <p2:Pax_Id>1</p2:Pax_Id>
                            <p2:Pax_Tp>ADULT</p2:Pax_Tp>
                            <p2:Pax_Srv_Prc_Ex CurISO=""GBP"">547.00</p2:Pax_Srv_Prc_Ex>
                        </p2:SubServPax>
                        <p2:SubServPax>
                            <p2:Pax_Id>2</p2:Pax_Id>
                            <p2:Pax_Tp>ADULT</p2:Pax_Tp>
                            <p2:Pax_Srv_Prc_Ex CurISO=""GBP"">547.00</p2:Pax_Srv_Prc_Ex>
                        </p2:SubServPax>
                    </p2:SubServPaxs>
                    <p2:Prices>
                        <p2:Price>
                            <p2:Prc_Cd>AA</p2:Prc_Cd>
                            <p2:Prc_Cd_Name>Adult Accommodation</p2:Prc_Cd_Name>
                            <p2:Prc_Cd_Tp>ACC</p2:Prc_Cd_Tp>
                            <p2:Qty>2</p2:Qty>
                            <p2:Prc CurISO=""GBP"">547.00</p2:Prc>
                            <p2:Prc_Dt>2019-09-17T12:03:31.000+01:00</p2:Prc_Dt>
                            <p2:PricePaxs>
                                <p2:Pax_Id>1</p2:Pax_Id>
                                <p2:Pax_Id>2</p2:Pax_Id>
                            </p2:PricePaxs>
                            <p2:Visible>true</p2:Visible>
                            <p2:Prc_Sts>STK</p2:Prc_Sts>
                        </p2:Price>
                    </p2:Prices>
                </p2:Rm_Cd>
                <p2:Ref_Prd_Id>2</p2:Ref_Prd_Id>
                <p2:Free_Car_Rental_Poss>false</p2:Free_Car_Rental_Poss>
                <p2:Atol_Mth>NONE</p2:Atol_Mth>
            </p2:Accom>
            <p2:Route_List>
                <p2:Routing Routing_Type=""OW"">
                    <p2:Routing_Id>2</p2:Routing_Id>
                    <p2:Route Rt_Dir=""outbound"">
                        <p2:RouteCd>PMILGW4ALGWPMI</p2:RouteCd>
                        <p2:Flt_Inv_Id>171480</p2:Flt_Inv_Id>
                        <p2:Rt_InvState>INTERNAL</p2:Rt_InvState>
                        <p2:Dep_Air_Cd>LGW</p2:Dep_Air_Cd>
                        <p2:Arr_Air_Cd>PMI</p2:Arr_Air_Cd>
                        <p2:Flt_Dt_Tm DirType=""DEPARTURE"">
                            <p2:Local>2020-08-06T11:30:00+00:00</p2:Local>
                        </p2:Flt_Dt_Tm>
                        <p2:Flt_Dt_Tm DirType=""ARRIVAL"">
                            <p2:Local>2020-08-06T14:00:00+00:00</p2:Local>
                        </p2:Flt_Dt_Tm>
                        <p2:Duration>7</p2:Duration>
                        <p2:Cycle_Dt>2020-08-06</p2:Cycle_Dt>
                        <p2:JnyDur>02:30</p2:JnyDur>
                        <p2:Prom Code=""AUPK"" Issue=""1"" Name=""Package LP"" />
                        <p2:Car_Cd>EZY</p2:Car_Cd>
                        <p2:Flt_No>791</p2:Flt_No>
                        <p2:Bkg_Cls Code=""Y"" />
                        <p2:Cab_Cls Code=""Y"" Name=""Economy"" />
                        <p2:Flt_Seq_Cd>1</p2:Flt_Seq_Cd>
                        <p2:Sec>
                            <p2:Id>2</p2:Id>
                            <p2:SecId>1</p2:SecId>
                            <p2:Dep_Air_Cd>LGW</p2:Dep_Air_Cd>
                            <p2:Arr_Air_Cd>PMI</p2:Arr_Air_Cd>
                            <p2:Flt_Dt_Tm DirType=""DEPARTURE"">
                                <p2:Local>2020-08-06T11:30:00+00:00</p2:Local>
                            </p2:Flt_Dt_Tm>
                            <p2:Flt_Dt_Tm DirType=""ARRIVAL"">
                                <p2:Local>2020-08-06T14:00:00+00:00</p2:Local>
                            </p2:Flt_Dt_Tm>
                            <p2:JnyDur>02:30</p2:JnyDur>
                            <p2:Car_Cd>EZY</p2:Car_Cd>
                            <p2:Flt_No>791</p2:Flt_No>
                            <p2:Bkg_Cls Code=""Y"" />
                            <p2:Cab_Cls Code=""Y"" Name=""Economy"" />
                            <p2:Eqmt>B738-189</p2:Eqmt>
                            <p2:EqmtDescription>Boeing 738-189</p2:EqmtDescription>
                            <p2:Seat_Res_Possible>false</p2:Seat_Res_Possible>
                        </p2:Sec>
                        <p2:Ser_Sts>FIX</p2:Ser_Sts>
                        <p2:Ser_Sts>OPTION</p2:Ser_Sts>
                        <p2:Ser_Sts>QUOTE</p2:Ser_Sts>
                        <p2:SubServPaxs>
                            <p2:SubServPax>
                                <p2:Pax_Id>1</p2:Pax_Id>
                                <p2:Pax_Tp>ADULT</p2:Pax_Tp>
                                <p2:Pax_Srv_Prc_Ex CurISO=""GBP"">0.00</p2:Pax_Srv_Prc_Ex>
                            </p2:SubServPax>
                            <p2:SubServPax>
                                <p2:Pax_Id>2</p2:Pax_Id>
                                <p2:Pax_Tp>ADULT</p2:Pax_Tp>
                                <p2:Pax_Srv_Prc_Ex CurISO=""GBP"">0.00</p2:Pax_Srv_Prc_Ex>
                            </p2:SubServPax>
                        </p2:SubServPaxs>
                        <p2:Seat_Res_Possible>false</p2:Seat_Res_Possible>
                        <p2:Check_In Dir=""DEPARTURE"">North Terminal</p2:Check_In>
                    </p2:Route>
                    <p2:Route Rt_Dir=""inbound"">
                        <p2:RouteCd>PMILGW4APMILGW</p2:RouteCd>
                        <p2:Flt_Inv_Id>173127</p2:Flt_Inv_Id>
                        <p2:Rt_InvState>INTERNAL</p2:Rt_InvState>
                        <p2:Dep_Air_Cd>PMI</p2:Dep_Air_Cd>
                        <p2:Arr_Air_Cd>LGW</p2:Arr_Air_Cd>
                        <p2:Flt_Dt_Tm DirType=""DEPARTURE"">
                            <p2:Local>2020-08-13T15:00:00+00:00</p2:Local>
                        </p2:Flt_Dt_Tm>
                        <p2:Flt_Dt_Tm DirType=""ARRIVAL"">
                            <p2:Local>2020-08-13T17:00:00+00:00</p2:Local>
                        </p2:Flt_Dt_Tm>
                        <p2:Duration>7</p2:Duration>
                        <p2:Cycle_Dt>2020-08-13</p2:Cycle_Dt>
                        <p2:JnyDur>02:00</p2:JnyDur>
                        <p2:Prom Code=""AUPK"" Issue=""1"" Name=""Package LP"" />
                        <p2:Car_Cd>EZY</p2:Car_Cd>
                        <p2:Flt_No>792</p2:Flt_No>
                        <p2:Bkg_Cls Code=""Y"" />
                        <p2:Cab_Cls Code=""Y"" Name=""Economy"" />
                        <p2:Flt_Seq_Cd>1</p2:Flt_Seq_Cd>
                        <p2:Sec>
                            <p2:Id>3</p2:Id>
                            <p2:SecId>2</p2:SecId>
                            <p2:Dep_Air_Cd>PMI</p2:Dep_Air_Cd>
                            <p2:Arr_Air_Cd>LGW</p2:Arr_Air_Cd>
                            <p2:Flt_Dt_Tm DirType=""DEPARTURE"">
                                <p2:Local>2020-08-13T15:00:00+00:00</p2:Local>
                            </p2:Flt_Dt_Tm>
                            <p2:Flt_Dt_Tm DirType=""ARRIVAL"">
                                <p2:Local>2020-08-13T17:00:00+00:00</p2:Local>
                            </p2:Flt_Dt_Tm>
                            <p2:JnyDur>02:00</p2:JnyDur>
                            <p2:Car_Cd>EZY</p2:Car_Cd>
                            <p2:Flt_No>792</p2:Flt_No>
                            <p2:Bkg_Cls Code=""Y"" />
                            <p2:Cab_Cls Code=""Y"" Name=""Economy"" />
                            <p2:Eqmt>B738-189</p2:Eqmt>
                            <p2:EqmtDescription>Boeing 738-189</p2:EqmtDescription>
                            <p2:Seat_Res_Possible>false</p2:Seat_Res_Possible>
                        </p2:Sec>
                        <p2:Ser_Sts>FIX</p2:Ser_Sts>
                        <p2:Ser_Sts>OPTION</p2:Ser_Sts>
                        <p2:Ser_Sts>QUOTE</p2:Ser_Sts>
                        <p2:SubServPaxs>
                            <p2:SubServPax>
                                <p2:Pax_Id>1</p2:Pax_Id>
                                <p2:Pax_Tp>ADULT</p2:Pax_Tp>
                                <p2:Pax_Srv_Prc_Ex CurISO=""GBP"">0.00</p2:Pax_Srv_Prc_Ex>
                            </p2:SubServPax>
                            <p2:SubServPax>
                                <p2:Pax_Id>2</p2:Pax_Id>
                                <p2:Pax_Tp>ADULT</p2:Pax_Tp>
                                <p2:Pax_Srv_Prc_Ex CurISO=""GBP"">0.00</p2:Pax_Srv_Prc_Ex>
                            </p2:SubServPax>
                        </p2:SubServPaxs>
                        <p2:Seat_Res_Possible>false</p2:Seat_Res_Possible>
                        <p2:Check_In Dir=""DEPARTURE"">Main Terminal</p2:Check_In>
                    </p2:Route>
                </p2:Routing>
            </p2:Route_List>
        </p2:Package>
        <p2:Item Code=""TFR/SHA"" Name=""Shared Transfer"" Auto_Inc=""false"" Short_Name=""Shared Transfer"">
            <p2:Id>4</p2:Id>
            <p2:St_Dt>2020-08-06</p2:St_Dt>
            <p2:Set_Type>EXTRA</p2:Set_Type>
            <p2:Item_Type Code=""TX"">
                <p2:Item_Type_Desc>
                    <p2:Locale>EN_EN</p2:Locale>
                    <p2:Desc>Transfer</p2:Desc>
                </p2:Item_Type_Desc>
            </p2:Item_Type>
            <p2:Prom Code=""AUCI"" Issue=""1"" Name=""Common Items"" />
            <p2:Bkg_Qty>2</p2:Bkg_Qty>
            <p2:Ser_Sts>FIX</p2:Ser_Sts>
            <p2:Ser_Sts>OPTION</p2:Ser_Sts>
            <p2:Ser_Sts>QUOTE</p2:Ser_Sts>
            <p2:SubServPaxs>
                <p2:SubServPax>
                    <p2:Pax_Id>1</p2:Pax_Id>
                    <p2:Pax_Tp>ADULT</p2:Pax_Tp>
                    <p2:Pax_Srv_Prc_Ex CurISO=""GBP"">0.00</p2:Pax_Srv_Prc_Ex>
                </p2:SubServPax>
                <p2:SubServPax>
                    <p2:Pax_Id>2</p2:Pax_Id>
                    <p2:Pax_Tp>ADULT</p2:Pax_Tp>
                    <p2:Pax_Srv_Prc_Ex CurISO=""GBP"">0.00</p2:Pax_Srv_Prc_Ex>
                </p2:SubServPax>
            </p2:SubServPaxs>
            <p2:Ref_Prd_Id>1</p2:Ref_Prd_Id>
            <p2:Rate_Rule>DAY</p2:Rate_Rule>
            <p2:Item_Method>PP</p2:Item_Method>
            <p2:Atol_Mth>NONE</p2:Atol_Mth>
        </p2:Item>
        <p2:CurISO>GBP</p2:CurISO>
        <p2:Fast_Seller>S</p2:Fast_Seller>
        <p2:Acc_Prc_Zero_Fg>false</p2:Acc_Prc_Zero_Fg>
        <p2:Acc_Cost_Zero_Fg>false</p2:Acc_Cost_Zero_Fg>
        <p2:Atol_Prot_Tp>NONE</p2:Atol_Prot_Tp>
        <p2:Atol_Prot_By>NONE</p2:Atol_Prot_By>
        <p2:Atol_Prot_Issuer>NONE</p2:Atol_Prot_Issuer>
        <p2:Summary_Prices>
            <p2:Summary_Price>
                <p2:Prc_Tp_Cd>ACC</p2:Prc_Tp_Cd>
                <p2:Prc_Tp_Name>Adult Accommodation</p2:Prc_Tp_Name>
                <p2:Qty>2</p2:Qty>
                <p2:Prc>547.00</p2:Prc>
            </p2:Summary_Price>
        </p2:Summary_Prices>
    </p2:Bkg_Ent>
    <p2:Agt_No>WAGBP</p2:Agt_No>
    <p2:PayData>
        <p2:Dpt Type=""LOW"">
            <p2:CurISO>GBP</p2:CurISO>
            <p2:Amt>120.00</p2:Amt>
            <p2:Dep_Dt>2019-09-17</p2:Dep_Dt>
        </p2:Dpt>
        <p2:Bkg_Prc_Ex>
            <p2:CurISO>GBP</p2:CurISO>
            <p2:Amt>1094.00</p2:Amt>
        </p2:Bkg_Prc_Ex>
        <p2:Bkg_Prc_Inc>
            <p2:CurISO>GBP</p2:CurISO>
            <p2:Amt>1094.00</p2:Amt>
            <p2:Bal_Due_Amt>1094.00</p2:Bal_Due_Amt>
            <p2:Bal_Due_Dt>2020-06-07</p2:Bal_Due_Dt>
        </p2:Bkg_Prc_Inc>
        <p2:Tot_Amt>1094.00</p2:Tot_Amt>
        <p2:Agt_Com>0.00</p2:Agt_Com>
        <p2:Comm_Inc_VAT>0.00</p2:Comm_Inc_VAT>
        <p2:VAT>0.00</p2:VAT>
        <p2:Payment_Received>0.00</p2:Payment_Received>
        <p2:TO_Comm_Amt>0.00</p2:TO_Comm_Amt>
        <p2:TO_Comm_Amt_Calc>0.00</p2:TO_Comm_Amt_Calc>
    </p2:PayData>
    <p2:Pax Index=""1"">
        <p2:Person>
            <p2:FirstName>John</p2:FirstName>
            <p2:LastName>Doe</p2:LastName>
            <p2:Title>Mr</p2:Title>
            <p2:Sex>SEX_MALE</p2:Sex>
            <p2:PersonType>TYPE_NATURAL</p2:PersonType>
        </p2:Person>
        <p2:Pax_Tp>ADULT</p2:Pax_Tp>
        <p2:Lead_Pax>true</p2:Lead_Pax>
    </p2:Pax>
    <p2:Pax Index=""2"">
        <p2:Person>
            <p2:FirstName>Jane</p2:FirstName>
            <p2:LastName>Doe</p2:LastName>
            <p2:Title>Mr</p2:Title>
            <p2:Sex>SEX_FEMALE</p2:Sex>
            <p2:PersonType>TYPE_NATURAL</p2:PersonType>
        </p2:Person>
        <p2:Pax_Tp>ADULT</p2:Pax_Tp>
    </p2:Pax>
    <p2:DD_Marketing_Sts>V0</p2:DD_Marketing_Sts>
    <p2:DD_Mandate Apply_Sts=""DISA""></p2:DD_Mandate>
    <p2:Prom Code=""EZBO"" Issue=""1"" Name=""Beach - Other"" Prom_Group_Code=""EJH"" />
    <p2:Incident_Sts>NA</p2:Incident_Sts>
    <p2:Insurance_Method>INT</p2:Insurance_Method>
    <p2:Retail_Bkg_Id>-1</p2:Retail_Bkg_Id>
    <p2:PayTypes>
        <p2:PayType Cd=""VI"" Name=""Visa Credit Card"" />
        <p2:PayType Cd=""VD"" Name=""Visa Debit Card"" />
        <p2:PayType Cd=""AX"" Name=""American Express Card"" />
        <p2:PayType Cd=""CA"" Name=""Cash"" />
        <p2:PayType Cd=""BT"" Name=""Bank Transfer"" />
        <p2:PayType Cd=""VO"" Name=""Voucher"" />
        <p2:PayType Cd=""MC"" Name=""Mastercard Credit Card"" />
        <p2:PayType Cd=""MD"" Name=""Mastercard Debit Card"" />
        <p2:PayType Cd=""SW"" Name=""Maestro/Switch"" />
        <p2:PayType Cd=""PP"" Name=""Paypal"" />
        <p2:PayType Cd=""FINP"" Name=""Finance Payment"" />
    </p2:PayTypes>
    <p2:Bkg_Type_Mth>TO</p2:Bkg_Type_Mth>
</p1:InfoBookingResponse>")));

            #endregion

            #region BookingRequest mock

            atcomApiClient
                .Setup(x => x.MakeCall(It.IsAny<HttpMethod>(), It.Is<Uri>(u => u.AbsoluteUri.Contains("/EZYDMO/VRPWebservice/AniteGateway/AniteGateway.aspx")), It.Is<string>(p => p.Contains("p2:BookingRequest")), It.IsAny<string>(), It.IsAny<TimeSpan?>()))
                .ReturnsAsync(new MemoryStream(Encoding.UTF8.GetBytes(@"<p1:BookingResponse xmlns:p1=""AtComRes/BookingResponse"" xmlns:p2=""AtComRes/Common"" xmlns:xsi=""http://www.w3.org/2001/XMLSchema-instance"" xsi:schemaLocation=""AtComRes/BookingResponse ../api/BookingResponse/BookingResponse.xsd"">
    <!-- Response returned from: EZYDMO -->
    <p2:Adm Xsd_Ver=""T3.20.4.8"">
        <p2:ReqId>12133</p2:ReqId>
        <p2:Tm>2019-09-18T08:33:51.821+01:00</p2:Tm>
        <p2:Trk From=""atcomres"" To=""easyjet"" />
    </p2:Adm>
    <p2:CltInfo>
        <p2:Locale>en_EN</p2:Locale>
        <p2:CltSysContext>3</p2:CltSysContext>
        <p2:Agt_No>WAGBP</p2:Agt_No>
        <p2:TermCode>ABCD</p2:TermCode>
        <p2:User_Name>anite</p2:User_Name>
        <p2:Chan>inhouse</p2:Chan>
        <p2:Channel_Type>VRP</p2:Channel_Type>
        <p2:User_Role>INTERNAL</p2:User_Role>
    </p2:CltInfo>
    <p2:BkgNum>
        <p2:BkgId>9013</p2:BkgId>
        <p2:CurrentVersion>1</p2:CurrentVersion>
        <p2:AtcomresBkgVersion>21448</p2:AtcomresBkgVersion>
    </p2:BkgNum>
    <p2:BkgSts>BOOKING</p2:BkgSts>
    <p2:ResSts>CONFIRMED</p2:ResSts>
    <p2:HasAgt_Notice>false</p2:HasAgt_Notice>
    <p2:StsExpDate>2019-09-18T08:48:50.000+01:00</p2:StsExpDate>
    <p2:His>
        <p2:Bkg_Dt_Tm>2019-09-18T08:33:22.000+01:00</p2:Bkg_Dt_Tm>
        <p2:Bkg_User>EZYVRP</p2:Bkg_User>
        <p2:Bkg_Term_Code>ABCD</p2:Bkg_Term_Code>
        <p2:Bkg_Chan>inhouse</p2:Bkg_Chan>
    </p2:His>
    <p2:Bkg_Ent>
        <p2:Package>
            <p2:Accom>
                <p2:Id>1</p2:Id>
                <p2:St_Dt>2020-08-06</p2:St_Dt>
                <p2:End_Dt>2020-08-13</p2:End_Dt>
                <p2:HtlPrd>
                    <p2:Name>Majorca Atcore Test Accom</p2:Name>
                    <p2:Prom Code=""EZBO"" Issue=""1"" Name=""Beach - Other"" />
                    <p2:Acc_Cd Accom_Id=""17019/2"">ESMJ0001</p2:Acc_Cd>
                    <p2:Acc_InvState>INTERNAL</p2:Acc_InvState>
                    <p2:Hotel>
                        <p2:Add>
                            <p2:Name>Majorca Atcore Test Accom</p2:Name>
                            <p2:City>Alcudia</p2:City>
                            <p2:Region>Majorca</p2:Region>
                            <p2:CountryISOCode>ES</p2:CountryISOCode>
                        </p2:Add>
                        <p2:Star_Rating>2</p2:Star_Rating>
                        <p2:Loc>
                            <p2:Loc_Cd>ESMJAL</p2:Loc_Cd>
                            <p2:Loc_Tp>CITY</p2:Loc_Tp>
                            <p2:Loc_Name>Alcudia</p2:Loc_Name>
                        </p2:Loc>
                    </p2:Hotel>
                    <p2:Cat_Page>
                        <p2:Catalog Code=""EZBO"" Name=""easyJet Holidays Beach - Other"" />
                        <p2:Cat_Page_No>0</p2:Cat_Page_No>
                        <p2:Prc_Cat_Page_No>0</p2:Prc_Cat_Page_No>
                    </p2:Cat_Page>
                    <p2:Corporate_Cd>123456</p2:Corporate_Cd>
                </p2:HtlPrd>
                <p2:Rm_Cd>
                    <p2:Rm_No>1</p2:Rm_No>
                    <p2:Code>TW01</p2:Code>
                    <p2:Desc>Twin Room</p2:Desc>
                    <p2:Inf_Inc_Occ>true</p2:Inf_Inc_Occ>
                    <p2:Min_Pax>1</p2:Min_Pax>
                    <p2:Max_Pax>2</p2:Max_Pax>
                    <p2:Max_Adu>2</p2:Max_Adu>
                    <p2:Max_Chd>2</p2:Max_Chd>
                    <p2:Max_Inf>0</p2:Max_Inf>
                    <p2:BB_Cd>BB</p2:BB_Cd>
                    <p2:BB_Name>
                        <![CDATA[Bed & Breakfast]]>
                    </p2:BB_Name>
                    <p2:Ser_Sts>FIX</p2:Ser_Sts>
                    <p2:SubServPaxs>
                        <p2:SubServPax>
                            <p2:Pax_Id>1</p2:Pax_Id>
                            <p2:Pax_Tp>ADULT</p2:Pax_Tp>
                            <p2:Pax_Srv_Prc_Ex CurISO=""GBP"">547.00</p2:Pax_Srv_Prc_Ex>
                        </p2:SubServPax>
                        <p2:SubServPax>
                            <p2:Pax_Id>2</p2:Pax_Id>
                            <p2:Pax_Tp>ADULT</p2:Pax_Tp>
                            <p2:Pax_Srv_Prc_Ex CurISO=""GBP"">547.00</p2:Pax_Srv_Prc_Ex>
                        </p2:SubServPax>
                    </p2:SubServPaxs>
                    <p2:Prices>
                        <p2:Price>
                            <p2:Prc_Cd>AA</p2:Prc_Cd>
                            <p2:Prc_Cd_Name>Adult Accommodation</p2:Prc_Cd_Name>
                            <p2:Prc_Cd_Tp>ACC</p2:Prc_Cd_Tp>
                            <p2:Qty>2</p2:Qty>
                            <p2:Prc CurISO=""GBP"">547.00</p2:Prc>
                            <p2:Prc_Dt>2019-09-18T08:33:22.000+01:00</p2:Prc_Dt>
                            <p2:PricePaxs>
                                <p2:Pax_Id>1</p2:Pax_Id>
                                <p2:Pax_Id>2</p2:Pax_Id>
                            </p2:PricePaxs>
                            <p2:Visible>true</p2:Visible>
                            <p2:Prc_Sts>STK</p2:Prc_Sts>
                        </p2:Price>
                    </p2:Prices>
                </p2:Rm_Cd>
                <p2:Ref_Prd_Id>2</p2:Ref_Prd_Id>
                <p2:Free_Car_Rental_Poss>false</p2:Free_Car_Rental_Poss>
                <p2:Atol_Mth>NONE</p2:Atol_Mth>
            </p2:Accom>
            <p2:Route_List>
                <p2:Routing Routing_Type=""OW"">
                    <p2:Routing_Id>2</p2:Routing_Id>
                    <p2:Route Rt_Dir=""outbound"">
                        <p2:RouteCd>PMILGW4ALGWPMI</p2:RouteCd>
                        <p2:Flt_Inv_Id>171480</p2:Flt_Inv_Id>
                        <p2:Rt_InvState>INTERNAL</p2:Rt_InvState>
                        <p2:Dep_Air_Cd>LGW</p2:Dep_Air_Cd>
                        <p2:Arr_Air_Cd>PMI</p2:Arr_Air_Cd>
                        <p2:Flt_Dt_Tm DirType=""DEPARTURE"">
                            <p2:Local>2020-08-06T11:30:00+00:00</p2:Local>
                        </p2:Flt_Dt_Tm>
                        <p2:Flt_Dt_Tm DirType=""ARRIVAL"">
                            <p2:Local>2020-08-06T14:00:00+00:00</p2:Local>
                        </p2:Flt_Dt_Tm>
                        <p2:Duration>7</p2:Duration>
                        <p2:Cycle_Dt>2020-08-06</p2:Cycle_Dt>
                        <p2:JnyDur>02:30</p2:JnyDur>
                        <p2:Prom Code=""AUPK"" Issue=""1"" Name=""Package LP"" />
                        <p2:Car_Cd>EZY</p2:Car_Cd>
                        <p2:Flt_No>791</p2:Flt_No>
                        <p2:Bkg_Cls Code=""Y"" />
                        <p2:Cab_Cls Code=""Y"" Name=""Economy"" />
                        <p2:Flt_Seq_Cd>1</p2:Flt_Seq_Cd>
                        <p2:Sec>
                            <p2:Id>2</p2:Id>
                            <p2:SecId>1</p2:SecId>
                            <p2:Dep_Air_Cd>LGW</p2:Dep_Air_Cd>
                            <p2:Arr_Air_Cd>PMI</p2:Arr_Air_Cd>
                            <p2:Flt_Dt_Tm DirType=""DEPARTURE"">
                                <p2:Local>2020-08-06T11:30:00+00:00</p2:Local>
                            </p2:Flt_Dt_Tm>
                            <p2:Flt_Dt_Tm DirType=""ARRIVAL"">
                                <p2:Local>2020-08-06T14:00:00+00:00</p2:Local>
                            </p2:Flt_Dt_Tm>
                            <p2:JnyDur>02:30</p2:JnyDur>
                            <p2:Car_Cd>EZY</p2:Car_Cd>
                            <p2:Flt_No>791</p2:Flt_No>
                            <p2:Bkg_Cls Code=""Y"" />
                            <p2:Cab_Cls Code=""Y"" Name=""Economy"" />
                            <p2:Eqmt>B738-189</p2:Eqmt>
                            <p2:EqmtDescription>Boeing 738-189</p2:EqmtDescription>
                            <p2:Seat_Res_Possible>false</p2:Seat_Res_Possible>
                        </p2:Sec>
                        <p2:Ser_Sts>FIX</p2:Ser_Sts>
                        <p2:SubServPaxs>
                            <p2:SubServPax>
                                <p2:Pax_Id>1</p2:Pax_Id>
                                <p2:Pax_Tp>ADULT</p2:Pax_Tp>
                                <p2:Pax_Srv_Prc_Ex CurISO=""GBP"">0.00</p2:Pax_Srv_Prc_Ex>
                            </p2:SubServPax>
                            <p2:SubServPax>
                                <p2:Pax_Id>2</p2:Pax_Id>
                                <p2:Pax_Tp>ADULT</p2:Pax_Tp>
                                <p2:Pax_Srv_Prc_Ex CurISO=""GBP"">0.00</p2:Pax_Srv_Prc_Ex>
                            </p2:SubServPax>
                        </p2:SubServPaxs>
                        <p2:Seat_Res_Possible>false</p2:Seat_Res_Possible>
                        <p2:Check_In Dir=""DEPARTURE"">North Terminal</p2:Check_In>
                    </p2:Route>
                    <p2:Route Rt_Dir=""inbound"">
                        <p2:RouteCd>PMILGW4APMILGW</p2:RouteCd>
                        <p2:Flt_Inv_Id>173127</p2:Flt_Inv_Id>
                        <p2:Rt_InvState>INTERNAL</p2:Rt_InvState>
                        <p2:Dep_Air_Cd>PMI</p2:Dep_Air_Cd>
                        <p2:Arr_Air_Cd>LGW</p2:Arr_Air_Cd>
                        <p2:Flt_Dt_Tm DirType=""DEPARTURE"">
                            <p2:Local>2020-08-13T15:00:00+00:00</p2:Local>
                        </p2:Flt_Dt_Tm>
                        <p2:Flt_Dt_Tm DirType=""ARRIVAL"">
                            <p2:Local>2020-08-13T17:00:00+00:00</p2:Local>
                        </p2:Flt_Dt_Tm>
                        <p2:Duration>7</p2:Duration>
                        <p2:Cycle_Dt>2020-08-13</p2:Cycle_Dt>
                        <p2:JnyDur>02:00</p2:JnyDur>
                        <p2:Prom Code=""AUPK"" Issue=""1"" Name=""Package LP"" />
                        <p2:Car_Cd>EZY</p2:Car_Cd>
                        <p2:Flt_No>792</p2:Flt_No>
                        <p2:Bkg_Cls Code=""Y"" />
                        <p2:Cab_Cls Code=""Y"" Name=""Economy"" />
                        <p2:Flt_Seq_Cd>1</p2:Flt_Seq_Cd>
                        <p2:Sec>
                            <p2:Id>3</p2:Id>
                            <p2:SecId>2</p2:SecId>
                            <p2:Dep_Air_Cd>PMI</p2:Dep_Air_Cd>
                            <p2:Arr_Air_Cd>LGW</p2:Arr_Air_Cd>
                            <p2:Flt_Dt_Tm DirType=""DEPARTURE"">
                                <p2:Local>2020-08-13T15:00:00+00:00</p2:Local>
                            </p2:Flt_Dt_Tm>
                            <p2:Flt_Dt_Tm DirType=""ARRIVAL"">
                                <p2:Local>2020-08-13T17:00:00+00:00</p2:Local>
                            </p2:Flt_Dt_Tm>
                            <p2:JnyDur>02:00</p2:JnyDur>
                            <p2:Car_Cd>EZY</p2:Car_Cd>
                            <p2:Flt_No>792</p2:Flt_No>
                            <p2:Bkg_Cls Code=""Y"" />
                            <p2:Cab_Cls Code=""Y"" Name=""Economy"" />
                            <p2:Eqmt>B738-189</p2:Eqmt>
                            <p2:EqmtDescription>Boeing 738-189</p2:EqmtDescription>
                            <p2:Seat_Res_Possible>false</p2:Seat_Res_Possible>
                        </p2:Sec>
                        <p2:Ser_Sts>FIX</p2:Ser_Sts>
                        <p2:SubServPaxs>
                            <p2:SubServPax>
                                <p2:Pax_Id>1</p2:Pax_Id>
                                <p2:Pax_Tp>ADULT</p2:Pax_Tp>
                                <p2:Pax_Srv_Prc_Ex CurISO=""GBP"">0.00</p2:Pax_Srv_Prc_Ex>
                            </p2:SubServPax>
                            <p2:SubServPax>
                                <p2:Pax_Id>2</p2:Pax_Id>
                                <p2:Pax_Tp>ADULT</p2:Pax_Tp>
                                <p2:Pax_Srv_Prc_Ex CurISO=""GBP"">0.00</p2:Pax_Srv_Prc_Ex>
                            </p2:SubServPax>
                        </p2:SubServPaxs>
                        <p2:Seat_Res_Possible>false</p2:Seat_Res_Possible>
                        <p2:Check_In Dir=""DEPARTURE"">Main Terminal</p2:Check_In>
                    </p2:Route>
                </p2:Routing>
            </p2:Route_List>
        </p2:Package>
        <p2:Item Code=""TFR/SHA"" Name=""Shared Transfer"" Auto_Inc=""false"" Short_Name=""Shared Transfer"">
            <p2:Id>4</p2:Id>
            <p2:St_Dt>2020-08-06</p2:St_Dt>
            <p2:Set_Type>EXTRA</p2:Set_Type>
            <p2:Item_Type Code=""TX"">
                <p2:Item_Type_Desc>
                    <p2:Locale>EN_EN</p2:Locale>
                    <p2:Desc>Transfer</p2:Desc>
                </p2:Item_Type_Desc>
            </p2:Item_Type>
            <p2:Prom Code=""AUCI"" Issue=""1"" Name=""Common Items"" />
            <p2:Bkg_Qty>2</p2:Bkg_Qty>
            <p2:Ser_Sts>FIX</p2:Ser_Sts>
            <p2:SubServPaxs>
                <p2:SubServPax>
                    <p2:Pax_Id>1</p2:Pax_Id>
                    <p2:Pax_Tp>ADULT</p2:Pax_Tp>
                    <p2:Pax_Srv_Prc_Ex CurISO=""GBP"">0.00</p2:Pax_Srv_Prc_Ex>
                </p2:SubServPax>
                <p2:SubServPax>
                    <p2:Pax_Id>2</p2:Pax_Id>
                    <p2:Pax_Tp>ADULT</p2:Pax_Tp>
                    <p2:Pax_Srv_Prc_Ex CurISO=""GBP"">0.00</p2:Pax_Srv_Prc_Ex>
                </p2:SubServPax>
            </p2:SubServPaxs>
            <p2:Ref_Prd_Id>1</p2:Ref_Prd_Id>
            <p2:Rate_Rule>DAY</p2:Rate_Rule>
            <p2:Item_Method>PP</p2:Item_Method>
            <p2:Atol_Mth>NONE</p2:Atol_Mth>
        </p2:Item>
        <p2:CurISO>GBP</p2:CurISO>
        <p2:Fast_Seller>S</p2:Fast_Seller>
        <p2:Acc_Prc_Zero_Fg>false</p2:Acc_Prc_Zero_Fg>
        <p2:Acc_Cost_Zero_Fg>false</p2:Acc_Cost_Zero_Fg>
        <p2:Atol_Prot_Tp>NONE</p2:Atol_Prot_Tp>
        <p2:Atol_Prot_By>NONE</p2:Atol_Prot_By>
        <p2:Atol_Prot_Issuer>NONE</p2:Atol_Prot_Issuer>
        <p2:Summary_Prices>
            <p2:Summary_Price>
                <p2:Prc_Tp_Cd>ACC</p2:Prc_Tp_Cd>
                <p2:Prc_Tp_Name>Adult Accommodation</p2:Prc_Tp_Name>
                <p2:Qty>2</p2:Qty>
                <p2:Prc>547.00</p2:Prc>
            </p2:Summary_Price>
        </p2:Summary_Prices>
    </p2:Bkg_Ent>
    <p2:Agt_No>WAGBP</p2:Agt_No>
    <p2:CusDet>
        <p2:Person>
            <p2:Add>
                <p2:Street>353 Bugkingham Avenue</p2:Street>
                <p2:ZipCode>SL1 4PF</p2:ZipCode>
                <p2:City>Slough</p2:City>
                <p2:CountryISOCode>UK</p2:CountryISOCode>
            </p2:Add>
            <p2:Comm>
                <p2:CommType>TYPE_PHONE</p2:CommType>
                <p2:Sphere>SPHERE_PRIVATE</p2:Sphere>
                <p2:AreaCode></p2:AreaCode>
                <p2:Num>+44 1111 222222</p2:Num>
            </p2:Comm>
            <p2:Comm>
                <p2:CommType>TYPE_MOBILE</p2:CommType>
                <p2:Sphere>SPHERE_PRIVATE</p2:Sphere>
                <p2:AreaCode></p2:AreaCode>
                <p2:Num>+44 3333 444444</p2:Num>
            </p2:Comm>
            <p2:Comm>
                <p2:CommType>TYPE_PHONE</p2:CommType>
                <p2:Sphere>SPHERE_BUSINESS</p2:Sphere>
                <p2:AreaCode></p2:AreaCode>
                <p2:Num>+44 1753 804000</p2:Num>
            </p2:Comm>
            <p2:Email>
                <p2:Address>home@home.com</p2:Address>
                <p2:Sphere>SPHERE_PRIVATE</p2:Sphere>
            </p2:Email>
            <p2:Email>
                <p2:Address>work@work.com</p2:Address>
                <p2:Sphere>SPHERE_BUSINESS</p2:Sphere>
            </p2:Email>
        </p2:Person>
    </p2:CusDet>
    <p2:TrvDox>
        <p2:DocumentReceiver>BOTH</p2:DocumentReceiver>
        <p2:DoxLang>en_EN</p2:DoxLang>
        <p2:ConfPrt>false</p2:ConfPrt>
        <p2:Travel_Dox_Stop>false</p2:Travel_Dox_Stop>
        <p2:Conf_Stop>false</p2:Conf_Stop>
        <p2:Travel_Dox_No_Price>false</p2:Travel_Dox_No_Price>
        <p2:Travel_Dox_Per_Person>false</p2:Travel_Dox_Per_Person>
        <p2:Print_Voucher_Immed>false</p2:Print_Voucher_Immed>
        <p2:EDox_Generation>false</p2:EDox_Generation>
    </p2:TrvDox>
    <p2:PayData>
        <p2:Dpt Type=""LOW"">
            <p2:CurISO>GBP</p2:CurISO>
            <p2:Amt>120.00</p2:Amt>
            <p2:Dep_Dt>2019-09-18</p2:Dep_Dt>
        </p2:Dpt>
        <p2:Bkg_Prc_Ex>
            <p2:CurISO>GBP</p2:CurISO>
            <p2:Amt>1094.00</p2:Amt>
        </p2:Bkg_Prc_Ex>
        <p2:Bkg_Prc_Inc>
            <p2:CurISO>GBP</p2:CurISO>
            <p2:Amt>1094.00</p2:Amt>
            <p2:Bal_Due_Amt>1094.00</p2:Bal_Due_Amt>
            <p2:Bal_Due_Dt>2020-06-07</p2:Bal_Due_Dt>
        </p2:Bkg_Prc_Inc>
        <p2:Tot_Amt>1094.00</p2:Tot_Amt>
        <p2:Agt_Com>0.00</p2:Agt_Com>
        <p2:Comm_Inc_VAT>0.00</p2:Comm_Inc_VAT>
        <p2:VAT>0.00</p2:VAT>
        <p2:Payment_Received>0.00</p2:Payment_Received>
        <p2:TO_Comm_Amt>0.00</p2:TO_Comm_Amt>
        <p2:TO_Comm_Amt_Calc>0.00</p2:TO_Comm_Amt_Calc>
    </p2:PayData>
    <p2:Pax Index=""1"">
        <p2:Person>
            <p2:FirstName>John</p2:FirstName>
            <p2:LastName>Doe</p2:LastName>
            <p2:Title>Mr</p2:Title>
            <p2:Sex>SEX_MALE</p2:Sex>
            <p2:PersonType>TYPE_NATURAL</p2:PersonType>
        </p2:Person>
        <p2:Pax_Tp>ADULT</p2:Pax_Tp>
        <p2:Lead_Pax>true</p2:Lead_Pax>
    </p2:Pax>
    <p2:Pax Index=""2"">
        <p2:Person>
            <p2:FirstName>Jane</p2:FirstName>
            <p2:LastName>Doe</p2:LastName>
            <p2:Title>Mr</p2:Title>
            <p2:Sex>SEX_FEMALE</p2:Sex>
            <p2:PersonType>TYPE_NATURAL</p2:PersonType>
        </p2:Person>
        <p2:Pax_Tp>ADULT</p2:Pax_Tp>
    </p2:Pax>
    <p2:DD_Marketing_Sts>V0</p2:DD_Marketing_Sts>
    <p2:Prom Code=""EZBO"" Issue=""1"" Name=""Beach - Other"" Prom_Group_Code=""EJH"" />
    <p2:Incident_Sts>NA</p2:Incident_Sts>
    <p2:Insurance_Method>INT</p2:Insurance_Method>
    <p2:PayGateway_Url>http://pg-dev-01/QA/EZY/Inhouse/anitexmlgateway.aspx?CCMESSAGE=PFJlcXVlc3Q%2bPENvbnRyb2w%2bPENvbmZpZz5URVNUPC9Db25maWc%2bPFNvdXJjZT5JTkg8L1NvdXJjZT48Q29tcGFueT5FWlk8L0NvbXBhbnk%2bPEFkZHJlc3M%2bMjA0MjwvQWRkcmVzcz48U3ViQWRkcmVzcz4xPC9TdWJBZGRyZXNzPjwvQ29udHJvbD48VHJhbnNhY3Rpb24%2bPFR5cGU%2bR2V0VG9rZW48L1R5cGU%2bPElkPjE4OTgwOTwvSWQ%2bPFBheW1lbnRUcmFuc2FjdGlvblJlZmVyZW5jZT5OZ2NHQ0RrdUJIR0FLR3o0SjZaVUlXUGxCbDlNVVNwUmNISnk5VlBEZEFuSExyeHpIcFZmczNtdFVJc0djWVFsZ3BLa1RHMG5HWUdEb3o4YUJ0VGxEWkxvbz08L1BheW1lbnRUcmFuc2FjdGlvblJlZmVyZW5jZT48U2FmZUlkPjwvU2FmZUlkPjxDdXJyZW5jeUNvZGU%2bR0JQPC9DdXJyZW5jeUNvZGU%2bPERhdGVUaW1lIC8%2bPC9UcmFuc2FjdGlvbj48L1JlcXVlc3Q%2b</p2:PayGateway_Url>
    <p2:Retail_Bkg_Id>-1</p2:Retail_Bkg_Id>
    <p2:Bkg_Type_Mth>TO</p2:Bkg_Type_Mth>
</p1:BookingResponse>")));

            #endregion

            #region CommitBooking mock

            atcomApiClient
                .Setup(x => x.MakeCall(It.IsAny<HttpMethod>(), It.Is<Uri>(u => u.AbsoluteUri.Contains("/EZYDMO/VRPWebservice/AniteGateway/AniteGateway.aspx")), It.Is<string>(p => p.Contains("p2:ModifyCustPaymentRequest")), It.IsAny<string>(), It.IsAny<TimeSpan?>()))
                .ReturnsAsync(new MemoryStream(Encoding.UTF8.GetBytes(@"<p2:ModifyCustPaymentResponse xmlns:p1=""AtComRes/Common"" xmlns:p2=""AtComRes/ModifyCustPaymentResponse""><!-- Response returned from: EZYDMO --><p1:Adm Xsd_Ver=""T3.20.4.8""><p1:SessId>4927eafa-7b8b-4916-8eab-2dd3264f1c78@0</p1:SessId><p1:ReqId>1efd9cc1-774e-41bf-a3cc-1cdd0f0c4e26</p1:ReqId><p1:Tm>2019-09-20T13:54:12.221+01:00</p1:Tm><p1:Trk From=""atcomres"" To=""easyjet"" /></p1:Adm><p1:CltInfo><p1:Locale>en_EN</p1:Locale><p1:CltSysContext>3</p1:CltSysContext><p1:Agt_No>WAGBP</p1:Agt_No><p1:TermCode>ABCD</p1:TermCode><p1:User_Name>EZYVRP</p1:User_Name><p1:Chan>inhouse</p1:Chan><p1:Channel_Type>VRP</p1:Channel_Type><p1:User_Role>INTERNAL</p1:User_Role></p1:CltInfo><p1:BkgNum><p1:BkgId>9484</p1:BkgId><p1:CurrentVersion>1</p1:CurrentVersion></p1:BkgNum><p1:BkgSts>BOOKING</p1:BkgSts><p1:His><p1:Bkg_Dt_Tm>2019-09-20T13:53:12.000+01:00</p1:Bkg_Dt_Tm><p1:Bkg_User>EZYVRP</p1:Bkg_User><p1:Bkg_Term_Code>ABCD</p1:Bkg_Term_Code><p1:Bkg_Chan>inhouse</p1:Bkg_Chan><p1:Amd_Dt_Tm>2019-09-20T13:54:11.000+01:00</p1:Amd_Dt_Tm><p1:Amd_User>EZYVRP</p1:Amd_User><p1:Amd_Term_Code>ABCD</p1:Amd_Term_Code><p1:Amd_Chan>inhouse</p1:Amd_Chan></p1:His><p1:PayData><p1:Pay><p1:CCPay CCType=""CREDIT"" Card_Issuer=""AX"" Card_Cd=""AX"" Card_Desc=""American Express Card""><p1:CNum>464646******4644</p1:CNum><p1:ExpDate>10/20</p1:ExpDate><p1:PayAmt>718.00</p1:PayAmt><p1:Is_Loyalty_Card>false</p1:Is_Loyalty_Card></p1:CCPay><p1:Pay_Seq>1</p1:Pay_Seq><p1:Amt>718.00</p1:Amt><p1:Exch_Rate>1.00</p1:Exch_Rate><p1:CurISO>GBP</p1:CurISO><p1:TransNo>189985</p1:TransNo><p1:PayDtTm>2019-09-20T13:54:11.000+01:00</p1:PayDtTm><p1:Pay_Group Code=""CREDIT"" Name=""Credit card"" /><p1:AuthSys>AniteCCA</p1:AuthSys><p1:Pay_Type_Code>AX</p1:Pay_Type_Code><p1:Pay_Method Code=""AX"" Name=""American Express Card"" /><p1:Settle_Method>N</p1:Settle_Method><p1:Recon_Type>CARD</p1:Recon_Type><p1:Recon_Method>MAN</p1:Recon_Method><p1:Payment_User Code=""EZYVRP"" Name=""EasyJet VRP USER"" /><p1:Pay_Id>1086278</p1:Pay_Id><p1:Bal_Refund_Amt>718.00</p1:Bal_Refund_Amt></p1:Pay></p1:PayData></p2:ModifyCustPaymentResponse>")));

            #endregion

            #region DispalyBooking mock

            atcomApiClient
                .Setup(x => x.MakeCall(It.IsAny<HttpMethod>(), It.Is<Uri>(u => u.AbsoluteUri.Contains("/EZYDMO/VRPWebservice/AniteGateway/AniteGateway.aspx")), It.Is<string>(p => p.Contains("p2:DisplayRequest ")), It.IsAny<string>(), It.IsAny<TimeSpan?>()))
                .ReturnsAsync(new MemoryStream(Encoding.UTF8.GetBytes(@"<p2:DisplayResponse xmlns:p1=""AtComRes/Common"" xmlns:p2=""AtComRes/DisplayResponse""><!-- Response returned from: EZYDMO --><p1:Adm Xsd_Ver=""T3.20.4.8""><p1:Tm>2019-09-20T13:54:38.418+01:00</p1:Tm><p1:Trk From=""atcomres"" To=""easyjet"" /></p1:Adm><p1:CltInfo><p1:Locale>en_EN</p1:Locale><p1:CltSysContext>3</p1:CltSysContext><p1:Agt_No>WAGBP</p1:Agt_No><p1:TermCode>ABCD</p1:TermCode><p1:User_Name>EZYVRP</p1:User_Name><p1:Chan>inhouse</p1:Chan><p1:Channel_Type>VRP</p1:Channel_Type><p1:User_Role>INTERNAL</p1:User_Role></p1:CltInfo><p1:BkgNum><p1:BkgId>9484</p1:BkgId><p1:CurrentVersion>1</p1:CurrentVersion><p1:AtcomresBkgVersion>22377</p1:AtcomresBkgVersion></p1:BkgNum><p1:BkgSts>BOOKING</p1:BkgSts><p1:ResSts>CONFIRMED</p1:ResSts><p1:HasAgt_Notice>false</p1:HasAgt_Notice><p1:His><p1:Bkg_Dt_Tm>2019-09-20T13:53:12.000+01:00</p1:Bkg_Dt_Tm><p1:Bkg_User>EZYVRP</p1:Bkg_User><p1:Bkg_Term_Code>ABCD</p1:Bkg_Term_Code><p1:Bkg_Chan>inhouse</p1:Bkg_Chan><p1:Amd_Dt_Tm>2019-09-20T13:54:11.000+01:00</p1:Amd_Dt_Tm><p1:Amd_User>EZYVRP</p1:Amd_User><p1:Amd_Term_Code>ABCD</p1:Amd_Term_Code><p1:Amd_Chan>inhouse</p1:Amd_Chan></p1:His><p1:Bkg_Ent><p1:Package><p1:Accom><p1:Id>1</p1:Id><p1:St_Dt>2019-10-17</p1:St_Dt><p1:End_Dt>2019-10-24</p1:End_Dt><p1:HtlPrd><p1:Name>Hilton Palma Nova</p1:Name><p1:Prom Code=""EZBO"" Issue=""1"" Name=""Beach - Other"" /><p1:Acc_Cd Accom_Id=""47460/2"">ESMJ0002</p1:Acc_Cd><p1:Acc_InvState>INTERNAL</p1:Acc_InvState><p1:Hotel><p1:Add><p1:Name>Hilton Palma Nova</p1:Name><p1:Street>Address 1</p1:Street><p1:City>Palma Nova</p1:City><p1:Region>Majorca</p1:Region><p1:CountryISOCode>ES</p1:CountryISOCode></p1:Add><p1:Star_Rating>5</p1:Star_Rating><p1:Loc><p1:Loc_Cd>ESMJPV</p1:Loc_Cd><p1:Loc_Tp>CITY</p1:Loc_Tp><p1:Loc_Name>Palma Nova</p1:Loc_Name></p1:Loc></p1:Hotel><p1:Cat_Page><p1:Catalog Code=""EZBO"" Name=""easyJet Holidays Beach - Other"" /><p1:Cat_Page_No>0</p1:Cat_Page_No><p1:Prc_Cat_Page_No>0</p1:Prc_Cat_Page_No></p1:Cat_Page><p1:Corporate_Cd>345678</p1:Corporate_Cd></p1:HtlPrd><p1:Rm_Cd><p1:Rm_No>1</p1:Rm_No><p1:Code>1BA01</p1:Code><p1:Desc>1 Bedroom Apartment</p1:Desc><p1:Fac_List>Private Pool, Swim Up, Limited Mountain View</p1:Fac_List><p1:Facility_List><p1:Facility Code=""PP"" Name=""Private Pool"" /><p1:Facility Code=""SU"" Name=""Swim Up"" /><p1:Facility Code=""LMV"" Name=""Limited Mountain View"" /></p1:Facility_List><p1:Inf_Inc_Occ>false</p1:Inf_Inc_Occ><p1:Min_Pax>1</p1:Min_Pax><p1:Max_Pax>2</p1:Max_Pax><p1:Max_Adu>2</p1:Max_Adu><p1:Max_Chd>1</p1:Max_Chd><p1:Max_Inf>0</p1:Max_Inf><p1:BB_Cd>BB</p1:BB_Cd><p1:BB_Name><![CDATA[Bed & Breakfast]]></p1:BB_Name><p1:Alt_BB_Cd>FB</p1:Alt_BB_Cd><p1:Ser_Sts>FIX</p1:Ser_Sts><p1:SubServPaxs><p1:SubServPax><p1:Pax_Id>1</p1:Pax_Id><p1:Pax_Tp>ADULT</p1:Pax_Tp><p1:Pax_Srv_Prc_Ex CurISO=""GBP"">359.00</p1:Pax_Srv_Prc_Ex></p1:SubServPax><p1:SubServPax><p1:Pax_Id>2</p1:Pax_Id><p1:Pax_Tp>ADULT</p1:Pax_Tp><p1:Pax_Srv_Prc_Ex CurISO=""GBP"">359.00</p1:Pax_Srv_Prc_Ex></p1:SubServPax></p1:SubServPaxs><p1:Prices><p1:Price><p1:Prc_Cd>AA</p1:Prc_Cd><p1:Prc_Cd_Name>Adult Accommodation</p1:Prc_Cd_Name><p1:Prc_Cd_Tp>ACC</p1:Prc_Cd_Tp><p1:Qty>2</p1:Qty><p1:Prc CurISO=""GBP"">359.00</p1:Prc><p1:Prc_Dt>2019-09-20T13:53:12.000+01:00</p1:Prc_Dt><p1:PricePaxs><p1:Pax_Id>1</p1:Pax_Id><p1:Pax_Id>2</p1:Pax_Id></p1:PricePaxs><p1:Visible>true</p1:Visible><p1:Prc_Sts>STK</p1:Prc_Sts></p1:Price></p1:Prices></p1:Rm_Cd><p1:Ref_Prd_Id>2</p1:Ref_Prd_Id><p1:Free_Car_Rental_Poss>false</p1:Free_Car_Rental_Poss><p1:Atol_Mth>NONE</p1:Atol_Mth></p1:Accom><p1:Route_List><p1:Routing Routing_Type=""OW""><p1:Routing_Id>2</p1:Routing_Id><p1:Route Rt_Dir=""outbound""><p1:RouteCd>PMILGW4ALGWPMI</p1:RouteCd><p1:Flt_Inv_Id>170598</p1:Flt_Inv_Id><p1:Rt_InvState>INTERNAL</p1:Rt_InvState><p1:Dep_Air_Cd>LGW</p1:Dep_Air_Cd><p1:Arr_Air_Cd>PMI</p1:Arr_Air_Cd><p1:Flt_Dt_Tm DirType=""DEPARTURE""><p1:Local>2019-10-17T11:30:00+00:00</p1:Local></p1:Flt_Dt_Tm><p1:Flt_Dt_Tm DirType=""ARRIVAL""><p1:Local>2019-10-17T14:00:00+00:00</p1:Local></p1:Flt_Dt_Tm><p1:Duration>7</p1:Duration><p1:Cycle_Dt>2019-10-17</p1:Cycle_Dt><p1:JnyDur>02:30</p1:JnyDur><p1:Prom Code=""AUPK"" Issue=""1"" Name=""Package LP"" /><p1:Car_Cd>EZY</p1:Car_Cd><p1:Flt_No>791</p1:Flt_No><p1:Bkg_Cls Code=""Y"" /><p1:Cab_Cls Code=""Y"" Name=""Economy"" /><p1:Flt_Seq_Cd>1</p1:Flt_Seq_Cd><p1:Sec><p1:Id>2</p1:Id><p1:SecId>1</p1:SecId><p1:Dep_Air_Cd>LGW</p1:Dep_Air_Cd><p1:Arr_Air_Cd>PMI</p1:Arr_Air_Cd><p1:Flt_Dt_Tm DirType=""DEPARTURE""><p1:Local>2019-10-17T11:30:00+00:00</p1:Local></p1:Flt_Dt_Tm><p1:Flt_Dt_Tm DirType=""ARRIVAL""><p1:Local>2019-10-17T14:00:00+00:00</p1:Local></p1:Flt_Dt_Tm><p1:JnyDur>02:30</p1:JnyDur><p1:Car_Cd>EZY</p1:Car_Cd><p1:Flt_No>791</p1:Flt_No><p1:Bkg_Cls Code=""Y"" /><p1:Cab_Cls Code=""Y"" Name=""Economy"" /><p1:Eqmt>B738-189</p1:Eqmt><p1:EqmtDescription>Boeing 738-189</p1:EqmtDescription><p1:Seat_Res_Possible>false</p1:Seat_Res_Possible></p1:Sec><p1:Ser_Sts>FIX</p1:Ser_Sts><p1:SubServPaxs><p1:SubServPax><p1:Pax_Id>1</p1:Pax_Id><p1:Pax_Tp>ADULT</p1:Pax_Tp><p1:Pax_Srv_Prc_Ex CurISO=""GBP"">0.00</p1:Pax_Srv_Prc_Ex></p1:SubServPax><p1:SubServPax><p1:Pax_Id>2</p1:Pax_Id><p1:Pax_Tp>ADULT</p1:Pax_Tp><p1:Pax_Srv_Prc_Ex CurISO=""GBP"">0.00</p1:Pax_Srv_Prc_Ex></p1:SubServPax></p1:SubServPaxs><p1:Seat_Res_Possible>false</p1:Seat_Res_Possible><p1:Check_In Dir=""DEPARTURE"">North Terminal</p1:Check_In></p1:Route><p1:Route Rt_Dir=""inbound""><p1:RouteCd>PMILGW4APMILGW</p1:RouteCd><p1:Flt_Inv_Id>172245</p1:Flt_Inv_Id><p1:Rt_InvState>INTERNAL</p1:Rt_InvState><p1:Dep_Air_Cd>PMI</p1:Dep_Air_Cd><p1:Arr_Air_Cd>LGW</p1:Arr_Air_Cd><p1:Flt_Dt_Tm DirType=""DEPARTURE""><p1:Local>2019-10-24T15:00:00+00:00</p1:Local></p1:Flt_Dt_Tm><p1:Flt_Dt_Tm DirType=""ARRIVAL""><p1:Local>2019-10-24T17:00:00+00:00</p1:Local></p1:Flt_Dt_Tm><p1:Duration>7</p1:Duration><p1:Cycle_Dt>2019-10-24</p1:Cycle_Dt><p1:JnyDur>02:00</p1:JnyDur><p1:Prom Code=""AUPK"" Issue=""1"" Name=""Package LP"" /><p1:Car_Cd>EZY</p1:Car_Cd><p1:Flt_No>792</p1:Flt_No><p1:Bkg_Cls Code=""Y"" /><p1:Cab_Cls Code=""Y"" Name=""Economy"" /><p1:Flt_Seq_Cd>1</p1:Flt_Seq_Cd><p1:Sec><p1:Id>3</p1:Id><p1:SecId>2</p1:SecId><p1:Dep_Air_Cd>PMI</p1:Dep_Air_Cd><p1:Arr_Air_Cd>LGW</p1:Arr_Air_Cd><p1:Flt_Dt_Tm DirType=""DEPARTURE""><p1:Local>2019-10-24T15:00:00+00:00</p1:Local></p1:Flt_Dt_Tm><p1:Flt_Dt_Tm DirType=""ARRIVAL""><p1:Local>2019-10-24T17:00:00+00:00</p1:Local></p1:Flt_Dt_Tm><p1:JnyDur>02:00</p1:JnyDur><p1:Car_Cd>EZY</p1:Car_Cd><p1:Flt_No>792</p1:Flt_No><p1:Bkg_Cls Code=""Y"" /><p1:Cab_Cls Code=""Y"" Name=""Economy"" /><p1:Eqmt>B738-189</p1:Eqmt><p1:EqmtDescription>Boeing 738-189</p1:EqmtDescription><p1:Seat_Res_Possible>false</p1:Seat_Res_Possible></p1:Sec><p1:Ser_Sts>FIX</p1:Ser_Sts><p1:SubServPaxs><p1:SubServPax><p1:Pax_Id>1</p1:Pax_Id><p1:Pax_Tp>ADULT</p1:Pax_Tp><p1:Pax_Srv_Prc_Ex CurISO=""GBP"">0.00</p1:Pax_Srv_Prc_Ex></p1:SubServPax><p1:SubServPax><p1:Pax_Id>2</p1:Pax_Id><p1:Pax_Tp>ADULT</p1:Pax_Tp><p1:Pax_Srv_Prc_Ex CurISO=""GBP"">0.00</p1:Pax_Srv_Prc_Ex></p1:SubServPax></p1:SubServPaxs><p1:Seat_Res_Possible>false</p1:Seat_Res_Possible><p1:Check_In Dir=""DEPARTURE"">Main Terminal</p1:Check_In></p1:Route></p1:Routing></p1:Route_List></p1:Package><p1:Item Code=""TFR/SHA"" Name=""Shared Transfer"" Auto_Inc=""false"" Short_Name=""Shared Transfer""><p1:Id>4</p1:Id><p1:St_Dt>2019-10-17</p1:St_Dt><p1:Set_Type>EXTRA</p1:Set_Type><p1:Item_Type Code=""TX""><p1:Item_Type_Desc><p1:Locale>EN_EN</p1:Locale><p1:Desc>Transfer</p1:Desc></p1:Item_Type_Desc></p1:Item_Type><p1:Prom Code=""AUCI"" Issue=""1"" Name=""Common Items"" /><p1:Bkg_Qty>2</p1:Bkg_Qty><p1:Ser_Sts>FIX</p1:Ser_Sts><p1:SubServPaxs><p1:SubServPax><p1:Pax_Id>1</p1:Pax_Id><p1:Pax_Tp>ADULT</p1:Pax_Tp><p1:Pax_Srv_Prc_Ex CurISO=""GBP"">0.00</p1:Pax_Srv_Prc_Ex></p1:SubServPax><p1:SubServPax><p1:Pax_Id>2</p1:Pax_Id><p1:Pax_Tp>ADULT</p1:Pax_Tp><p1:Pax_Srv_Prc_Ex CurISO=""GBP"">0.00</p1:Pax_Srv_Prc_Ex></p1:SubServPax></p1:SubServPaxs><p1:Ref_Prd_Id>1</p1:Ref_Prd_Id><p1:Rate_Rule>DAY</p1:Rate_Rule><p1:Item_Method>PP</p1:Item_Method><p1:Atol_Mth>NONE</p1:Atol_Mth></p1:Item><p1:Flt_Extra_Cat_List><p1:Flt_Inv_Id>170598</p1:Flt_Inv_Id><p1:Flt_Extra_Cat Code=""BAG"" Name=""Baggage"" Method=""BAG""><p1:Flt_Extra Code=""BAG"" Name=""Baggage""><p1:Class>Y</p1:Class><p1:Baggage><p1:Weight Cd=""23""><p1:Piece Cd=""1"">4</p1:Piece></p1:Weight></p1:Baggage><p1:SubServPaxs><p1:SubServPax><p1:Pax_Id>1</p1:Pax_Id><p1:Pax_Tp>ADULT</p1:Pax_Tp><p1:Pax_Srv_Prc_Ex CurISO=""GBP"">0.00</p1:Pax_Srv_Prc_Ex></p1:SubServPax><p1:SubServPax><p1:Pax_Id>2</p1:Pax_Id><p1:Pax_Tp>ADULT</p1:Pax_Tp><p1:Pax_Srv_Prc_Ex CurISO=""GBP"">0.00</p1:Pax_Srv_Prc_Ex></p1:SubServPax></p1:SubServPaxs><p1:Atol_Mth>NONE</p1:Atol_Mth></p1:Flt_Extra></p1:Flt_Extra_Cat></p1:Flt_Extra_Cat_List><p1:Flt_Extra_Cat_List><p1:Flt_Inv_Id>172245</p1:Flt_Inv_Id><p1:Flt_Extra_Cat Code=""BAG"" Name=""Baggage"" Method=""BAG""><p1:Flt_Extra Code=""BAG"" Name=""Baggage""><p1:Class>Y</p1:Class><p1:Baggage><p1:Weight Cd=""23""><p1:Piece Cd=""1"">4</p1:Piece></p1:Weight></p1:Baggage><p1:SubServPaxs><p1:SubServPax><p1:Pax_Id>1</p1:Pax_Id><p1:Pax_Tp>ADULT</p1:Pax_Tp><p1:Pax_Srv_Prc_Ex CurISO=""GBP"">0.00</p1:Pax_Srv_Prc_Ex></p1:SubServPax><p1:SubServPax><p1:Pax_Id>2</p1:Pax_Id><p1:Pax_Tp>ADULT</p1:Pax_Tp><p1:Pax_Srv_Prc_Ex CurISO=""GBP"">0.00</p1:Pax_Srv_Prc_Ex></p1:SubServPax></p1:SubServPaxs><p1:Atol_Mth>NONE</p1:Atol_Mth></p1:Flt_Extra></p1:Flt_Extra_Cat></p1:Flt_Extra_Cat_List><p1:CurISO>GBP</p1:CurISO><p1:Fast_Seller>S</p1:Fast_Seller><p1:Acc_Prc_Zero_Fg>false</p1:Acc_Prc_Zero_Fg><p1:Acc_Cost_Zero_Fg>false</p1:Acc_Cost_Zero_Fg><p1:Atol_Prot_Tp>NONE</p1:Atol_Prot_Tp><p1:Atol_Prot_By>NONE</p1:Atol_Prot_By><p1:Atol_Prot_Issuer>NONE</p1:Atol_Prot_Issuer><p1:Summary_Prices><p1:Summary_Price><p1:Prc_Tp_Cd>ACC</p1:Prc_Tp_Cd><p1:Prc_Tp_Name>Adult Accommodation</p1:Prc_Tp_Name><p1:Qty>2</p1:Qty><p1:Prc>359.00</p1:Prc></p1:Summary_Price></p1:Summary_Prices></p1:Bkg_Ent><p1:Agt_No>DIRECT</p1:Agt_No><p1:CusDet><p1:Person><p1:Add><p1:Street>1 lea road#</p1:Street><p1:ZipCode>lu13gg</p1:ZipCode><p1:City>luton</p1:City></p1:Add><p1:Comm><p1:CommType>TYPE_PHONE</p1:CommType><p1:Sphere>SPHERE_PRIVATE</p1:Sphere><p1:AreaCode></p1:AreaCode><p1:Num>89754</p1:Num></p1:Comm><p1:Email><p1:Address>ant@on.com</p1:Address><p1:Sphere>SPHERE_PRIVATE</p1:Sphere></p1:Email></p1:Person></p1:CusDet><p1:TrvDox><p1:DocumentReceiver>BOTH</p1:DocumentReceiver><p1:DoxLang>en_EN</p1:DoxLang><p1:ConfPrt>false</p1:ConfPrt><p1:Travel_Dox_Stop>false</p1:Travel_Dox_Stop><p1:Conf_Stop>false</p1:Conf_Stop><p1:Travel_Dox_No_Price>false</p1:Travel_Dox_No_Price><p1:Travel_Dox_Per_Person>false</p1:Travel_Dox_Per_Person><p1:Print_Voucher_Immed>false</p1:Print_Voucher_Immed><p1:EDox_Generation>false</p1:EDox_Generation></p1:TrvDox><p1:PayData><p1:Dpt Type=""LOW""><p1:CurISO>GBP</p1:CurISO><p1:Amt>0.00</p1:Amt><p1:Dep_Dt>2019-09-20</p1:Dep_Dt></p1:Dpt><p1:Bkg_Prc_Ex><p1:CurISO>GBP</p1:CurISO><p1:Amt>718.00</p1:Amt></p1:Bkg_Prc_Ex><p1:Bkg_Prc_Inc><p1:CurISO>GBP</p1:CurISO><p1:Amt>718.00</p1:Amt><p1:Bal_Due_Amt>0.00</p1:Bal_Due_Amt><p1:Bal_Due_Dt>2019-09-20</p1:Bal_Due_Dt></p1:Bkg_Prc_Inc><p1:Pay><p1:CCPay CCType=""CREDIT"" Card_Issuer=""AX"" Card_Cd=""AX"" Card_Desc=""American Express Card""><p1:CNum>464646******4644</p1:CNum><p1:ExpDate>10/20</p1:ExpDate><p1:PayAmt>718.00</p1:PayAmt><p1:Is_Loyalty_Card>false</p1:Is_Loyalty_Card></p1:CCPay><p1:Pay_Seq>1</p1:Pay_Seq><p1:Amt>718.00</p1:Amt><p1:Exch_Rate>1.00</p1:Exch_Rate><p1:CurISO>GBP</p1:CurISO><p1:TransNo>189985</p1:TransNo><p1:PayDtTm>2019-09-20T13:54:11.000+01:00</p1:PayDtTm><p1:Pay_Group Code=""CREDIT"" Name=""Credit card"" /><p1:AuthSys>AniteCCA</p1:AuthSys><p1:Pay_Type_Code>AX</p1:Pay_Type_Code><p1:Pay_Method Code=""AX"" Name=""American Express Card"" /><p1:Settle_Method>N</p1:Settle_Method><p1:Recon_Type>CARD</p1:Recon_Type><p1:Recon_Method>MAN</p1:Recon_Method><p1:Payment_User Code=""EZYVRP"" Name=""EasyJet VRP USER"" /><p1:Pay_Id>1086278</p1:Pay_Id><p1:Bal_Refund_Amt>718.00</p1:Bal_Refund_Amt></p1:Pay><p1:Tot_Amt>718.00</p1:Tot_Amt><p1:Agt_Com>0.00</p1:Agt_Com><p1:Comm_Inc_VAT>0.00</p1:Comm_Inc_VAT><p1:VAT>0.00</p1:VAT><p1:Payment_Received>718.00</p1:Payment_Received><p1:TO_Comm_Amt>0.00</p1:TO_Comm_Amt><p1:TO_Comm_Amt_Calc>0.00</p1:TO_Comm_Amt_Calc></p1:PayData><p1:Pax Age=""29"" Index=""1""><p1:Person><p1:FirstName>Anton</p1:FirstName><p1:LastName>Trukh</p1:LastName><p1:DateOfBirth>1990-01-01</p1:DateOfBirth><p1:Title>Mr</p1:Title><p1:Sex>SEX_MALE</p1:Sex><p1:PersonType>TYPE_NATURAL</p1:PersonType></p1:Person><p1:Pax_Tp>ADULT</p1:Pax_Tp><p1:Lead_Pax>true</p1:Lead_Pax></p1:Pax><p1:Pax Age=""18"" Index=""2""><p1:Person><p1:FirstName>AL</p1:FirstName><p1:LastName>Trukh</p1:LastName><p1:Title>Mrs</p1:Title><p1:Sex>SEX_FEMALE</p1:Sex><p1:PersonType>TYPE_NATURAL</p1:PersonType></p1:Person><p1:Pax_Tp>ADULT</p1:Pax_Tp></p1:Pax><p1:DD_Marketing_Sts>V0</p1:DD_Marketing_Sts><p1:Prom Code=""EZBO"" Issue=""1"" Name=""Beach - Other"" Prom_Group_Code=""EJH"" /><p1:Incident_Sts>NA</p1:Incident_Sts><p1:Insurance_Method>INT</p1:Insurance_Method><p1:Retail_Bkg_Id>-1</p1:Retail_Bkg_Id><p1:Bkg_Type_Mth>TO</p1:Bkg_Type_Mth><p2:Amendments><p2:Bkg Add=""true"" Amend=""true"" Cancel=""true"" /><p2:Route Add=""true"" Amend=""true"" Cancel=""true"" /><p2:Accom Add=""true"" Amend=""true"" Cancel=""true"" /><p2:Item Add=""true"" Amend=""true"" Cancel=""true"" /><p2:Flight_Extra Add=""true"" Amend=""true"" Cancel=""true"" /><p2:Car_Rental Add=""true"" Amend=""true"" Cancel=""true"" /><p2:Cruise Add=""true"" Amend=""true"" Cancel=""true"" /><p2:Pax Add=""true"" Amend=""true"" Cancel=""true"" /><p2:Memo Add=""true"" Amend=""true"" Cancel=""true"" /></p2:Amendments></p2:DisplayResponse>")));

            #endregion
        }

        public void Dispose()
        {

        }

        [Fact]
        public async Task MakePayment_3DS1_Success()
        {
            // Arrange
            #region Make Payment mock

            eiApiClient
                .Setup(x => x.MakeCall(It.IsAny<HttpMethod>(), It.Is<Uri>(u => u.AbsoluteUri.Contains("/core/finance/payments/v1/make-payment-request")), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<TimeSpan?>()))
                .ReturnsAsync(new MemoryStream(Encoding.UTF8.GetBytes(@"{
                    ""message"": ""Success"",
                    ""amount"": {
                        ""currencyCode"": ""GBP"",
                        ""value"": 10.34
                    },
                    ""payerAuthToken"": {
                        ""issuerUrl"": ""https://test.test/issuer"",
                        ""md"": ""MD-test"",
                        ""paReq"": ""pares-test""
                    },
                    ""paymentId"": ""3469"",
                    ""paymentMethod"": ""Card"",
                    ""paymentMethodTypeCode"": ""MC"",
                    ""resultCode"": ""Redirect"",
                    ""transactionDetail"": {
                        ""card"": {
                            ""cardNumber"": ""XXXXXXXXXXXX1234"",
                            ""expiryMonth"": 10,
                            ""expiryYear"": 2020,
                            ""nameOnCard"": ""Test Tester""
                        },
                        ""transactionTime"": ""0001-01-01T00:00:00"",
                        ""provider"": ""ADYEN"",
                        ""providerId"": 100
                    },
                    ""transactionStatus"": ""None""
                }")));

            eiApiClient
                .Setup(x => x.MakeCall(It.IsAny<HttpMethod>(), It.Is<Uri>(u => u.AbsoluteUri.Contains("/core/finance/payments/v1/make-payment-request")), It.Is<string>(p => p.Contains("paRes")), It.IsAny<string>(), It.IsAny<TimeSpan?>()))
                .ReturnsAsync(new MemoryStream(Encoding.UTF8.GetBytes(@"{
                    ""message"": ""Success"",
                    ""amount"": {
                        ""currencyCode"": ""GBP"",
                        ""value"": 10.34
                    },
                    ""paymentId"": ""3469"",
                    ""paymentMethod"": ""Card"",
                    ""paymentMethodTypeCode"": ""MC"",
                    ""resultCode"": ""Success"",
                    ""transactionDetail"": {
                        ""card"": {
                            ""cardNumber"": ""XXXXXXXXXXXX1234"",
                            ""expiryMonth"": 10,
                            ""expiryYear"": 2020,
                            ""nameOnCard"": ""Test Tester""
                        },
                        ""transactionTime"": ""0001-01-01T00:00:00"",
                        ""provider"": ""ADYEN"",
                        ""providerId"": 100
                    },
                    ""transactionStatus"": ""None""
                }")));
            #endregion

            #region Booking Request setup

            var request = new BookingRequest
            {
                PaymentInfo = new CardPaymentInfo
                {
                    BillingInfo = new BillingInfo
                    {
                        FullName = "Test Petrov",
                        Address = "Avenue Lane 12-3",
                        City = "New Vasulky",
                        PostCode = "lu13gg"
                    },
                    CardNumber = "4988438843884305",
                    CVV = "737",
                    ExpirationDate = "10/20",
                    Amount = 120,
                    Currency = "GBP",
                    NameOnCard = "Test Petrovich"
                },
                BrowserInfo = new BrowserInfo
                {

                },
                Offer = new Offer
                {
                    Price = 1094.00M,
                    Stay = 7,
                    Currency = new() { Code = "GBP" },
                    Accom = new Accom
                    {
                        Unit = new List<Unit>()
                        {
                            new Unit
                            {

                            }
                        }
                    },
                    Transport = new Transport
                    {
                        Routes = new List<Route>()
                        {
                            new Route
                            {
                                Direction = Direction.Outbound,
                                FltNo = "EZY791",
                                Car = "EZY",
                                DepPt = "LGW",
                                DepDate = new DateTime(2020, 09, 03, 11, 0, 0, DateTimeKind.Utc),
                                ArrPt = "PMI",
                                ArrDate = new DateTime(2020, 09, 03, 13, 0, 0, DateTimeKind.Utc)
                            },
                            new Route
                            {
                                Direction = Direction.Inbound,
                                FltNo = "EZY792",
                                Car = "EZY",
                                DepPt = "PMI",
                                DepDate = new DateTime(2020, 09, 10, 11, 0, 0, DateTimeKind.Utc),
                                ArrPt = "LGW",
                                ArrDate = new DateTime(2020, 09, 10, 13, 0, 0, DateTimeKind.Utc)
                            }
                        }
                    }
                },
                Guests = new List<PersonWithDetails>()
                {
                    new PersonWithDetails
                    {
                        Age = 18,
                        Sex = Sex.Male,
                        Type = PersonType.Adult
                    },
                    new PersonWithDetails
                    {
                        Age = 18,
                        Sex = Sex.Female,
                        Type = PersonType.Adult
                    }
                },
                LeadPassenger = new LeadPassenger
                {
                    DateOfBirth = new DateTimeOffset(new DateTime(2000, 09, 10)),
                    Email = "test@test.com"
                }
            };

            #endregion
            try
            {

                // Act
                await sut.Create(request);
            }
            catch (PaymentAuthorisationRequiredException parex)
            {
                parex.PaymentResponse.IssuerUrl.Should().Be("https://test.test/issuer");
                parex.PaymentResponse.Md.Should().Be("MD-test");
                parex.PaymentResponse.PaReq.Should().Be("pares-test");
                parex.PaymentResponse.TermUrl.Should().Be("https://localhost:44319/api/v1.0/payment/3ds1");
            }

            // do second call 
            var secondRequest = Force.DeepCloner.Helpers.ShallowObjectCloner.CloneObject(request) as BookingRequest;
            ArgumentNullException.ThrowIfNull(secondRequest);
            CardPaymentInfo secondPaymentInfo = secondRequest.PaymentInfo.AsCardPayment();
            secondPaymentInfo.Md = "XYZ";
            secondPaymentInfo.PaRes = "ZYX";

            await sut.Create(request);

            // Assert #2
            atcomApiClient.Verify(x => x.MakeCall(It.Is<HttpMethod>(h => h.Method.ToUpperInvariant() == "POST"), It.Is<Uri>(u => u.AbsoluteUri.Contains("/EZYDMO/VRPWebservice/AniteGateway/AniteGateway.aspx")), It.Is<string>(p => p.Contains("p2:BookingRequest")), It.IsAny<string>(), It.IsAny<TimeSpan?>()), Times.Once);
        }

        [Fact]
        public async Task MakePayment_3DS2_Identify_Success()
        {
            // Arrange
            #region Make Payment mock

            eiApiClient
                .Setup(x => x.MakeCall(It.IsAny<HttpMethod>(), It.Is<Uri>(u => u.AbsoluteUri.Contains("/core/finance/payments/v1/make-payment-request")), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<TimeSpan?>()))
                .ReturnsAsync(new MemoryStream(Encoding.UTF8.GetBytes(@"{
                    ""message"": ""Success"",
                    ""amount"": {
                        ""currencyCode"": ""GBP"",
                        ""value"": 10.34
                    },
                    ""payerAuthToken"": {
                        ""threeDS2Data"": {
                            ""authority"": ""Adyen"",
                            ""mode"": ""browser"",
                            ""use"": ""helpers"",
                            ""data"": [
                                {
                                ""key"": ""threeDSServerTransID"",
                                    ""value"": ""d618029b-e820-4914-934b-c9bb07189988""
                                },
                                {
                                ""key"": ""threeDSMethodURL"",
                                    ""value"": ""https://pal-test.adyen.com/threeds2simulator/acs/startMethod.shtml""
                                },
                                {
                                ""key"": ""threeDSMethodFormElement"",
                                    ""value"": ""threeDSMethodData""
                                }
                            ]
                        }
                    },
                    ""paymentId"": ""3469"",
                    ""paymentMethod"": ""Card"",
                    ""paymentMethodTypeCode"": ""MC"",
                    ""resultCode"": ""Identify"",
                    ""transactionDetail"": {
                        ""card"": {
                            ""cardNumber"": ""XXXXXXXXXXXX1234"",
                            ""expiryMonth"": 10,
                            ""expiryYear"": 2020,
                            ""nameOnCard"": ""Test Tester""
                        },
                        ""transactionId"": ""882568103762352B"",
                        ""transactionReference"": ""458fd549-3933-4d4c-a72c-990350ec7dc9"",
                        ""transactionTime"": ""0001-01-01T00:00:00"",
                        ""provider"": ""ADYEN"",
                        ""providerId"": 100
                    },
                    ""transactionStatus"": ""None""
                }")));

            eiApiClient
                .Setup(x => x.MakeCall(It.IsAny<HttpMethod>(), It.Is<Uri>(u => u.AbsoluteUri.Contains("/core/finance/payments/v1/make-payment-request")), It.Is<string>(p => p.Contains("\"transactionReference\":\"458fd549-3933-4d4c-a72c-990350ec7dc9\"") && p.Contains("\"completionIndicator\":\"Y\"")), It.IsAny<string>(), It.IsAny<TimeSpan?>()))
                .ReturnsAsync(new MemoryStream(Encoding.UTF8.GetBytes(@"{
                    ""message"": ""Success"",
                    ""amount"": {
                        ""currencyCode"": ""GBP"",
                        ""value"": 10.34
                    },
                    ""paymentId"": ""3469"",
                    ""paymentMethod"": ""Card"",
                    ""paymentMethodTypeCode"": ""MC"",
                    ""resultCode"": ""Success"",
                    ""transactionDetail"": {
                        ""card"": {
                            ""cardNumber"": ""XXXXXXXXXXXX1234"",
                            ""expiryMonth"": 10,
                            ""expiryYear"": 2020,
                            ""nameOnCard"": ""Test Tester""
                        },
                        ""transactionTime"": ""0001-01-01T00:00:00"",
                        ""provider"": ""ADYEN"",
                        ""providerId"": 100
                    },
                    ""transactionStatus"": ""None""
                }")));
            #endregion

            #region Booking Request setup

            var request = new BookingRequest
            {
                PaymentInfo = new CardPaymentInfo
                {
                    BillingInfo = new BillingInfo
                    {
                        FullName = "Test Petrov",
                        Address = "Avenue Lane 12-3",
                        City = "New Vasulky",
                        PostCode = "lu13gg"
                    },
                    CardNumber = "4988438843884305",
                    CVV = "737",
                    ExpirationDate = "10/20",
                    Amount = 120,
                    Currency = "GBP",
                    NameOnCard = "Test Petrovich"
                },
                BrowserInfo = new BrowserInfo
                {

                },
                Offer = new Offer
                {
                    Currency = new() { Code = "GBP" },
                    Price = 1094.00M,
                    Stay = 7,
                    Accom = new Accom
                    {
                        Unit = new List<Unit>()
                        {
                            new Unit
                            {

                            }
                        }
                    },
                    Transport = new Transport
                    {
                        Routes = new List<Route>()
                        {
                            new Route
                            {
                                Direction = Direction.Outbound,
                                FltNo = "EZY791",
                                Car = "EZY",
                                DepPt = "LGW",
                                DepDate = new DateTime(2020, 09, 03, 11, 0, 0, DateTimeKind.Utc),
                                ArrPt = "PMI",
                                ArrDate = new DateTime(2020, 09, 03, 13, 0, 0, DateTimeKind.Utc),
                            },
                            new Route
                            {
                                Direction = Direction.Inbound,
                                FltNo = "EZY792",
                                Car = "EZY",
                                DepPt = "PMI",
                                DepDate = new DateTime(2020, 09, 10, 11, 0, 0, DateTimeKind.Utc),
                                ArrPt = "LGW",
                                ArrDate = new DateTime(2020, 09, 10, 13, 0, 0, DateTimeKind.Utc)
                            }
                        }
                    }
                },
                Guests = new List<PersonWithDetails>()
                {
                    new PersonWithDetails
                    {
                        Age = 18,
                        Sex = Sex.Male,
                        Type = PersonType.Adult
                    },
                    new PersonWithDetails
                    {
                        Age = 18,
                        Sex = Sex.Female,
                        Type = PersonType.Adult
                    }
                },
                LeadPassenger = new LeadPassenger
                {
                    DateOfBirth = new DateTimeOffset(new DateTime(2000, 09, 10)),
                    Email = "test@test.com"
                }
            };

            #endregion
            try
            {
                // Act
                await sut.Create(request);
            }
            catch (PaymentAuthorisationRequiredException parex)
            {
                parex.PaymentResponse.ThreeDSServerTransID.Should().Be("d618029b-e820-4914-934b-c9bb07189988");
                parex.PaymentResponse.TransactionReference.Should().Be("458fd549-3933-4d4c-a72c-990350ec7dc9");
                parex.PaymentResponse.ThreeDSMethodURL.Should().Be("https://pal-test.adyen.com/threeds2simulator/acs/startMethod.shtml");
                parex.PaymentResponse.MethodNotificationURL.Should().Be("https://localhost:44319/api/v1.0/payment/identify");
            }

            // do second call 
            var secondRequest = request.DeepClone();
            CardPaymentInfo secondPaymentInfo = secondRequest.PaymentInfo.AsCardPayment();
            secondPaymentInfo.ThreeDSServerTransID = "f2657680-f7f9-4186-a0a9-7b8c72e596a6";
            secondPaymentInfo.TransactionReference = "458fd549-3933-4d4c-a72c-990350ec7dc9";
            secondPaymentInfo.ChallengeComplete = false;

            await sut.Create(secondRequest);

            // Assert #2
            atcomApiClient.Verify(x => x.MakeCall(It.Is<HttpMethod>(h => h.Method.ToUpperInvariant() == "POST"), It.Is<Uri>(u => u.AbsoluteUri.Contains("/EZYDMO/VRPWebservice/AniteGateway/AniteGateway.aspx")), It.Is<string>(p => p.Contains("p2:BookingRequest")), It.IsAny<string>(), It.IsAny<TimeSpan?>()), Times.Once);
        }

        [Fact]
        public async Task MakePayment_3DS2_Direct_Challenge_Success()
        {
            // Arrange
            #region Make Payment mock

            eiApiClient
                .Setup(x => x.MakeCall(It.IsAny<HttpMethod>(), It.Is<Uri>(u => u.AbsoluteUri.Contains("/core/finance/payments/v1/make-payment-request")), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<TimeSpan?>()))
                .ReturnsAsync(new MemoryStream(Encoding.UTF8.GetBytes(@"{
                    ""message"": ""Success"",
                    ""amount"": {
                                ""currencyCode"": ""GBP"",
                        ""value"": 20.02
                    },
                    ""payerAuthToken"": {
                                ""threeDS2Data"": {
                                    ""authority"": ""Adyen"",
                            ""mode"": ""browser"",
                            ""use"": ""helpers"",
                            ""data"": [
                                {
                                    ""key"": ""acsURL"",
                                    ""value"": ""https://pal-test.adyen.com/threeds2simulator/acs/challenge.shtml""
                                },
                                {
                                    ""key"": ""threeDSServerTransID"",
                                    ""value"": ""f2657680-f7f9-4186-a0a9-7b8c72e596a6""
                                },
                                {
                                    ""key"": ""messageVersion"",
                                    ""value"": ""2.1.0""
                                },
                                {
                                    ""key"": ""acsTransID"",
                                    ""value"": ""3690ba6d-a1a2-410f-a8b7-de4d032ae71d""
                                },
                                {
                                    ""key"": ""messageType"",
                                    ""value"": ""CReq""
                                },
                                {
                                    ""key"": ""threeDSChallengeFormElement"",
                                    ""value"": ""creq""
                                }
                            ]
                        }
                    },
                    ""paymentId"": ""3902"",
                    ""paymentMethod"": ""Card"",
                    ""paymentMethodTypeCode"": ""DL"",
                    ""resultCode"": ""Challenge"",
                    ""transactionDetail"": {
                        ""card"": {
                            ""cardNumber"": ""XXXXXXXXXXXX0006"",
                            ""expiryMonth"": 10,
                            ""expiryYear"": 2020,
                            ""nameOnCard"": ""Test Tester""
                        },
                        ""transactionTime"": ""0001-01-01T00:00:00"",
                        ""transactionId"": ""882568103762352B"",
                        ""transactionReference"": ""458fd549-3933-4d4c-a72c-990350ec7dc9"",
                        ""provider"": ""ADYEN"",
                        ""providerId"": 100
                    },
                    ""transactionStatus"": ""None""
                }")));

            eiApiClient
                .Setup(x => x.MakeCall(It.IsAny<HttpMethod>(), It.Is<Uri>(u => u.AbsoluteUri.Contains("/core/finance/payments/v1/make-payment-request")),
                    It.Is<string>(p => p.Contains("\"transactionReference\":\"458fd549-3933-4d4c-a72c-990350ec7dc9\"") && p.Contains("\"transactionStatus\":\"Y\"")), It.IsAny<string>(), It.IsAny<TimeSpan?>()))
                .ReturnsAsync(new MemoryStream(Encoding.UTF8.GetBytes(@"{
                    ""message"": ""Success"",
                    ""amount"": {
                        ""currencyCode"": ""GBP"",
                        ""value"": 10.34
                    },
                    ""paymentId"": ""3469"",
                    ""paymentMethod"": ""Card"",
                    ""paymentMethodTypeCode"": ""MC"",
                    ""resultCode"": ""Success"",
                    ""transactionDetail"": {
                        ""card"": {
                            ""cardNumber"": ""XXXXXXXXXXXX1234"",
                            ""expiryMonth"": 10,
                            ""expiryYear"": 2020,
                            ""nameOnCard"": ""Test Tester""
                        },
                        ""transactionTime"": ""0001-01-01T00:00:00"",
                        ""provider"": ""ADYEN"",
                        ""providerId"": 100
                    },
                    ""transactionStatus"": ""None""
                }")));
            #endregion

            #region Booking Request setup

            var request = new BookingRequest
            {
                PaymentInfo = new CardPaymentInfo
                {
                    BillingInfo = new BillingInfo
                    {
                        FullName = "Test Petrov",
                        Address = "Avenue Lane 12-3",
                        City = "New Vasulky",
                        PostCode = "lu13gg"
                    },
                    CardNumber = "4988438843884305",
                    CVV = "737",
                    ExpirationDate = "10/20",
                    Amount = 120,
                    Currency = "GBP",
                    NameOnCard = "Test Petrovich"
                },
                BrowserInfo = new BrowserInfo
                {

                },
                Offer = new Offer
                {
                    Currency = new() { Code = "GBP" },
                    Price = 1094.00M,
                    Stay = 7,
                    Accom = new Accom
                    {
                        Unit = new List<Unit>()
                        {
                            new Unit
                            {

                            }
                        }
                    },
                    Transport = new Transport
                    {
                        Routes = new List<Route>()
                        {
                            new Route
                            {
                                Direction = Direction.Outbound,
                                FltNo = "EZY791",
                                Car = "EZY",
                                DepPt = "LGW",
                                DepDate = new DateTime(2020, 09, 03, 11, 0, 0, DateTimeKind.Utc),
                                ArrPt = "PMI",
                                ArrDate = new DateTime(2020, 09, 03, 13, 0, 0, DateTimeKind.Utc)
                            },
                            new Route
                            {
                                Direction = Direction.Inbound,
                                FltNo = "EZY792",
                                Car = "EZY",
                                DepPt = "PMI",
                                DepDate = new DateTime(2020, 09, 10, 11, 0, 0, DateTimeKind.Utc),
                                ArrPt = "LGW",
                                ArrDate = new DateTime(2020, 09, 10, 13, 0, 0, DateTimeKind.Utc)
                            }
                        }
                    }
                },
                Guests = new List<PersonWithDetails>()
                {
                    new PersonWithDetails
                    {
                        Age = 18,
                        Sex = Sex.Male,
                        Type = PersonType.Adult
                    },
                    new PersonWithDetails
                    {
                        Age = 18,
                        Sex = Sex.Female,
                        Type = PersonType.Adult
                    }
                },
                LeadPassenger = new LeadPassenger
                {
                    DateOfBirth = new DateTimeOffset(new DateTime(2000, 09, 10)),
                    Email = "test@test.com"
                }
            };

            #endregion
            try
            {
                // Act
                await sut.Create(request);
            }
            catch (PaymentAuthorisationRequiredException parex)
            {
                parex.PaymentResponse.ThreeDSServerTransID.Should().Be("f2657680-f7f9-4186-a0a9-7b8c72e596a6");
                parex.PaymentResponse.TransactionReference.Should().Be("458fd549-3933-4d4c-a72c-990350ec7dc9");
                parex.PaymentResponse.AcsURL.Should().Be("https://pal-test.adyen.com/threeds2simulator/acs/challenge.shtml");
                parex.PaymentResponse.AcsTransID.Should().Be("3690ba6d-a1a2-410f-a8b7-de4d032ae71d");
                parex.PaymentResponse.MessageVersion.Should().Be("2.1.0");
            }

            // do second call 
            var secondRequest = request.DeepClone();
            CardPaymentInfo secondPaymentInfo = secondRequest.PaymentInfo.AsCardPayment();
            secondPaymentInfo.ThreeDSServerTransID = "f2657680-f7f9-4186-a0a9-7b8c72e596a6";
            secondPaymentInfo.TransactionReference = "458fd549-3933-4d4c-a72c-990350ec7dc9";
            secondPaymentInfo.ChallengeComplete = true;
            secondPaymentInfo.TransStatus = "Y";

            await sut.Create(secondRequest);

            // Assert #2
            atcomApiClient.Verify(x => x.MakeCall(It.Is<HttpMethod>(h => h.Method.ToUpperInvariant() == "POST"), It.Is<Uri>(u => u.AbsoluteUri.Contains("/EZYDMO/VRPWebservice/AniteGateway/AniteGateway.aspx")), It.Is<string>(p => p.Contains("p2:BookingRequest")), It.IsAny<string>(), It.IsAny<TimeSpan?>()), Times.Once);
        }

        [Fact]
        public async Task MakePayment_3DS2_Identify_Challenge_Success()
        {
            // Arrange
            #region Make Payment mock

            eiApiClient
                .Setup(x => x.MakeCall(It.IsAny<HttpMethod>(), It.Is<Uri>(u => u.AbsoluteUri.Contains("/core/finance/payments/v1/make-payment-request")), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<TimeSpan?>()))
                .ReturnsAsync(new MemoryStream(Encoding.UTF8.GetBytes(@"{
                    ""message"": ""Success"",
                    ""amount"": {
                        ""currencyCode"": ""GBP"",
                        ""value"": 10.34
                    },
                    ""payerAuthToken"": {
                        ""threeDS2Data"": {
                            ""authority"": ""Adyen"",
                            ""mode"": ""browser"",
                            ""use"": ""helpers"",
                            ""data"": [
                                {
                                ""key"": ""threeDSServerTransID"",
                                    ""value"": ""d618029b-e820-4914-934b-c9bb07189988""
                                },
                                {
                                ""key"": ""threeDSMethodURL"",
                                    ""value"": ""https://pal-test.adyen.com/threeds2simulator/acs/startMethod.shtml""
                                },
                                {
                                ""key"": ""threeDSMethodFormElement"",
                                    ""value"": ""threeDSMethodData""
                                }
                            ]
                        }
                    },
                    ""paymentId"": ""3469"",
                    ""paymentMethod"": ""Card"",
                    ""paymentMethodTypeCode"": ""MC"",
                    ""resultCode"": ""Identify"",
                    ""transactionDetail"": {
                        ""card"": {
                            ""cardNumber"": ""XXXXXXXXXXXX1234"",
                            ""expiryMonth"": 10,
                            ""expiryYear"": 2020,
                            ""nameOnCard"": ""Test Tester""
                        },
                        ""transactionId"": ""882568103762352B"",
                        ""transactionReference"": ""458fd549-3933-4d4c-a72c-990350ec7dc9"",
                        ""transactionTime"": ""0001-01-01T00:00:00"",
                        ""provider"": ""ADYEN"",
                        ""providerId"": 100
                    },
                    ""transactionStatus"": ""None""
                }")));

            eiApiClient
                .Setup(x => x.MakeCall(It.IsAny<HttpMethod>(), It.Is<Uri>(u => u.AbsoluteUri.Contains("/core/finance/payments/v1/make-payment-request")), It.Is<string>(p => p.Contains("\"transactionReference\":\"458fd549-3933-4d4c-a72c-990350ec7dc9\"") && p.Contains("\"completionIndicator\":\"Y\"")), It.IsAny<string>(), It.IsAny<TimeSpan?>()))
                .ReturnsAsync(new MemoryStream(Encoding.UTF8.GetBytes(@"{
                    ""message"": ""Success"",
                    ""amount"": {
                                ""currencyCode"": ""GBP"",
                        ""value"": 20.02
                    },
                    ""payerAuthToken"": {
                                ""threeDS2Data"": {
                                    ""authority"": ""Adyen"",
                            ""mode"": ""browser"",
                            ""use"": ""helpers"",
                            ""data"": [
                                {
                                    ""key"": ""acsURL"",
                                    ""value"": ""https://pal-test.adyen.com/threeds2simulator/acs/challenge.shtml""
                                },
                                {
                                    ""key"": ""threeDSServerTransID"",
                                    ""value"": ""f2657680-f7f9-4186-a0a9-7b8c72e596a6""
                                },
                                {
                                    ""key"": ""messageVersion"",
                                    ""value"": ""2.1.0""
                                },
                                {
                                    ""key"": ""acsTransID"",
                                    ""value"": ""3690ba6d-a1a2-410f-a8b7-de4d032ae71d""
                                },
                                {
                                    ""key"": ""messageType"",
                                    ""value"": ""CReq""
                                },
                                {
                                    ""key"": ""threeDSChallengeFormElement"",
                                    ""value"": ""creq""
                                }
                            ]
                        }
                    },
                    ""paymentId"": ""3902"",
                    ""paymentMethod"": ""Card"",
                    ""paymentMethodTypeCode"": ""DL"",
                    ""resultCode"": ""Challenge"",
                    ""transactionDetail"": {
                        ""card"": {
                            ""cardNumber"": ""XXXXXXXXXXXX0006"",
                            ""expiryMonth"": 10,
                            ""expiryYear"": 2020,
                            ""nameOnCard"": ""Test Tester""
                        },
                        ""transactionTime"": ""0001-01-01T00:00:00"",
                        ""transactionId"": ""882568103762352B"",
                        ""transactionReference"": ""458fd549-3933-4d4c-a72c-990350ec7dc9"",
                        ""provider"": ""ADYEN"",
                        ""providerId"": 100
                    },
                    ""transactionStatus"": ""None""
                }")));

            eiApiClient
                .Setup(x => x.MakeCall(It.IsAny<HttpMethod>(), It.Is<Uri>(u => u.AbsoluteUri.Contains("/core/finance/payments/v1/make-payment-request")), It.Is<string>(p => p.Contains("\"transactionReference\":\"458fd549-3933-4d4c-a72c-990350ec7dc9\"") && p.Contains("\"transactionStatus\":\"Y\"")), It.IsAny<string>(), It.IsAny<TimeSpan?>()))
                .ReturnsAsync(new MemoryStream(Encoding.UTF8.GetBytes(@"{
                    ""message"": ""Success"",
                    ""amount"": {
                        ""currencyCode"": ""GBP"",
                        ""value"": 10.34
                    },
                    ""paymentId"": ""3469"",
                    ""paymentMethod"": ""Card"",
                    ""paymentMethodTypeCode"": ""MC"",
                    ""resultCode"": ""Success"",
                    ""transactionDetail"": {
                        ""card"": {
                            ""cardNumber"": ""XXXXXXXXXXXX1234"",
                            ""expiryMonth"": 10,
                            ""expiryYear"": 2020,
                            ""nameOnCard"": ""Test Tester""
                        },
                        ""transactionTime"": ""0001-01-01T00:00:00"",
                        ""provider"": ""ADYEN"",
                        ""providerId"": 100
                    },
                    ""transactionStatus"": ""Sent For Settlement""
                }")));
            #endregion

            #region Booking Request setup

            var request = new BookingRequest
            {
                PaymentInfo = new CardPaymentInfo
                {
                    BillingInfo = new BillingInfo
                    {
                        FullName = "Test Petrov",
                        Address = "Avenue Lane 12-3",
                        City = "New Vasulky",
                        PostCode = "lu13gg"
                    },
                    CardNumber = "4988438843884305",
                    CVV = "737",
                    ExpirationDate = "10/20",
                    Amount = 120,
                    Currency = "GBP",
                    NameOnCard = "Test Petrovich"
                },
                BrowserInfo = new BrowserInfo
                {

                },
                Offer = new Offer
                {
                    Currency = new() { Code = "GBP" },
                    Price = 1094.00M,
                    Stay = 7,
                    Accom = new Accom
                    {
                        Unit = new List<Unit>()
                        {
                            new Unit
                            {

                            }
                        }
                    },
                    Transport = new Transport
                    {
                        Routes = new List<Route>()
                        {
                            new Route
                            {
                                Direction = Direction.Outbound,
                                FltNo = "EZY791",
                                Car = "EZY",
                                DepPt = "LGW",
                                DepDate = new DateTime(2020, 09, 03, 11, 0, 0, DateTimeKind.Utc),
                                ArrPt = "PMI",
                                ArrDate = new DateTime(2020, 09, 03, 13, 0, 0, DateTimeKind.Utc)
                            },
                            new Route
                            {
                                Direction = Direction.Inbound,
                                FltNo = "EZY792",
                                Car = "EZY",
                                DepPt = "PMI",
                                DepDate = new DateTime(2020, 09, 10, 13, 0, 0, DateTimeKind.Utc),
                                ArrPt = "LGW",
                                ArrDate = new DateTime(2020, 09, 10, 13, 0, 0, DateTimeKind.Utc)
                            }
                        }
                    }
                },
                Guests = new List<PersonWithDetails>()
                {
                    new PersonWithDetails
                    {
                        Age = 18,
                        Sex = Sex.Male,
                        Type = PersonType.Adult
                    },
                    new PersonWithDetails
                    {
                        Age = 18,
                        Sex = Sex.Female,
                        Type = PersonType.Adult
                    }
                },
                LeadPassenger = new LeadPassenger
                {
                    DateOfBirth = new DateTimeOffset(new DateTime(2000, 09, 10)),
                    Email = "test@test.com"
                }
            };

            #endregion
            try
            {
                // Act
                await sut.Create(request);
            }
            catch (PaymentAuthorisationRequiredException parex)
            {
                parex.PaymentResponse.ThreeDSServerTransID.Should().Be("d618029b-e820-4914-934b-c9bb07189988");
                parex.PaymentResponse.ThreeDSMethodURL.Should().Be("https://pal-test.adyen.com/threeds2simulator/acs/startMethod.shtml");
                parex.PaymentResponse.MethodNotificationURL.Should().Be("https://localhost:44319/api/v1.0/payment/identify");
            }

            // do second call 
            var secondRequest = Force.DeepCloner.Helpers.ShallowObjectCloner.CloneObject(request) as BookingRequest;
            ArgumentNullException.ThrowIfNull(secondRequest);
            CardPaymentInfo secondPaymentInfo = secondRequest.PaymentInfo.AsCardPayment();
            secondPaymentInfo.ThreeDSServerTransID = "f2657680-f7f9-4186-a0a9-7b8c72e596a6";
            secondPaymentInfo.TransactionReference = "458fd549-3933-4d4c-a72c-990350ec7dc9";
            secondPaymentInfo.ChallengeComplete = false;
            secondPaymentInfo.TransStatus = "Y";

            try
            {
                await sut.Create(secondRequest);
            }
            catch (PaymentAuthorisationRequiredException parex)
            {
                parex.PaymentResponse.ThreeDSServerTransID.Should().Be("f2657680-f7f9-4186-a0a9-7b8c72e596a6");
                parex.PaymentResponse.TransactionReference.Should().Be("458fd549-3933-4d4c-a72c-990350ec7dc9");
                parex.PaymentResponse.AcsURL.Should().Be("https://pal-test.adyen.com/threeds2simulator/acs/challenge.shtml");
                parex.PaymentResponse.AcsTransID.Should().Be("3690ba6d-a1a2-410f-a8b7-de4d032ae71d");
                parex.PaymentResponse.MessageVersion.Should().Be("2.1.0");
            }

            // do second call 
            var thirdRequest = secondRequest.DeepClone();
            CardPaymentInfo thirdPaymentInfo = thirdRequest.PaymentInfo.AsCardPayment();
            thirdPaymentInfo.ThreeDSServerTransID = "f2657680-f7f9-4186-a0a9-7b8c72e596a6";
            thirdPaymentInfo.TransactionReference = "458fd549-3933-4d4c-a72c-990350ec7dc9";
            thirdPaymentInfo.ChallengeComplete = true;

            await sut.Create(thirdRequest);

            // Assert #2
            atcomApiClient.Verify(x => x.MakeCall(It.Is<HttpMethod>(h => h.Method.ToUpperInvariant() == "POST"), It.Is<Uri>(u => u.AbsoluteUri.Contains("/EZYDMO/VRPWebservice/AniteGateway/AniteGateway.aspx")), It.Is<string>(p => p.Contains("p2:BookingRequest")), It.IsAny<string>(), It.IsAny<TimeSpan?>()), Times.Once);
        }

        [Fact]
        public async Task MakePayment_WithIgnoredErrorFromAtcom_ShouldSucceed()
        {
            // Arrange
            #region Make Payment mock

            eiApiClient
                .Setup(x => x.MakeCall(It.IsAny<HttpMethod>(), It.Is<Uri>(u => u.AbsoluteUri.Contains("/core/finance/payments/v1/make-payment-request")), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<TimeSpan?>()))
                .ReturnsAsync(new MemoryStream(Encoding.UTF8.GetBytes(@"{
                    ""message"": ""Success"",
                    ""amount"": {
                        ""currencyCode"": ""GBP"",
                        ""value"": 10.34
                    },
                    ""payerAuthToken"": {
                        ""issuerUrl"": ""https://test.test/issuer"",
                        ""md"": ""MD-test"",
                        ""paReq"": ""pares-test""
                    },
                    ""paymentId"": ""3469"",
                    ""paymentMethod"": ""Card"",
                    ""paymentMethodTypeCode"": ""MC"",
                    ""resultCode"": ""Redirect"",
                    ""transactionDetail"": {
                        ""card"": {
                            ""cardNumber"": ""XXXXXXXXXXXX1234"",
                            ""expiryMonth"": 10,
                            ""expiryYear"": 2020,
                            ""nameOnCard"": ""Test Tester""
                        },
                        ""transactionTime"": ""0001-01-01T00:00:00"",
                        ""provider"": ""ADYEN"",
                        ""providerId"": 100
                    },
                    ""transactionStatus"": ""None""
                }")));

            eiApiClient
                .Setup(x => x.MakeCall(It.IsAny<HttpMethod>(), It.Is<Uri>(u => u.AbsoluteUri.Contains("/core/finance/payments/v1/make-payment-request")), It.Is<string>(p => p.Contains("paRes")), It.IsAny<string>(), It.IsAny<TimeSpan?>()))
                .ReturnsAsync(new MemoryStream(Encoding.UTF8.GetBytes(@"{
                    ""message"": ""Success"",
                    ""amount"": {
                        ""currencyCode"": ""GBP"",
                        ""value"": 10.34
                    },
                    ""paymentId"": ""3469"",
                    ""paymentMethod"": ""Card"",
                    ""paymentMethodTypeCode"": ""MC"",
                    ""resultCode"": ""Success"",
                    ""transactionDetail"": {
                        ""card"": {
                            ""cardNumber"": ""XXXXXXXXXXXX1234"",
                            ""expiryMonth"": 10,
                            ""expiryYear"": 2020,
                            ""nameOnCard"": ""Test Tester""
                        },
                        ""transactionTime"": ""0001-01-01T00:00:00"",
                        ""provider"": ""ADYEN"",
                        ""providerId"": 100
                    },
                    ""transactionStatus"": ""None""
                }")));
            #endregion

            #region Booking Request setup

            var request = new BookingRequest
            {
                PaymentInfo = new CardPaymentInfo
                {
                    BillingInfo = new BillingInfo
                    {
                        FullName = "Test Petrov",
                        Address = "Avenue Lane 12-3",
                        City = "New Vasulky",
                        PostCode = "lu13gg"
                    },
                    CardNumber = "4988438843884305",
                    CVV = "737",
                    ExpirationDate = "10/20",
                    Amount = 120,
                    Currency = "GBP",
                    NameOnCard = "Test Petrovich",
                    Md = "XYZ",
                    PaRes = "ZYX"
                },
                BrowserInfo = new BrowserInfo
                {

                },
                Offer = new Offer
                {
                    Currency = new() { Code = "GBP" },
                    Price = 1094.00M,
                    Stay = 7,
                    Accom = new Accom
                    {
                        Unit = new List<Unit>()
                        {
                            new Unit
                            {

                            }
                        }
                    },
                    Transport = new Transport
                    {
                        Routes = new List<Route>()
                        {
                            new Route
                            {
                                Direction = Direction.Outbound,
                                FltNo = "EZY791",
                                Car = "EZY",
                                DepPt = "LGW",
                                DepDate = new DateTime(2020, 09, 03, 11, 0, 0, DateTimeKind.Utc),
                                ArrPt = "PMI",
                                ArrDate = new DateTime(2020, 09, 03, 13, 0, 0, DateTimeKind.Utc)
                            },
                            new Route
                            {
                                Direction = Direction.Inbound,
                                FltNo = "EZY792",
                                Car = "EZY",
                                DepPt = "PMI",
                                DepDate = new DateTime(2020, 09, 10, 11, 0, 0, DateTimeKind.Utc),
                                ArrPt = "LGW",
                                ArrDate = new DateTime(2020, 09, 10, 13, 0, 0, DateTimeKind.Utc)
                            }
                        }
                    }
                },
                Guests = new List<PersonWithDetails>()
                {
                    new PersonWithDetails
                    {
                        Age = 18,
                        Sex = Sex.Male,
                        Type = PersonType.Adult
                    },
                    new PersonWithDetails
                    {
                        Age = 18,
                        Sex = Sex.Female,
                        Type = PersonType.Adult
                    }
                },
                LeadPassenger = new LeadPassenger
                {
                    DateOfBirth = new DateTimeOffset(new DateTime(2000, 09, 10)),
                    Email = "test@test.com"
                }
            };

            #endregion

            #region CommitBooking mock

            atcomApiClient
                .Setup(x => x.MakeCall(It.IsAny<HttpMethod>(), It.Is<Uri>(u => u.AbsoluteUri.Contains("/EZYDMO/VRPWebservice/AniteGateway/AniteGateway.aspx")), It.Is<string>(p => p.Contains("p2:ModifyCustPaymentRequest")), It.IsAny<string>(), It.IsAny<TimeSpan?>()))
                .ReturnsAsync(new MemoryStream(Encoding.UTF8.GetBytes(@"<p2:ModifyCustPaymentResponse xmlns:p1=""AtComRes/Common"" xmlns:p2=""AtComRes/ModifyCustPaymentResponse""><!-- Response returned from: EZYPRD.EJH.ATCOM --><p1:Adm Xsd_Ver=""TE3.22.4.2""><p1:Tm>2023-07-19T11:38:13.713405+01:00</p1:Tm><p1:Trk From=""atcomres"" To=""easyjet"" /><p1:Full_View_Key>AAAbaaAAYAAOkyxAAh</p1:Full_View_Key><p1:Ser_Msg><p1:Severity>ERROR</p1:Severity><p1:Code>E1369</p1:Code><p1:Desc>Hotel Plaform Server Error {K1} {K2}</p1:Desc><p1:KeyValuePair Key=""K1"">991</p1:KeyValuePair><p1:KeyValuePair Key=""K2"">Internal server error</p1:KeyValuePair></p1:Ser_Msg></p1:Adm><p1:CltInfo><p1:Locale>en_EN</p1:Locale><p1:CltSysContext>3</p1:CltSysContext><p1:Agt_No>WAGBP</p1:Agt_No><p1:TermCode>ABCD</p1:TermCode><p1:User_Name>EZYVRP</p1:User_Name><p1:Chan>inhouse</p1:Chan><p1:Channel_Type>VRP</p1:Channel_Type><p1:User_Role>INTERNAL</p1:User_Role></p1:CltInfo><p1:BkgNum><p1:BkgId>4815400</p1:BkgId><p1:CurrentVersion>3</p1:CurrentVersion></p1:BkgNum><p1:BkgSts>BOOKING</p1:BkgSts><p1:His><p1:Bkg_Dt_Tm>2023-07-07T10:28:07+01:00</p1:Bkg_Dt_Tm><p1:Bkg_User>EZYVRP</p1:Bkg_User><p1:Amd_Dt_Tm>2023-07-19T11:34:54+01:00</p1:Amd_Dt_Tm><p1:Amd_User>EZYVRP</p1:Amd_User><p1:Amd_Term_Code>ABCD</p1:Amd_Term_Code><p1:Amd_Chan>inhouse</p1:Amd_Chan></p1:His><p1:PayData><p1:Pay><p1:CCPay CCType=""CARD"" Card_Issuer=""DM"" Card_Cd=""DM"" Card_Desc=""Mastercard Debit""><p1:CNum>***</p1:CNum><p1:ExpDate>08/25</p1:ExpDate><p1:Payer CusId=""""><p1:Person><p1:FirstName>***</p1:FirstName><p1:LastName>***</p1:LastName><p1:Title>***</p1:Title></p1:Person></p1:Payer><p1:PayAmt>71.92</p1:PayAmt><p1:Is_Loyalty_Card>false</p1:Is_Loyalty_Card></p1:CCPay><p1:Pay_Seq>3</p1:Pay_Seq><p1:Amt>71.92</p1:Amt><p1:Exch_Rate>1.00</p1:Exch_Rate><p1:CurISO>GBP</p1:CurISO><p1:AuthCode>638743213</p1:AuthCode><p1:TransNo>123</p1:TransNo><p1:PayDtTm>2023-07-19T11:38:12+01:00</p1:PayDtTm><p1:PayDetails>ADYEN</p1:PayDetails><p1:Pay_Group Code=""CARD"" Name=""Card"" /><p1:AuthSys>EasyJetPGS</p1:AuthSys><p1:Pay_Type_Code>DM</p1:Pay_Type_Code><p1:Pay_Method Code=""DM"" Name=""Mastercard Debit"" /><p1:Settle_Method>Y</p1:Settle_Method><p1:Recon_Method>MAN</p1:Recon_Method><p1:Payment_User Code=""EZYVRP"" Name=""easyJet Holidays VRP User"" /><p1:Pay_Id>2223185350</p1:Pay_Id><p1:Bal_Refund_Amt>71.92</p1:Bal_Refund_Amt><p1:Adjust_Refund_Fg>N</p1:Adjust_Refund_Fg></p1:Pay></p1:PayData></p2:ModifyCustPaymentResponse>")));

            #endregion

            // Act
            await sut.Create(request);

            // Assert
            atcomApiClient.Verify(x => x.MakeCall(It.Is<HttpMethod>(h => h.Method.ToUpperInvariant() == "POST"), It.Is<Uri>(u => u.AbsoluteUri.Contains("/EZYDMO/VRPWebservice/AniteGateway/AniteGateway.aspx")), It.Is<string>(p => p.Contains("p2:BookingRequest")), It.IsAny<string>(), It.IsAny<TimeSpan?>()), Times.Once);
        }
    }
}
