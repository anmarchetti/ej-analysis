using System.Collections.Generic;
using System.Linq;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Data.Managers;

namespace easyJet.Feature.ChangeTracking.Extensions
{
    public static class ItemExtensions
    {
        public static bool InheritsFrom(this Item item, ID baseTemplateId)
        {
            return InheritsFrom(baseTemplateId, item.TemplateID, item.Database);
        }

        private static bool InheritsFrom(ID baseTemplateId, ID templateId, Database database)
        {
            if (templateId == baseTemplateId)
            {
                return true;
            }

            var inheritedTemplateIds = GetBaseTemplateIds(templateId, database);
            return inheritedTemplateIds.Any(t => t.Equals(baseTemplateId));
        }

        private static List<ID> GetBaseTemplateIds(ID templateId, Database db)
        {
            var template = TemplateManager.GetTemplate(templateId, db);
            var result = template?.GetBaseTemplates().Select(t => t.ID).ToList() ?? new List<ID>();
            return result;
        }
    }
}
