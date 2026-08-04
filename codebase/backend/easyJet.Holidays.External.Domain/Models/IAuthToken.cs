namespace easyJet.Holidays.External.Domain.Models
{
    /// <summary>
    /// Interface for authentication models
    /// </summary>
    public interface IAuthToken
    {
        /// <summary>
        /// Authorization access token
        /// </summary>
        string AccessToken { get; set; }

        /// <summary>
        /// Expiration duration (in seconds)
        /// </summary>
        int ExpiresIn { get; set; }
    }
}
