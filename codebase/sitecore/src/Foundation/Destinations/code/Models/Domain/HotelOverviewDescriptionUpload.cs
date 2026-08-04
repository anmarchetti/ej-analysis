using System;
using CsvHelper.Configuration.Attributes;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class HotelOverviewDescriptionUpload : IEquatable<HotelOverviewDescriptionUpload>
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="HotelOverviewDescriptionUpload"/> class.
        /// This ctor needs for deserialization.
        /// </summary>
        public HotelOverviewDescriptionUpload()
        {
        }

        public HotelOverviewDescriptionUpload(string giataCode, string hotelOverviewDescription)
        {
            GiataCode = giataCode;
            HotelOverviewDescription = hotelOverviewDescription;
        }

        /// <summary>
        /// Gets or sets hotel code.
        /// </summary>
        [Index(0)]
        public string GiataCode { get; set; }

        /// <summary>
        /// Gets or sets hotel overview description.
        /// </summary>
        [Index(1)]
        public string HotelOverviewDescription { get; set; }

        public bool Equals(HotelOverviewDescriptionUpload other)
        {
            if (ReferenceEquals(null, other))
            {
                return false;
            }

            if (ReferenceEquals(this, other))
            {
                return true;
            }

            return GiataCode == other.GiataCode;
        }

        public override bool Equals(object obj)
        {
            if (ReferenceEquals(null, obj))
            {
                return false;
            }

            if (ReferenceEquals(this, obj))
            {
                return true;
            }

            if (obj.GetType() != GetType())
            {
                return false;
            }

            return Equals((HotelOverviewDescriptionUpload)obj);
        }

        public override int GetHashCode()
        {
            return GiataCode != null ? GiataCode.GetHashCode() : 0;
        }
    }
}