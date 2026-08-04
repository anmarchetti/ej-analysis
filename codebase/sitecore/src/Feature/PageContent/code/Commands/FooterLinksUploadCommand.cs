using System.Collections.Generic;
using System.Runtime.CompilerServices;
using easyJet.Feature.PageContent.Models.FooterLinks;
using easyJet.Foundation.Analytics.Logging;
using easyJet.Foundation.SitecoreExtensions.Commands;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.SecurityModel;

namespace easyJet.Feature.PageContent.Commands
{
    public class FooterLinksUploadCommand : BaseJsonCommand
    {
        public FooterLinksUploadCommand(
            IAnalyticsLogger logger,
            IDatabaseProvider databaseProvider,
            IUserCreationService userCreationService,
            ISitecoreUIService sitecoreUiService)
            : base(databaseProvider, logger, userCreationService, sitecoreUiService)
        {
        }

        protected override IEnumerable<Item> ProcessItems(Item contextItem)
        {
            var createdUpdatedItemsCollection = new List<Item>();
            var container = GetFileData<FooterLinkContainer>(contextItem);

            using (new SecurityDisabler())
            using (new DatabaseCacheDisabler())
            using (new BulkUpdateContext())
            {
                var ids = new List<string>();
                foreach (var group in container.Groups)
                {
                    // create title
                    var groupItem = CreateFooterLinkGroup(contextItem, group);
                    ids.Add(groupItem.ID.ToString());
                }

                // update footer titles list
                contextItem.Editing.BeginEdit();
                var listOfTitlesField = new MultilistField(contextItem.Fields[Constants.Fields.FooterLinkContainer.ListOfTitles]);

                foreach (var id in ids)
                {
                    listOfTitlesField.Add(id);
                }

                contextItem.Fields[Constants.Fields.FooterLinkContainer.DesktopTitle].Value = container.DesktopTitle;
                contextItem.Fields[Constants.Fields.FooterLinkContainer.MobileTitle].Value = container.MobileTitle;
                contextItem.Editing.EndEdit();
            }

            createdUpdatedItemsCollection.Add(contextItem);

            return createdUpdatedItemsCollection;
        }

        private Item CreateFooterLinkGroup(Item contextItem, FooterLinkGroup group)
        {
            var itemName = ItemUtil.ProposeValidItemName($"{group.Title}");
            var linkGroupItem = contextItem.Add(itemName, new TemplateID(Constants.TemplateIds.FooterLinkGroup));

            var ids = new List<string>();
            foreach (var link in group.Links)
            {
                // create subtitle
                var linkItem = CreateFooterLink(linkGroupItem, link);
                ids.Add(linkItem.ID.ToString());
            }

            // update list of subtitles
            linkGroupItem.Editing.BeginEdit();
            linkGroupItem[Constants.Fields.FooterLinkContainer.FooterLinkGroup.Title] = group.Title;
            var listOfSubtitlesField = new MultilistField(linkGroupItem.Fields[Constants.Fields.FooterLinkContainer.FooterLinkGroup.ListOfSubtitles]);

            foreach (var id in ids)
            {
                listOfSubtitlesField.Add(id);
            }

            linkGroupItem.Editing.EndEdit();

            return linkGroupItem;
        }

        private Item CreateFooterLink(Item contextItem, FooterLink link)
        {
            var itemName = ItemUtil.ProposeValidItemName($"{link.Subtitle}");
            var linkItem = contextItem.Add(itemName, new TemplateID(Constants.TemplateIds.FooterLink));

            linkItem.Editing.BeginEdit();
            linkItem[Constants.Fields.FooterLinkContainer.FooterLinkGroup.FooterLink.Subtitle] = link.Subtitle;
            linkItem[Constants.Fields.FooterLinkContainer.FooterLinkGroup.FooterLink.Link] = $"<link linktype=\"external\" url =\"{link.SubtitleLink}\" />";
            linkItem.Editing.EndEdit();

            return linkItem;
        }
    }
}
