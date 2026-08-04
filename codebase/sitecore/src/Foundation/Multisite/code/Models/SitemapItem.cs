using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore;
using Sitecore.Data;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Multisite.Models
{
    /// <summary>
    /// Item what descripe page properties.
    /// </summary>
    public class SitemapItem
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="SitemapItem"/> class.
        /// </summary>
        /// <param name="item">Sitecore's item.</param>
        public SitemapItem(Item item)
        {
            if (item == null)
            {
                return;
            }

            var name = item[Constants.Fields.DatasourceItem.Name];
            Name = string.IsNullOrWhiteSpace(name) ? item.Name : name;
            Url = item.GetItemUrl();
            Template = item.TemplateName;
            Language = item.Language.Name;
            ID = item.ID.ToString();
            PageTitle = item[Constants.Fields.BasePage.Title];

            if (item.HasBaseTemplate(new TemplateID(Constants.TemplateIds.SitemapBase)))
            {
                LookupField changeFrequencyField = item.Fields[Constants.Fields.SitemapBase.ChangeFrequency];
                ChangeFrequency = changeFrequencyField?.TargetItem?.DisplayName;
                Priority = MainUtil.GetFloat(item[Constants.Fields.SitemapBase.Priority], 0.0F);
            }
        }

        public string ID { get; set; }

        public string Name { get; set; }

        public string PageTitle { get; set; }

        public string Url { get; set; }

        public string ChangeFrequency { get; set; }

        public float Priority { get; set; }

        public string Template { get; set; }

        public string Language { get; set; }
    }
}