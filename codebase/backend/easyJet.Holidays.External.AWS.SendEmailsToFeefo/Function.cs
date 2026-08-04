using Amazon.Lambda.Annotations;
using Amazon.Lambda.Core;
using Amazon.Lambda.SQSEvents;
using easyJet.Holidays.External.AWS.SendEmailsToFeefo.Services;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace easyJet.Holidays.External.AWS.SendEmailsToFeefo;
/// <summary>
/// A Lambda function that processes incoming messages from an SQS queue,
/// checks email consent for marketing, and sends data to Feefo for bookings.
/// </summary>
public class Function
{
    private readonly IFeefoProcessor _processor;

    /// <summary>
    /// standard ctor
    /// </summary>
    /// <param name="processor"></param>
    public Function(IFeefoProcessor processor)
    {
        _processor = processor;
    }

    /// <summary>
    /// A simple function that gets list of bookings landing the day before lambda launch and put it into the dynamo db table to be sent over to the airline
    /// </summary>
    /// <param name="sqsEvent"></param>
    /// <returns></returns>
    [LambdaFunction]
    public async Task<SQSBatchResponse> Run(SQSEvent sqsEvent)
    {
        var response = await _processor.Process(sqsEvent?.Records ?? []);
        
        return response;
    }
}