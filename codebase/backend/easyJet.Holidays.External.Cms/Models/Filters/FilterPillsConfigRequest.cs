using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.Filters
{
    /// <summary>
    /// Request for getting filter pills config
    /// </summary>
    public class FilterPillsConfigRequest : JsonApiRequest<object>
    {
        /// <inheritdoc />
        public override HttpMethod Method => HttpMethod.Get;
    }
}