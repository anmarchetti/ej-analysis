using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking
{
    public enum PromoCodeStatus
    {
        [EnumMember(Value = "NO_PROMOCODE")]
        NO_PROMOCODE,
        [EnumMember(Value = "APPLIED_ORIGINALLY")]
        APPLIED_ORIGINALLY,
        [EnumMember(Value = "PROMOCODE_REMOVED")]
        PROMOCODE_REMOVED,
        [EnumMember(Value = "TIER_DOWNGRADE")]
        TIER_DOWNGRADE,
        [EnumMember(Value = "TIER_UPGRADE")]
        TIER_UPGRADE,
        [EnumMember(Value = "ERROR")]
        ERROR
    }
}
