using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Settings
{
    [Serializable]
    [DataContract]
    public class SmartSeerSitecoreSettings
    {
        [IgnoreDataMember]
        public bool IsRecommendedActive
        {
            get
            {
                return IsRecommendedActiveString == "1";
            }
        }

        [IgnoreDataMember]
        public bool IsSortActive
        {
            get
            {
                return IsSortActiveString == "1";
            }
        }

        [DataMember(Name = "IsRecommendedActive")]
        public string IsRecommendedActiveString { get; set; }

        [DataMember(Name = "IsSortActive")]
        public string IsSortActiveString { get; set; }

        [DataMember]
        public int MinimumHotelsAvailable { get; set; }

        [DataMember]
        public int NumberOfRequestedHotelsSmartSeer { get; set; }

        [DataMember]
        public int NumberOfRequestedHotelsAtcom { get; set; }

    }
}
