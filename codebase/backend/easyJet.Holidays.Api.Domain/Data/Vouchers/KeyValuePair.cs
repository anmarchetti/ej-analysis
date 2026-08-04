using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Vouchers
{
    [Serializable]
    [DataContract]
    public class KeyValuePair
    {
        [DataMember(Name = "key")]
        public string Key { get; set; }

        [DataMember(Name = "value")]
        public object Value { get; set; }
    }
}
