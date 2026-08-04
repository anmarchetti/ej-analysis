using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Marketing
{
    /// <summary>
    /// Customer marketing preferences response model
    /// </summary>
    [Serializable]
    [DataContract]
    public class CustomerPreferencesResponse
    {
        /// <summary>
        /// Is message can be send to customer email
        /// </summary>
        [DataMember]
        public bool CanBeSent { get; set; }

        /// <summary>
        /// Customer url list
        /// </summary>
        [DataMember(Name = "csatUrls")]
        public IEnumerable<string> Urls { get; set; }

        /// <summary>
        /// Unsubscribe link
        /// </summary>
        [DataMember]
        public string UnsubscribeLink { get; set; }
    }

    /// <summary>
    /// Parameters to build CustomerPreferencesResponse urls
    /// </summary>
    public class MarketingUrlParameters
    {
        /// <summary>
        /// Form language
        /// </summary>
        [DataMember(Name = "lng")]
        public string FormLanguage { get; set; }

        /// <summary>
        /// This is the scheduled arrival date
        /// </summary>
        [DataMember(Name = "surveyRef")]
        public string SurveyRef { get; set; }

        /// <summary>
        /// This is the scheduled arrival date
        /// </summary>
        [DataMember(Name = "ADate")]
        public string ADate { get; set; }

        /// <summary>
        /// This is the Holidays booking reference
        /// </summary>
        [DataMember(Name = "BrokerPanelId")]
        public string BrokerPanelId { get; set; }

        /// <summary>
        /// Outbound departure date
        /// </summary>
        [DataMember(Name = "OutFltDT")]
        public string OutFltDT { get; set; }

        /// <summary>
        /// Inbound departure date
        /// </summary>
        [DataMember(Name = "InFltDT")]
        public string InFltDT { get; set; }

        /// <summary>
        /// This is the outbound departure code
        /// </summary>
        [DataMember(Name = "OutDep")]
        public string OutDep { get; set; }

        /// <summary>
        /// This is the outbound arrival code
        /// </summary>
        [DataMember(Name = "OutArr")]
        public string OutArr { get; set; }

        /// <summary>
        /// This is the return departure code
        /// </summary>
        [DataMember(Name = "InDep")]
        public string InDep { get; set; }

        /// <summary>
        /// This is the return arrival code 
        /// </summary>
        [DataMember(Name = "InArr")]
        public string InArr { get; set; }

        /// <summary>
        /// Satisfaction score (from 1 to 7) 
        /// </summary>
        [DataMember(Name = "SAT")]
        public int SatisfactionScore { get; set; }

        /// <summary>
        /// This is the total number of guests within the booking
        /// </summary>
        [DataMember(Name = "PAXMix")]
        public int PaxMix { get; set; }

        /// <summary>
        /// This is a unique hotel identifier allocated to individual hotels
        /// </summary>
        [DataMember(Name = "AccomCode")]
        public string AccomCode { get; set; }

        /// <summary>
        /// This is the name allocated to the hotels unique identifier
        /// </summary>
        [DataMember(Name = "AccomName")]
        public string AccomName { get; set; }

        /// <summary>
        /// This is the resort that this hotel is located in
        /// </summary>
        [DataMember(Name = "ResortName")]
        public string ResortName { get; set; }

        /// <summary>
        /// This identifies if a customer has a transfer included in their booking and if yes what transfer is included
        /// STR – Shared Transfer PTR – Private Transfer NSTR – No Shared Transfer NPTR – No Private Transfer.
        /// </summary>
        [DataMember(Name = "TfrType")]
        public int TransferType { get; set; }

        /// <summary>
        /// This is the airlines flight number i.e. EZYnnnn
        /// </summary>
        [DataMember(Name = "DepFltNo")]
        public string DepFltNo { get; set; }

        /// <summary>
        /// This is the airlines flight number i.e. EZYnnnn
        /// </summary>
        [DataMember(Name = "ArrFltno")]
        public string ArrFltno { get; set; }

        /// <summary>
        /// Language
        /// </summary>
        [DataMember(Name = "LG")]
        public string Language { get; set; }

        /// <summary>
        /// Market
        /// </summary>
        [DataMember(Name = "Market")]
        public string MarketCode { get; set; }

        /// <summary>
        /// How the customer booked their holiday i.e. via the website or through a travel agent
        /// </summary>
        [DataMember(Name = "BT")]
        public string BookingType { get; set; }

        /// <summary>
        /// The bed and board basis  i.e. All-inclusive etc 
        /// </summary>
        [DataMember(Name = "BB")]
        public string BoardBasis { get; set; }

        /// <summary>
        /// Type of package
        /// </summary>
        [DataMember(Name = "T")]
        public string Theme { get; set; }

        /// <summary>
        /// Official star rating as categorised by the hotel
        /// </summary>
        [DataMember(Name = "Star")]
        public string HotelStarRating { get; set; }

        /// <summary>
        /// Children are included in the booking 
        /// </summary>
        [DataMember(Name = "HC")]
        public string HasChildren { get; set; }

        /// <summary>
        /// Marketing Option from MarketingPreferenceTable
        /// </summary>
        [DataMember(Name = "MarketingOptin")]
        public string MarketingOptin { get; set; }

        /// <summary>
        /// By adding the parameter &DevelopmentCycle=1 the interview will not be saved. This is only to be used to test invite mailings.
        /// </summary>
        [DataMember(Name = "DevelopmentCycle")]
        public string DevelopmentCycle { get; set; }
    }
}
