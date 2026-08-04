using System.Runtime.Serialization;

namespace easyJet.Holidays.External.HolidayExtras.Models
{
    /// <inheritdoc />
    public class HolidayExtrasRequestWithKeyAndToken : HolidayExtrasRequestWithKey
    {
        /// <summary>
        /// <see cref="HolidayExtrasSettings.Token"/>
        /// </summary>
        [DataMember(Name = "token")]
        public required string Token { get; set; }
    }
}