namespace easyJet.Foundation.PushNotifications.Services
{
    public interface IUtmParamsService
    {
        /// <summary>
        /// Set predefined, content and campaing UTM params to url.
        /// </summary>
        /// <param name="url">Url string.</param>
        /// <param name="content">UTM parameter content.</param>
        /// <param name="campaignName">UTM parameter campaing name.</param>
        /// <returns>Url with utm params.</returns>
        string SetUtmParams(string url, string content, string campaignName);

        /// <summary>
        /// Set predefined, content and campaing UTM params to tokenized url.
        /// </summary>
        /// <param name="url">Url string.</param>
        /// <param name="content">UTM parameter content.</param>
        /// <param name="campaignName">UTM parameter campaing name.</param>
        /// <returns>Url with utm params.</returns>
        string SetUtmParamsForTokenizedUrl(string url, string content, string campaignName);
    }
}
