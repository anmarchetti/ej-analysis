using easyJet.Holidays.External.Domain.Models.Api;
using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Cms.Models.Hotels
{
    public class PolygonHotelsRequest : JsonApiRequest<PolygonHotelsRequestBody>
    {
        public override HttpMethod Method => HttpMethod.Post;
    }

    public class PolygonHotelsRequestBody
    {
        [DataMember(Name = "topLeftAngle")]
        public LocationPoint TopLeftAngle { get; set; }

        [DataMember(Name = "bottomRightAngle")]
        public LocationPoint BottomRightAngle { get; set; }
    }

    public class LocationPoint
    {
        [DataMember(Name = "Latitude")]
        public float Latitude { get; set; }

        [DataMember(Name = "Longitude")]
        public float Longitude { get; set; }
    }
}
