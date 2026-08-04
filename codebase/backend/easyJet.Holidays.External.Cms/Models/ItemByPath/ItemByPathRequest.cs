using easyJet.Holidays.External.Domain.Models.Api;
using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Cms.Models.ItemByPath
{
    public class ItemByPathRequest : JsonApiRequest<object>
    {
        public override HttpMethod Method => HttpMethod.Get;

        [DataMember(Name = "path")]
        public string Path { get; set; }

        [DataMember(Name = "withChildren")]
        public bool? WithChildren { get; set; }

        [DataMember(Name = "readAll")]
        public bool? ReadAll { get; set; }
    }
}
