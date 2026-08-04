using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.Transfers
{
    /// <summary>
    /// Request for getting all transfer durations
    /// </summary>
    public class TransferDurationsRequest : JsonApiRequest<object>
    {
        /// <inheritdoc />
        public override HttpMethod Method { get => HttpMethod.Get; }
    }
}
