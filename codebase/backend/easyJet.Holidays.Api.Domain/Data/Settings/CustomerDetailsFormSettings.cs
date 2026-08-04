using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Settings
{
    [Serializable]
    [DataContract]
    public class CustomerDetailsFormSettings
    {
        [DataMember(Name = "PasswordProhibitedWords")]
        public string PasswordProhibitedWordsString { get; set; }

        private static char _separator = ',';

        public IEnumerable<string> PasswordProhibitedWords =>
            PasswordProhibitedWordsString?.Split(_separator, StringSplitOptions.RemoveEmptyEntries) ?? Array.Empty<string>();
    }
}
