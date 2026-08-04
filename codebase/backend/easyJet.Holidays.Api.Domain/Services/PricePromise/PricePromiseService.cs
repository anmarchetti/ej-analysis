using Amazon.CloudFront;
using easyJet.Holidays.Api.Domain.Data.PrisePromise;
using easyJet.Holidays.Api.Domain.Interfaces.Notification;
using easyJet.Holidays.Api.Domain.Interfaces.PricePromise;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Domain.Services.PricePromise
{
    public class PricePromiseService : IPricePromiseService
    {
        private readonly IPricePromiseRepository _pricePromiseRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly ILogger<PricePromiseService> _logger;
        private readonly AwsSettingsSNS _snsSettings;
        private readonly ApiSettings _apiSettings;

        public PricePromiseService(
            IPricePromiseRepository pricePromiseRepository,
            INotificationRepository notificationRepository,
            ILogger<PricePromiseService> logger,
            IOptions<ApiSettings> apiSettings,
            IOptions<AwsSettings> awsSettings)
        {
            _pricePromiseRepository = pricePromiseRepository;
            _notificationRepository = notificationRepository;
            _logger = logger;
            var awsSettings1 = awsSettings.Value ?? throw new ArgumentNullException(nameof(awsSettings));
            _snsSettings = awsSettings1.SNS ?? throw new ArgumentNullException(nameof(awsSettings));
            _apiSettings = apiSettings.Value ?? throw new ArgumentNullException(nameof(apiSettings));
        }

        /// <summary>
        /// Create price promise request item
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        public async Task<string> Create(PricePromiseModel model)
        {
            // create item
            var attachments = await _pricePromiseRepository.Create(model);
            var fileNames = attachments.Select(x => x.FileName).ToList();
            _logger.LogInformation("Added price promise items: {Names}", string.Join("|", fileNames));

            // send notification
            var message = BuildMessage(model, fileNames);
            var msgId = await _notificationRepository.Send(_snsSettings.Topics.PricePromise, _apiSettings.PricePromise.Subject, message);

            return msgId;
        }

        private string BuildMessage(PricePromiseModel model, IEnumerable<string> fileNames)
        {
            var screenLinks = fileNames.Select(BuildSignedUrl);

            return _apiSettings.PricePromise.BodyTemplate
                .Replace("{Name}", model.Name)
                .Replace("{BookingReference}", model.BookingReference)
                .Replace("{MarketCode}", model.MarketCode ?? "-")
                .Replace("{DepartureDate}", DateFormatUtils.DateOnly(model.DepartureDate))
                .Replace("{SameDatesOfTravel}", model.SameDatesOfTravel.ToString())
                .Replace("{DifferentCompany}", model.DifferentCompany.ToString())
                .Replace("{SameFlights}", model.SameFlights.ToString())
                .Replace("{SamePartyComposition}", model.SamePartyComposition.ToString())
                .Replace("{SameRoomType}", model.SameRoomType.ToString())
                .Replace("{InclusiveOn23kg}", model.InclusiveOn23kg.ToString())
                .Replace("{BookedWithinLast24h}", model.BookedWithinLast24h.ToString())
                .Replace("{InclusiveOfTransfers}", model.InclusiveOfTransfers.ToString())
                .Replace("{Link}", model.Link)
                .Replace("{Screen}", string.Join(Environment.NewLine, screenLinks))
            ;
        }

        /// <summary>
        /// Build signed URL for screenshots
        /// </summary>
        /// <param name="fileName">File relative location in bucket</param>
        /// <returns>Signed url</returns>
        private string BuildSignedUrl(string fileName)
        {
            var url = $"{_apiSettings.PricePromise.CloudFront.BaseUrl}/{Uri.EscapeUriString(fileName)}";
            var privateKey = Base64Helper.Decode(_apiSettings.PricePromise.CloudFront.PrivateKey);
            var signedUrl = AmazonCloudFrontUrlSigner.GetCannedSignedURL(
                url,
                new StringReader(privateKey),
                _apiSettings.PricePromise.CloudFront.KeyPairId,
                DateTimeOffset.UtcNow.AddDays(_apiSettings.PricePromise.CloudFront.ExpirationDays).DateTime
             );

            return signedUrl;
        }
    }
}