using System.Xml.Serialization;

namespace easyJet.Holidays.External.B2B.Models.Seats
{
    public class GetSeatsPlanResponse : B2BApiResponseBase<GetSeatsPlanRoot>
    {
    }

    public class GetSeatsPlanRoot
    {
        public GetSeatsPlanRootBody SeatPlanResponse { get; set; }
        public Offers Offers { get; set; }
    }

    public class GetSeatsPlanRootBody
    {
        /// <summary>
        /// Represents the currency code in which user wishes to receive the seat prices.
        /// </summary>
        [XmlAttribute]
        public string CurrencyCode { get; set; }

        /// <summary>
        /// Represents aircraft type code.
        /// </summary>
        [XmlAttribute]
        public string AircraftType { get; set; }

        /// <summary>
        /// Indicates if the wrapped prices are applicable or not.
        /// </summary>
        [XmlAttribute]
        public string IsWrapped { get; set; }

        /// <summary>
        /// Represent seat plan rows
        /// </summary>
        [XmlArray("rows"), XmlArrayItem(typeof(Row), ElementName = "row")]
        public Row[] Rows { get; set; }
    }

    [XmlRoot(ElementName = "Offers")]
    public class Offers
    {
        [XmlElement(ElementName = "Fare")]
        public Fare Fare { get; set; }

        [XmlArray("AncillaryOffers"), XmlArrayItem(typeof(Product), ElementName = "Product")]
        public List<Product> AncillaryOffers { get; set; }
    }

    [XmlRoot(ElementName = "Product")]
    public class Product
    {
        [XmlArray("Benefits"), XmlArrayItem(typeof(Benefit), ElementName = "Benefit")]
        public List<Benefit> Benefits { get; set; }

        [XmlAttribute(AttributeName = "ChargeCode")]
        public string ChargeCode { get; set; }

        [XmlAttribute(AttributeName = "ChargeCodeId")]
        public string ChargeCodeId { get; set; }

        [XmlAttribute(AttributeName = "DisplayName")]
        public string DisplayName { get; set; }
    }

    [XmlRoot(ElementName = "Fare")]
    public class Fare
    {
        [XmlArray("Benefits"), XmlArrayItem(typeof(Benefit), ElementName = "Benefit")]
        public List<Benefit> Benefits { get; set; }

        [XmlAttribute(AttributeName = "DisplayName")]
        public string DisplayName { get; set; }

        [XmlAttribute(AttributeName = "FareClass")]
        public string FareClass { get; set; }
    }
}
