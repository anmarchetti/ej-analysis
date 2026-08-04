using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.SitecoreExtensions.Commands;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyJet.Foundation.Voucherify.ContentSearch.Repositories;
using easyJet.Foundation.Voucherify.Logging;
using easyJet.Foundation.Voucherify.Models.HotelGiataCodes;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.SecurityModel;
using Sitecore.Sites;

namespace easyJet.Foundation.Voucherify.Commands
{
    public class HotelGiataCodesUploadCommand : BaseCsvCommand
    {
        private readonly IDestinationsSearchService destinationsSearchService;
        private readonly IPromotionRepository promotionRepository;

        public HotelGiataCodesUploadCommand(
            IDestinationsSearchService destinationsSearchService,
            IPromotionRepository promotionRepository,
            ICsvUtilsService csvUtilsService,
            IVoucherifyLogger logger,
            IDatabaseProvider databaseProvider,
            IUserCreationService userCreationService,
            ISitecoreUIService sitecoreUiService)
            : base(databaseProvider, csvUtilsService, logger, userCreationService, sitecoreUiService)
        {
            this.destinationsSearchService = destinationsSearchService;
            this.promotionRepository = promotionRepository;
        }

        protected override IEnumerable<Item> ProcessItems(Item contextItem)
        {
            var itemsToUpdate = GetFileData<HotelGiataCodesCsv>(contextItem);

            if (!itemsToUpdate.Any())
            {
                Logger.Warn($"[{nameof(HotelGiataCodesUploadCommand)}-{nameof(ProcessItems)}] File is not set or empty", this);
                yield break;
            }

            var codeDelimiter = new char[] { '|' };
            var fileData = new Dictionary<(string AtcomPromoCode, string MarketCode), HashSet<string>>();

            // Reformat data as Promotion => List of ATCOM Codes, initially in CSV file it looks as ATCOM Code => Promotions
            foreach (var item in itemsToUpdate)
            {
                if (string.IsNullOrWhiteSpace(item.GiataCode))
                {
                    Logger.Warn($"[{nameof(HotelGiataCodesUploadCommand)}-{nameof(ProcessItems)}] GiataCode not defined", this);
                }

                var atcomPromoCodes = item.AtcomPromoCodes != null ? item.AtcomPromoCodes.Split(codeDelimiter, System.StringSplitOptions.RemoveEmptyEntries) : Array.Empty<string>();
                if (!atcomPromoCodes.Any())
                {
                    Logger.Warn($"[{nameof(HotelGiataCodesUploadCommand)}-{nameof(ProcessItems)}] AtcomPromoCodes not defined", this);
                    continue;
                }

                if (string.IsNullOrWhiteSpace(item.MarketCode))
                {
                    Logger.Warn($"[{nameof(HotelGiataCodesUploadCommand)}-{nameof(ProcessItems)}] MarketCode not defined", this);
                    continue;
                }

                foreach (var atcomPromoCode in atcomPromoCodes)
                {
                    if (!fileData.ContainsKey((atcomPromoCode, item.MarketCode)))
                    {
                        fileData.Add((atcomPromoCode, item.MarketCode), new HashSet<string> { item.GiataCode });
                    }
                    else if (!fileData[(atcomPromoCode, item.MarketCode)].Contains(item.GiataCode))
                    {
                        fileData[(atcomPromoCode, item.MarketCode)].Add(item.GiataCode);
                    }
                }
            }

            // Update data in Sitecore
            var siteCotext = DatabaseProvider.GetSiteContext(contextItem);
            using (new SiteContextSwitcher(siteCotext))
            using (new DatabaseSwitcher(contextItem.Database))
            using (new SecurityDisabler())
            using (new DatabaseCacheDisabler())
            using (new BulkUpdateContext())
            {
                Logger.Warn($"[{nameof(HotelGiataCodesUploadCommand)}-{nameof(ProcessItems)}] Site name:  {siteCotext.SiteInfo.Name}.", this);
                Logger.Warn($"[{nameof(HotelGiataCodesUploadCommand)}-{nameof(ProcessItems)}] Site database:  {siteCotext.Database.Name}.", this);
                Logger.Warn($"[{nameof(HotelGiataCodesUploadCommand)}-{nameof(ProcessItems)}] ContextItem Database:  {contextItem.Database.Name}.", this);

                foreach (var promo in fileData)
                {
                    Logger.Warn($"[{nameof(HotelGiataCodesUploadCommand)}-{nameof(ProcessItems)}] Begin update promo {promo.Key}.", this);

                    var (atcomPromoCode, marketCode) = promo.Key;
                    var promotionItem = promotionRepository.GetPromotionByAtcomCode(atcomPromoCode, marketCode);

                    if (promotionItem == null)
                    {
                        Logger.Warn($"[{nameof(HotelGiataCodesUploadCommand)}-{nameof(ProcessItems)}] Promotion with AtcomPromoCode '{promo.Key}' not found.", this);
                        continue;
                    }

                    var giataCodesToSet = promo.Value.ToArray();
                    var hotelItems = destinationsSearchService.GetHotelsByGiataCodes(giataCodesToSet);

                    if (hotelItems == null)
                    {
                        Logger.Warn($"[{nameof(HotelGiataCodesUploadCommand)}-{nameof(ProcessItems)}] Hotel Items not found for giataCodes {string.Join(",", giataCodesToSet)}.", this);
                        continue;
                    }

                    var hotelItemIds = string.Join("|", hotelItems.Select(x => x.ItemId.ToString()).ToArray());

                    Logger.Warn($"[{nameof(HotelGiataCodesUploadCommand)}-{nameof(ProcessItems)}] Updating promo {promotionItem.ID} with hotels {hotelItemIds}.", this);

                    promotionItem.Editing.BeginEdit();
                    promotionItem.Fields[Templates.Promotion.Fields.Destination].Value = hotelItemIds;
                    promotionItem.Editing.EndEdit();

                    Logger.Warn($"[{nameof(HotelGiataCodesUploadCommand)}-{nameof(ProcessItems)}] End update promo {promo.Key}.", this);
                    yield return promotionItem;
                }
            }
        }
    }
}
