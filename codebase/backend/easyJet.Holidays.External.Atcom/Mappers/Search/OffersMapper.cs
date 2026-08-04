using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Data.Themes;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.Offers;
using easyJet.Holidays.Api.Domain.Services.Offers;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Extensions;
using easyJet.Holidays.External.Atcom.Mappers.Booking;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;
using easyJet.Holidays.External.Atcom.Models.Search;
using easyJet.Holidays.External.Atcom.Utils;
using Microsoft.Extensions.Options;
using System.Globalization;
using AlternativeAccommodation = easyJet.Holidays.Api.Domain.Data.PackageOffers.AlternativeAccommodation;

namespace easyJet.Holidays.External.Atcom.Mappers.Search
{
    /// <inheritdoc />
    public class OffersMapper : IOffersMapper
    {
        private readonly IReferenceDataService _referenceDataService;
        private readonly IHotelThemeService _hotelThemeService;
        private readonly AtcomSettings _atcomSettings;
        private readonly IPricesService _pricesService;

        /// <summary>
        /// Offers mapper
        /// </summary>
        /// <param name="referenceDataService"></param>
        /// <param name="hotelThemeService"></param>
        /// <param name="atcomSettings"></param>
        /// <param name="pricesService"></param>
        /// <exception cref="ArgumentNullException"></exception>
        public OffersMapper(IReferenceDataService referenceDataService, IHotelThemeService hotelThemeService, IOptions<AtcomSettings> atcomSettings,
            IPricesService pricesService)
        {
            _referenceDataService = referenceDataService;
            _hotelThemeService = hotelThemeService;
            _atcomSettings = atcomSettings?.Value ?? throw new ArgumentNullException(nameof(atcomSettings));
            _pricesService = pricesService ?? throw new ArgumentNullException(nameof(pricesService));
        }

        /// <inheritdoc />
		public async Task<List<Offer>> ConvertOffers(IEnumerable<AvCacheResultOffersOffer> offers, string[] sponsoredHotels, MarketSettings marketSettings, Func<int, int> getOfferId = null)
        {
            if (offers.IsNullOrEmpty())
			{
				return new List<Offer>();
			}

			var transferTypes = _atcomSettings.Transfers?.Types;
			var discountSettings = await _referenceDataService.GetDiscountSettings();
			var distressedFlightsClass = _atcomSettings.DistressedFlightsClass;
            var translatedTransfers = await _referenceDataService.GetTransfers();

            var tasks = offers.Select((offer, index) => MapOfferAsync(
				offer,
				index,
				sponsoredHotels,
				marketSettings,
				getOfferId,
				discountSettings,
				distressedFlightsClass,
				transferTypes,
                translatedTransfers)).ToList();

			var results = await Task.WhenAll(tasks);
			return results.ToList();
        }

