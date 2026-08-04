using easyJet.Holidays.Api.Domain.Settings;
using System.Xml.Serialization;

namespace easyJet.Holidays.External.B2B.Models.Seats
{
    public class GetOffersRequestV2 : B2BRequestBase<GetOffersRequestV2Body>
    {
    }

    [XmlRoot(ElementName = "GetOffersRequestV2")]
    public class GetOffersRequestV2Body : B2BApiRequestBase
    {
        public GetOffersRequestV2Body()
        {
        }

        public GetOffersRequestV2Body(B2BSettings b2bSettings) : base(b2bSettings)
        {
        }

        /// <summary>
        /// {Required Attribute} :- Sets the currency code in which consumer wants to display the offers
        /// </summary>
        [XmlAttribute(AttributeName = "CurrencyCode")]
        public string CurrencyCode { get; set; }

        /// <summary>
        /// {Required Attribute} :- Sets the language code. Language codes supported by B2B api are EN, DE, ES
        /// </summary>
        [XmlAttribute(AttributeName = "LanguageCode")]
        public string LanguageCode { get; set; }

        /// <summary>
        /// {Optional Attribute} :- Sets the office id of the B2B api consumer
        /// </summary>
        [XmlAttribute(AttributeName = "OfficeID")]
        public string OfficeId { get; set; }

        /// <summary>
        /// {Optional Attribute} :- Sets the corporate id of the B2B api consumer
        /// </summary>
        [XmlAttribute(AttributeName = "CorporateID")]
        public string CorporateId { get; set; }

        /// <summary>
        /// {Optional Attribute} :- Gets or sets the Passenger details list
        /// </summary>
        [XmlArray("Passengers"), XmlArrayItem(typeof(Passenger), ElementName = "Passengers")]
        public List<Passenger> Passengers { get; set; }

        /// <summary>
        /// {Required Attribute} :- Gets or sets the Flight details
        /// </summary>
        [XmlElement(ElementName = "FlightIdentifier")]
        public FlightIdentifier FlightIdentifier { get; set; }

        /// <summary>
        /// {Optional Attribute} :- Gets or sets the Fare criteria detail
        /// </summary>
        [XmlElement(ElementName = "FareCriteria")]
        public FareCriteria FareCriteria { get; set; }
    }

    /// <summary>
    /// Passenger details
    /// </summary>
    [XmlRoot(ElementName = "Passenger")]
    public class Passenger
    {
        /// <summary>
        /// {Required Attribute} :- Represents the Passenger Reference
        /// </summary>
        [XmlAttribute(AttributeName = "Ref")]
        public string Ref { get; set; }

        /// <summary>
        /// {Required Attribute} :- Represents the Passenger's EjPlusCard.B2B supports the Standard or None Value of EjPlusCard
        /// </summary>
        [XmlAttribute(AttributeName = "ejPlusCard")]
        public string EjPlusCard { get; set; }

        /// <summary>
        /// {Optional Attribute} :- Represents the Passenger's type. B2B supports the Adult or Child Value of type
        /// </summary>
        [XmlAttribute(AttributeName = "Type")]
        public string Type { get; set; }
    }

    [XmlRoot(ElementName = "FareCriteria")]
    public class FareCriteria
    {
        /// <summary>
        /// {Required Attribute} :- Represents the Fare Class
        /// </summary>
        [XmlAttribute(AttributeName = "FareClass")]
        public string FareClass { get; set; }
    }
}