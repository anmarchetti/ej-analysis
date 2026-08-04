namespace easyJet.Foundation.Analytics.Services
{
    public interface IConsentService
    {
        /// <summary>
        /// Checks if the personalization and performance cookie consent is given.
        /// </summary>
        /// <returns>True if the personalization and performance cookie is exist and equal to "1".</returns>
        bool IsPersonalizationConsentGiven();

        /// <summary>
        /// Checks if the personalization is enabled.
        /// </summary>
        /// <returns>True if the personalization is enabled.</returns>
        bool IsPersonalizationEnabled();
    }
}