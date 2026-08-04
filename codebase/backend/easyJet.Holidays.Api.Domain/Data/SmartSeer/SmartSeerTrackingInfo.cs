using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.SmartSeer
{
    /// <summary>
    /// SmartSeer tracking info
    /// </summary>
    [Serializable]
    [DataContract]
    public class SmartSeerTrackingInfo
    {
        /// <summary>
        /// pToken from response
        /// </summary>
        [DataMember(Name = "pToken")]
        public string PToken { get; set; }

        /// <summary>
        /// Tracking onbject fron response
        /// </summary>
        [DataMember(Name = "tracking")]
        public object Tracking { get; set; }

        /// <summary>
        /// 
        /// </summary>
        [DataMember(Name = "recoInfo")]
        public object RecoInfo { get; set; }

        /// <summary>
        /// SmartSeer request url
        /// </summary>
        [DataMember(Name = "apiUrl")]
        public string ApiUrl { get; set; }

        /// <summary>
        /// Failiure error message
        /// </summary>
        [DataMember(Name = "apiMessage")]
        public string ApiMessage { get; set; }
    }
}
