using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Services
{
    public interface IRequestedSearchUrlService
    {
        string GetLiveSiteBaseUrl(Item contextItem, string liveSiteUrl);

        string BuildUrl(Item item, string baseUrl);
    }
}
