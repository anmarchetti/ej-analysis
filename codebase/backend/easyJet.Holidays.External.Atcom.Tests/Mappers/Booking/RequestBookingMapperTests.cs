using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Transliteration;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using easyJet.Holidays.Api.Domain.Services.Luggage;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Mappers.Booking;
using easyJet.Holidays.External.Atcom.Mappers.Guests;
using easyJet.Holidays.External.Atcom.Services;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using System.Collections;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.Booking
{
    public class RequestBookingMapperTests
    {
        private readonly IFixture _fixture = FixtureUtils.AutoMoqFixture();

        [Theory]
        [ClassData(typeof(MapNoPayment_ValidDataData))]
        public void MapNoPayment_ValidData_ShouldIncludeSessionAndRequestIds(BookingRequest request, Models.Internal.CltInfo cltInfo, ValidateBookingResponse validteResponse)
        {
            // Act
            var actual = RequestBookingMapper.MapCreateWithoutPayment(request.LeadPassenger, cltInfo, "1234", "abcd", string.Empty, "en_EN");

            // Assert
            actual.Payload.Body.Adm.SessId.Should().Be("1234");
            actual.Payload.Body.Adm.ReqId.Should().Be("abcd");
        }

        [Theory]
        [ClassData(typeof(MapNoPayment_ValidDataData))]
        public void MapNoPayment_ValidData_ShouldCopyClientInfo(BookingRequest request, Models.Internal.CltInfo cltInfo, ValidateBookingResponse validteResponse)
        {
            // Act
            var actual = RequestBookingMapper.MapCreateWithoutPayment(request.LeadPassenger, cltInfo, string.Empty, string.Empty, string.Empty, "en_EN");

            // Assert
            actual.Payload.Body.CltInfo.Agt_No.Should().Be("SOME");
        }

        [Theory]
        [InlineData(null, "CH", "fr-CH")]
        [InlineData("de_DE", "CH", "de-CH")]
        [InlineData("abc", "CH", "en")]
        public void MapAtcomLanguage_ValidatData(string doxLang, string market, string expectedResult)
        {
            //Arrange

            var atcomSettings = Options.Create(new AtcomSettings
            {
                CltInfo = new AtcomCltInfoSettings
                {
                    AgentGroups = new Dictionary<string, AtcomCltInfoAgentsSettings>
                    {
                        {
                            "default",
                            new AtcomCltInfoAgentsSettings
                            {
                                AgentsNames = new Dictionary<string, string> {
                                    {"CH", "WACHFS" },
                                    {"UK", "WAGBP" }
                                }
                            }
                        }
                    }
                },
                PaymentCodes = new Dictionary<string, PaymentCodesSettings> { { "", new PaymentCodesSettings { Issued = new PaymentTypeSettings { Code = "12345" }, Redeemed = new PaymentTypeSettings { Code = "1234" } } } }
            });
            var languageSettings = Options.Create(new LanguageSettings
            {
                MarketLanguages = new Dictionary<string, IEnumerable<string>> {
                        { "CH", new []{"fr-CH", "de-CH"}},
                        { "UK", new []{"en"}}
                        }
            });
            var tradeAgent = new Mock<ITradeAgentAuthenticationService>();
            var apiSettings = Options.Create(new ApiSettings
            {
                DisabledOffersForNextDay = true,
                Vouchers = new VoucherSettings
                {
                    IsActive = false,
                    PromoVouchers = new VoucherReasonSettings { Types = new List<string> { "Promo" } },
                    Types = new VoucherTypeSettings { GiftCard = "gift" }
                }
            });
            var priceMapper = new PriceMapper(atcomSettings, apiSettings, tradeAgent.Object);
            var seatsMapper = new Mock<SeatsMapper>();
            var atcomRequestGenerator = new AtcomRequestGenerator(atcomSettings, tradeAgent.Object, null, null);
            var referenceDataService = new Mock<IReferenceDataService>();
            var luggageServiceMock = new Mock<ILuggageService>();
            var flightExtraService = new Mock<IFlightExtraService>();
            var extraLuggageMapper = new ExtraLuggageMapper(referenceDataService.Object, luggageServiceMock.Object, flightExtraService.Object, _fixture.Create<ILogger<ExtraLuggageMapper>>());
            var transliterationServiceMock = new Mock<ITransliterationService>();
            var guestsMapper = new GuestsMapper(transliterationServiceMock.Object);

            var actual = new RequestBookingMapper(atcomSettings, priceMapper, seatsMapper.Object, atcomRequestGenerator, languageSettings, extraLuggageMapper, guestsMapper);

            // Act
            var response = actual.MapLanguage(doxLang, market);
            // Assert
            response.Should().Be(expectedResult);
        }

        [Theory]
        [InlineData("Use customer id", "0123456789", "0123456789")]
        [InlineData("No customer id: null", null, null)]
        [InlineData("No customer id: empty", "", null)]
        [InlineData("No customer id: whitespace", "  ", null)]
        public void MapNoPayment_ValidData_IncludeCustomerId(string because, string customerId, string expectedCustomerId)
        {
            // Arrange 
            var request = new BookingRequest();
            var cltInfo = new Models.Internal.CltInfo()
            {
                Agt_No = "SOME"
            };

            // Act
            var actual = RequestBookingMapper.MapCreateWithoutPayment(request.LeadPassenger, cltInfo, string.Empty, string.Empty, customerId, "en_EN");

            // Assert
            actual.Payload.Body.Cus?.CusId.Should().Be(expectedCustomerId, because);
        }
    }

    public class MapNoPayment_ValidDataData : IEnumerable<object[]>
    {
        public IEnumerator<object[]> GetEnumerator()
        {
            yield return new object[] {
                new BookingRequest(),
                new Models.Internal.CltInfo() {
                    Agt_No = "SOME"
                },
                new ValidateBookingResponse() {
                    RequestId = "abcd",
                    SessionId = "1234"
                }
            };
            yield return new object[] {
                new BookingRequest(),
                new Models.Internal.CltInfo() {
                    Agt_No = "SOME"
                },
                new ValidateBookingResponse() {
                    RequestId = "abcd",
                    SessionId = "1234"
                }
            };
        }

        IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();
    }


}
