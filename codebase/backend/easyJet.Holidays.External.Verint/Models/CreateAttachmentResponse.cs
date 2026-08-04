using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Domain.Models.Api;
using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Verint.Models
{
    public class CreateAttachmentResponse : JsonApiResponse<CreateAttachmentResponseBody>
    {
        public override ApiError[] ApiErrors => null;
    }

    public class CreateAttachmentResponseBody
    {
        [DataMember(Name = "identifier")]
        public string Identifier { get; set; }

        [DataMember(Name = "fileName")]
        public string FileName { get; set; }

        [DataMember(Name = "sessionId")]
        public string SessionId { get; set; }

        [DataMember(Name = "sessionExpiry")]
        public int SessionExpiry { get; set; }

        [DataMember(Name = "fileSize")]
        public int FileSize { get; set; }

        [DataMember(Name = "contentType")]
        public string ContentType { get; set; }
    }
}