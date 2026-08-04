namespace easyJet.Holidays.External.Domain.Services
{
    public interface IAuthService
    {
        /// <summary>
        /// Method gets token
        /// </summary>
        /// <param name="forceUpdate">Flag for force updating token in storage</param>
        /// <returns></returns>
        Task<string> GetToken(bool forceUpdate = false);
    }
}
