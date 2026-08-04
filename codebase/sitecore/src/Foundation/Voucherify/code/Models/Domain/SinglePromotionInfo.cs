using System;
using System.Collections.Generic;

namespace easyJet.Foundation.Voucherify.Models.Domain
{
    public class SinglePromotionInfo
    {
        /// <summary>
        /// Gets or sets promotion Title.
        /// </summary>
        public string Title { get; set; }

        public string CardDescription { get; set; }

        public string Icon { get; set; }

        public string BannerTitle { get; set; }

        public string MinimumSpend1 { get; set; }

        public string MinimumSpend2 { get; set; }

        public string MinimumSpend3 { get; set; }

        public string PromoCode { get; set; }

        public string Date { get; set; }

        public string TandCs { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether promotion should be displayed on Extras Page or not
        /// </summary>
        public bool DisplayOnExtrasPage { get; set; }
    }
}