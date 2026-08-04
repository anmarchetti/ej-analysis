namespace easyJet.Foundation.Destinations.Models.Requests
{
    public class BaseByPaginationRequest
    {
        /// <summary>
        /// Gets or sets number of entities to take.
        /// </summary>
        public int Take { get; set; }

        /// <summary>
        /// Gets or sets start position to take entities from.
        /// </summary>
        public int Page { get; set; }
    }
}