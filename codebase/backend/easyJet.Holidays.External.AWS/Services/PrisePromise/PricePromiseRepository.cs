using Amazon.DynamoDBv2.Model;
using Amazon.S3.Transfer;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.PrisePromise;
using easyJet.Holidays.Api.Domain.Interfaces.PricePromise;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.AWS.Services.PrisePromise
{
    public class PricePromiseRepository : IPricePromiseRepository
    {
        public static readonly string IdAttr = "Id";
        public static readonly string NameAttr = "Name";
        public static readonly string BookingReferenceAttr = "BookingReference";
        public static readonly string MarketCodeAttr = "MarketCode";
        public static readonly string DepartureDateAttr = "DepartureDate";
        public static readonly string DifferentCompany = "DifferentCompany";
        public static readonly string SameDatesOfTravelAttr = "SameDatesOfTravel";
        public static readonly string SameFlightsAttr = "SameFlights";
        public static readonly string SamePartyCompositionAttr = "SamePartyComposition";
        public static readonly string SameRoomTypeAttr = "SameRoomType";
        public static readonly string InclusiveOn23kgAttr = "InclusiveOn23kg";
        public static readonly string BookedWithinLast24h = "BookedWithinLast24h";
        public static readonly string InclusiveOfTransfersAttr = "InclusiveOfTransfers";
        public static readonly string LinkAttr = "Link";
        public static readonly string ScreenshotAttr = "Screenshot";
        public static readonly string CreatedAttr = "Created";

        private readonly AwsSettings _awsSettings;
        private readonly AwsClient _awsClient;
        private readonly ILogger<PricePromiseRepository> _logger;

        public PricePromiseRepository(
            AwsClient awsClient,
            IOptions<AwsSettings> awsSettings,
            ILogger<PricePromiseRepository> logger)
        {
            _awsSettings = awsSettings.Value ?? throw new ArgumentNullException(nameof(awsSettings));
            _awsClient = awsClient;
            _logger = logger;
        }

        public async Task<IEnumerable<PriceAttachment>> Create(PricePromiseModel model)
        {
            try
            {
                var attachments = new List<PriceAttachment>();
                // upload attachments
                using (var s3Client = _awsClient.GetS3Client())
                {
                    foreach (var screenshot in model.Screenshots)
                    {
                        var transferUtility = new TransferUtility(s3Client);

                        var itemId = Guid.NewGuid().ToString();
                        var fileName = $"{itemId}-{RemoveInvalidChars(screenshot.FileName)}";
                        var filePath = $"s3://{_awsSettings.S3.Buckets.PricePromise}/{fileName}";
                        _logger.LogInformation("Uploading file {FilePath}", filePath);
                        using (var fileStream = screenshot.OpenReadStream())
                            await transferUtility.UploadAsync(fileStream, _awsSettings.S3.Buckets.PricePromise, fileName);
                        attachments.Add(new PriceAttachment
                        {
                            FileName = fileName,
                            FilePath = filePath
                        });
                    }
                }

                // create record in DynamoDB
                using (var client = _awsClient.GetClient())
                {
                    var request = new PutItemRequest
                    {
                        TableName = _awsSettings.Storage.Tables.PricePromise,
                        Item = new Dictionary<string, AttributeValue>()
                    {
                        {
                            IdAttr,
                            new AttributeValue { S = Guid.NewGuid().ToString()}
                        },
                        {
                            NameAttr,
                            new AttributeValue { S = model.Name}
                        },
                        {
                            BookingReferenceAttr,
                            new AttributeValue { S = model.BookingReference}
                        },
                        {
                            MarketCodeAttr,
                            new AttributeValue { S = model.MarketCode ?? "-"}
                        },
                        {
                            DepartureDateAttr,
                            new AttributeValue { S = DateFormatUtils.Iso8601(model.DepartureDate)}
                        },
                        {
                            DifferentCompany,
                            model.DifferentCompany.HasValue ? new AttributeValue { BOOL = model.DifferentCompany.Value } : new AttributeValue { NULL = true }
                        },
                        {
                            SameDatesOfTravelAttr,
                            new AttributeValue { BOOL = model.SameDatesOfTravel}
                        },
                        {
                            SameFlightsAttr,
                            new AttributeValue { BOOL = model.SameFlights}
                        },
                        {
                            SamePartyCompositionAttr,
                            new AttributeValue { BOOL = model.SamePartyComposition}
                        },
                        {
                            SameRoomTypeAttr,
                            new AttributeValue { BOOL = model.SameRoomType}
                        },
                        {
                            InclusiveOn23kgAttr,
                            new AttributeValue { BOOL = model.InclusiveOn23kg}
                        },
                        {
                            BookedWithinLast24h,
                            new AttributeValue { BOOL = model.BookedWithinLast24h}
                        },
                        {
                            InclusiveOfTransfersAttr,
                            new AttributeValue { BOOL = model.InclusiveOfTransfers}
                        },
                        {
                            LinkAttr,
                            new AttributeValue { S = model.Link}
                        },
                        /* Using the same type and doing concatination of strings instead of use "SS" type of the field 
                         * because previously "ScreenshotAttr" was single string and need to sypport previous version as well. */
                        {
                            ScreenshotAttr,
                            new AttributeValue { S = string.Join("|", attachments.Select(x => x.FilePath))}
                        },
                        {
                            CreatedAttr,
                            new AttributeValue { N = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString()}
                        },
                    },
                    };

                    await client.PutItemAsync(request);
                }

                return attachments;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Cannot create price promise item");
                throw new ApiException(ApiExceptionCodes.PricePromiseCantCreate, null, ex);
            }
        }

        public string RemoveInvalidChars(string filename)
        {
            return string.Concat(filename.Split(Path.GetInvalidFileNameChars()));
        }
    }
}
