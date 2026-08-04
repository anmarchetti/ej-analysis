namespace easyJet.Holidays.Api.Domain.Data.Settings
{
    /// <summary>
    /// Currency
    /// </summary>
    public class Currency
    {
        /// <summary>
        /// Currency code.
        /// </summary>
        public string Code { get; set; }
        public override bool Equals(object obj)
        {
            if (obj is not Currency curr) return false;
            return Code.Equals(curr.Code);
        }

        public override int GetHashCode()
        {
            return Code.GetHashCode();
        }

        public static Currency GBP => new Currency { Code = "GBP" };
        public static Currency CHF => new Currency { Code = "CHF" };
        public static Currency EUR => new Currency { Code = "EUR" };
        
        /// <summary>
        /// Currency representing no tax applicable.
        /// </summary>
        public static Currency NoTax => new Currency { Code = "NoTax" };
    }
}
