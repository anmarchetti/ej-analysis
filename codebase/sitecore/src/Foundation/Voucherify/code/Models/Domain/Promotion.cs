using System;
using System.Linq;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.Voucherify.Mappers;
using easyJet.Foundation.Voucherify.Models.Domain.Validation;
using Sitecore;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Voucherify.Models.Domain
{
    /// <summary>
    /// Promotion model.
    /// </summary>
    public class Promotion
    {
        public Promotion(Item item)
            : this(item, string.Empty, true)
        {
        }

        public Promotion(Item item, string requestedAtcomPromoCode, bool returnAll = true)
        {
            if (item == null)
            {
                return;
            }

            InitializePromotion(item, requestedAtcomPromoCode, returnAll);
        }

        private void InitializePromotion(Item item, string requestedAtcomPromoCode, bool returnAll)
        {
            Id = item.ID.ToString();
            Title = item.Fields[Templates.Promotion.Fields.CustomerPromoCode].Value;
            CardDescription = item.Fields[Templates.Promotion.Fields.CardDescription]?.Value;
            Icon = item.GetMediaUrl(Templates.Promotion.Fields.Icon);
            BannerTitle = item.Fields[Templates.Promotion.Fields.BannerTitle]?.Value;
            MinimumSpend = item.Fields[Templates.Promotion.Fields.MinimumSpend1]?.Value;
            PromoCode = item.Fields[Templates.Promotion.Fields.PromoCode]?.Value;
            Date = item.Fields[Templates.Promotion.Fields.Date]?.Value;
            TandCs = item.Fields[Templates.Promotion.Fields.TandCs]?.Value;
            DisplayOnExtrasPage = MainUtil.GetBool(item.Fields[Templates.Promotion.Fields.DisplayOnExtrasPage]?.Value, false);
            ShowTaxesNote = MainUtil.GetBool(item.Fields[Templates.Promotion.Fields.ShowTaxesNote]?.Value, false);

            PromotionCodes = item.Children
                .Where(i => i != null && i.TemplateID.Equals(Templates.PromotionCodeConfiguration.Id))
                .Where(ConditionPredicate)
                .OrderBy(x => x.GetInteger(FieldIDs.Sortorder))
                .Select(i => new PromotionCode(i, item))
                .ToArray();

            ValidationRules = PromotionValidationRulesMapper.BuildValidationRules(item);
            bool ConditionPredicate(Item i) => returnAll || string.IsNullOrEmpty(requestedAtcomPromoCode) || i.Fields[Templates.PromotionCodeConfiguration.Fields.AtcomPromoCode].Value.Equals(requestedAtcomPromoCode, StringComparison.OrdinalIgnoreCase);
        }

        /// <summary>
        /// Gets or sets Sitecore Id of Promotion Item.
        /// </summary>
        public string Id { get; set; }

        /// <summary>
        /// Gets or sets title.
        /// </summary>
        public string Title { get; set; }

        public string CardDescription { get; set; }

        public string Icon { get; set; }

        public string BannerTitle { get; set; }

        public string MinimumSpend { get; set; }

        public string PromoCode { get; set; }

        public string Date { get; set; }

        public string TandCs { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether it gets or sets Display on Extras Page flag for auto apply promo code input
        /// </summary>
        public bool DisplayOnExtrasPage { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the taxes note is shown
        /// </summary>
        public bool ShowTaxesNote { get; set; }

        /// <summary>
        /// Gets or sets Promotion Code for Promotion.
        /// </summary>
        public PromotionCode[] PromotionCodes { get; set; }

        /// <summary>
        /// Gets or sets validation rules for booking.
        /// </summary>
        public PromotionValidationRules ValidationRules { get; set; }
    }
}