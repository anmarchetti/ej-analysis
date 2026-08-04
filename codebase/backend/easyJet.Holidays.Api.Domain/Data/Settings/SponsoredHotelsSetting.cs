using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Settings
{
    [Serializable]
    [DataContract]
    public class SponsoredHotelsSettingSitecore
    {
        [IgnoreDataMember]
        public bool IsEnabled
        {
            get
            {
                return IsEnabledString == "1";
            }
        }

        [DataMember(Name = "IsEnabled")]
        public string IsEnabledString { get; set; }

    }
}
