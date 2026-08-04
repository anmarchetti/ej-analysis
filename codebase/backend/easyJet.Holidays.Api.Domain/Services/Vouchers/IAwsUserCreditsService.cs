using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Data.Vouchers;

namespace easyJet.Holidays.Api.Domain.Services.Vouchers
{
    public interface IAwsUserCreditsService
    {
        /// <summary>
        /// Get or create new user credit info recode
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <param name="currency">Currency</param>
        /// <param name="action">function to update credits info</param>
        /// <param name="force">Force upadate user cache</param>
        /// <returns></returns>
        Task<Dictionary<Currency, MyCreditInfo>> GetOrUpdateUserCredits(string userId, Func<Task<Dictionary<Currency, MyCreditInfo>>> action, bool force = false);

        /// <summary>
        /// Clear value in dynamoDB
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <param name="currency">Currency</param>
        /// <returns></returns>
        Task ClearUserCreditsInfo(string userId);
    }
}
