using System.Globalization;
using easyJet.Foundation.Multisite.Services;
using EasyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.Data.Items;
using Sitecore.Pipelines.GetContentEditorWarnings;
using Sitecore.Shell.Framework.CommandBuilders;

namespace easyJet.Foundation.Multisite.Pipelines.GetContentEditorWarnings
{
    public class DelegatedAreaWarning
    {
        public IDelegatedAreaService DelegatedAreaService { get; set; }

        public DelegatedAreaWarning(IDelegatedAreaService service) => DelegatedAreaService = service;

        /// <summary>
        /// Add delegated area warning if item is cloned and added to deletegated are setting.
        /// </summary>
        /// <param name="args">GetContentEditorWarningsArgs args.</param>
        public void Process(GetContentEditorWarningsArgs args)
        {
            Item clone = args.Item;
            if (clone == null || clone.Database.Name.Is("core") || !DelegatedAreaService.CheckForDelegatedArea(clone))
            {
                return;
            }

            AddWarning(args.Add(), clone);
        }

        /// <summary>
        /// Add delegated area warning if item is cloned and added to deletegated are setting.
        /// </summary>
        /// <param name="warning">Warning.</param>
        /// <param name="clone">Cloned item.</param>
        protected virtual void AddWarning(
          GetContentEditorWarningsArgs.ContentEditorWarning warning,
          Item clone)
        {
            warning.Title = "The item is in a delegated area.";
            warning.Text = "The item clone is in a delegated area and it is protected from editing. Edit the source item by clicking the link.";
            warning.AddOption("Navigate to the source item.", GetCommand(clone));
            warning.Icon = "Applications/32x32/warning.png";
            warning.IsExclusive = true;
        }

        /// <summary>
        /// Get command for clone item.
        /// </summary>
        /// <param name="clone">Clone item.</param>
        /// <returns>Command string.</returns>
        private string GetCommand(Item clone)
        {
            CommandBuilder commandBuilder = new CommandBuilder("item:load");
            commandBuilder.Add("id", clone.Source.ID.ToString());
            commandBuilder.Add("language", clone.Language.Name);
            commandBuilder.Add("version", clone.Versions.GetLatestVersion().Version.Number.ToString(CultureInfo.InvariantCulture));
            return commandBuilder.ToString();
        }
    }
}