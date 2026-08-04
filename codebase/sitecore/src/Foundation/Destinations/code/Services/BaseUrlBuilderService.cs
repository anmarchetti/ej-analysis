using System.Linq;
using Sitecore.Abstractions;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Links;

namespace easyJet.Foundation.Destinations.Services
{
    public abstract class BaseUrlBuilderService
    {
        private readonly BaseLinkManager linkManager;

        protected BaseUrlBuilderService(BaseLinkManager linkManager)
        {
            this.linkManager = linkManager;
        }

        public static string GetFieldValueFromAncestor(Item item, ID ancestorTemplateId, string ancestorFieldName)
        {
            var ancestor = item?.Axes.GetAncestors()
                .FirstOrDefault(i => i.TemplateID == ancestorTemplateId);

            return ancestor?[ancestorFieldName];
        }

        public string GetRelativePath(Item item)
        {
            if (item == null)
            {
                return string.Empty;
            }

            var options = linkManager.GetDefaultUrlBuilderOptions();
            options.LanguageEmbedding = LanguageEmbedding.Never;
            options.AlwaysIncludeServerUrl = false;

            return linkManager.GetItemUrl(item, options) ?? string.Empty;
        }

        public string BuildUrl(Item contextItem, string baseUrl)
        {
            var relativePath = GetRelativePath(contextItem);
            return string.Join(string.Empty, baseUrl, relativePath);
        }
    }
}
