using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.ContentSearch.Settings;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.SitecoreExtensions.Commands;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Indexing;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyJet.Foundation.SitecoreExtensions.Utils;
using Sitecore;
using Sitecore.Abstractions;
using Sitecore.Data;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.Globalization;
using Sitecore.SecurityModel;
using Sitecore.Shell.Framework.Commands;
using Sitecore.Web.UI.Sheer;

namespace easyJet.Foundation.Destinations.Commands
{
    public class RunTransfersImportCommand : BaseCsvCommand
    {
        private readonly int transferInfoIdsPerSolrQuery = Sitecore.Configuration.Settings.GetIntSetting("Destinations.TransferInfoIdsPerSolrQuery", 30);
        private readonly BaseMediaManager mediaManager;
        private readonly IDestinationsLogger logger;
        private readonly ITransfersInfoSearchService transfersInfoSearchService;
        private readonly IDatabaseProvider databaseProvider;
        private readonly ITransferInfoSearchSettings settings;
        private readonly IIndexingService indexingService;
        private readonly ISitecoreContextProvider sitecoreContextProvider;
        private bool hasErrorsDuringUpload = false;

        public RunTransfersImportCommand(
            BaseMediaManager mediaManager,
            ICsvUtilsService csvUtilsService,
            IDestinationsLogger logger,
            ITransfersInfoSearchService transfersInfoSearchService,
            IDatabaseProvider databaseProvider,
            ITransferInfoSearchSettings settings,
            IIndexingService indexingService,
            ISitecoreContextProvider sitecoreContextProvider,
            IUserCreationService userCreationService,
            ISitecoreUIService sitecoreUiService)
            : base(databaseProvider, csvUtilsService, logger, userCreationService, sitecoreUiService)
        {
            this.mediaManager = mediaManager;
            this.logger = logger;
            this.transfersInfoSearchService = transfersInfoSearchService;
            this.databaseProvider = databaseProvider;
            this.settings = settings;
            this.indexingService = indexingService;
            this.sitecoreContextProvider = sitecoreContextProvider;
        }

        protected override bool IsCommandContextValid(CommandContext context)
        {
            var item = context.Items.FirstOrDefault();

            var shouldShowItem = item?.TemplateID.Equals(Constants.TemplateIds.TranserInfoFolder) ?? false;

            if (!shouldShowItem)
            {
                return false;
            }

            FileField file = item.Fields[Constants.Fields.TransferInfoFolder.ImportFile];

            return file.ContainsCsvFile();
        }

        protected override void PostAction(ClientPipelineArgs args)
        {
            if (hasErrorsDuringUpload)
            {
                sitecoreContextProvider.ClientPage.ClientResponse.ShowError("Error is thrown during uploading transfers, please contact to administrator.", string.Empty);
            }
            else
            {
                sitecoreContextProvider.ClientPage.ClientResponse.Alert("Transfers were imported successfully.");
            }

            base.PostAction(args);
        }

        /// <summary>
        /// Create or update items based on csv file from contextItem ImportFile field.
        /// </summary>
        /// <param name="contextItem">Parent item contains new item or item to update.</param>
        /// <returns>Returns created Items.</returns>
        protected override IEnumerable<Item> ProcessItems(Item contextItem)
        {
            var createdUpdatedItemsCollection = new List<Item>();

            var fileItem = new FileField(contextItem.Fields[Constants.Fields.TransferInfoFolder.ImportFile])?.MediaItem;

            if (fileItem == null)
            {
                return Enumerable.Empty<Item>();
            }

            var csvSitecoreLanguageMapping = GetCsvSitecoreLanguageMapping(contextItem);

            IList<TransferInfo> transferInfoModels = GetFileData<TransferInfo>(contextItem, typeof(TransferInfoMap));

            var productIds = transferInfoModels.Select(transferInfoModel => transferInfoModel.ProductId);
            var data = transfersInfoSearchService.GetTransfersInfoByProductIds(productIds, transferInfoIdsPerSolrQuery).ConfigureAwait(false).GetAwaiter().GetResult();

            var existingItems = data.GroupBy(t => t.ProductId).ToDictionary(t => t.Key, t => databaseProvider.GetItem(t.First(i => i.Language == Constants.TransferInfo.DefaultLanguage).Uri));

            foreach (var transferInfoModel in transferInfoModels)
            {
                if (string.IsNullOrEmpty(transferInfoModel.ProductId))
                {
                    continue;
                }

                existingItems.TryGetValue(transferInfoModel.ProductId, out Item itemToUpdate);

                var updatedItems = UpdateOrCreateItem(contextItem, itemToUpdate, transferInfoModel, csvSitecoreLanguageMapping);
                if (!updatedItems.Any())
                {
                    continue;
                }

                createdUpdatedItemsCollection.AddRange(updatedItems);

                try
                {
                    foreach (var updatedItem in updatedItems)
                    {
                        indexingService.UpdateItem(updatedItem, settings.IndexName);
                    }
                }
                catch (Exception ex)
                {
                    logger.Warn($"Item with ID {itemToUpdate?.ID} cannot be re-indexed", ex, this);
                }
            }

            return createdUpdatedItemsCollection;
        }

        private static string GetValueFromDictionary(Dictionary<string, string> dictionary, string languageString)
        {
            return !dictionary.ContainsKey(languageString) ? string.Empty : dictionary[languageString];
        }

        /// <summary>
        /// Create new item.
        /// </summary>
        /// <param name="contextItem">Parent item.</param>
        /// <param name="transferInfoModel">Data used to update item.</param>
        /// <returns>Returns created item.</returns>
        private Item CreateItem(Item contextItem, TransferInfo transferInfoModel)
        {
            var newTransferInfoItemName = ItemUtil.ProposeValidItemName($"{transferInfoModel.ResortName}-{transferInfoModel.ProductId}");

            // Create Item
            var itemToUpdate = contextItem.Add(newTransferInfoItemName, new TemplateID(Constants.TemplateIds.TransferInfo));

            return itemToUpdate;
        }

