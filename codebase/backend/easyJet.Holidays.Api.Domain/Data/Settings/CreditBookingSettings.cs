using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Settings
{
    [Serializable]
    [DataContract]
    public class CreditBookingSettingsSitecore
    {
        [IgnoreDataMember]
        public bool EnableRedeemVoucher => EnableRedeemVoucherString?.Equals("1") ?? false;

        [DataMember(Name = "EnableRedeemVoucher")]
        public string EnableRedeemVoucherString { get; set; }
    }
}
