using Sitecore.Data.Items;
using Sitecore.Globalization;

namespace easyJet.Foundation.SitecoreExtensions.Utils
{
    public static class ItemUtils
    {
        public static Item GetItemInLanguage(Item item, Language language)
        {
            return item.Database.GetItem(item.ID, language);
        }

        public static string GetTrackingId(Item item, string languageName = "en")
        {
            if (item == null)
            {
                return null;
            }

            if (string.IsNullOrWhiteSpace(languageName))
            {
                return GetName(item);
            }

            if (!Language.TryParse(languageName, out var requestedLanguage))
            {
                return GetName(item);
            }

            if (item.Language == requestedLanguage)
            {
                return GetName(item);
            }

            var itemInLanguage = GetItemInLanguage(item, requestedLanguage);
            return GetName(itemInLanguage ?? item);
        }

        private static string GetName(Item item)
        {
            var nameInLanguage = item?["Name"];
            return string.IsNullOrEmpty(nameInLanguage) ? item?.Name : nameInLanguage;
        }
    }
}
