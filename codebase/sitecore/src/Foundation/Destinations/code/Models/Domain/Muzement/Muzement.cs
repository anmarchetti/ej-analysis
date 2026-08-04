using System.Collections.Generic;

namespace easyJet.Foundation.Destinations.Models.Domain.Muzement
{
    public class Muzement
    {
        public Muzement()
        {
        }

        public Muzement(IEnumerable<string> muzementIds, float radius, string type, IEnumerable<HotelCoordinates> coordinates)
        {
            MuzementIds = muzementIds;
            Radius = radius;
            Coordinates = coordinates;
            Type = type;
        }

        /// <summary>
        /// Gets or Sets muzement ids.
        /// </summary>
        public IEnumerable<string> MuzementIds { get; set; }

        /// <summary>
        /// Gets or sets destination type.
        /// </summary>
        public string Type { get; set; }

        /// <summary>
        /// Gets or sets country or region radius.
        /// </summary>
        public float Radius { get; set; }

        /// <summary>
        /// Gets or Sets hotels coordinates.
        /// </summary>
        public IEnumerable<HotelCoordinates> Coordinates { get; set; }
    }
}