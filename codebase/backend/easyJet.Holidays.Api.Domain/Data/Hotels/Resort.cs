namespace easyJet.Holidays.Api.Domain.Data.Hotels
{
    /// <summary>
    /// Resort model
    /// </summary>
    public class Resort : IDestinationDatasource
    {
        /// <summary>
        /// object code
        /// </summary>
        public string Code { get; set; }

        /// <summary>
        /// object title
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// item name
        /// </summary>
        public string ItemName { get; set; }

        /// <summary>
        /// object Url
        /// </summary>
        public string Url { get; set; }
    }
}
