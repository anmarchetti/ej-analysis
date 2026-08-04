using Refit;

namespace easyJet.Holiday.IntegrationTests.Shared.Models.CallCentre
{
    public class GetCreditsRequest
    {
        [AliasAs("lastName")]
        public string UserEmail { get; set; }

        [AliasAs("currency")]
        public string Currency { get; set; }
    }
}
