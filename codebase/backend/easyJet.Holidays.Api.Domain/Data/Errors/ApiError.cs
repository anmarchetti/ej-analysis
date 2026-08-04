using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Errors
{
    /// <summary>
    /// Downstream API error
    /// </summary>
    [DataContract]
    public class ApiError
    {
        /// <summary>
        /// Downstream API error code
        /// </summary>
        [DataMember(Name = "code", EmitDefaultValue = false)]
        public string Code { get; set; }

        /// <summary>
        /// Downstream API error message
        /// </summary>
        [DataMember(Name = "message", EmitDefaultValue = false)]
        public string Message { get; set; }
    }
}
