using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Settings
{
    [Serializable]
    [DataContract]
    public class SessionSettings
    {
        [DataMember(Name = "SessionTimeout")]
        public int? SessionTimeout { get; set; }

        [DataMember(Name = "TimerPopupTimeout")]
        public int? TimerPopupTimeout { get; set; }
    }
}