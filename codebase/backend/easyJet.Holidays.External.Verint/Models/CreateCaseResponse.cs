using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Domain.Models.Api;
using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Verint.Models
{
    public class CreateCaseResponse : JsonApiResponse<CreateCaseResponseBody>
    {
        public override ApiError[] ApiErrors => null;

    }

    [Serializable]
    [DataContract]
    public class CreateCaseResponseBody
    {
        [DataMember(Name = "returnCode")]
        public string ReturnCode { get; set; }

        [DataMember(Name = "returnMessage")]
        public string ReturnMessage { get; set; }

        [DataMember(Name = "caseId")]
        public int CaseId { get; set; }
    }
}
