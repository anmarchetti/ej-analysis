using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.Voucherify.Models.Domain;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.SecurityModel;

namespace easyJet.Foundation.Voucherify.Services.Sync
{
    [Service(typeof(ISyncDataService), Lifetime = Lifetime.Singleton)]
    public class SyncDataService : ISyncDataService
    {
        private readonly IVoucherifyService voucherifyService;

        public SyncDataService(IVoucherifyService voucherifyService)
        {
            this.voucherifyService = voucherifyService;
        }

        /// <inheritdoc/>
        public Item[] SyncPromotionToVoucherifyAndEnforceSortOrder(Item item)
        {
            var processedItems = new List<Item>();
            var order = 0;
            var promoCodeItems = item.Children.Where(x => x.TemplateID == Templates.PromotionCodeConfiguration.Id).ToList();

            foreach (var promoCodeItem in promoCodeItems)
            {
                var voucherInfo = GetVoucherInfo(promoCodeItem);

                var voucherCode = voucherifyService.CreateOrUpdate(voucherInfo).GetAwaiter().GetResult();

                if (string.IsNullOrEmpty(voucherCode))
                {
                    continue;
                }

                // Update IsPromotionInVoucherify field if voucher is successfully copied to Voucherify.
                using (new SecurityDisabler())
                {
                    CheckboxField isPromotionInVoucherifyField = promoCodeItem.Fields[Templates.PromotionCodeConfiguration.Fields.IsPromotionInVoucherify];

                    promoCodeItem.Editing.BeginEdit();
                    if (!isPromotionInVoucherifyField?.Checked ?? false)
                    {
                        isPromotionInVoucherifyField.Checked = true;
                    }

                    promoCodeItem.Fields[Sitecore.FieldIDs.Sortorder].Value = order.ToString();
                    promoCodeItem.Editing.EndEdit();
                }

                // increase order by 10 for the next promo tier.
                order += 10;

                processedItems.Add(promoCodeItem);
            }

            return processedItems.ToArray();
        }

        private static DateTime GetDateTimeFromItem(Item promoCode, Item promoItem, string fieldName)
            => ((DateField)promoCode.Fields[fieldName]).DateTime != DateTime.MinValue
                ? ((DateField)promoCode.Fields[fieldName]).IsoTimeToServerDateTime()
                : ((DateField)promoItem.Fields[fieldName]).IsoTimeToServerDateTime();

        private VoucherInfo GetVoucherInfo(Item item)
        {
            if (item == null || string.IsNullOrEmpty(item.Fields[Templates.PromotionCodeConfiguration.Fields.AtcomPromoCode].Value))
            {
                return null;
            }

            var promoItem = item.Parent;

            var startDate = GetDateTimeFromItem(item, promoItem, Templates.Promotion.Fields.DateValidityFrom);
            var expirationDate = GetDateTimeFromItem(item, promoItem, Templates.Promotion.Fields.DateValidityTo);

            return new VoucherInfo()
            {
                Title = promoItem.Fields[Templates.Promotion.Fields.CustomerPromoCode].Value,
                VoucherCode = item.ID.ToString(),
                StartDate = startDate,
                ExpirationDate = expirationDate,
                Redemption = promoItem.GetInteger(Templates.Promotion.FieldsIds.Redemption),
                Metadata = new Dictionary<string, object>()
                {
                    { Constants.AtcomCodeMetadataName, item.Fields[Templates.PromotionCodeConfiguration.Fields.AtcomPromoCode].Value.ToUpper() }
                }
            };
        }
    }
}