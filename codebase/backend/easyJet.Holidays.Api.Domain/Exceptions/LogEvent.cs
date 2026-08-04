using System.Runtime.Serialization;
using System.Text.Json.Serialization;

namespace easyJet.Holidays.Api.Common.Exceptions
{
    /// <summary>
    /// Log Event
    /// </summary>
    [DataContract]
    public class LogEvent
    {
        /// <summary>
        /// Log record level
        /// </summary>
        [DataMember(Name = "level")]
        public string Level { get; set; }

        /// <summary>
        /// Log message
        /// </summary>
        [DataMember(Name = "message")]
        public string Message { get; set; }

        /// <summary>
        /// Exception stack trace
        /// </summary>
        [DataMember(Name = "stack")]
        [JsonPropertyName("stack")]
        public string StackTrace { get; set; }
    }
}
