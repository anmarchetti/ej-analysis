using easyJet.Holidays.Api.Domain.Settings;
using System.Xml.Serialization;

namespace easyJet.Holidays.External.B2B.Models.Seats
{
    public class GetSeatPlanRequestV1 : B2BRequestBase<GetSeatPlanRequestV1Body>
    {
    }

    [XmlRoot(ElementName = "GetSeatPlanRequestV1")]
    public class GetSeatPlanRequestV1Body : B2BApiRequestBase
    {
        public GetSeatPlanRequestV1Body()
        {
        }

        public GetSeatPlanRequestV1Body(B2BSettings b2bSettings) : base(b2bSettings)
        {
        }

        /// <summary>
        /// {Required Attribute} :- Gets or sets the Flight details
        /// </summary>
        [XmlElement(ElementName = "FlightIdentifier")]
        public FlightIdentifier FlightIdentifier { get; set; }
    }
}