using Amazon.CloudFront;
using easyJet.Holidays.Api.Domain.Data.TradePortal.TradeAgentFeedback;
using easyJet.Holidays.Api.Domain.Interfaces.Feedback;
using easyJet.Holidays.Api.Domain.Interfaces.Notification;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Domain.Services.Feedback
{
    /// <summary>
    /// Implementation of <see cref="ITradeAgentFeedbackService"/>
    /// </summary>
    public class TradeAgentFeedbackService : ITradeAgentFeedbackService
    {
        private readonly ILogger<TradeAgentFeedbackService> _logger;
        private readonly ITradeAgentFeedbackRepository _feedbackRepo;
        private readonly INotificationRepository _notificationRepo;

        private readonly AwsSettingsSNS _snsSettings;
        private readonly TradePortalSettings _tradePortalSettings;

        public TradeAgentFeedbackService(
            ILogger<TradeAgentFeedbackService> logger,
            ITradeAgentFeedbackRepository tradeAgentFeedbackRepository,
            INotificationRepository notificationRepository,
            IOptions<AwsSettings> awsSettings,
            IOptions<TradePortalSettings> tradePortalSettings
        )
        {
            _logger = logger;
            _feedbackRepo = tradeAgentFeedbackRepository;
            _notificationRepo = notificationRepository;

            _snsSettings = awsSettings?.Value?.SNS ?? throw new ArgumentNullException(nameof(awsSettings));
            _tradePortalSettings = tradePortalSettings?.Value ?? throw new ArgumentNullException(nameof(tradePortalSettings));
        }

        /// <inheritdoc />
        public async Task<string> Create(TradeAgentFeedbackRequest feedback)
        {
            var attachments = await _feedbackRepo.Create(feedback);
            var fileNames = attachments.Select(attachment => attachment.FileName);

            if (fileNames.Any())
            {
                _logger.LogInformation($"Attachments from feedback created: {string.Join("|", fileNames)}");
            }

            var message = BuildMessage(feedback, fileNames);
            var messageId = await _notificationRepo.Send(_snsSettings.Topics.TradeAgentFeedback, _tradePortalSettings.TradeAgentFeedback.Subject, message);

            return messageId;
        }

        private string BuildMessage(TradeAgentFeedbackRequest feedback, IEnumerable<string> fileNames)
        {
            var links = fileNames?.Select(fileName => BuildUrl(fileName));

            var supportingDocumentsValue = (links?.Any(value => !string.IsNullOrWhiteSpace(value)) ?? false)
                ? string.Join(Environment.NewLine, links)
                : "no supporting documents";

            var parsedTemplate = string.Join(Environment.NewLine, _tradePortalSettings.TradeAgentFeedback.BodyTemplate);

            var message = parsedTemplate.Replace("{Name}", feedback.Name)
                                        .Replace("{TradeAgentName}", feedback.TradeAgentName)
                                        .Replace("{ABTA}", feedback.ABTANumber)
                                        .Replace("{Email}", feedback.Email)
                                        .Replace("{WebSiteRelated}", feedback.IsWebsiteRelated.ToString())
                                        .Replace("{TradeRelated}", feedback.IsTradeFeedback.ToString())
                                        .Replace("{OtherRelated}", feedback.IsOtherFeedback.ToString())
                                        .Replace("{FeedbackText}", feedback.FeedbackText)
                                        .Replace("{Documents}", supportingDocumentsValue);

            return message;
        }

        private string BuildUrl(string fileName)
        {
            if (string.IsNullOrWhiteSpace(fileName))
                return null;

            var privateKey = Base64Helper.Decode(_tradePortalSettings.TradeAgentFeedback.CloudFront.PrivateKey);

            var url = $"{_tradePortalSettings.TradeAgentFeedback.CloudFront.BaseUrl}/{Uri.EscapeUriString(fileName)}";
            var signedUrl = AmazonCloudFrontUrlSigner.GetCannedSignedURL(
                url,
                new StringReader(privateKey),
                _tradePortalSettings.TradeAgentFeedback.CloudFront.KeyPairId,
                DateTimeOffset.UtcNow.AddDays(_tradePortalSettings.TradeAgentFeedback.CloudFront.ExpirationDays).DateTime
             );

            return signedUrl;
        }
    }
}
