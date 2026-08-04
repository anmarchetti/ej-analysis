#pragma warning disable CS1591
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Salesforce.Models;

/// <summary>
/// Salesforce GET request wrapper for SOQL query endpoints.
/// </summary>
internal class SalesforceQueryRequest : ApiRequest
{
    /// <summary>
    /// Gets the HTTP method used for the Salesforce query request.
    /// </summary>
    public override HttpMethod Method => HttpMethod.Get;

    /// <summary>
    /// Gets the request payload. Salesforce query requests do not send a body.
    /// </summary>
    public override string PayloadString => null!;
}

#pragma warning restore CS1591

