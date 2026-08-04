namespace easyJet.Holidays.Api.Domain.Services.Authentication
{
    /// <summary>
    /// CAPTCHA service
    /// </summary>
    public interface ICaptchaService
    {
        /// <summary>
        /// Verify user's CAPTCHA response
        /// </summary>
        /// <param name="token">The user response token provided by the CAPTCHA</param>
        /// <returns>Valid or not</returns>
        Task<bool> Verify(string token);
    }
}
