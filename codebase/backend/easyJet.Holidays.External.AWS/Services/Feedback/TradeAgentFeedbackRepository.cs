using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.DynamoDB.TradePortal;
using easyJet.Holidays.Api.Domain.Data.Feedback;
using easyJet.Holidays.Api.Domain.Data.TradePortal.TradeAgentFeedback;
using easyJet.Holidays.Api.Domain.Interfaces.Feedback;
using easyJet.Holidays.Api.Domain.Interfaces.FileService;
using easyJet.Holidays.Api.Domain.Interfaces.Repositories;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.AWS.Services.Feedback
{
    public class TradeAgentFeedbackRepository : ITradeAgentFeedbackRepository
    {
        private readonly ILogger<TradeAgentFeedbackRepository> _logger;
        private readonly IS3FileService _s3FileService;
        private readonly IAWSDbRepository<TradeAgentFeedback> _awsDbRepository;
        private readonly AwsSettings _awsSettings;

        public TradeAgentFeedbackRepository(
            ILogger<TradeAgentFeedbackRepository> logger,
            IOptions<AwsSettings> awsSettings,
            IS3FileService s3FileService,
            IAWSDbRepository<TradeAgentFeedback> awsDbRepository)
        {
            _logger = logger;
            _s3FileService = s3FileService;
            _awsDbRepository = awsDbRepository;
            _awsSettings = awsSettings?.Value ?? throw new ArgumentNullException(nameof(awsSettings));
        }

        public async Task<IEnumerable<TradeAgentFeedbackAttachment>> Create(TradeAgentFeedbackRequest feedback)
        {
            try
            {
                List<TradeAgentFeedbackAttachment> uploadedAttachments = new List<TradeAgentFeedbackAttachment>();
                if (feedback.Documents?.Any() ?? false)
                {
                    uploadedAttachments = await UploadAttachmentsToS3(feedback);
                }

                var feedbackDbModel = new TradeAgentFeedback
                {
                    Id = Guid.NewGuid().ToString(),
                    Created = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString(),
                    Attachments = uploadedAttachments.Select(attachment => attachment.FilePath).ToList(),
                    Name = feedback.Name,
                    TradeAgentName = feedback.TradeAgentName,
                    ABTANumber = feedback.ABTANumber,
                    Email = feedback.Email,
                    FeedbackText = feedback.FeedbackText,
                    IsOtherFeedback = feedback.IsOtherFeedback,
                    IsTradeFeedback = feedback.IsTradeFeedback,
                    IsWebsiteRelated = feedback.IsWebsiteRelated
                };

                await _awsDbRepository.SaveAsync(feedbackDbModel);

                return uploadedAttachments;
            }
            catch (Exception exc)
            {
                _logger.LogError(exc, "Persisting Feedback failed");
                throw new ApiException(ApiExceptionCodes.FeedbackSaveError, null, exc);
            }
        }

        private async Task<List<TradeAgentFeedbackAttachment>> UploadAttachmentsToS3(TradeAgentFeedbackRequest feedback)
        {
            var attachments = new List<TradeAgentFeedbackAttachment>();
            foreach (var attachment in feedback?.Documents)
            {
                var guid = Guid.NewGuid().ToString();
                var sanitizedFileName = $"{guid}-{RemoveInvalidChars(attachment.FileName)}";
                var filePath = $"s3://{_awsSettings.S3.Buckets.TradeAgentFeedbackAttachments}/{sanitizedFileName}";
                _logger.LogInformation($"Uploading file: {filePath}");


                using (var fileStream = attachment.OpenReadStream())
                {
                    await _s3FileService.UploadFile(_awsSettings.S3.Buckets.TradeAgentFeedbackAttachments,
                        sanitizedFileName, fileStream);
                }

                attachments.Add(new TradeAgentFeedbackAttachment()
                {
                    FileName = sanitizedFileName,
                    FilePath = filePath
                });
            }

            return attachments;
        }

        public string RemoveInvalidChars(string filename)
        {
            return string.Concat(filename.Split(Path.GetInvalidFileNameChars()));
        }
    }
}
