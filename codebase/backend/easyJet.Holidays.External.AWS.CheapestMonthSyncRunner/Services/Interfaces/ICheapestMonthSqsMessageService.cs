namespace easyJet.Holidays.External.AWS.CheapestMonthSyncRunner.Services.Interfaces;
/// <summary>
/// ICheapestMonthSqsMessageService
/// </summary>
public interface ICheapestMonthSqsMessageService
{
    /// <summary>
    /// Builds the messages per selection.
    /// </summary>
    /// <param name="airportCodes">The airport codes.</param>
    /// <returns>A Task.</returns>
    Task<IList<string>> BuildMessagesPerSelectionAsync(IList<string> airportCodes);

    /// <summary>
    /// Sends the messages.
    /// </summary>
    /// <param name="messages">The messages.</param>
    /// <returns>A Task.</returns>
    Task SendMessages(IList<string> messages);
}
