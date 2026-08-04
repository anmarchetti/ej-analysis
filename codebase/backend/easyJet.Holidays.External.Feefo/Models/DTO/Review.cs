namespace easyJet.Holidays.External.Feefo.Models.DTO
{
    public class Review
    {
        /// <summary>
        /// Rating in points
        /// </summary>
        public int Rating { get; set; }

        /// <summary>
        /// Title of the review
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// Body text of the review
        /// </summary>
        public string Text { get; set; }

        /// <summary>
        /// Date, the review was posted
        /// </summary>
        public DateTime Date { get; set; }

        /// <summary>
        /// Customer, who left the review
        /// </summary>
        public string CustomerName { get; set; }
    }
}
