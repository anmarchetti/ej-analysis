namespace easyJet.Holidays.External.AWS.FeefoDataGenerator.Services;

/// <summary>
/// Retrieves bookings created yesterday,
/// filters them, transforms them into FeefoEnterSale objects, and sends them to SQS.
/// </summary>
public interface IFeefoDataGenerationHandler
{
    /// <summary>
    /// Generates SQS entries based on yesterday's bookings
    /// </summary>
    /// <returns>Amount of messages sent</returns>
    Task Generate();
}