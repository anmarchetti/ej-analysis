using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking
{
    /// <summary>
    /// Changed person informaion.
    /// </summary>
    public class AmendPerson
    {
        /// <summary>
        /// Passenger first name.
        /// </summary>
        /// <value>
        /// The first name.
        /// </value>
        [DataMember(Name = "firstName")]
        [Required]
        public string FirstName { get; set; }

        /// <summary>
        /// Passenger last name.
        /// </summary>
        /// <value>
        /// The last name.
        /// </value>
        [DataMember(Name = "lastName")]
        [Required]
        public string LastName { get; set; }

        /// <summary>
        /// Value indicat whether this instance is lead passenger.
        /// </summary>
        /// <value>
        ///   <c>true</c> if this instance is lead passenger; otherwise, <c>false</c>.
        /// </value>
        [DataMember(Name = "isLeadPassenger")]
        [Required]
        public bool IsLeadPassenger { get; set; }

        /// <summary>
        /// Atcom PAX index.
        /// </summary>
        /// <value>
        /// The index.
        /// </value>
        [DataMember(Name = "index")]
        [Required]
        public string Index { get; set; }
    }
}