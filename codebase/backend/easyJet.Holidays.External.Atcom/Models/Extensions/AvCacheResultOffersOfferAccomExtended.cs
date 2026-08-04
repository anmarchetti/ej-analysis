using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;

namespace easyJet.Holidays.External.Atcom.Models.Extensions
{
    public class AvCacheResultOffersOfferAccomExtended : AvCacheResultOffersOfferAccom
    {
        public AvCacheResultOffersOfferAccomExtended(AvCacheResultOffersOfferAccom accom)
        {
            AtcomId = accom.AtcomId;
            Brand = accom.Brand;
            Code = accom.Code;
            CommPri = accom.CommPri;
            Cty1 = accom.Cty1;
            Cty2 = accom.Cty2;
            Cty3 = accom.Cty3;
            Date = accom.Date;
            Ext = accom.Ext;
            ExtSpecified = accom.ExtSpecified;
            Id = accom.Id;
            Name = accom.Name;
            Prom = accom.Prom;
            Pt = accom.Pt;
            Rating = accom.Rating;
            Stay = accom.Stay;
            SubId = accom.SubId;
            Tracs = accom.Tracs;
            Type = accom.Type;
            TypeSpecified = accom.TypeSpecified;
            Unit = accom.Unit;
            Latitude = accom.Latitude;
            Longitude = accom.Longitude;
        }

        public int StarRating { get; init; }

        public double TripAdvisorRating { get; init; }

        /// <summary>
        /// All hotel types applicable to this hotel according to facility matrix from sitecore
        /// </summary>
        public HotelType[] FacilityMatrix { get; init; }

        public List<FacilityGroup> FacilityGroups { get; init; }

        public List<string> FacilitiesCodes { get; init; }

        /// <summary>
        /// Transfer duration in minutes
        /// </summary>
        public int? TransferDuration { get; init; }
    }
}