namespace easyJet.Holidays.Api.Domain.Data.Promotion
{
    /// <summary>
    /// Promocode Discounts.
    /// </summary>
    [Serializable]
    public class PromocodeDiscounts
    {
        /// <summary>
        /// Gets or sets Discount Amount Per Booking.
        /// </summary>
        public decimal DiscountAmountPerBooking { get; set; }

        /// <summary>
        /// Gets or sets PercentageDiscountPerBooking.
        /// </summary>
        public decimal PercentageDiscountPerBooking { get; set; }

        /// <summary>
        /// Gets or sets AdultDiscountAmountPerPerson.
        /// </summary>
        public decimal AdultDiscountAmountPerPerson { get; set; }

        /// <summary>
        /// Gets or sets AdultPercentageAmountPerPerson.
        /// </summary>
        public decimal AdultPercentageAmountPerPerson { get; set; }

        /// <summary>
        /// Gets or sets ChildDiscountAmountPerPerson.
        /// </summary>
        public decimal ChildDiscountAmountPerPerson { get; set; }

        /// <summary>
        /// Gets or sets ChildPercentageAmountPerPerson.
        /// </summary>
        public decimal ChildPercentageAmountPerPerson { get; set; }
    }
}
