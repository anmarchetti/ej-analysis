using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Dflo.Models.Search
{
    public class DocumentsSearchResponse : JsonApiResponse<DocumentItem[]>
    {
        public override ApiError[] ApiErrors => null; // Don't handle response body errors
    }

    public class DocumentItem
    {
        public string ID { get; set; }
        public string DocType { get; set; }
        public string ResID { get; set; }
        public string Document { get; set; }
        public DateTime? DateStored { get; set; }
    }
}