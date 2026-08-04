using Amazon.Lambda.Annotations;
using Amazon.Lambda.Core;
using Amazon.Lambda.SQSEvents;
using easyJet.Holidays.External.AWS.CheapestMonthSync.Services.Interfaces;

[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace easyJet.Holidays.External.AWS.CheapestMonthSync;
/// <summary>
/// The function.
/// </summary>

#pragma warning disable CA1716 // Identifiers should not match keywords
public class Function
#pragma warning restore CA1716 // Identifiers should not match keywords
{
    private readonly ICheapestMonthSyncHandler _cheapestMonthSyncHandler;

    /// <summary>
    /// Initializes a new instance of the <see cref="Function"/> class.
    /// </summary>
    /// <param name="cheapestMonthSyncHandler">The cheapestMonthSyncHandler.</param>
    public Function(
         ICheapestMonthSyncHandler cheapestMonthSyncHandler)
    {
        _cheapestMonthSyncHandler = cheapestMonthSyncHandler;
    }

    // EXAMPLE MESSAGE BODY : "{\"RegionDetails\":{\"CountryCode\":\"AT\",\"RegionCode\":\"ATIN\",\"RelatedRegions\":null},\"AirportCode\":\"LGW\"}"
    /// <summary>
    /// Runs the cheapest month sync.
    /// </summary>
    /// <param name="sqsEvent">The sqs event.</param>
    /// <param name="context">The context.</param>
    /// <returns>A Task.</returns>
    [LambdaFunction]
    public async Task Run(SQSEvent sqsEvent, ILambdaContext context) =>
        await _cheapestMonthSyncHandler.Handle(sqsEvent);
   
}