		private async Task<Offer> MapOfferAsync(
			AvCacheResultOffersOffer offer,
			int index,
			string[] sponsoredHotels,
			MarketSettings marketSettings,
			Func<int, int> getOfferId,
			DiscountSettings discountSettings,
			string distressedFlightsClass,
			TransferTypesSettings transferTypes,
            Dictionary<string, HotelTransfer> translatedTransfers)
		{
            var accom = offer.Accom.FirstOrDefault();
            
			var units = accom?.Unit ?? [];
            var transferDuration = offer is AvCacheResultOffersOfferExtended extended ? extended.TransferDuration : (int?)null;

			var (theme, type) = await _hotelThemeService.GetTheme(accom?.Prom);
			var guestsCount = ComputeGuestsCount(offer.Price, offer.PricePP);
			var hideDiscounts = ShouldHideDiscounts(units, discountSettings);
            var taxesAndFees = offer.TaxesAndFees;

            var convertedOffer = new Offer
            {
                Id = (getOfferId?.Invoke(index) ?? index).ToString(CultureInfo.InvariantCulture),
                Date = offer.Date,
                Price = offer.Price,
                PricePP = offer.PricePP,
                Deposit = offer.Deposit,
                Stay = offer.Stay,
                GiataCode = offer.GiataCode,
                Accom = MapAccom(accom, units, marketSettings, type, theme, hideDiscounts, offer, transferDuration),
                AlternativeAccommodations = offer.AlternativeAccommodations?.Select(y => new AlternativeAccommodation
                {
                    Code = y.Code,
                    PackageId = y.PackageId
                }).ToList(),
                Transport = BuildTransport(offer),
                Transfers = ItemsMapper.MapTransfers(offer.Transfers, transferTypes, marketSettings?.Currency, translatedTransfers),
                hasDistressedFlights = offer.Transport?.Route?.Any(r => r.Class == distressedFlightsClass),
                IsSponsored = accom?.Id != null ? sponsoredHotels?.Any(h => h == accom?.Id) : null,
                Currency = marketSettings?.Currency,
                TouristTax = AvCacheResultOffersOfferExtendedHelpers.GetPayLocalEst(offer),
                TouristTaxPP = AvCacheResultOffersOfferExtendedHelpers.GetPayLocalEstPP(offer),
                PriceExcludingTouristTax = _pricesService.RoundPrice(AvCacheResultOffersOfferExtendedHelpers.GetPriceExcludingTouristTax(offer)),
                PricePPExcludingTouristTax = _pricesService.RoundPrice(AvCacheResultOffersOfferExtendedHelpers.GetPricePPExcludingTouristTax(offer))
            };

            convertedOffer.AltBoards = MapAltBoards(offer, marketSettings, guestsCount);

            if (taxesAndFees.Count > 0)
            {
                convertedOffer.TaxesAndFees = taxesAndFees.Select(x => new KeyValuePair<string, Holidays.Api.Domain.Data.PackageOffers.TaxesAndFeesSummary>(x.Key, new Holidays.Api.Domain.Data.PackageOffers.TaxesAndFeesSummary
                {
                    TotalLocalPrice = x.Value.TotalLocalPrice,
                    TotalLocalPricePP = x.Value.TotalLocalPricePP,
                    Currency = x.Value.Currency,
                    ExchRt = x.Value.ExchRt,
                })).ToDictionary(x => x.Key, x => x.Value);
            }
            return convertedOffer;
		}

		private static decimal ComputeGuestsCount(decimal totalPrice, decimal pricePerPerson)
		{
			return pricePerPerson != 0 ? (totalPrice / pricePerPerson) : 1;
		}

		private static bool ShouldHideDiscounts(IEnumerable<AvCacheResultOffersOfferAccomUnit> units, DiscountSettings discountSettings)
		{
			var totalDiscount = units.Sum(u => u.Disc);
			return totalDiscount > 0 && discountSettings != null && totalDiscount < discountSettings.DiscountThreshold;
		}

		private List<AltBoardType> MapAltBoards(AvCacheResultOffersOffer offer, MarketSettings marketSettings, decimal guestsCount)
		{
			return offer.AltBoard?.Select(board => new AltBoardType
			{
				Code = board.Code,
				UnitCode = board.UnitCode,
				Currency = marketSettings?.Currency,
				Price = board.Price,
				PricePP = board.Price / guestsCount,
                PriceExcludingTouristTax = _pricesService.RoundPrice(board.Price - AvCacheResultOffersOfferExtendedHelpers.GetPayLocalEst(offer)),
                PricePPExcludingTouristTax = _pricesService.RoundPrice(board.Price / guestsCount - AvCacheResultOffersOfferExtendedHelpers.GetPayLocalEstPP(offer)),
                AccommodationId = board.AccommodationId,
				PackageId = board.PackageId,
				IsExternal = board.IsExternal,
			}).ToList();
		}

		private static Transport BuildTransport(AvCacheResultOffersOffer offer)
		{
			return new Transport()
			{
				Routes = offer.Transport?.Route?.Select(y => new Route()
				{
					Id = y.AtcomId,
					ArrDate = DateParseUtils.BuildDate(y.ArrDate, y.ArrTime),
					#pragma warning disable CS0618 // Route.ArrTime is obsolete
					Duration = y.FltDur != 0 ? $"{y.FltDur}" : null,
					ArrPt = y.ArrPt,
					Avail = y.Avail,
					Car = y.Car,
					CycDate = y.CycDate,
					DepDate = DateParseUtils.BuildDate(y.DepDate, y.DepTime),
					#pragma warning disable CS0618 // Route.DepTime is obsolete
					DepPt = y.DepPt,
					FltNo = y.FltNo,
					RouteCd = y.RouteCd,
					RouteId = y.Id,
					IsExternal = y.ExtSpecified && y.Ext == YesNo.Y,
					Direction = y.Dir == AvCacheResultOffersOfferTransportRouteDir.O ? Direction.Outbound : Direction.Inbound,
					BookingClass = y.Class
				}).ToList(),
			};
		}

