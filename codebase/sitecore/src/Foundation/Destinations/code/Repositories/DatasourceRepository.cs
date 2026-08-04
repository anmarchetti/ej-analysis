using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore;
using Sitecore.Data;
using Sitecore.Data.Events;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.Layouts;
using Sitecore.SecurityModel;

namespace easyJet.Foundation.Destinations.Repositories
{
    [Service(typeof(IDatasourceRepository), Lifetime = Lifetime.Singleton)]
    public class DatasourceRepository : IDatasourceRepository
    {
        private readonly IDestinationsLogger logger;

        public DatasourceRepository(IDestinationsLogger logger)
        {
            this.logger = logger;
        }

        /// <inheritdoc/>
        public Item GetOrCreateItem(string name, ID templateId, Item parent, bool disableEvents = false)
        {
            logger.Info($"{nameof(GetOrCreateItem)} with {nameof(templateId)}:{templateId}, {nameof(parent)}:{parent?.Paths.Path}, {nameof(disableEvents)}:{disableEvents}", this);
            using (new SecurityDisabler())
            {
                var itemName = ItemUtil.ProposeValidItemName(name);

                var item = parent.Children.FirstOrDefault(x => x.Name.Equals(itemName, System.StringComparison.InvariantCultureIgnoreCase));

                if (disableEvents)
                {
                    using (new EventDisabler())
                    {
                        return item ?? parent.Add(itemName, new TemplateID(templateId));
                    }
                }

                if (item != null)
                {
                    logger.Info($"{nameof(item)} already exists {nameof(item)}:{item?.Paths.Path}", this);
                    return item;
                }

                logger.Info($"adding new item with {nameof(templateId)}:{templateId} under {nameof(parent)}:{parent?.Paths.Path}", this);
                return parent.Add(itemName, new TemplateID(templateId));
            }
        }

        /// <inheritdoc/>
        public Item GetOrCreateItemByCode(string name, string code, ID templateId, Item parent, bool disableEvents = false, bool shouldDoDeepSearch = false, Version version = null)
        {
            logger.Info($"{nameof(GetOrCreateItemByCode)} with {nameof(templateId)}:{templateId}, {nameof(code)}:{code}, {nameof(parent)}:{parent?.Paths.Path}, {nameof(disableEvents)}:{disableEvents}", this);
            using (new SecurityDisabler())
            {
                var itemVersion = version ?? Version.Latest;
                var itemName = ItemUtil.ProposeValidItemName(name);
                string itemQuery = shouldDoDeepSearch ?
                    $"{parent.QuerySafePath()}//*[@@templateid = '{templateId}' and @Code='{code}']" :
                    $"{parent.QuerySafePath()}/*[@Code='{code}']";

                var item = parent.Database.SelectSingleItem(itemQuery);

                if (disableEvents)
                {
                    using (new EventDisabler())
                    {
                        return item != null ? item.Versions[itemVersion] : parent.Add(itemName, new TemplateID(templateId));
                    }
                }

                if (item != null)
                {
                    logger.Info($"{nameof(item)} already exists {nameof(item)}:{item?.Paths.Path}", this);
                    return item.Versions[itemVersion];
                }

                logger.Info($"adding new item with {nameof(templateId)}:{templateId}, {nameof(code)}:{code}, under {nameof(parent)}:{parent?.Paths.Path}", this);
                return parent.Add(itemName, new TemplateID(templateId));
            }
        }

        /// <inheritdoc/>
        public Item CreateItem(string name, ID templateId, Item parent, bool disableEvents = false)
        {
            logger.Info($"{nameof(CreateItem)} with {nameof(templateId)}:{templateId}, {nameof(parent)}:{parent?.Paths.Path}, {nameof(disableEvents)}:{disableEvents}", this);
            using (new SecurityDisabler())
            {
                if (disableEvents)
                {
                    using (new EventDisabler())
                    {
                        return parent.Add(ItemUtil.ProposeValidItemName(name), new TemplateID(templateId));
                    }
                }

                return parent.Add(ItemUtil.ProposeValidItemName(name), new TemplateID(templateId));
            }
        }

