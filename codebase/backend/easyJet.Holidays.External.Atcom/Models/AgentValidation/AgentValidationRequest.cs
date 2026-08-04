using easyJet.Holidays.External.Atcom.Models.InfoBooking;

namespace easyJet.Holidays.External.Atcom.Models.AgentValidation
{
    public class AgentValidationRequest : AtcomApiRequest<Internal.AgentValidationRequest>
    {
        public override HttpMethod Method => HttpMethod.Post;
        protected override string RequestNamespace => "AtComRes/AgentValidationRequest";
    }
}
