using easyJet.Holidays.Api.Domain.Data.Seats;

namespace easyJet.Holidays.Api.Domain.Data.DynamoDB.Bookings
{
    /// <summary>
    /// Part of B2B seat data to cache in Dynamo DB
    /// </summary>
    public class Seat
    {
        /// <summary>
        /// Seat number
        /// </summary>
        public string Number { get; set; }

        /// <summary>
        /// Seat price
        /// </summary>
        public decimal Price { get; set; }

        /// <summary>
        /// Seat price band name
        /// </summary>
        public string PriceBand { get; set; }

        /// <summary>
        /// Seat benefits/products
        /// </summary>
        public List<Product> Products { get; set; }
    }
}