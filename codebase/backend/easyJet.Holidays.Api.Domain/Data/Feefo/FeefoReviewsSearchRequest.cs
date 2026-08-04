namespace easyJet.Holidays.Api.Domain.Data.Feefo
{
    /// <summary>
    /// Search Request Object
    /// </summary>
    public class FeefoReviewsSearchRequest
    {
        public int Count { get; set; }
        public DateTime? CreatedDateTime { get; set; }
        public DateTime? UpdatedDateTime { get; set; }
        public FeefoRequestSort? Sort { get; set; }
        public FeefoRequestPeriod? UpdatedSince { get; set; }
        public List<int> Rating { get; set; }

        /*Tags*/
        public DateTime? TagDate { get; set; }
        public string TagCategory { get; set; }
        public string TagDestinationCountry { get; set; }
        public string TagDestinationRegion { get; set; }
        public string TagResort { get; set; }
        public string TagHotel { get; set; }
        public int? TagNumberOfPassengers { get; set; }
        public string TagPackageType { get; set; }
    }
}
