using easyJet.Holidays.External.Domain.Models.Api;
using System.Runtime.Serialization;

namespace easyJet.Holidays.External.HolidayExtras.Models
{
    /// <inheritdoc />
    public class HolidayExtrasRequestWithKey : JsonApiRequest<object>
    {
        /// <summary>
        /// <see cref="HolidayExtrasSettings.Key"/>
        /// </summary>
        [DataMember(Name = "key")]
        public required string Key { get; set; }
    }
}