using easyJet.Holidays.Api.Domain.Data.Errors;

namespace easyJet.Holidays.External.Domain.Models.Api;

public abstract class ApiResponse
{
    /// <summary>
    /// List of API errors for specific response. Used to decide whether response is successful  or not even if response code is 200
    /// </summary>
    public abstract ApiError[] ApiErrors { get; }

    /// <summary>
    /// List of API warnings for a specific response
    /// </summary>
    public virtual ApiError[] ApiWarnings { get; }

    public abstract string PayloadString { get; }

    public abstract void DeserializePayload(string payload);
}