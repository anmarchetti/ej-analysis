using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.TradePortal.TradeAgentFeedback;
using easyJet.Holidays.Api.Domain.Interfaces.Feedback;
using easyJet.Holidays.Api.Domain.Interfaces.Notification;
using easyJet.Holidays.Api.Domain.Services.Feedback;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Tests.Domain;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.TradeAgentFeedback
{
    public class TradeAgentFeedbackServiceTests
    {
        private readonly IFixture _fixture;
        private readonly TradeAgentFeedbackService _sut;
        private readonly Mock<ILogger<TradeAgentFeedbackService>> _loggerMock = new();
        private readonly Mock<ITradeAgentFeedbackRepository> _tradeAgentFeedbackRepositoryMock = new();
        private readonly Mock<INotificationRepository> _notificationRepositoryMock = new();

        public TradeAgentFeedbackServiceTests()
        {
            _fixture = FixtureUtils.AutoMoqFixture();
            _fixture.Inject(Options.Create(new AwsSettings
            {
                SNS = new AwsSettingsSNS
                {
                    Topics = new AwsSettingsSNSTopics
                    {
                        TradeAgentFeedback = "TradeAgentFeedback"
                    }
                }
            }));
            _fixture.Inject(Options.Create(new TradePortalSettings
            {
                TradeAgentFeedback = new TradeAgentFeedbackSettings
                {
                    BodyTemplate = new[] { "{Name} {TradeAgentName} {ABTA} {Email} {WebSiteRelated} {TradeRelated} {OtherRelated} {FeedbackText} {Documents}" },
                    Subject = "Subject",
                }
            }));

            _sut = new TradeAgentFeedbackService(
                _loggerMock.Object,
                _tradeAgentFeedbackRepositoryMock.Object,
                _notificationRepositoryMock.Object,
                _fixture.Create<IOptions<AwsSettings>>(),
                _fixture.Create<IOptions<TradePortalSettings>>());
        }

        [Fact]
        public async Task BuildMessageTests()
        {
            var feedback = new TradeAgentFeedbackRequest
            {
                Name = "Name",
                TradeAgentName = "TradeAgentName",
                ABTANumber = "ABTANumber",
                Email = "Email",
                IsWebsiteRelated = true,
                IsTradeFeedback = true,
                IsOtherFeedback = true,
                FeedbackText = "FeedbackText",
            };

            var result = await _sut.Create(feedback);
            var expected = "Name TradeAgentName ABTANumber Email True True True FeedbackText no supporting documents";

            _notificationRepositoryMock.Verify(x => x.Send(It.IsAny<string>(), It.IsAny<string>(), expected));
        }
    }
}
