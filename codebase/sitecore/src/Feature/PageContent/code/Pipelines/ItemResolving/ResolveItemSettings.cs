using Sitecore.Configuration;
using Sitecore.Data.Items;

namespace easyJet.Feature.PageContent.Pipelines.ItemResolving
{
    public class ResolveItemSettings
    {
        public bool RequireLanguageVersion { get; set; }

        public static ResolveItemSettings CreateDefaultSettings(Item context)
        {
            return new ResolveItemSettings
            {
                RequireLanguageVersion =
                    Settings.GetBoolSetting("Item Resolving.Require Language Version", true),
            };
        }
    }
}