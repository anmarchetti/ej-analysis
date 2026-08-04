using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Transfers
{
    /// <summary>
    /// Transfer instructions model
    /// </summary>
    [Serializable]
    [DataContract]
    public class TransferInfo
    {
        /// <summary>
        /// Gets or sets arrival instructinos
        /// </summary>
        [DataMember(Name = "arrivalInstr")]
        public string ArrivalInstructions { get; set; }

        /// <summary>
        /// Gets or sets departure instructinos
        /// </summary>
        [DataMember(Name = "depInstr")]
        public string DepInstructions { get; set; }

        /// <summary>
        /// Gets or sets transfer duration
        /// </summary>
        [DataMember(Name = "duration")]
        public int Duration { get; set; }

        /// <summary>
        /// Gets or sets transfer language
        /// </summary>
        [DataMember(Name = "lang")]
        public string Language { get; set; }
    }
}
