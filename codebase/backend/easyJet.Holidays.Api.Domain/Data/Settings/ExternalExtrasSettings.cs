using System;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Settings
{
    /// <summary>
    /// External Extras Settings from Sitecore
    /// </summary>
    [Serializable]
    [DataContract]
    public class ExternalExtrasSettings
    {
        /// <summary>
        /// Returns true if IsExternalExtrasEnabled toggle is on, string value equals to 1, and false otherwise
        /// </summary>
        [IgnoreDataMember]
        public bool IsExternalExtrasEnabled
        {
            get
            {
                return IsExternalExtrasEnabledString == "1";
            }
        }

        /// <summary>
        /// IsExternalExtrasEnabled toggle value as string
        /// </summary>
        [DataMember(Name = "IsExternalExtrasEnabled")]
        public string IsExternalExtrasEnabledString { get; set; }

    }
}
