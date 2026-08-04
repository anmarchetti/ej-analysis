using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.PackageOffers.ShortList
{
    /// <summary>
    /// ShortList type
    /// </summary>
    public enum ShortListType
    {
        /// <summary>
        /// short list type for offers search results
        /// </summary>
        [EnumMember(Value = "offer")]
        Offer,

        /// <summary>
        /// short list type for hotels browse pages
        /// </summary>
        [EnumMember(Value = "hotel")]
        Hotel,
    }
}