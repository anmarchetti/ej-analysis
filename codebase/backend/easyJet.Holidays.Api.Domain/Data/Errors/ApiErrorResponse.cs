using System.Runtime.Serialization;
using System.Runtime.Serialization.DataContracts;

namespace easyJet.Holidays.Api.Domain.Data.Errors;

/// <summary>
/// Error returned by api
/// </summary>
[DataContract]
public class ApiErrorResponse
{
    /// <summary>
    /// Error message
    /// </summary>
    [DataMember(Name = "error")]
    public string Error { get; set; }

    /// <summary>
    /// Error code
    /// </summary>
    [DataMember(Name = "code")]
    public string Code { get; set; }

    /// <summary>
    /// Correlation id
    /// </summary>
    [DataMember(Name = "correlationId")]
    public string CorrelationId { get; set; }

    /// <summary>
    /// Additional data
    /// </summary>
    [DataMember(Name = "additionalData")]
    public Dictionary<string, string> AdditionalData { get; set; }

    /// <summary>
    /// Inner errors, if any
    /// </summary>
    [DataMember(Name = "innerErrors")]
    public ICollection<ApiError> InnerErrors { get; set; }

    /// <summary>
    /// Stacktrace if it's a 500
    /// </summary>
    [DataMember(Name = "stackTrace")]
    public string StackTrace { get; set; }

}
