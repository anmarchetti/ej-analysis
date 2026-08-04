using easyJet.Holidays.External.Atcom.Models.InfoBooking;

namespace easyJet.Holidays.External.Atcom.Models.InfoCancellation
{
    /// <summary>
    /// Request to Atcom API for InfoCancellation
    /// </summary>
    public class InfoCancellationRequest : AtcomApiRequest<Internal.InfoCancellationRequest>
    {
        /// <summary>
        /// HTTP Method
        /// </summary>
        public override HttpMethod Method => HttpMethod.Post;

        /// <summary>
        /// Namespace for the request
        /// </summary>
        protected override string RequestNamespace => "AtComRes/InfoCancellationRequest";
    }
}