        /// <inheritdoc/>
        public Item GetOrCreateTypeItem(Item parentItem, string itemName, ID templateId, string codeFieldValue, string nameFieldValue)
        {
            logger.Info($"{nameof(GetOrCreateTypeItem)} with {nameof(templateId)}:{templateId}, {nameof(itemName)}:{itemName}, {nameof(parentItem)}:{parentItem?.Paths.Path}, {nameof(codeFieldValue)}:{codeFieldValue}, {nameof(nameFieldValue)}:{nameFieldValue}", this);
            using (new SecurityDisabler())
            {
                itemName = ItemUtil.ProposeValidItemName(itemName);

                var typeItem = parentItem.Children.FirstOrDefault(x => x.Name.Equals(itemName, System.StringComparison.InvariantCultureIgnoreCase) && x.TemplateID.Equals(templateId));

                if (typeItem == null)
                {
                    return CreateTypeItem(parentItem, itemName, templateId, codeFieldValue, nameFieldValue);
                }

                logger.Info($"{nameof(typeItem)} already exists {nameof(typeItem)}:{typeItem?.Paths.Path}", this);
                SetCodeAndName(codeFieldValue, nameFieldValue, typeItem);
                return typeItem;
            }
        }

        /// <inheritdoc/>
        public Item CreateTypeItem(Item parentItem, string itemName, ID templateId, string codeFieldValue, string nameFieldValue)
        {
            logger.Info($"{nameof(CreateTypeItem)} with {nameof(templateId)}:{templateId}, {nameof(itemName)}:{itemName}, {nameof(parentItem)}:{parentItem?.Paths.Path}, {nameof(codeFieldValue)}:{codeFieldValue}, {nameof(nameFieldValue)}:{nameFieldValue}", this);

            using (new SecurityDisabler())
            {
                var typeItem = parentItem.Add(ItemUtil.ProposeValidItemName(itemName), new TemplateID(templateId));

                SetCodeAndName(codeFieldValue, nameFieldValue, typeItem);

                return typeItem;
            }
        }

        /// <inheritdoc/>
        public IDictionary<string, string> CreateMapperWhichMapsTypeCodesToItemIds(Item typesFolderItem, ID templateId, bool shouldDeepSelect = false)
        {
            logger.Info($"{nameof(CreateMapperWhichMapsTypeCodesToItemIds)} with {nameof(typesFolderItem)}:{typesFolderItem?.Paths.Path}, {nameof(templateId)}:{templateId}, {nameof(shouldDeepSelect)}:{shouldDeepSelect}", this);
            IEnumerable<Item> types;
            if (shouldDeepSelect)
            {
                types = typesFolderItem.GetDescendantsByTemplate(templateId);
            }
            else
            {
                types = typesFolderItem.Children.Where(child => child.TemplateID == templateId);
            }

            return types?.GroupBy(type => type.Fields[Constants.Fields.DatasourceItem.Code].Value).ToDictionary(g => g.Key, g => g.ToList().FirstOrDefault()?.ID.ToString()) ?? new Dictionary<string, string>();
        }

        /// <inheritdoc/>
        public Item GetOrCreateFolderItem(Item parentItem, string name, ID templateId)
        {
            logger.Info($"{nameof(GetOrCreateFolderItem)} with {nameof(parentItem)}:{parentItem?.Paths.Path}, {nameof(name)}:{name}, {nameof(templateId)}:{templateId}", this);

            using (new SecurityDisabler())
            {
                var folder = parentItem.Axes.SelectSingleItem($"./*[@@templateid='{templateId}']");

                if (folder == null)
                {
                    folder = parentItem.Add(ItemUtil.ProposeValidItemName(name), new TemplateID(templateId));
                }

                return folder;
            }
        }

