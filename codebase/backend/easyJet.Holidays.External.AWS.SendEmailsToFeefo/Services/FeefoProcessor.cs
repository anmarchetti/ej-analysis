using Amazon.Lambda.SQSEvents;
using easyJet.Holidays.Api.Domain.Interfaces.Marketing;
using easyJet.Holidays.External.AWS.SendEmailsToFeefo.Settings;
using easyJet.Holidays.External.Domain.Exceptions;
using easyJet.Holidays.External.Feefo.Interfaces;
using easyJet.Holidays.External.Feefo.Models.EnterSale;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;

namespace easyJet.Holidays.External.AWS.SendEmailsToFeefo.Services;

/// <inheritdoc cref="IFeefoProcessor"/>
public class FeefoProcessor : IFeefoProcessor
{
    private readonly IFeefoService _feefoService;
    private readonly ICsatService _csatService;
    private readonly IRandomGenerator _randomGenerator;
    private readonly ILogger<FeefoProcessor> _logger;
    private readonly LambdaSettings _lambdaSettings;

    /// <summary>
    /// standard ctor
    /// </summary>
    /// <param name="feefoService"></param>
    /// <param name="csatService"></param>
    /// <param name="randomGenerator"></param>
    /// <param name="logger"></param>
    /// <param name="lambdaOptions"></param>
    public FeefoProcessor(
        IFeefoService feefoService,
        ICsatService csatService,
        IRandomGenerator randomGenerator,
        ILogger<FeefoProcessor> logger,
        IOptions<LambdaSettings> lambdaOptions)
    {
        _feefoService = feefoService;
        _csatService = csatService;
        _randomGenerator = randomGenerator;
        _logger = logger;

        ArgumentNullException.ThrowIfNull(lambdaOptions);
        _lambdaSettings = lambdaOptions.Value;
    }

    /// <inheritdoc />
    public async Task<SQSBatchResponse> Process(ICollection<SQSEvent.SQSMessage> records)
    {
        ArgumentNullException.ThrowIfNull(records);

        var response = new SQSBatchResponse
        {
            BatchItemFailures = []
        };

        int count = 0;
        foreach (var message in records)
        {
            if (_randomGenerator.NextDouble() > _lambdaSettings.SampleRate) continue;

            var feefoEnterSale = JsonConvert.DeserializeObject<FeefoEnterSale>(message.Body);

            if (await HasEmailConsent(feefoEnterSale?.Email) &&
                await SendDataToFeefo(feefoEnterSale, message.MessageId, response))
            {
                count++;
            }
        }

        _logger.LogInformation("Sent {Count} booking to Feefo", count);

        return response;
    }

    private async Task<bool> HasEmailConsent(string email)
    {
        try
        {
            return await _csatService.CheckMarketingEmailConsent(email);
        }
        catch (ApiRequestException e) when (e.InnerException?.Message.Contains("status 404(NotFound)", StringComparison.InvariantCulture) == true)
        {
            return false;
        }
    }

    private async Task<bool> SendDataToFeefo(FeefoEnterSale feefoEnterSale, string messageId, SQSBatchResponse response)
    {
        if (!await _feefoService.SendData(feefoEnterSale))
        {
            response.BatchItemFailures.Add(new SQSBatchResponse.BatchItemFailure
            {
                ItemIdentifier = messageId
            });
            _logger.LogError("Failed to send data to Feefo for message {MessageId}", messageId);
            return false;
        }

        return true;
    }
}