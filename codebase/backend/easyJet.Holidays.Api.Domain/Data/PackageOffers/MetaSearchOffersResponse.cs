using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.PackageOffers
{
    [Serializable]
    [DataContract]
    public class MetaSearchOffersResponse
    {
        [DataMember(Name = "offers")]
        public List<MetaSearchOffer> Offers { get; set; }
    }

    /// <summary>
    /// Lightweight offer model for external meta search systems
    /// </summary>
    [Serializable]
    [DataContract]
    public class MetaSearchOffer : Offer
    {
        public MetaSearchOffer()
        {

        }

        public MetaSearchOffer(Offer offer)
        {
            //there is no data not needed for external meta search systems (accom price, transfers, etc.)
            Id = offer.Id;
            Date = offer.Date;
            Stay = offer.Stay;
            Price = offer.Price;
            PricePP = offer.PricePP;
            PriceExcludingTouristTax = offer.PriceExcludingTouristTax;
            PricePPExcludingTouristTax = offer.PricePPExcludingTouristTax;
            Currency = offer.Currency;
            Deposit = offer.Deposit;
            Accom = new Accom()
            {
                Code = offer.Accom.Code,
                Id = offer.Accom.Id,
                Date = offer.Accom.Date,
                IsExternal = offer.Accom.IsExternal,
                Latitude = offer.Accom.Latitude,
                Longitude = offer.Accom.Longitude,
                Stay = offer.Accom.Stay,
                PackageId = offer.Accom.PackageId,
                Unit = offer.Accom.Unit.Select(x => new Unit
                {
                    Code = x.Code,
                    Board = x.Board,
                    Occupation = x.Occupation
                }).ToList()
            };
            AltBoards = offer.AltBoards;
            Transport = new Transport()
            {
                Routes = offer.Transport.Routes.Select(route => new Route()
                {
                    DepPt = route.DepPt,
                    DepDate = route.DepDate,
                    ArrPt = route.ArrPt,
                    ArrDate = route.ArrDate,
                    FltNo = route.FltNo,
                    Car = route.Car,
                    Direction = route.Direction,
                    IsExternal = route.IsExternal
                }).ToList()
            };
            DefaultTransferCode = offer.DefaultTransferCode;
            Hotel = new MetaSearchHotel()
            {
                Name = offer.Hotel?.Name,
            };
            DeepLink = offer.DeepLink;
        }

        /// <summary>
        /// Lightweight hotel for external meta search systems
        /// </summary>
        [DataMember(Name = "hotel")]
        public MetaSearchHotel Hotel { get; set; }
    }

    /// <summary>
    /// Lightweight hotel model for external meta search systems
    /// </summary>
    [Serializable]
    [DataContract]
    public class MetaSearchHotel
    {
        [DataMember(Name = "name")]
        public string Name { get; set; }

        [DataMember(Name = "giataCode")]
        public string GiataCode { get; set; }

    }
}