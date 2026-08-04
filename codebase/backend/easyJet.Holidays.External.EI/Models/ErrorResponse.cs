using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Domain.Models.Api;
using Newtonsoft.Json;
using System.Runtime.Serialization;
using System.Text;

namespace easyJet.Holidays.External.EI.Models
{
    public class ErrorResponse : JsonApiResponse<ErrorResponseBody>
    {
        public override ApiError[] ApiErrors => Payload.Body.Errors.Where(e => e.AffectedData != null).SelectMany(e => e.AffectedData).Select(d => new ApiError
        {
            Code = d.DataName,
            Message = d.Information
        }).Union(Payload.Body.Errors.Where(e => e.AffectedData == null).Select(e => new ApiError
        {
            Code = "999",
            Message = e.Message
        })).ToArray();
    }

    /// <summary>
    /// Collection of errors
    /// </summary>
    [DataContract]
    public class ErrorResponseBody
    {
        /// <summary>
        /// Gets or Sets Errors
        /// </summary>
        [DataMember(Name = "errors", EmitDefaultValue = false)]
        [JsonProperty(PropertyName = "errors")]
        public List<Error> Errors { get; set; }


        /// <summary>
        /// Get the string presentation of the object
        /// </summary>
        /// <returns>String presentation of the object</returns>
        public override string ToString()
        {
            var sb = new StringBuilder();
            sb.Append("class ErrorResponse {\n");
            sb.Append("  Errors: ").Append(Errors).Append("\n");
            sb.Append("}\n");
            return sb.ToString();
        }

        /// <summary>
        /// Get the JSON string presentation of the object
        /// </summary>
        /// <returns>JSON string presentation of the object</returns>
        public string ToJson()
        {
            return JsonConvert.SerializeObject(this, Formatting.Indented);
        }

    }
}
