using Sitecore;
using Sitecore.Data.Items;

namespace easyJet.Foundation.SiteModes.Models.Domain
{
    public class LanguageVersionState
    {
        public string FullLanguageName { get; set; }

        public string IsoLanguageCode { get; set; }

        public LanguageVersionState(Item item)
        {
            if (item != null)
            {
                FullLanguageName = item.Language.CultureInfo.EnglishName;
                IsoLanguageCode = item.Language.Name;
            }
        }
    }
}