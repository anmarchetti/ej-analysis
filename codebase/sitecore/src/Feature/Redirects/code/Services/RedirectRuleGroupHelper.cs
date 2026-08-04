using System;
using System.Linq;
using Sitecore;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.SecurityModel;

namespace easyJet.Feature.Redirects.Services
{
    internal static class RedirectRuleGroupHelper
    {
        public static Item ResolveOrCreateGroup(Item root, string groupName, string defaultGroupName)
        {
            if (root == null || string.IsNullOrWhiteSpace(groupName))
            {
                return null;
            }

            if (!string.IsNullOrWhiteSpace(defaultGroupName) &&
                groupName.Equals(defaultGroupName, StringComparison.OrdinalIgnoreCase))
            {
                return root;
            }

            var proposedName = ItemUtil.ProposeValidItemName(groupName);
            var existing = root.Children
                .FirstOrDefault(child => child.TemplateID == Templates.RedirectRulesFolder.ID
                    && child.Name.Equals(proposedName, StringComparison.OrdinalIgnoreCase));

            if (existing != null)
            {
                return existing;
            }

            using (new SecurityDisabler())
            {
                var groupItem = root.Add(proposedName, new TemplateID(Templates.RedirectRulesFolder.ID));
                if (groupItem != null && !string.Equals(groupItem.DisplayName, groupName, StringComparison.Ordinal))
                {
                    using (new EditContext(groupItem, false, true))
                    {
                        groupItem.Fields[FieldIDs.DisplayName].Value = groupName;
                    }
                }

                return groupItem;
            }
        }
    }
}
