using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Settings
{
    /// <summary>
    /// My Bookings Settings from Sitecore
    /// </summary>
    [Serializable]
    [DataContract]
    public class MyBookingsSettings
    {
        /// <summary>
        /// Promotions used to hide bookings in My Bookings.
        /// </summary>
        [DataMember(Name = "HideBookingsWithPromotion")]
        public IReadOnlyCollection<KeyedPromotion> HideBookingsWithPromotion { get; set; }
    }
}
