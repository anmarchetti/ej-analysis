namespace easyJet.Holidays.Api.Domain.Data.PackageOffers.ShortList
{
    /// <summary>
    /// Informations describing shortlisted offer
    /// </summary>
    public class ShortlistInfo
    {
        /// <summary>
        /// Shirt list package ID
        /// </summary>
        public string Id { get; set; }

        /// <summary>
        /// Short list type
        /// </summary>
        public ShortListType? Type { get; set; }

        /// <summary>
        /// Short list language
        /// </summary>
        public string Language { get; set; }

        /// <summary>
        /// Short list market code
        /// </summary>
        public string MarketCode { get; set; }
    }
}
