using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Payment;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using easyJet.Holidays.Api.Domain.Services.Cookies;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Mappers.Booking;
using easyJet.Holidays.External.Atcom.Mappers.InfoCancellation;
using easyJet.Holidays.External.Atcom.Models.Internal;
using easyJet.Holidays.External.Atcom.Services;
using easyJet.Holidays.External.Domain.Services;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.InfoCancellation
{
    public class InfoCancellationMapperTest
    {
        private InfoCancellationMapper _sut;
        private Mock<EndpointsProvider> _atcomEndpointProvider;
        private Mock<IHttpContextAccessor> _httpContextAccessor = new Mock<IHttpContextAccessor>();
        private Mock<AtcomRequestGenerator> _atcomRequestGenerator;
        private Mock<IBookingCancellationRequestService> _BookingCancellationRequestService = new Mock<IBookingCancellationRequestService>();
        private Mock<PriceMapper> _priceMapper;

        public InfoCancellationMapperTest()
        {
            _priceMapper = CreatePriceMapperMock();
            _atcomEndpointProvider = CreateEndpointProvider();
            _atcomRequestGenerator = CreateAtcomRequestGenerator();

            _sut = new InfoCancellationMapper(_priceMapper.Object, _atcomEndpointProvider.Object,
                _httpContextAccessor.Object, _atcomRequestGenerator.Object, _BookingCancellationRequestService.Object);
        }

        private static Mock<AtcomRequestGenerator> CreateAtcomRequestGenerator()
        {
            var atcomSettings = new Mock<IOptions<AtcomSettings>>();
            atcomSettings.Setup(options => options.Value).Returns(new AtcomSettings()
            {
                CltInfo = new AtcomCltInfoSettings
                {
                    AgentGroups = new ()
                    {
                        {
                            "default",
                            new AtcomCltInfoAgentsSettings
                            {
                                AgentsNames = new() {
                                    {"CH", "WACHFS" },
                                    {"UK", "WAGBP" }
                                },
                                UserNames = new() {
                                    { "CH", "WACHFS" },
                                    {"UK", "WAGBP" }
                                },
                            }
                        }
                    }
                },
            });

            var tradeAgentAuthenticationService = new Mock<ITradeAgentAuthenticationService>();
            var marketService = new Mock<IMarketService>();
            var languageService = new Mock<ILanguageService>();

            return new Mock<AtcomRequestGenerator>(atcomSettings.Object, tradeAgentAuthenticationService.Object, marketService.Object, languageService.Object);
        }

        private static Mock<EndpointsProvider> CreateEndpointProvider()
        {
            var atcomSettings = new Mock<IOptions<AtcomSettings>>();
            atcomSettings.Setup(options => options.Value).Returns(new AtcomSettings()
            {
                Booking = new AtcomApiSettings() { BaseUrl = "holidays", Host = "https://easyjet.com" },
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
            });

            var envBehaviorSettings = new Mock<IOptions<EnvironmentBehaviourSettings>>();
            envBehaviorSettings.Setup(options => options.Value).Returns(new EnvironmentBehaviourSettings());

            var cookieService = new Mock<ICookiesService>();
            var logger = new Mock<ILogger<EndpointsProvider>>();

            return new Mock<EndpointsProvider>(atcomSettings.Object, envBehaviorSettings.Object, cookieService.Object, logger.Object);
        }

        private static Mock<PriceMapper> CreatePriceMapperMock()
        {
            var atcomSettings = new Mock<IOptions<AtcomSettings>>();
            atcomSettings.Setup(options => options.Value).Returns(new AtcomSettings()
            {
                PaymentCodes = new Dictionary<string, PaymentCodesSettings>()
            });

            var apiSettings = new Mock<IOptions<ApiSettings>>();
            apiSettings.Setup(options => options.Value).Returns(new ApiSettings()
            {
                Vouchers = new VoucherSettings()
                {
                    Types = new VoucherTypeSettings()
                    {
                        GiftCard = "GiftCard",
                        Goodwill = "Goodwill",
                        Incentive = "Incentive",
                        OneTimeUse = "OneTimeUse",
                        Refund = "Refund",
                    },
                    PromoVouchers = new VoucherReasonSettings()
                    {
                        Types = new List<string>(){"Tesco"}
                    }
                },
            });
            var tradeAgentAuthenticationService = new Mock<ITradeAgentAuthenticationService>();

            return new Mock<PriceMapper>(atcomSettings.Object, apiSettings.Object, tradeAgentAuthenticationService.Object);
        }

        [Fact]
        public void MapResponse_MapAtcomToDomain()
        {
            _priceMapper.Setup(x => x.MapAmendmentFeeInfoItems(It.IsAny<Price[]>())).Returns(new FeeItem[]
            {
                new FeeItem
                {
                    Name = "Cancellation Fee"
                },
                new FeeItem
                {
                    Name = "Other Fee Item"
                }
            });

            var infoCancellationResponse = new InfoCancellationResponse()
            {
                Bkg_Ent = new Bkg_Ent()
                {
                    Prices = []
                },
                BkgNum = new BkgNum()
                {
                    BkgId = "BookingReference"
                },
                BkgSts = BkgSts.BOOKING,
                His = new His()
                {
                    Bkg_Dt_Tm = DateTimeOffset.Now.AddDays(-100),
                    Cnx_Dt_Tm = DateTime.Now,
                },
                HasAgt_Notice = false
            };


            var result = _sut.MapResponse(infoCancellationResponse);

            result.Should().NotBeNull();
            result.BookingDate.Should().Be(infoCancellationResponse.His.Bkg_Dt_Tm.Date);
            result.BookingReference.Should().Be(infoCancellationResponse.BkgNum.BkgId);
            result.BookingStatus.Should().Be(infoCancellationResponse.BkgSts.ToString());
            result.HasNotice.Should().Be(infoCancellationResponse.HasAgt_Notice);
            result.CancellationDate.Should().Be(infoCancellationResponse.His.Cnx_Dt_Tm);
            result.CancellationFeeItem.Should().NotBeNull();
            result.CancellationFeeItem.Name.Should().Be("Cancellation Fee");
            result.FeeItems.Should().NotBeNull();
            result.FeeItems.Count.Should().Be(1);
            result.FeeItems.FirstOrDefault()?.Name.Should().Be("Other Fee Item");
        }
        
        [Fact]
        public async Task CreateRequest_ShouldBuildCorrectInfoCancellationRequest()
        {
            // Arrange
            var bookingResponse = new easyJet.Holidays.Api.Domain.Data.Booking.BookingResponse
            {
                BookingReference = "ABC123",
                MarketCode = "GB",
                Language = "EN"
            };
            var discountCode = "DISCOUNT123";
            bool withoutFee = false;
            bool withoutFeeSpecified = false;
        
            var expectedEndpoint = "https://easyjet.com/holidays";
        
            // Act
            var result = await _sut.CreateRequest(bookingResponse, withoutFee, withoutFeeSpecified, discountCode);
        
            // Assert
            result.Should().NotBeNull();
            result.Payload.Body.BkgNum.Should().ContainSingle(bkg => bkg.BkgId == bookingResponse.BookingReference);
            result.Payload.Body.Cnx_Without_Fee.Should().Be(withoutFee);
            result.Payload.Body.Items.Should().ContainSingle(item => ((Disc)item).Disc_Code == discountCode);
            result.Endpoint.Should().Be(expectedEndpoint);
        }

        [Fact]
        public void MapResponse_ShouldMapInfoCancellationResponseCorrectly()
        {
            // Arrange
            var apiResponse = new InfoCancellationResponse
            {
                BkgNum = new BkgNum { BkgId = "ABC123" },
                BkgSts = BkgSts.BOOKING,
                His = new His { Bkg_Dt_Tm = new DateTime(2025, 1, 1), Cnx_Dt_Tm = new DateTime(2025, 2, 1) },
                HasAgt_Notice = true,
                Bkg_Ent = new Bkg_Ent
                {
                    Prices = []
                }
            };
            
            var mappedFeeItems = new List<FeeItem>
            {
                new() { Name = "Cancellation Fee", Amount = 100 },
                new() { Name = "Service Fee", Amount = 50 }
            }.ToArray();

            _priceMapper
                .Setup(mapper => mapper.MapAmendmentFeeInfoItems(It.IsAny<Price[]>()))
                .Returns(mappedFeeItems);

            // Act
            var result = _sut.MapResponse(apiResponse);

            // Assert
            result.Should().NotBeNull();
            result.BookingReference.Should().Be(apiResponse.BkgNum.BkgId);
            result.BookingStatus.Should().Be(apiResponse.BkgSts.ToString());
            result.BookingDate.Should().Be(apiResponse.His.Bkg_Dt_Tm.Date);
            result.CancellationDate.Should().Be(apiResponse.His.Cnx_Dt_Tm);
            result.HasNotice.Should().Be(apiResponse.HasAgt_Notice);
            result.CancellationFeeItem.Should().NotBeNull();
            result.CancellationFeeItem.Name.Should().Be("Cancellation Fee");
            result.FeeItems.Should().HaveCount(1);
            result.FeeItems.Should().Contain(item => item.Name == "Service Fee");
        }

        [Fact]
        public void MapResponse_ShouldHandleNoCancellationFeeItems()
        {
            // Arrange
            var apiResponse = new InfoCancellationResponse
            {
                BkgNum = new BkgNum { BkgId = "ABC123" },
                BkgSts = BkgSts.BOOKING,
                His = new His { Bkg_Dt_Tm = new DateTime(2025, 1, 1), Cnx_Dt_Tm = new DateTime(2025, 2, 1) },
                HasAgt_Notice = true,
                Bkg_Ent = new Bkg_Ent
                {
                    Prices = []
                }
            };
        
            var mappedFeeItems = new List<FeeItem>
            {
                new FeeItem { Name = "Service Fee", Amount = 50 }
            }.ToArray();
        
            _priceMapper
                .Setup(mapper => mapper.MapAmendmentFeeInfoItems(It.IsAny<Price[]>()))
                .Returns(mappedFeeItems);
        
            // Act
            var result = _sut.MapResponse(apiResponse);
        
            // Assert
            result.Should().NotBeNull();
            result.CancellationFeeItem.Should().BeNull();
            result.FeeItems.Should().HaveCount(1);
            result.FeeItems.Should().Contain(item => item.Name == "Service Fee");
        }
    }
}
