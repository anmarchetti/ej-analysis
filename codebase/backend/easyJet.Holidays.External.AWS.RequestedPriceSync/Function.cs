using Amazon.Lambda.Annotations;
using Amazon.Lambda.Core;
using easyJet.Holidays.External.AWS.RequestedPriceSync.Services;
using Newtonsoft.Json;
using Amazon.Lambda.SQSEvents;
using easyJet.Holidays.External.AWS.Services.RequestedPrice.Models;
using Microsoft.Extensions.Logging;
using System.Runtime.CompilerServices;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]
[assembly: InternalsVisibleTo("easyJet.Holidays.External.AWS.RequestedPriceSync.Tests")]
namespace easyJet.Holidays.External.AWS.RequestedPriceSync;

/// <summary>
/// 
/// </summary>
public class Function
{
    private readonly ISettableLanguageService _languageService;
    private readonly IRequestedPriceFlow _flow;
    private readonly ILogger<Function> _logger;

    /// <summary>
    /// standard ctor
    /// </summary>
    public Function(ISettableLanguageService languageService, IRequestedPriceFlow flow, ILogger<Function> logger)
    {
        _languageService = languageService;
        _flow = flow;
        _logger = logger;
    }

    /// <summary>
    /// Function entry point: fetch and combine Atcom offers to build quick access to the cheapest price by different types of filters
    /// </summary>
    /// <param name="sqsEvent">event trigger</param>
    /// <param name="context"></param>
    /// <returns></returns>
    [LambdaFunction]
    public async Task Sync(SQSEvent sqsEvent, ILambdaContext context)
    {
        ArgumentNullException.ThrowIfNull(sqsEvent);

        _logger.LogInformation("Starting RequestedPriceSync function");

        var input = ReadInput(sqsEvent);

        foreach (var record in input)
        {
            _languageService.SetLanguage(record.Language);

            await _flow.Process(record);
        }
    }

    /// <summary>  
    /// Reads and parses the input from the SQS event.  
    /// Validates the input to ensure it contains the required fields.  
    /// </summary>  
    /// <param name="sqsEvent">The SQS event containing the input data.</param>  
    /// <returns>A <see cref="RequestedPriceSyncInput"/> object containing the parsed input data.</returns>  
    /// <exception cref="ArgumentNullException">Thrown if the event or its body is null.</exception>  
    /// <exception cref="ArgumentException">Thrown if the event contains no records or required fields are missing.</exception>  
    internal IEnumerable<RequestedPriceSyncInput> ReadInput(SQSEvent sqsEvent)
    {
        ArgumentNullException.ThrowIfNull(sqsEvent);

        if (sqsEvent.Records.Count == 0)
        {
            throw new ArgumentException("No records found in the SQS event.");
        }

        var records = new List<RequestedPriceSyncInput>();
        var exceptions = new List<Exception>();

        for (var i = 0; i < sqsEvent.Records.Count; i++)
        {
            try
            {
                var inputRecord = JsonConvert.DeserializeObject<RequestedPriceSyncInput>(sqsEvent.Records[i].Body);

                ArgumentNullException.ThrowIfNull(inputRecord);
                ArgumentException.ThrowIfNullOrEmpty(inputRecord.Market);
                ArgumentException.ThrowIfNullOrEmpty(inputRecord.Language);

                _logger.LogInformation("Input {Index}: {Body}", i, sqsEvent.Records[i].Body);
                records.Add(inputRecord);
            }
            catch (Exception exception)
            {
                exceptions.Add(exception);
            }
        }

        if (exceptions.Count != 0)
        {
            throw new AggregateException("Failed to read input.", exceptions);
        }

        return records;
    }
}
