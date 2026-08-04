using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Multisite.Pipelines.PushCloneChanges;
using Sitecore;
using Sitecore.Abstractions;
using Sitecore.Data;
using Sitecore.Data.Comparers;
using Sitecore.Data.Items;
using Sitecore.Globalization;
using Sitecore.SecurityModel;

namespace easyJet.Foundation.Multisite.Services
{
    [Service(typeof(IPushCloneService), Lifetime = Lifetime.Singleton)]
    public class PushCloneService : IPushCloneService
    {
        private readonly IPushCloneCoordinatorService coordinatorService;
        private readonly BaseCorePipelineManager corePipelineManager;

        public PushCloneService(IPushCloneCoordinatorService coordinatorService, BaseCorePipelineManager corePipelineManager)
        {
            this.coordinatorService = coordinatorService;
            this.corePipelineManager = corePipelineManager;
        }

        /// <inheritdoc/>
        public void AddChild(Item item)
        {
            Item parent = item.Parent;
            if (parent == null)
            {
                return;
            }

            if (!coordinatorService.IsPage(item))
            {
                return;
            }

            foreach (Item clone in parent.GetClones())
            {
                if (coordinatorService.ShouldProcess(clone) && HasVersion(item))
                {
                    var targetItem = item.CloneTo(clone, false);
                    ProtectItem(targetItem);
                    SetOriginalItem(item, targetItem);
                }
            }
        }

        /// <inheritdoc/>
        public void Move(Item item)
        {
            if (!item.Parent.HasClones)
            {
                return;
            }

            foreach (Item parentClone in GetCloneItem(item.Parent).ToList())
            {
                if (!coordinatorService.ShouldProcess(parentClone))
                {
                    break;
                }

                foreach (Item childClone in GetCloneItem(item))
                {
                    childClone.MoveTo(parentClone);
                }
            }
        }

        /// <inheritdoc/>
        public void Remove(Item item)
        {
            foreach (Item clone in item.GetClones())
            {
                if (coordinatorService.ShouldProcess(clone))
                {
                    clone.Delete();
                }
            }
        }

        /// <inheritdoc/>
        public void SaveClone(Item item, ItemChanges changes)
        {
            foreach (Item clone in GetCloneItem(item))
            {
                if (!coordinatorService.ShouldProcess(clone))
                {
                    break;
                }

                corePipelineManager.Run("pushCloneChanges", new PushCloneChangesArgs()
                {
                    Item = item,
                    Changes = changes,
                    Clone = clone
                });
            }
        }

        /// <inheritdoc/>
        public void AddVersion(Item item)
        {
            Item parent = item.Parent;
            if (parent == null || item.Versions.Count == 0)
            {
                return;
            }

            if (!coordinatorService.IsPage(item))
            {
                return;
            }

            Item lastVersionItem = item.Versions.GetLatestVersion() ?? item;
            ItemUri uri = lastVersionItem.Uri;
            IEnumerable<Item> cloneItems = GetCloneItem(lastVersionItem).ToList();
            if (!cloneItems.Any() && parent.HasClones)
            {
                foreach (Item obj2 in GetCloneItem(parent))
                {
                    if (coordinatorService.ShouldProcess(obj2))
                    {
                        Item target = item.CloneTo(obj2);
                        ProtectItem(target);
                        SetOriginalItem(item, target);
                    }
                }
            }
            else
            {
                foreach (Item clone in cloneItems)
                {
                    if (coordinatorService.ShouldProcess(clone) && !HasVersion(clone, lastVersionItem.Language, lastVersionItem.Version))
                    {
                        Item lastVersionClone = clone.Database.GetItem(clone.ID, lastVersionItem.Language);
                        using (new SecurityDisabler())
                        {
                            Item newVersionClone = lastVersionClone.Versions.AddVersion();
                            newVersionClone.Editing.BeginEdit();
                            newVersionClone[FieldIDs.Source] = uri.ToString();
                            newVersionClone[FieldIDs.SourceItem] = uri.ToString(false);
                            newVersionClone[FieldIDs.Workflow] = string.Empty;
                            newVersionClone[FieldIDs.WorkflowState] = string.Empty;
                            newVersionClone.Editing.EndEdit();
                        }
                    }
                }
            }
        }

        /// <summary>
        /// Checks if the item has version.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <returns>True if item has version.</returns>
        protected bool HasVersion(Item item)
        {
            foreach (Language language in item.Languages)
            {
                if (HasLanguageVersion(item, language))
                {
                    return true;
                }
            }

            return false;
        }

        /// <summary>
        /// Check if the item has certain version.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <param name="language">Language.</param>
        /// <param name="lastVersion">Last version.</param>
        /// <returns>True if item has version.</returns>
        protected bool HasVersion(Item item, Language language, Version lastVersion)
        {
            var latestVersion = item.Database.GetItem(item.ID, language)?.Versions?.GetLatestVersion();
            return latestVersion != null && latestVersion?.Version.Number == lastVersion.Number;
        }

        /// <summary>
        /// Checks if the item has language version.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <param name="language">Language.</param>
        /// <returns>True if item has version.</returns>
        protected bool HasLanguageVersion(Item item, Language language)
        {
            Item obj = item.Database.GetItem(item.ID, language);
            return obj != null && obj.Versions.GetVersionNumbers().Length != 0;
        }

        /// <summary>
        /// Protect item.
        /// </summary>
        /// <param name="item">Sitecore Item.</param>
        protected void ProtectItem(Item item)
        {
            item.Editing.BeginEdit();
            item.Appearance.ReadOnly = true;
            item.Editing.EndEdit();
        }

        protected void SetOriginalItem(Item originalItem, Item cloneItem)
        {
            if (originalItem == null || cloneItem == null)
            {
                return;
            }

            cloneItem.Editing.BeginEdit();
            cloneItem.Fields[Templates.BasePage.Fields.OriginalItem].Value = originalItem.ID.ToString();
            cloneItem.Editing.EndEdit();
        }

        /// <summary>
        /// Get Clone item.
        /// </summary>
        /// <param name="item">Source item.</param>
        /// <returns>Collection of clones of this item.</returns>
        protected IEnumerable<Item> GetCloneItem(Item item) => item.GetClones().Where(i => i.Language.Equals(item.Language)).Distinct(new ItemIdComparer());
    }
}