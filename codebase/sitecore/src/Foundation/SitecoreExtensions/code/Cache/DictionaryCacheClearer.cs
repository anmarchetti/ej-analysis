using System;
using System.Diagnostics.CodeAnalysis;
using Sitecore.Diagnostics;
using Sitecore.Globalization;

namespace easyJet.Foundation.SitecoreExtensions.Cache
{
    [ExcludeFromCodeCoverage]
    public class DictionaryCacheClearer
    {
        public void ClearCache(object sender, EventArgs args)
        {
            Translate.ResetCache(true);
            Log.Info("Dictionary cache cleared", this);
        }
    }
}