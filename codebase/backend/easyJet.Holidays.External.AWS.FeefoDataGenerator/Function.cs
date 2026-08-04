using Amazon.Lambda.Annotations;
using Amazon.Lambda.Core;
using easyJet.Holidays.External.AWS.FeefoDataGenerator.Services;
using Microsoft.Extensions.Logging;
using System.Runtime.CompilerServices;


// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]
[assembly: InternalsVisibleTo("easyJet.Holidays.External.AWS.FeefoDataGenerator.Tests")]

namespace easyJet.Holidays.External.AWS.FeefoDataGenerator;
/// <summary>
/// A Lambda function that retrieves bookings from the Eskel API for the previous day,
/// transforms them into Feefo sales entries, and sends them to an SQS queue.
/// </summary>
public class Function
{
    private readonly IFeefoDataGenerationHandler _handler;
    private readonly ILogger<Function> _logger;

    /// <summary>
    /// Initializes a new instance of the <see cref="Function"/> class.
    /// </summary>
    /// <param name="handler"></param>
    /// <param name="logger">The logger used for logging information and errors.</param>
    public Function(IFeefoDataGenerationHandler handler, ILogger<Function> logger)
    {
        _handler = handler;
        _logger = logger;
    }

    /// <summary>
    /// The main entry point for the Lambda function.
    /// Defers data generation to underlying handler
    /// </summary>
    /// <returns>A task that represents the asynchronous operation.</returns>
    [LambdaFunction]
    public async Task Handler(ILambdaContext ctx)
    {
        _logger.LogInformation("Getting bookings booked yesterday from Eskel API!");
        
        await _handler.Generate();
    }
}
