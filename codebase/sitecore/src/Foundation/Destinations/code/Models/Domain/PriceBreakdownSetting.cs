using System;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class PriceBreakdownSetting
    {
        // Requires for deserialization
        public PriceBreakdownSetting()
        {
        }

        public PriceBreakdownSetting(Item item)
        {
            Text = item?.Fields[Constants.Fields.PriceBreakdownSetting.Text]?.Value;
            Code = item?.Fields[Constants.Fields.DatasourceItem.Code]?.Value;
            AddScopesFromItem(item);
        }

        public void AddScopesFromItem(Item item)
        {
            MultilistField selectedScopes = item?.Fields[Constants.Fields.PriceBreakdownSetting.Scope];

            // Use BookingPage scope as the default value for old items
            if (selectedScopes == null || selectedScopes.Count == 0)
            {
                Scope |= PriceBreakdownCategoryScope.BookingPage;
                return;
            }

            foreach (Item scopeItem in selectedScopes.GetItems())
            {
                Scope |= (PriceBreakdownCategoryScope)Enum.Parse(typeof(PriceBreakdownCategoryScope), scopeItem[Constants.Fields.SitecoreProperty.Value]);
            }
        }

        public string Text { get; set; }

        public string Code { get; set; }

        public PriceBreakdownCategoryScope Scope { get; set; } = PriceBreakdownCategoryScope.None;
    }
}