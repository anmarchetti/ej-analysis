using easyJet.Holidays.External.Atcom.Models.Internal.Search;

namespace easyJet.Holidays.External.Atcom.Models.Extensions
{
    public class AvCacheResultOffersOfferExtended : AvCacheResultOffersOffer
    {
        public AvCacheResultOffersOfferExtended(AvCacheResultOffersOffer offer, IEnumerable<AvCacheResultOffersOfferAccomExtended> accom)
        {
            ArgumentNullException.ThrowIfNull(offer);
            ArgumentNullException.ThrowIfNull(accom);

            Accom = accom.ToArray();
            base.Accom = Accom.Select(a => new AvCacheResultOffersOfferAccom()
            {
                AtcomId = a.AtcomId,
                Brand = a.Brand,
                Code = a.Code,
                CommPri = a.CommPri,
                Cty1 = a.Cty1,
                Cty2 = a.Cty2,
                Cty3 = a.Cty3,
                Date = a.Date,
                Ext = a.Ext,
                ExtSpecified = a.ExtSpecified,
                Id = a.Id,
                Name = a.Name,
                Prom = a.Prom,
                Pt = a.Pt,
                Rating = a.Rating,
                Stay = a.Stay,
                SubId = a.SubId,
                Tracs = a.Tracs,
                Type = a.Type,
                TypeSpecified = a.TypeSpecified,
                Unit = a.Unit,
                Latitude = a.Latitude,
                Longitude = a.Longitude
            }).ToArray();

            if (int.TryParse(Accom.FirstOrDefault()?.CommPri, out int priority))
            {
                CommercialPriority = priority;
            }

            AltBoard = offer.AltBoard;
            Avail = offer.Avail;
            AvailSpecified = offer.AvailSpecified;
            Baggage = offer.Baggage;
            CarHire = offer.CarHire;
            CarHireSpecified = offer.CarHireSpecified;
            CoachTransfer = offer.CoachTransfer;
            CoachTransferSpecified = offer.CoachTransferSpecified;
            Date = offer.Date;
            DateSpecified = offer.DateSpecified;
            Deposit = offer.Deposit;
            DepositSpecified = offer.DepositSpecified;
            Group = offer.Group;
            Hlo = offer.Hlo;
            HloSpecified = offer.HloSpecified;
            LowDep = offer.LowDep;
            LowDepSpecified = offer.LowDepSpecified;
            MultiCentre = offer.MultiCentre;
            Price = offer.Price;
            PricePP = offer.PricePP;
            PriceExcludingTouristTax = AvCacheResultOffersOfferExtendedHelpers.GetPriceExcludingTouristTax(offer);
            PricePPExcludingTouristTax = AvCacheResultOffersOfferExtendedHelpers.GetPricePPExcludingTouristTax(offer);
            PayLocalEst = AvCacheResultOffersOfferExtendedHelpers.GetPayLocalEst(offer);
            PayLocalEstPP = AvCacheResultOffersOfferExtendedHelpers.GetPayLocalEstPP(offer);
            PricePPSpecified = offer.PricePPSpecified;
            PriceSpecified = offer.PriceSpecified;
            Stay = offer.Stay;
            StaySpecified = offer.StaySpecified;
            Transport = offer.Transport;
            Transfers = offer.Transfers;
            Type = offer.Type;
            TypeSpecified = offer.TypeSpecified;
            WorldCare = offer.WorldCare;
            WorldCareSpecified = offer.WorldCareSpecified;
            AlternativeAccommodations = offer.AlternativeAccommodations;
            AllBoards = offer.AllBoards ?? new List<Board>();
        }

        public AvCacheResultOffersOfferExtended() { }

        public new IEnumerable<AvCacheResultOffersOfferAccomExtended> Accom { get; }

        public AvCacheResultOffersOfferAccomExtended Accommodation { get => Accom.SingleOrDefault(); }

        public int CommercialPriority { get; }

        public decimal Discount { get => Accommodation?.Unit?.Sum(x => x.Disc) ?? 0; }

        public IReadOnlyCollection<Board> AllBoards { get; init; }

        /// <summary>
        /// Tourist Tax amount in local currency per person
        /// </summary>
        public decimal TouristTaxLocalPP { get; set; }

        /// <summary>
        /// Return if this offer is of HolidayCode type
        /// </summary>
        public bool IsHolidayCodeType(string holidayCode) => Accom
            .Where(a => a.FacilityMatrix != null)
            .SelectMany(accom => accom.FacilityMatrix)
            .Any(fg => fg.Code == holidayCode);

        /// <summary>
        /// Transfer duration in minutes
        /// </summary>
        public int? TransferDuration { get; init; }
    }
}
