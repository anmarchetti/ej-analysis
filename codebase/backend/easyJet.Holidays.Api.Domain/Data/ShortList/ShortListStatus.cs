namespace easyJet.Holidays.Api.Domain.Data.ShortList
{
    /// <summary>
    /// Status of Short list operation
    /// </summary>
    public class ShortListStatus
    {
        /// <summary>
        /// Number of saved offers
        /// </summary>
        public int SavedOffersCount { get; set; }

        /// <summary>
        /// Id of a created item
        /// </summary>
        public string CreatedID { get; set; }
    }
}
