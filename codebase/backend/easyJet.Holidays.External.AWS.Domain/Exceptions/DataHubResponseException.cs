namespace easyJet.Holidays.External.AWS.Domain.Exceptions;

/// <summary>
/// Thrown when a Data Hub call completes successfully at the transport level
/// but its payload indicates an application-level error (i.e. Err_Num is set).
/// </summary>
#pragma warning disable CA1032
public class DataHubResponseException : Exception
#pragma warning restore CA1032
{
    /// <summary>
    /// Initializes a new instance of the <see cref="DataHubResponseException"/> class
    /// using the provided Data Hub error details.
    /// </summary>
    /// <param name="message">
    /// A formatted string describing the Data Hub error, typically including Err_Num and Err_Msg.
    /// </param>
    public DataHubResponseException(string message)
        : base(message)
    {
    }
}