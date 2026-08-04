using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Utils;
using Sitecore.Data;
using Sitecore.Data.Items;

namespace easyJet.Feature.PageContent.Extensions
{
    public static class ItemExtensions
    {
        public static bool IsTransparentItem(this Item item)
        {
            return FieldUtils.IsChecked(Constants.Fields.TransparentFolder.TransparentItem, item);
        }
    }
}
