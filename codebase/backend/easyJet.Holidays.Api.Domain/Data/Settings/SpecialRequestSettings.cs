using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Settings
{
    [Serializable]
    [DataContract]
    public class SpecialRequestSettingsSitecore
    {
        [IgnoreDataMember]
        public bool IsSpecialRequestActive => IsSpecialRequestActiveString?.Equals("1") ?? false;

        [IgnoreDataMember]
        public bool IsEligibleToAddForDC => IsEligibleToAddSSRForDC?.Equals("1") ?? false;

        [IgnoreDataMember]
        public bool IsEligibleToAddForHBG => IsEligibleToAddSSRForHBG?.Equals("1") ?? false;

        [DataMember(Name = "IsSpecialRequestActive")]
        public string IsSpecialRequestActiveString { get; set; }

        [DataMember(Name = "IsEligibleToAddSSRForDC")]
        public string IsEligibleToAddSSRForDC { get; set; }

        [DataMember(Name = "IsEligibleToAddSSRForHBG")]
        public string IsEligibleToAddSSRForHBG { get; set; }
    }
}
