using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.AWS.BoardUpgradeDataSync.Models;

/// <summary>
/// Represents a request for board upgrade data synchronization.
/// </summary>
internal class BoardUpgradeRequest : JsonApiRequest<object>
{
    private readonly TimeSpan? _timeout;

    /// <inheritdoc />
    public override TimeSpan? Timeout => _timeout;

    /// <summary>
    /// Gets the HTTP method used for the request.
    /// </summary>
    public override HttpMethod Method => HttpMethod.Get;

    public BoardUpgradeRequest(TimeSpan? requestTimeout)
    {
        _timeout = requestTimeout;
    }
}