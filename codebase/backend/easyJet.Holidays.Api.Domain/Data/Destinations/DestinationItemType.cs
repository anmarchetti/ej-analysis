using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Destinations
{
    /// <summary>
    /// Destination item type
    /// </summary>
    public enum DestinationItemType
    {
        /// <summary>
        /// Country type
        /// </summary>
        [EnumMember(Value = "Country")]
        Country,

        /// <summary>
        /// Location type
        /// </summary>
        [EnumMember(Value = "Region")]
        Region,

        /// <summary>
        /// Resort type
        /// </summary>
        [EnumMember(Value = "Resort")]
        Resort,

        /// <summary>
        /// Hotel type
        /// </summary>
        [EnumMember(Value = "Hotel")]
        Hotel,

        /// <summary>
        /// VirtualCountry type
        /// </summary>
        [EnumMember(Value = "VirtualCountry")]
        VirtualCountry,

        /// <summary>
        /// VirtualRegion type
        /// </summary>
        [EnumMember(Value = "VirtualRegion")]
        VirtualRegion,

        /// <summary>
        /// VirtualResort type
        /// </summary>
        [EnumMember(Value = "VirtualResort")]
        VirtualResort
    }
}