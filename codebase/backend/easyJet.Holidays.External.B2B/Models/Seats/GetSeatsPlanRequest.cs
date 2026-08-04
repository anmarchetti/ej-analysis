using easyJet.Holidays.Api.Domain.Settings;
using System.Runtime.Serialization;
using System.Xml.Serialization;

namespace easyJet.Holidays.External.B2B.Models.Seats
{
    public class GetSeatsPlanRequest : B2BRequestBase<GetSeatsPlanRequestBody>
    {
    }

    [XmlRoot(ElementName = "OFTFlightSeatPlanRequest")]
    public class GetSeatsPlanRequestBody : B2BApiRequestBase
    {
        [XmlAttribute]
        [DataMember]
        public string LanguageCode { get; set; }

        /// <summary>
        /// {Optional attribute} :- Sets the currency code in which consumer wants to display the fares.
        /// </summary>
        [XmlAttribute]
        [DataMember]
        public string CurrencyCode { get; set; }

        /// <summary>
        /// Departure airport code (Ex. 'LTN', 'EDI')
        /// </summary>
        [XmlAttribute]
        [DataMember]
        public string DepAirportCode { get; set; }

        /// <summary>
        /// Arrival airport code (Ex. 'LTN', 'EDI')
        /// </summary>
        [XmlAttribute]
        [DataMember]
        public string ArrAirportCode { get; set; }

        /// <summary>
        /// Flight departure date. Use ISO Format yyyy-MM-dd
        /// </summary>
        [XmlAttribute]
        [DataMember]
        public string DepartureDate { get; set; }

        /// <summary>
        /// Flight number (Ex. 7415, 6578)
        /// </summary>
        [XmlAttribute]
        [DataMember]
        public int FlightNumber { get; set; }

        /// <summary>
        /// Currency code of departure airport (Ex.  'EUR','CHF')
        /// </summary>
        [XmlAttribute]
        [DataMember]
        public string BaseCurrencyCode { get; set; }

        /// <summary>
        /// The fare class for which the seat plan and prices are to be retrieved
        /// </summary>
        [XmlAttribute]
        [DataMember]
        public string FareClass { get; set; }

        /// <summary>
        /// Passenger has ejPlus card
        /// </summary>
        [XmlAttribute]
        [DataMember]
        public string HasejPlusCard { get; set; }

        /// <summary>
        /// Passenger is a pregnant female
        /// </summary>
        [XmlAttribute]
        [DataMember]
        public string Pregnant { get; set; }

        /// <summary>
        /// Passenger is traveling with an infant
        /// </summary>
        [XmlAttribute]
        [DataMember]
        public string InfantOnLap { get; set; }

        /// <summary>
        /// Passenger has any kind of disability
        /// </summary>
        [XmlAttribute]
        [DataMember]
        public string Disability { get; set; }

        /// <summary>
        /// Passenger has any kind of disability
        /// </summary>
        [XmlAttribute]
        [DataMember]
        public string PhysicalDisorder { get; set; }

        /// <summary>
        /// Passenger is a child under 16 years of age
        /// </summary>
        [XmlAttribute]
        [DataMember]
        public string Child { get; set; }

        /// <summary>
        /// Passenger is elderly or fragile
        /// </summary>
        [XmlAttribute]
        [DataMember]
        public string Fragile { get; set; }

        /// <summary>
        /// {Optional Attribute} :- Indicates if the Offers will be shown in response or not. Possible values are 'Y','N'. Default value is 'N'. If the value is 'Y', then Offers are shown in the seat plan response.
        /// </summary>
        [XmlAttribute]
        [DataMember]
        public string ShowOffers { get; set; }

        public GetSeatsPlanRequestBody() { }

        public GetSeatsPlanRequestBody(B2BSettings b2bSettings) : base(b2bSettings) { }
    }
}
