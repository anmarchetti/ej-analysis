using System;

namespace easyJet.Foundation.Voucherify.Models.Domain
{
    /// <summary>
    /// Date time range model.
    /// </summary>
    public class DateTimeRange
    {
        /// <summary>
        /// Gets or sets 'from' date time.
        /// </summary>
        public DateTime From { get; set; }

        /// <summary>
        /// Gets or sets 'to' date time.
        /// </summary>
        public DateTime To { get; set; }

        public override string ToString()
        {
            return $"{From:dd/MM/yyyy} - {To:dd/MM/yyyy}";
        }
    }
}