        /// <summary>
        /// Create or update item.
        /// </summary>
        /// <param name="contextItem">Context item.</param>
        /// <param name="itemAddDataTo">Item to add data to.</param>
        /// <param name="data">Data to use for updating supplied item.</param>
        /// <param name="csvSitecoreLanguageMapping">Csv Language to Sitecore Language Mapping.</param>
        private List<Item> UpdateOrCreateItem(Item contextItem, Item itemAddDataTo, TransferInfo data, Dictionary<string, List<Language>> csvSitecoreLanguageMapping)
        {
            var editedItemList = new List<Item>();

            if (!int.TryParse(data.TransfersMinutes, out _))
            {
                logger.Warn($"Number format cannot be parsed. ProductID: {data.ProductId}, TransfersMinutes: {data.TransfersMinutes}", this);
                return editedItemList;
            }

            using (new SecurityDisabler())
            using (new DatabaseCacheDisabler())
            using (new BulkUpdateContext())
            {
                var languageStrings = data.ArrivalInstr.Keys.Concat(data.DepInstr.Keys).Distinct().ToList();
                if (itemAddDataTo == null)
                {
                    itemAddDataTo = CreateItem(contextItem, data);
                }

                if (!WriteSharedDataToItem(itemAddDataTo, data, editedItemList))
                {
                    hasErrorsDuringUpload = true;
                    return editedItemList;
                }

                foreach (var languageString in languageStrings)
                {
                    if (!csvSitecoreLanguageMapping.ContainsKey(languageString))
                    {
                        continue;
                    }

                    var sitecoreLanguage = csvSitecoreLanguageMapping[languageString];
                    foreach (var language in sitecoreLanguage)
                    {
                        if (!WriteDataToItemLanguageVersion(itemAddDataTo, data, language, languageString, editedItemList))
                        {
                            hasErrorsDuringUpload = true;
                            return editedItemList;
                        }
                    }
                }

                return editedItemList.GroupBy(i => i.Uri).Select(i => i.FirstOrDefault()).Where(i => i != null)
                    .ToList();
            }
        }

        private bool WriteSharedDataToItem(Item itemAddDataTo, TransferInfo data, List<Item> editedItemList)
        {
            try
            {
                // SharedFields
                itemAddDataTo.Editing.BeginEdit();

                itemAddDataTo.Fields[Constants.Fields.TransferInfoItem.AirportId].Value = data.AirportId;
                itemAddDataTo.Fields[Constants.Fields.TransferInfoItem.ResortId].Value = data.ResortId;
                itemAddDataTo.Fields[Constants.Fields.TransferInfoItem.ProductId].Value = data.ProductId;
                return true;
            }
            catch (Exception ex)
            {
                logger.Error($"{ex.Message}", this);
                itemAddDataTo?.Editing.CancelEdit();
                return false;
            }
            finally
            {
                itemAddDataTo?.Editing.EndEdit();
                if (itemAddDataTo != null)
                {
                    editedItemList.Add(itemAddDataTo);
                }
            }
        }

        private bool WriteDataToItemLanguageVersion(Item itemAddDataTo, TransferInfo data, Language language, string languageString, List<Item> editedItemList)
        {
            var itemAddDataToInLanguage = itemAddDataTo.Database.GetItem(itemAddDataTo.ID, language);
            if (itemAddDataToInLanguage.Versions.Count == 0)
            {
                itemAddDataToInLanguage = itemAddDataToInLanguage.Versions.AddVersion();
            }

            try
            {
                itemAddDataToInLanguage.Editing.BeginEdit();

                itemAddDataToInLanguage.Fields[Constants.Fields.TransferInfoItem.ResortName].Value = data.ResortName;
                itemAddDataToInLanguage.Fields[Constants.Fields.TransferInfoItem.Duration].Value = data.TransfersMinutes;
                itemAddDataToInLanguage.Fields[Constants.Fields.TransferInfoItem.ArrivalInstr].Value = GetValueFromDictionary(data.ArrivalInstr, languageString);
                itemAddDataToInLanguage.Fields[Constants.Fields.TransferInfoItem.DepInstr].Value = GetValueFromDictionary(data.DepInstr, languageString);
                itemAddDataToInLanguage.Fields[Constants.Fields.TransferInfoItem.Type].Value = data.Type;

                return true;
            }
            catch (Exception ex)
            {
                logger.Error($"{ex.Message}", this);
                itemAddDataToInLanguage?.Editing.CancelEdit();
                return false;
            }
            finally
            {
                itemAddDataToInLanguage?.Editing.EndEdit();
                editedItemList.Add(itemAddDataToInLanguage);
            }
        }

        private Dictionary<string, List<Language>> GetCsvSitecoreLanguageMapping(Item contextItem)
        {
            var csvSitecoreLanguageMapping = FieldUtils.GetNameValueListContent(Constants.Fields.TransferInfoFolder.LanguageMapping, contextItem);
            return csvSitecoreLanguageMapping.GroupBy(keyValuePair => keyValuePair.Value).Where(i => !string.IsNullOrEmpty(i.Key)).ToDictionary(
                keyValuePairs => keyValuePairs.Key?.ToLower(),
                keyValuePairs => keyValuePairs.Select(keyValuePair => keyValuePair.Key).Select(GetLanguage).Where(language => language != null).ToList());
        }

        private Language GetLanguage(string languageString)
        {
            return Language.TryParse(languageString, out var language) ? language : null;
        }
    }
}