using System;
using System.Linq;
using System.Runtime.CompilerServices;
using easyJet.Foundation.SitecoreExtensions.Utils;
using easyJet.Foundation.Translation.Common;
using Sitecore;
using Sitecore.Data.Items;
using Sitecore.Diagnostics;
using Sitecore.Pipelines.ItemProvider.GetItem;
using Constants = easyJet.Foundation.Multisite.Constants;

[assembly: InternalsVisibleTo("easyJet.Foundation.Translation.Tests")]
[assembly: InternalsVisibleTo("DynamicProxyGenAssembly2")]

namespace easyJet.Foundation.Translation.Pipelines.GetItem
{
    public class DisabledFallbackAwareGetLanguageFallbackItem : GetLanguageFallbackItem
    {
        public override void Process(GetItemArgs args)
        {
            try
            {
                var shouldProcess = ShouldProcess();

                if (!shouldProcess)
                {
                    return;
                }

                var item = GetItemFromArgs(args);

                if (item != null &&
                    item.Name != "__Standard Values" &&
                    item.IsFallback)
                {
                    var field = item.Fields[Constants.Fields.BaseSetting.LanguagesWithDisabledFallback];
                    if (field != null && field.HasValue)
                    {
                        var disabledLanguages = FieldUtils.GetMultilistTargetItems(field.Name, item);

                        var languageNames = disabledLanguages.Select(languageItem => languageItem.Name).ToHashSet();

                        if (languageNames.Contains(item.Language.Name))
                        {
                            SetItemToArgs(args, null);
                        }
                    }
                }
            }
            catch (Exception exc)
            {
                Log.Debug(exc.Message, this);
            }
        }

        internal virtual Item GetItemFromArgs(GetItemArgs args) => args?.Result;

        internal virtual void SetItemToArgs(GetItemArgs args, Item value) => args.Result = value;

#pragma warning disable SA1503 // Braces should not be omitted
        private bool ShouldProcess()
        {
            if (Context.Site != null && Context.PageMode.IsExperienceEditor)
                return false;

            var isLanguageGalleryRequest = Context.Request?.GetQueryString("xmlcontrol", string.Empty) == "Gallery.Languages";
            var isIndexing = IndexingContextSwitcher.CurrentValue;
            var sitename = Context.GetSiteName();

            if (sitename == "shell" && (isIndexing || isLanguageGalleryRequest))
                return false;

            return true;
        }
#pragma warning restore SA1503 // Braces should not be omitted
    }
}
