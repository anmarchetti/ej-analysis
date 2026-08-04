using System.Net;

namespace PointsOfInterest;

/// <summary>
/// 
/// </summary>
public sealed class PointsOfInterestException : Exception
{
    /// <summary>
    /// 
    /// </summary>
    public PointsOfInterestException(){}

    /// <summary>
    /// 
    /// </summary>
    /// <param name="message"></param>
    public PointsOfInterestException(string message) : base(message) {}

    /// <summary>
    /// 
    /// </summary>
    /// <param name="message"></param>
    /// <param name="inner"></param>
    public PointsOfInterestException(string message, Exception inner) : base(message, inner) {}

    /// <summary>
    /// 
    /// </summary>
    /// <param name="statusCode"></param>
    /// <param name="message"></param>
    public PointsOfInterestException(HttpStatusCode statusCode, string message) : base(message) => StatusCode = statusCode;

    /// <summary>
    /// 
    /// </summary>
    public HttpStatusCode StatusCode { get; }
    
}
