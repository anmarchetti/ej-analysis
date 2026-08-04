#nullable enable
namespace easyJet.Holidays.Api.Domain.Data.Authentication
{
    /// <summary>
    /// Customer details
    /// </summary>
    public class CustomerIdentifiers
    {
        /// <summary>
        /// Customer id
        /// </summary>
        public string? Id { get; init; }

        /// <summary>
        /// Customer mapped id
        /// </summary>
        public string? MappedId { get; init; }
    }
}