using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Hotels
{
    /// <summary>
    /// Geografic coordinates point
    /// </summary>
    public class Point
    {
        /// <summary>
        /// Latitude
        /// </summary>
        [DataMember(Name = "latitude")]
        public float Latitude { get; set; }

        /// <summary>
        /// Longitude
        /// </summary>
        [DataMember(Name = "longitude")]
        public float Longitude { get; set; }
    }

    /// <summary>
    /// Top-left and bottom-right polygon angles
    /// </summary>
    public class PolyCoordinates
    {
        /// <summary>
        /// Top left angle coordinates
        /// </summary>
        [DataMember(Name = "topLeftAngle")]
        public Point TopLeftAngle { get; set; }

        /// <summary>
        /// Bottom right angle coordinates
        /// </summary>
        [DataMember(Name = "bottomRightAngle")]
        public Point BottomRightAngle { get; set; }
    }
}