		private static Accom MapAccom(
			AvCacheResultOffersOfferAccom accom,
			IEnumerable<AvCacheResultOffersOfferAccomUnit> units,
			MarketSettings marketSettings,
			ThemeType type,
			PackageTheme theme,
			bool hideDiscounts,
			AvCacheResultOffersOffer offer,
			int? transferDuration)
		{
			return new Accom()
			{
				Id = !string.IsNullOrWhiteSpace(accom?.Id) ? accom.Id : accom?.Code,
				PackageId = accom?.AtcomId,
				Latitude = accom?.Latitude,
				Longitude = accom?.Longitude,
				Prom = accom?.Prom,
				Date = accom?.Date ?? default,
				Stay = accom?.Stay ?? 0,
				Code = accom?.Code,
				Country = accom?.Cty1,
				Region = accom?.Cty2,
				Resort = accom?.Cty3,
				Type = type,
				Theme = theme,
				IsExternal = accom is {ExtSpecified: true, Ext: YesNo.Y},
				Unit = MapUnits(units, marketSettings, hideDiscounts, accom, offer),
				TransferDuration = transferDuration
			};
		}

		private static List<Unit> MapUnits(
			IEnumerable<AvCacheResultOffersOfferAccomUnit> units,
			MarketSettings marketSettings,
			bool hideDiscounts,
			AvCacheResultOffersOfferAccom accom,
			AvCacheResultOffersOffer offer)
		{
			return units.Select(unit => new Unit
			{
				Code = unit.Code,
				Name = unit.Name,
				Price = unit.Price,
				PricePP = unit.PricePP,
				Currency = marketSettings?.Currency,
				Discount = hideDiscounts ? null : unit.Disc,
				DiscountPP = hideDiscounts ? null : unit.DiscPP,
				Availability = unit.Avail,
				FreeForKids = unit.DcSpecified && unit.Dc == YesNo.Y,
				Board = unit.Board,
				ExternalRoomCode = unit.SrcInfo?.Unit,
				ExternalBoardCode = unit.SrcInfo?.Board,
				AccommodationId = accom?.Code ?? accom?.Id,
				PackageId = accom?.AtcomId,
				IsExternal = offer.IsExternal(),
				RequireBoardAlteration = unit.RequireBoardAlteration,
				Occupation = MapOccupation(unit),
                IsRefundable = unit.NRefSpecified ? unit.NRef == YesNo.N : (bool?)null
			}).ToList();
		}

		private static Occupation MapOccupation(AvCacheResultOffersOfferAccomUnit unit)
		{
			if (unit.Occ == null)
			{
				return null;
			}

			return new Occupation
			{
				Adults = unit.Occ.Ad,
				Children = unit.Occ.Ch,
				Infants = unit.Occ.In,
				PaxIds = unit.Occ.Pax?.Select(pax => int.TryParse(pax.Id, out int res) ? res : 0).ToList() ?? new List<int>(),
				ChildAges = GetChildAges(unit.Occ)
			};
		}

        /// <summary>
        /// Convert packages response to <see cref="SearchOffersResponse"/>
        /// </summary>
        /// <param name="response">Response to filter</param>
        /// <param name="marketSettings"></param>
        /// <returns>Filtered object</returns>
        public async Task<SearchOffersResponse> Map(SearchAvailablePackagesResponse response, MarketSettings marketSettings)
        {
            if (response == null) return null;

            var responseBody = response.Payload.Body;
            return new SearchOffersResponse()
            {
                Status = new Status()
                {
                    Total = responseBody?.Status?.Total?.Count ?? 0,
                },
                Offers = await ConvertOffers(responseBody?.Result.Offers.Offer, null, marketSettings) ?? new List<Offer>()
            };
        }

        /// <summary>
        /// Get collection of child ages.
        /// Uses the rule that first go adults, then children and infants
        /// </summary>
        /// <param name="occ">Occupation object</param>
        /// <returns>Child ages</returns>
        private static List<uint> GetChildAges(AvCacheResultOffersOfferAccomUnitOcc occ)
        {
            if (occ.Pax == null)
            {
                return new List<uint>();
            }

            var children = occ.Pax.Skip(occ.Ad).Take(occ.Ch);
            return children.Select(x => x.Age).ToList();
        }
    }
}
