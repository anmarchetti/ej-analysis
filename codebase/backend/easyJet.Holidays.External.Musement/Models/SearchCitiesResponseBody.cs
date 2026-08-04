using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Musement.Models
{
    /// <summary>
    /// Model returned by musement api
    /// </summary>
    [Serializable]
    [DataContract]
    public class SearchCitiesResponseBody
    {
        /// <summary>
        /// City id
        /// </summary>
        [DataMember(Name = "id")]
        public int Id { get; set; }

        /// <summary>
        /// City name
        /// </summary>
        [DataMember(Name = "name")]
        public string Name { get; set; }
    }
}