        public Item GetOrCreateFromHotelBranchTemplate(string name, Item parent, BranchItem branch, string displayName = null, bool lockItem = true)
        {
            logger.Info($"{nameof(GetOrCreateFromHotelBranchTemplate)} with {nameof(name)}:{name}, {nameof(parent)}:{parent?.Paths.Path}, {nameof(branch)}:{branch?.Name}, {nameof(displayName)}:{displayName}", this);
            using (new SecurityDisabler())
            {
                var itemName = ItemUtil.ProposeValidItemName(name);
                var matches = parent.Children.Where(i => i.Name.Equals(itemName, System.StringComparison.InvariantCultureIgnoreCase)).ToList();
                if (matches.Count > 1)
                {
                    logger.Warn($"Multiple children named '{itemName}' found under '{parent.Paths.Path}'; returning first.", this);
                }

                var existingAccommodation = matches.FirstOrDefault();
                if (existingAccommodation != null)
                {
                    if (!string.IsNullOrWhiteSpace(displayName))
                    {
                        existingAccommodation.Editing.BeginEdit();
                        existingAccommodation.SetValue(Constants.Fields.StandardFields.DisplayName, displayName);
                        existingAccommodation.Editing.EndEdit();
                    }

                    return existingAccommodation;
                }

                return CreateFromHotelBranchTemplate(name, parent, branch, displayName, lockItem);
            }
        }

        /// <inheritdoc/>
        public Item CreateFromHotelBranchTemplate(string name, Item parent, BranchItem branch, string displayName = null, bool lockItem = true)
        {
            logger.Info($"{nameof(CreateFromHotelBranchTemplate)} with {nameof(name)}:{name}, {nameof(parent)}:{parent?.Paths.Path}, {nameof(branch)}:{branch?.Name}, {nameof(displayName)}:{displayName}", this);
            using (new SecurityDisabler())
            {
                var itemName = ItemUtil.ProposeValidItemName(name);
                var item = parent.Add(itemName, branch) ?? parent.Children.LastOrDefault(x => x.Name.Equals(itemName, System.StringComparison.InvariantCultureIgnoreCase));
                var defaultWorkflow = item?.Template?.StandardValues?[FieldIDs.DefaultWorkflow];
                item.StartWorkflow(defaultWorkflow, lockItem);

                if (!string.IsNullOrWhiteSpace(displayName))
                {
                    item.SetValue(Constants.Fields.StandardFields.DisplayName, displayName);
                }

                var device = Context.Device ?? item.Database.Resources.Devices.GetAll().First(d => d.Name.ToLower() == Constants.Common.Default);
                var renderings = item.Visualization.GetRenderings(device, false);
                var promoBlock = renderings?.FirstOrDefault(x => x.RenderingID == Constants.RenderingIds.PromoBlocks);

                if (promoBlock != null)
                {
                    var sharedLayout = GetSharedLayout(item);
                    var currentDevice = sharedLayout.GetDevice(device.ID.ToString());
                    var rendering = currentDevice.GetRenderingByUniqueId(promoBlock.UniqueId);

                    if (rendering != null)
                    {
                        var ds = item.Database.SelectSingleItem($"{item.QuerySafePath()}//*[@@templateId='{Constants.TemplateIds.PromoBlocksFolder}']");
                        rendering.Datasource = ds?.ID.ToString();

                        item.Editing.BeginEdit();
                        item.Fields[FieldIDs.LayoutField].Value = sharedLayout.ToXml();
                        item.Editing.EndEdit();
                    }
                }

                return item;
            }
        }

        /// <inheritdoc/>
        public BranchItem GetBranchTemplate(string path)
        {
            return Context.ContentDatabase.GetItem(path);
        }

        private static LayoutDefinition GetSharedLayout(Item item)
            => GetLayoutDefinition(item, FieldIDs.LayoutField);

        private static LayoutDefinition GetLayoutDefinition(Item item, ID fieldId)
            => LayoutDefinition.Parse(LayoutField.GetFieldValue(item.Fields[fieldId]));

        private void SetCodeAndName(string codeFieldValue, string nameFieldValue, Item typeItem)
        {
            logger.Info($"{nameof(SetCodeAndName)} with {nameof(codeFieldValue)}:{codeFieldValue}, {nameof(nameFieldValue)}:{nameFieldValue}, {nameof(typeItem)}:{typeItem?.Paths.Path}", this);

            var changes = new Dictionary<string, string>()
            {
                { Constants.Fields.DatasourceItem.Code, codeFieldValue },
                { Constants.Fields.DatasourceItem.Name, nameFieldValue },
            };

            typeItem.BulkUpdate(changes);
        }
    }
}