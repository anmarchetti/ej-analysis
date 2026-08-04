using System.Xml.Serialization;

namespace easyJet.Holidays.External.B2B.Models.Seats
{
    public class GetOffersResponseV2 : B2BApiResponseBase<GetOffersV2Root>
    {
    }

    public class GetOffersV2Root
    {
        public GetOffersV2Body GetOffersResponseV2 { get; set; }
    }

    [XmlRoot(ElementName = "Price")]
    public class Price
    {
        [XmlAttribute(AttributeName = "OfferAmount")]
        public double OfferAmount { get; set; }

        [XmlAttribute(AttributeName = "DiscountAmount")]
        public int DiscountAmount { get; set; }
    }

    [XmlRoot(ElementName = "Fare")]
    public class FareV2
    {
        [XmlElement(ElementName = "Price")]
        public Price Price { get; set; }

        [XmlArray("Benefits"), XmlArrayItem(typeof(Benefit), ElementName = "Benefit")]
        public List<Benefit> Benefits { get; set; }

        [XmlAttribute(AttributeName = "DisplayName")]
        public string DisplayName { get; set; }

        [XmlAttribute(AttributeName = "FareClass")]
        public string FareClass { get; set; }

        [XmlArray("AncillaryInclusions"), XmlArrayItem(typeof(ProductV2), ElementName = "Product")]
        public List<ProductV2> AncillaryInclusions { get; set; }
    }

    [XmlRoot(ElementName = "Quantity")]
    public class Quantity
    {
        [XmlAttribute(AttributeName = "Available")]
        public int Available { get; set; }
    }

    [XmlRoot(ElementName = "Product")]
    public class ProductV2
    {
        [XmlElement(ElementName = "Description")]
        public string Description { get; set; }

        [XmlElement(ElementName = "Price")]
        public Price Price { get; set; }

        [XmlElement(ElementName = "Quantity")]
        public Quantity Quantity { get; set; }

        [XmlArray("Benefits"), XmlArrayItem(typeof(Benefit), ElementName = "Benefit")]
        public List<Benefit> Benefits { get; set; }

        [XmlAttribute(AttributeName = "ChargeCode")]
        public string ChargeCode { get; set; }

        [XmlAttribute(AttributeName = "DisplayName")]
        public string DisplayName { get; set; }
    }

    [XmlRoot(ElementName = "Offer")]
    public class OfferV2
    {
        [XmlArray("AvailablePassengers"), XmlArrayItem(typeof(string), ElementName = "PassengerRef")]
        public List<string> AvailablePassengers { get; set; }

        [XmlElement(ElementName = "Fare")]
        public FareV2 Fare { get; set; }

        [XmlArray("AncillaryOffers"), XmlArrayItem(typeof(ProductV2), ElementName = "Product")]
        public List<ProductV2> AncillaryOffers { get; set; }
    }

    [XmlRoot(ElementName = "GetOffersResponseV2")]
    public class GetOffersV2Body
    {
        [XmlArray("Offers"), XmlArrayItem(typeof(OfferV2), ElementName = "Offer")]
        public List<OfferV2> Offers { get; set; }

        [XmlAttribute(AttributeName = "CurrencyCode")]
        public string CurrencyCode { get; set; }
    }
}
