using CsvHelper.Configuration.Attributes;

namespace easyJet.Holidays.External.AWS.DistressedTaxFile.Models
{
    /// <summary>
    /// TaxDataRow model
    /// </summary>
    public class TaxDataRow
    {
        /// <summary>
        /// Sector
        /// </summary>
        [Name("SECTOR")]
        public string Sector { get; set; }

        /// <summary>
        /// TaxAmount
        /// </summary>
        [Ignore]
        public decimal TaxAmount { get; set; }

        /// <summary>
        /// Currency
        /// </summary>
        [Ignore]
        public string Currency { get; set; }

        /// <summary>
        /// EUR
        /// </summary>
        [Name("EUR")]
        public decimal EUR { get; set; }

        /// <summary>
        /// GBP
        /// </summary>
        [Name("GBP")]
        public decimal GBP { get; set; }

        /// <summary>
        /// CHF
        /// </summary>
        [Name("CHF")]
        public decimal CHF { get; set; }
    }
}