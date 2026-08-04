using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.Collections;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Pipelines.GetContentEditorWarnings;

namespace easyJet.Foundation.Presentation.Pipelines.GetContentEditorWarnings
{
    public abstract class BaseContentEditorWarningProcessor
    {
        private const string InformationIcon = "Applications/32x32/information.png";
        private const string WarningIcon = "Applications/32x32/warning.png";

        protected abstract ID[] MatchingTemplateIds { get; }

        public void Process(GetContentEditorWarningsArgs arguments)
        {
            var item = arguments?.Item;
            if (item == null || item.Database.Name.Equals("core", StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            if (IsMatch(item))
            {
                ProcessWarning(item, arguments);
            }
        }

        protected abstract void ProcessWarning(Item contextItem, GetContentEditorWarningsArgs arguments);

        /// <summary>
        /// Determines whether the processor should produce a warning for the supplied item.
        /// Defaults to an exact match against <see cref="MatchingTemplateIds"/>; override to match by base template.
        /// </summary>
        protected virtual bool IsMatch(Item item) => MatchingTemplateIds.Contains(item.TemplateID);

        protected virtual void AddNotification(string title, Item[] items, GetContentEditorWarningsArgs arguments)
        {
            if (items?.Any() != true)
            {
                return;
            }

            var notification = new GetContentEditorWarningsArgs.ContentEditorWarning
            {
                Title = title,
                Icon = InformationIcon,
            };

            foreach (var item in items)
            {
                notification.Options.Add(new Pair<string, string>(item.DisplayName, item.ToContentEditorLink()));
            }

            arguments.Warnings.Add(notification);
        }

        /// <summary>
        /// Adds an informational notification whose options carry explicit labels (Part1) linking to the given
        /// items (Part2). Use when the option label must differ from the item's display name.
        /// </summary>
        protected virtual void AddNotification(string title, IEnumerable<Pair<string, Item>> labelledItems, GetContentEditorWarningsArgs arguments)
        {
            AddLabelledNotification(title, labelledItems, arguments, InformationIcon);
        }

        /// <summary>
        /// Adds a warning notification (warning icon) whose options carry explicit labels (Part1) linking to the
        /// given items (Part2). Use to flag a mis-configuration the editor should act on, not just informational state.
        /// </summary>
        protected virtual void AddWarning(string title, IEnumerable<Pair<string, Item>> labelledItems, GetContentEditorWarningsArgs arguments)
        {
            AddLabelledNotification(title, labelledItems, arguments, WarningIcon);
        }

        private static void AddLabelledNotification(string title, IEnumerable<Pair<string, Item>> labelledItems, GetContentEditorWarningsArgs arguments, string icon)
        {
            var options = labelledItems?.Where(pair => pair.Part2 != null).ToList();
            if (options == null || options.Count == 0)
            {
                return;
            }

            var notification = new GetContentEditorWarningsArgs.ContentEditorWarning
            {
                Title = title,
                Icon = icon,
            };

            foreach (var option in options)
            {
                notification.Options.Add(new Pair<string, string>(option.Part1, option.Part2.ToContentEditorLink()));
            }

            arguments.Warnings.Add(notification);
        }
    }
}