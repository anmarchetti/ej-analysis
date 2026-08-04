using easyJet.Foundation.Multisite.Services;
using Sitecore.Data.Clones;
using Sitecore.Data.Items;
using Sitecore.Pipelines.GetContentEditorWarnings;

namespace easyJet.Foundation.Multisite.Pipelines.GetContentEditorWarnings
{
    public class HideNotificationForDelegatedArea
    {
        private readonly IDelegatedAreaService delegatedAreaService;

        public HideNotificationForDelegatedArea(IDelegatedAreaService delegatedAreaService) => this.delegatedAreaService = delegatedAreaService;

        /// <summary>
        /// Hide Sitecore OOTB Notifications for Clone functionality.
        /// </summary>
        /// <param name="args">GetContentEditorWarningsArgs arguments.</param>
        public void Process(GetContentEditorWarningsArgs args)
        {
            if (!delegatedAreaService.CheckForDelegatedArea(args.Item))
            {
                return;
            }

            Item clone = args.Item;
            foreach (Notification notification in clone.Database.NotificationProvider.GetNotifications(clone))
            {
                notification.Dismiss(clone);
            }
        }
    }
}