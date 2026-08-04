using easyJet.Holidays.External.Domain.Models.Api;
using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Dflo.Models.Search
{
    public class DocumentsSearchRequest : JsonApiRequest<DocumentsSearchRequestBody[]>
    {
        public override HttpMethod Method => HttpMethod.Post;
    }

    [DataContract]
    public class DocumentsSearchRequestBody
    {
        [DataMember(Name = "field")]
        public string Field { get; set; }

        [DataMember(Name = "operator")]
        public string Operator { get; set; }

        [DataMember(Name = "value")]
        public string Value { get; set; }
    }
}
