using AutoFixture;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.DynamoDB.Marketing;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Data.Marketing;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Themes;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Interfaces.Hotels;
using easyJet.Holidays.Api.Domain.Interfaces.Marketing;
using easyJet.Holidays.Api.Domain.Interfaces.Repositories;
using easyJet.Holidays.Api.Domain.Services.Marketing;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using System.Globalization;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Marketing
{
    public class MarketingServiceTests
    {
        private IFixture _fixture;
        private readonly IMarketingService _marketingService;
        private readonly Mock<IBookingRepository> bookingRepositoryMock;
        private readonly Mock<IHotelsService> _hotelsServiceMock;
        private readonly Mock<IAWSDbRepository<Unsubscribe>> _unsubscribeRepositoryMock;
        private readonly Mock<IAWSDbRepository<MarketingPreferences>> _marketingPreferencesRepositoryMock;
        private readonly Mock<ICsatService> _csatService;
        private readonly IOptions<MarketingSettings> _marketingSettings;
        private readonly IOptions<LanguageSettings> _languageSettings;

        public MarketingServiceTests()
        {
            _fixture = FixtureUtils.AutoMoqFixture();
            _marketingSettings = Options.Create(new MarketingSettings()
            {
                CsatLink = new CsatLinkSettings()
                {
                    Host = "https://survey2.medallia.eu/?HOL&",
                    TransferTypes = new MarketingTransferTypesSettings()
                    {
                        Shared = new List<string>() { "S", "SS" },
                        Private = new List<string>() { "P, PP" },
                    },
                    AirCarrier = "EZY",
                    Language = "EN",
                    BookingTypeExternalAgency = "Trade",
                    BookingTypeWebsite = "Website",
                },
                TradeBookingsEnabled = false,
                UnsubscribeLink = "https://www.easyjet.com/{basePath}/marketing-research-unsubscribe?encEmail={encEmail}",
                EncryptionPassword = "p@sswrdFeefo",
                EncryptionSalt = "unsubscribesalt",
                LanguageMap = new Dictionary<string, string>
                {
                    {"en", "EN" },
                    {"fr-CH", "FR" },
                    {"fr-FR", "FR" },
                    {"de-CH", "DE" },
                    {"de-DE", "DE" }
                }
            });

            _languageSettings = Options.Create(new LanguageSettings
            {
                BasePaths = new Dictionary<string, string>
                {
                    {"en", "en/holidays" }
                }
            });

            _csatService = _fixture.Freeze<Mock<ICsatService>>();

            _unsubscribeRepositoryMock =
                _fixture.Freeze<Mock<IAWSDbRepository<Unsubscribe>>>();

            bookingRepositoryMock = _fixture.Freeze<Mock<IBookingRepository>>();

            _hotelsServiceMock = _fixture.Freeze<Mock<IHotelsService>>();

            _marketingPreferencesRepositoryMock = _fixture.Freeze<Mock<IAWSDbRepository<MarketingPreferences>>>();

            _fixture.Inject(_marketingSettings);
            _fixture.Inject(_languageSettings);

            _marketingService = _fixture.Freeze<MarketingService>();
        }

        [Fact]
        public async Task GetMarketingPreferences_NullOrEmptyEmail_ThrowException()
        {
            await Assert.ThrowsAsync<ArgumentNullException>(() => _marketingService.GetMarketingPreferences(string.Empty));
            await Assert.ThrowsAsync<ArgumentNullException>(() => _marketingService.GetMarketingPreferences((string)null));
        }

        [Theory]
        [AutoMoqData]
        public async Task GetMarketingPreferences_StatusNo_ReturnDefaultValue(string email)
        {
            _csatService.Setup(service => service.CheckMarketingEmailConsent(It.IsAny<string>()))
                .ReturnsAsync(false);

            var customerPreferencesResponse = await _marketingService.GetMarketingPreferences(email);

            customerPreferencesResponse.CanBeSent.Should().BeFalse("Status indicates that canBeSent=false");
        }

        [Theory]
        [AutoMoqData]
        public async Task GetMarketingPreferences_StatusYes_ReturnCorrectValue(string email)
        {
            _csatService.Setup(service => service.CheckMarketingEmailConsent(It.IsAny<string>()))
                .ReturnsAsync(true);

            var customerPreferencesResponse = await _marketingService.GetMarketingPreferences(email);

            customerPreferencesResponse.CanBeSent.Should().BeTrue("Meets all requirements");
        }

        [Theory]
        [AutoMoqData]
        public async Task GetMarketingPreferences_CanBeSentFalse_ReturnFalse(CustomerPreferencesRequest customerPreferencesRequest)
        {
            _csatService.Setup(service => service.CheckMarketingEmailConsent(It.IsAny<string>()))
                .ReturnsAsync(false);


            var actResult = await _marketingService.GetMarketingPreferences(customerPreferencesRequest);

            actResult.CanBeSent.Should().BeFalse();
            actResult.Urls.Should().BeNull();
        }

        [Theory]
        [AutoMoqData]
        public async Task GetMarketingPreferences_RequestedTradeBooking_TradeBookingsDisabledByConfig_ThrowException(CustomerPreferencesRequest customerPreferencesRequest)
        {
            _csatService.Setup(service => service.CheckMarketingEmailConsent(It.IsAny<string>()))
                .ReturnsAsync(true);

            bookingRepositoryMock.Setup(repository => repository.GetBooking(It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync(new BookingResponse()
                {
                    IsExternalAgency = true //trade booking
                });

            await Assert.ThrowsAsync<ApiException>(
                () => _marketingService.GetMarketingPreferences(customerPreferencesRequest));
        }

        [Theory]
        [AutoMoqData]
        public async Task GetMarketingPreferences_RequestedEmailNotMatchLeadPasEmail_ThrowException(CustomerPreferencesRequest customerPreferencesRequest)
        {
            _csatService.Setup(service => service.CheckMarketingEmailConsent(It.IsAny<string>()))
                .ReturnsAsync(true);

            bookingRepositoryMock.Setup(repository => repository.GetBooking(It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync(new BookingResponse()
                {
                    IsExternalAgency = false,
                    LeadPassenger = new LeadPassenger()
                    {
                        Email = "Test"
                    }
                });

            await Assert.ThrowsAsync<ApiException>(
                () => _marketingService.GetMarketingPreferences(customerPreferencesRequest));
        }

        [Theory]
        [AutoMoqData]
        public async Task GetMarketingPreferences_CSATCanBeSent_GenerateCSATUrls(CustomerPreferencesRequest customerPreferencesRequest, int satisfactionScore)
        {
            _csatService.Setup(service => service.CheckMarketingEmailConsent(It.IsAny<string>()))
                .ReturnsAsync(true);

            bookingRepositoryMock.Setup(repository => repository.GetBooking(It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync(new BookingResponse()
                {
                    BookingReference = "Test",
                    IsExternalAgency = false,
                    LeadPassenger = new LeadPassenger()
                    {
                        Email = customerPreferencesRequest.Email
                    },
                    Package = new BookingPackage()
                    {
                        Accom = new BookingAccommodation()
                        {
                            Code = "Test"
                        },
                        Transport = new Transport()
                        {
                            Routes = new List<Route>()
                            {
                                new Route()
                                {
                                    Direction = Direction.Outbound,
                                    DepDate = DateTimeOffset.UtcNow,
                                    ArrDate = DateTimeOffset.UtcNow.AddHours(2),
                                    DepPt = "DepPt",
                                    ArrPt = "ArrPt",
                                    FltNo = "FltNo"
                                },
                                new Route()
                                {
                                    Direction  = Direction.Inbound,
                                    DepDate = DateTimeOffset.UtcNow.AddDays(1),
                                    ArrDate = DateTimeOffset.UtcNow.AddDays(1).AddHours(2),
                                    DepPt = "DepPt",
                                    ArrPt = "ArrPt",
                                    FltNo = "FltNo"
                                }
                            }
                        }
                    },
                    Transfers = new List<TransferItem>()
                    {
                        new TransferItem()
                        {
                            Code = "TestSS"
                        }
                    },
                    MarketCode = "UK",
                    Language = "en"
                });

            _marketingSettings.Value.CsatLink.SatisfactionScore = satisfactionScore;

            _fixture.Inject(_marketingSettings);

            _hotelsServiceMock.Setup(service => service.Search(It.IsAny<string[]>()))
                .ReturnsAsync(Enumerable.Empty<Hotel>());

            var actResult = await _marketingService.GetMarketingPreferences(customerPreferencesRequest);

            actResult.CanBeSent.Should().BeTrue();
            actResult.Urls.Count().Should().Be(satisfactionScore);
        }

        [Theory]
        [AutoMoqData]
        public async Task GetMarketingPreferences_CSATCanBeSent_GenerateCorrectResponse(CustomerPreferencesRequest customerPreferencesRequest, int satisfactionScore, string marketCode, string language)
        {
            _csatService.Setup(service => service.CheckMarketingEmailConsent(It.IsAny<string>()))
                .ReturnsAsync(true); _csatService.Setup(service => service.CheckMarketingEmailConsent(It.IsAny<string>()))
                .ReturnsAsync(true);


            bookingRepositoryMock.Setup(repository => repository.GetBooking(It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync(new BookingResponse()
                {
                    BookingReference = "BookingReference",
                    IsExternalAgency = false,
                    LeadPassenger = new LeadPassenger()
                    {
                        Email = customerPreferencesRequest.Email
                    },
                    Package = new BookingPackage()
                    {
                        Accom = new BookingAccommodation()
                        {
                            Code = "Test",
                            Rooms = new List<Unit>()
                            {
                                new Unit()
                                {
                                    Board = "Board"

                                }
                            },
                            Hotel = new OfferHotel()
                            {
                                Theme = new PackageTheme()
                                {
                                    Name = "AI"
                                }
                            }

                        },
                        Transport = new Transport()
                        {
                            Routes = new List<Route>()
                            {
                                new Route()
                                {
                                    Direction = Direction.Outbound,
                                    DepDate = new DateTimeOffset(new DateTime(2022, 1,1, 17, 0, 0)),
                                    ArrDate = new DateTimeOffset(new DateTime(2022, 1,1, 19, 0, 0)),
                                    DepPt = "DepPt",
                                    ArrPt = "ArrPt",
                                    FltNo = "FltNo"
                                },
                                new Route()
                                {
                                    Direction  = Direction.Inbound,
                                    DepDate = new DateTimeOffset(new DateTime(2022, 1,7, 17, 0, 0)),
                                    ArrDate = new DateTimeOffset(new DateTime(2022, 1,7, 19, 0, 0)),
                                    DepPt = "DepPt",
                                    ArrPt = "ArrPt",
                                    FltNo = "FltNo"
                                }
                            }
                        }
                    },
                    Transfers = new List<TransferItem>()
                    {
                        new TransferItem()
                        {
                            Code = "TestSS",
                        }
                    },
                    MarketCode = marketCode,
                    Language = language
                });

            _marketingSettings.Value.CsatLink.SatisfactionScore = satisfactionScore;
            _marketingSettings.Value.LanguageMap[language] = language.ToUpper();
            _languageSettings.Value.BasePaths = new Dictionary<string, string> { { language, $"{language}/holidays" } };

            _hotelsServiceMock.Setup(service => service.Search(It.IsAny<string[]>()))
                .ReturnsAsync(new List<Hotel>()
                {
                    new Hotel()
                    {
                        Name = "Hotel Name",
                        Resort = new Resort()
                        {
                            Name = "Resort Name"
                        },
                        StarRating = "5",
                    }
                });

            var actResult = await _marketingService.GetMarketingPreferences(customerPreferencesRequest);

            var lastGeneratedCSATUrl = actResult.Urls.LastOrDefault();

            actResult.CanBeSent.Should().BeTrue();
            actResult.Urls.Count().Should().Be(satisfactionScore);
            lastGeneratedCSATUrl.Should()
                .BeEquivalentTo(
                    $"https://survey2.medallia.eu/?HOL&lng={language}&ADate=2022-01-07&BrokerPanelId=BookingReference&OutFltDT=2022-01-01&InFltDT=2022-01-07&OutDep=DepPt&OutArr=ArrPt&InDep=DepPt&InArr=ArrPt&SAT=1&PAXMix=0&AccomCode=Test&AccomName=Hotel%20Name&ResortName=Resort%20Name&TfrType=1&DepFltNo=EZYFltNo&ArrFltno=EZYFltNo&LG={language.ToUpper(CultureInfo.InvariantCulture)}&Market={marketCode}&BB=Board&Star=5&HC=No&MarketingOptin=Y");
            actResult.UnsubscribeLink.Should().NotBeNull();
            actResult.UnsubscribeLink.Should().BeEquivalentTo($"https://www.easyjet.com/{language}/holidays/marketing-research-unsubscribe?encEmail={EncryptionUtils.EncryptValue(customerPreferencesRequest.Email, _marketingSettings.Value.EncryptionPassword, _marketingSettings.Value.EncryptionSalt)}");
        }

        [Theory]
        [AutoMoqData]
        public void BuildUnsubscribeLink_GeneratesCorrectLink(string email, string language)
        {
            _languageSettings.Value.BasePaths = new Dictionary<string, string> { { language, $"{language}/holidays" } };

            var result = _marketingService.BuildUnsubscribeLink(email, language);

            result.Should().BeEquivalentTo($"https://www.easyjet.com/{language}/holidays/marketing-research-unsubscribe?encEmail={EncryptionUtils.EncryptValue(email, _marketingSettings.Value.EncryptionPassword, _marketingSettings.Value.EncryptionSalt)}");
        }

        [Fact]
        public async Task Unsubscribe_NullOrEmptyEmail_ThrowException()
        {
            // Arrange
            var request = new UnsubscribeRequest() { Email = string.Empty, };

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentNullException>(
                () =>
                _marketingService.Unsubscribe(request));
            await Assert.ThrowsAsync<ArgumentNullException>(() => _marketingService.Unsubscribe(null));
        }

        [Theory]
        [AutoMoqData]
        public async Task Unsubscribe_ErrorDuringSaving_ThrowException(string email)
        {
            // Arrange
            var request = new UnsubscribeRequest() { Email = email };

            _csatService.Setup(service => service.UnsubscribeEmail(It.IsAny<string>()))
                .Throws(new Exception());

            // Act & Assert
            await Assert.ThrowsAnyAsync<ApiException>(() => _marketingService.Unsubscribe(request));
        }

        [Fact]
        public void Unsubscribe_RequestHasNoSource_ParsesCSAT()
        {
            // Arrange
            var mockSourceFromRequest = string.Empty;

            // Act
            var source = Unsubscribe.ParseSource(mockSourceFromRequest);

            // Assert
            source.Should().Be(Source.CSAT);
        }

        [Fact]
        public void Unsubscribe_RequestHasCSATSource_ParsesCSAT()
        {
            // Arrange
            var mockSourceFromRequest = "csat";

            // Act
            var source = Unsubscribe.ParseSource(mockSourceFromRequest);

            // Assert
            source.Should().Be(Source.CSAT);
        }

        [Fact]
        public void Unsubscribe_RequestHasAnyNonEmptySource_ParsesCSAT()
        {
            // Arrange
            var mockSourceFromRequest = "test";

            // Act
            var source = Unsubscribe.ParseSource(mockSourceFromRequest);

            // Assert
            source.Should().Be(Source.CSAT);
        }

        [Fact]
        public void Unsubscribe_RequestHasFeefoSource_ParsesFeefo()
        {
            // Arrange
            var mockSourceFromRequest = "feefo";

            // Act
            var source = Unsubscribe.ParseSource(mockSourceFromRequest);

            // Assert
            source.Should().Be(Source.FEEFO);
        }

        [Fact]
        public async Task DecryptEmail_WhenCorrectEmail_ShouldReturnDecryptedDataAsync()
        {
            // Arrange
            var testEmail = "test@test.com";
            var encyptedEmail = EncryptionUtils.EncryptValue(testEmail, _marketingSettings.Value.EncryptionPassword, _marketingSettings.Value.EncryptionSalt);

            // Act
            var decryptedEmail = await _marketingService.DecryptEmailAddress(encyptedEmail);

            // Assert
            decryptedEmail.Should().Be(testEmail);
        }

        [Theory]
        [AutoMoqData]
        public async Task DecryptEmail_WhenEmptyEmail_ShouldThrowException()
        {
            // Arrange
            var testEmail = string.Empty;

            //Act & Assert
            await Assert.ThrowsAnyAsync<ArgumentNullException>(() => _marketingService.DecryptEmailAddress(testEmail));
        }

        [Fact]
        public async Task AddToVerify_NullOrEmptyEmailsList_EmptyReturn()
        {
            var exceptionNull = await Record.ExceptionAsync(() => _marketingService.AddToVerify(null));

            var exceptionEmpty = await Record.ExceptionAsync(() => _marketingService.AddToVerify(Enumerable.Empty<string>()));

            _marketingPreferencesRepositoryMock.Verify(repository => repository.SaveAsync(It.IsAny<IEnumerable<MarketingPreferences>>()), Times.Never);

            Assert.Null(exceptionNull);

            Assert.Null(exceptionEmpty);
        }

        [Theory]
        [AutoMoqData]
        public async Task AddToVerify_CorrectInput_Save(List<string> emails)
        {
            var possibleException = await Record.ExceptionAsync(() => _marketingService.AddToVerify(emails));

            _marketingPreferencesRepositoryMock.Verify(repository => repository.SaveAsync(It.IsAny<IEnumerable<MarketingPreferences>>()), Times.Once);

            Assert.Null(possibleException);
        }

        [Theory]
        [AutoMoqData]
        public async Task AddToVerify_CorrectInput_Save_ErrorDuringSaving_ThrowException(List<string> emails)
        {
            _marketingPreferencesRepositoryMock.Setup(repository => repository.SaveAsync(It.IsAny<IEnumerable<MarketingPreferences>>()))
                .Throws(new Exception());

            await Assert.ThrowsAnyAsync<ApiException>(() => _marketingService.AddToVerify(emails));
        }
    }
}