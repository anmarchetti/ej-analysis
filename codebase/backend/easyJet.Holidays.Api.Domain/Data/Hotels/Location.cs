namespace easyJet.Holidays.Api.Domain.Data.Hotels
{
    /// <summary>
    /// Location model
    /// </summary>
    public class Location : IDestinationDatasource
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
        /// object Url
        /// </summary>
        public string Url { get; set; }

        /// <summary>
        /// object itemName
        /// </summary>

        public string ItemName { get; set; }
    }
}
