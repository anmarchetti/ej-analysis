using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.AirportParking
{
    /// <summary>
    /// Request with all necessary information to search for parking options in AtCom
    /// </summary>
    [Serializable]
    [DataContract]
    public class AirportParkingSearchRequest
    {
        /// <summary>
        /// Offer selected by the user in the web portal
        /// </summary>
        [DataMember(Name = "offer")]
        [Required]
        public Offer Offer { get; set; }
    }
}