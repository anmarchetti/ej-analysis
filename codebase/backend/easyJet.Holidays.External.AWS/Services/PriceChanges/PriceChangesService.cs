using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.PriceChanges;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Globalization;
using System.Net;

namespace easyJet.Holidays.External.AWS.Services.PriceChanges
{
    /// <summary>
    /// Store price changes in dynamoDB table "PriceChanges"
    /// </summary>
    public class PriceChangesService : IPriceChangesService
    {
        private const string AttributeId = "Id";
        private const string AttributeTimestamp = "Timestamp";
        private const string AttributeRequest = "Request";
        private const string AttributeCurrency = "Currency";
        private const string AttributePreviousPrice = "PreviousPrice";
        private const string AttributeNewPrice = "NewPrice";
        private const string AttributeDate = "Date";
        private const string AttributeDifference = "Difference";

        private readonly AwsSettings _awsSettings;
        private readonly AwsClient _awsClient;
        private readonly ILogger<PriceChangesService> _logger;
        private readonly IReferenceDataService _referenceDataService;
        private readonly ILanguageService _languageService;

        public PriceChangesService(
            AwsClient awsClient,
            IOptions<AwsSettings> awsSettings,
            ILogger<PriceChangesService> logger,
            IReferenceDataService referenceDataService,
            ILanguageService languageService)
        {
            _awsSettings = awsSettings.Value ?? throw new ArgumentNullException(nameof(awsSettings));
            _awsClient = awsClient;
            _logger = logger;
            _referenceDataService = referenceDataService;
            _languageService = languageService;
        }

        /// <inheritdoc />
        public async Task CreatePriceChangeRecord(string requestBody, MarketSettings market, decimal prevPrice, decimal newPrice, decimal prevPricePP, decimal newPricePP)
        {
            var priceJumpSettings = await _referenceDataService.GetPriceJumpSettings(_languageService.GetCurrentLanguage());
            var priceDif = newPrice - prevPrice;
            var priceDifPP = newPricePP - prevPricePP;

            if (prevPrice == 0 || newPrice == 0 || prevPrice == newPrice || Math.Abs(priceDif) < priceJumpSettings.AllowedPriceDifference)
            {
                return;
            }

            try
            {
                _logger.LogInformation("Price changed. Request body: {RequestBody}, prev price: {PrevPrice}, new price: {NewPrice}, prevPricePP: {PrevPricePP}, new PricePP: {NewPricePP}",
                    requestBody, prevPrice, newPrice, prevPricePP, newPricePP);

                using (IAmazonDynamoDB client = _awsClient.GetClient())
                {
                    var request = new PutItemRequest
                    {
                        TableName = _awsSettings.Storage.Tables.PriceChanges,
                        Item = new Dictionary<string, AttributeValue>()
                        {
                            {
                                AttributeDate,
                                new AttributeValue { S = DateFormatUtils.DateOnly(DateTimeOffset.UtcNow) }
                            },
                            {
                                AttributeTimestamp,
                                new AttributeValue { N = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString(CultureInfo.InvariantCulture) }
                            },
                            {
                                AttributeId,
                                new AttributeValue { S = Guid.NewGuid().ToString() }
                            },
                            {
                                AttributeRequest,
                                new AttributeValue { S = requestBody }
                            },
                            {
                                AttributeCurrency,
                                new AttributeValue { S = market.Currency.Code }
                            },
                            {
                                AttributePreviousPrice,
                                new AttributeValue { N = prevPrice.ToString(CultureInfo.InvariantCulture) }
                            },
                            {
                                AttributeNewPrice,
                                new AttributeValue { N = newPrice.ToString(CultureInfo.InvariantCulture) }
                            },
                            {
                                AttributeDifference,
                                new AttributeValue { N = (newPrice - prevPrice).ToString(CultureInfo.InvariantCulture) }
                            },
                        },
                    };


                    await client.PutItemAsync(request);
                }
            }
            catch (Exception ex)
            {
                // Do not need throw exception because it's just price changes logging.
                _logger.LogError(ex, $"Can not log price changes. Search: \"{requestBody}\". Previous price: {prevPrice}. New price: {newPrice}");
            }

            if ((priceJumpSettings.MaxPriceJumpAmount > 0 && priceJumpSettings.MaxPriceJumpAmount < priceDif) ||
                (priceJumpSettings.MaxPriceJumpAmountPP > 0 && priceJumpSettings.MaxPriceJumpAmountPP < priceDifPP) ||
                (priceJumpSettings.MaxPriceJumpPercentage > 0 && priceJumpSettings.MaxPriceJumpPercentage < (priceDif / newPrice) * 100) ||
                (priceJumpSettings.MaxPriceJumpPercentagePP > 0 && priceJumpSettings.MaxPriceJumpPercentagePP < (priceDifPP / newPricePP) * 100))
            {
                throw new ApiException(ApiExceptionCodes.SearchPackagesPriceJumpError,
                    $"Price changed. prev price: {prevPrice}, new price: {newPrice}, prevPricePP: {prevPricePP}, new PricePP: {newPricePP}",
                    null,
                    null,
                    HttpStatusCode.BadRequest);
            }

        }
    }
}
