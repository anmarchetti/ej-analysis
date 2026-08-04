using AutoFixture;
using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Api.Domain.Data.DynamoDB.HelpCenter;
using easyJet.Holidays.Api.Domain.Data.HelpCenter;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.HelpCenter;
using easyJet.Holidays.Api.Domain.Interfaces.Repositories;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using easyJet.Holidays.Api.Domain.Services.HelpCenter;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Tests.Domain;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;

namespace easyJet.Holidays.Api.Domain.Tests.Controllers
{
    public class HelpCentreControllerTests
    {
        private readonly IFixture _fixture;
        private readonly HelpCentreController _sut;
        private readonly Mock<IFaqService> _faqServiceMock = new();
        private readonly Mock<IMarketService> _marketServiceMock = new();
        private readonly Mock<ILanguageService> _languageServiceMock = new();
        private readonly Mock<ITradeAgentAuthenticationService> _tradeAgentAuthServiceMock = new();
        private readonly Mock<IAWSDbRepository<FeedbackInfo>> _feedbackRepositoryMock = new();
        private readonly Mock<ILogger<FeedbackService>> _loggerMock = new();
        private readonly ApiSettings _apiSettings = new()
        {
            BookingFeedback = new()
            {
                BusinessTags = new()
            }
        };

        public HelpCentreControllerTests()
        {
            _fixture = FixtureUtils.AutoMoqFixture();

            _sut = new HelpCentreController(
                _faqServiceMock.Object,
                new FeedbackService(_feedbackRepositoryMock.Object,
                    _loggerMock.Object,
                    _tradeAgentAuthServiceMock.Object,
                    Options.Create(_apiSettings)),
                _marketServiceMock.Object,
                _languageServiceMock.Object);
        }

        [Fact]
        public async Task Save_Faq_NoMarket_UsesCurrentMarket()
        {
            // Arrange
            _marketServiceMock
                .Setup(x => x.GetCurrentMarket())
                .Returns(new MarketSettings
                {
                    Code = "UK",
                });

            var model = new FaqInfo();

            // Act
            await _sut.Save(model);

            // Assert
            _faqServiceMock.Verify(x => x.Save(It.Is<FaqInfo>(m => m.MarketCode == "UK")));
        }

        [Fact]
        public async Task Save_Faq_HasMarket_UsesModelMarket()
        {
            // Arrange
            _marketServiceMock
                .Setup(x => x.GetCurrentMarket())
                .Returns(new MarketSettings
                {
                    Code = "UK",
                });

            var model = new FaqInfo { MarketCode = "CH" };

            // Act
            await _sut.Save(model);

            // Assert
            _faqServiceMock.Verify(x => x.Save(It.Is<FaqInfo>(m => m.MarketCode == "CH")));
        }

        [Fact]
        public async Task Save_Feedback_NoMarket_UsesCurrentMarket()
        {
            // Arrange
            _marketServiceMock
                .Setup(x => x.GetCurrentMarket())
                .Returns(new MarketSettings
                {
                    Code = "UK",
                });

            var model = new FeedbackInfoRequest();

            // Act
            await _sut.Save(model);

            // Assert
            _feedbackRepositoryMock.Verify(x => x.SaveAsync(It.Is<FeedbackInfo>(m => m.MarketCode == "UK")));
        }

        [Fact]
        public async Task Save_Feedback_HasMarket_UsesCurrentMarket()
        {
            // Arrange
            _marketServiceMock
                .Setup(x => x.GetCurrentMarket())
                .Returns(new MarketSettings
                {
                    Code = "UK",
                });

            var model = new FeedbackInfoRequest
            {
                MarketCode = "CH",
            };

            // Act
            await _sut.Save(model);

            // Assert
            _feedbackRepositoryMock.Verify(x => x.SaveAsync(It.Is<FeedbackInfo>(m => m.MarketCode == "CH")));
        }

        [Theory]
        [InlineData(true, "Trade Portal/B2B", "Trade Portal/B2B", "")]
        [InlineData(false, "", "Trade Portal/B2B", "")]
        public async Task Save_Feedback_DifferentEnvironments_ShouldRepresentEnvironment(bool isTradePoral, string expectedBusinessTag, string tradePortalTag, string defaultTag)
        {
            // Arrange
            _apiSettings.BookingFeedback.BusinessTags.TradePortal = tradePortalTag;
            _apiSettings.BookingFeedback.BusinessTags.DefaultWebsite = defaultTag;
            _tradeAgentAuthServiceMock
                .Setup(x => x.IsTradePortalEnv())
                .Returns(isTradePoral);

            var model = new FeedbackInfoRequest();

            // Act
            await _sut.Save(model);

            // Assert
            _feedbackRepositoryMock.Verify(x =>
                x.SaveAsync(It.Is<FeedbackInfo>(y => y.Business == expectedBusinessTag)));
        }
    }
}
