using System.Globalization;
using easyJet.Foundation.Multisite.Services;
using EasyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.Data.Items;
using Sitecore.Globalization;
using Sitecore.Pipelines.GetPageEditorNotifications;
using Sitecore.Shell.Framework.CommandBuilders;

namespace easyJet.Foundation.Multisite.Pipelines.GetPageEditorNotifications
{
    public class DelegatedAreaNotification : GetPageEditorNotificationsProcessor
    {
        public IDelegatedAreaService DelegatedAreaService { get; set; }

        public DelegatedAreaNotification(IDelegatedAreaService service) => DelegatedAreaService = service;

        /// <summary>
        /// Show delegated area notifaction for Experiance Editor.
        /// </summary>
        /// <param name="arguments">Aarguments.</param>
        public override void Process(GetPageEditorNotificationsArgs arguments)
        {
            Item contextItem = arguments.ContextItem;
            if (contextItem == null || contextItem.Database.Name.Is("core") || !DelegatedAreaService.CheckForDelegatedArea(contextItem))
            {
                return;
            }

            arguments.Notifications.Add(new PageEditorNotification(Translate.Text("The item is in a delegated area.") + " " + Translate.Text("The item clone is in a delegated area and it is protected from editing. Edit the source item by clicking the link."), PageEditorNotificationType.Warning)
            {
                Options =
                {
                    new PageEditorNotificationOption(Translate.Text("Navigate to the source item.") ?? string.Empty, GetCommand(contextItem))
                }
            });
        }

        /// <summary>
        /// Get command for the item.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <returns>Command in string format.</returns>
        private string GetCommand(Item item)
        {
            CommandBuilder commandBuilder = new CommandBuilder("webedit:navigatetosource");
            Item obj = item.Database.GetItem(item.Source.ID);
            commandBuilder.Add("id", item.Source.ID.ToString());
            if (obj != null)
            {
                commandBuilder.Add("language", obj.Language.Name);
                commandBuilder.Add("version", obj.Versions.GetLatestVersion().Version.Number.ToString(CultureInfo.InvariantCulture));
            }

            return commandBuilder.ToString();
        }
    }
}