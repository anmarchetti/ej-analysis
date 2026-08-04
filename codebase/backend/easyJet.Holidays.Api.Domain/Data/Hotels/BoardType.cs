namespace easyJet.Holidays.Api.Domain.Data.Hotels
{
    /// <summary>
    /// Model for board type
    /// </summary>
    public class BoardType
    {
        /// <summary>
        /// Board type code
        /// </summary>
        public string Code { get; set; }

        /// <summary>
        /// Board type Title
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Board type Full description
        /// </summary>
        public string Content { get; set; }

        /// <summary>
        /// Board type description
        /// </summary>
        public string Description { get; set; }

        /// <summary>
        /// Board type image url
        /// </summary>
        public string ImageUrl { get; set; }

        /// <summary>
        /// Board type icon url
        /// </summary>
        public string IconUrl { get; set; }

        /// <summary>
        /// Board group info.
        /// </summary>
        public BoardGroup BoardGroup { get; set; }

        /// <summary>
        /// object itemName
        /// </summary>
        public string ItemName { get; set; }
    }
}
