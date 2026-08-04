using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Settings
{
    [Serializable]
    [DataContract]
    public class LockedAccountSettings
    {
        [DataMember(Name = "Emails")]
        public string EmailsString { get; set; }

        private static string[] _splitters = { " ", "\r\n", "\t" };

        public IEnumerable<string> Emails => EmailsString?.Split(_splitters, StringSplitOptions.RemoveEmptyEntries);
    }
}
