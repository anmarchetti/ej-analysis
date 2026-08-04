using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.ContentSearch.Settings;

namespace easyJet.Foundation.Voucherify.ContentSearch.Settings
{
    /// <summary>
    /// Represents Search Settings
    /// Holds current IndexName and DefaultIndexName.
    /// </summary>
    [Service(typeof(IPromotionSearchSetting), Lifetime = Lifetime.Transient)]
    public class PromotionSearchSetting : BaseSearchSettings, IPromotionSearchSetting
    {
        public string Root => "/sitecore/content/EasyJet/Holidays/Data/Promotions";

        public override string IndexName => $"sitecore_promotions_{DatabaseName}_index";
    }
}