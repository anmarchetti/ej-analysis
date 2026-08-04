using easyJet.Holidays.Api.Domain.Data.Attributes;
using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Marketing
{
    [Serializable]
    [DataContract]
    public class MarketingPreferencesRequest
    {
        /// <summary>
        /// Customers emails to be checked
        /// </summary>
        [DataMember]
        [Required]
        [EmailAddressList]
        public IEnumerable<string> Emails { get; set; }
    }

}