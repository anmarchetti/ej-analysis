using System;
using System.Collections.Generic;

namespace easyJet.Foundation.Voucherify.Models.Domain
{
    public class VoucherInfo
    {
        public string Title { get; set; }

        public string VoucherCode { get; set; }

        public DateTime StartDate { get; set; }

        public DateTime ExpirationDate { get; set; }

        public int? Redemption { get; set; }

        public Dictionary<string, object> Metadata { get; set; }
    }
}