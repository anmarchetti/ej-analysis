namespace easyJet.Holidays.External.Feefo.Models.DTO
{
    /// <summary>
    /// Feefo reviews and summary
    /// </summary>
    public class ReviewsAndSummary
    {
        public List<Review> Reviews { get; set; }
        public ReviewSummary Summary { get; set; }
    }
}
