using System;

namespace easyJet.Foundation.Atcom.Models.Domain
{
    public class DateRange
    {
        /// <summary>
        /// Gets or sets start date.
        /// </summary>
        public DateTime? Start { get; set; }

        /// <summary>
        /// Gets or sets end date.
        /// </summary>
        public DateTime? End { get; set; }

        public override string ToString()
        {
            return $"{Start:MMM yy} - {End:MMM yy}";
        }
    }
}