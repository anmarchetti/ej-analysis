using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.PriceGraph;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.RoomVariants;
using easyJet.Holidays.Api.Domain.Services.Market;

namespace easyJet.Holidays.Api.Domain.Utils
{
    public class OfferUtils
    {
        /// <summary>
        /// Build offer code
        /// ex: X9001743_2151461282/2/846/2_DBL.IN!NOR.CG-TODOS-RO
        /// </summary>
        /// <param name="offer"></param>
        /// <returns></returns>
        public static string BuildOfferCode(Offer offer)
        {
            if (offer?.Accom?.Unit?.Count > 0)
            {
                var codes = new List<string>();
                codes.Add(offer.Accom.Code);
                codes.Add(offer.Accom.PackageId);
                codes.AddRange(offer.Accom.Unit.Select(x => $"{x.Code}-{x.Board}"));
                return string.Join("_", codes);
            }
            return "";
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="request"></param>
        /// <param name="withoutDate"></param>
        /// <returns></returns>
        public static string BuildAccomodationRequestCode(AccommodationOfferRequest request, bool withoutDate = false)
        {
            if (request == null)
            {
                return "";
            }
            var codes = new List<string>();
            codes.Add(request.AccommodationId);
            codes.Add(request.PackageId);
            codes.Add(request.OutboundRouteId);
            codes.Add(request.InboundRouteId);
            codes.Add(request.Transfer);
            codes.Add(string.Join("|", request.Duration ?? new List<int>()));
            codes.Add(request.BoardType);
            if (!withoutDate)
            {
                codes.Add(request.StartDate);
            }
            codes.Add(string.Join("|", request?.Room?.Select(x => $"{x.Adults}-{x.Children}-{x.Infants}-{x.RoomCode}") ?? new List<string>()));

            return string.Join("_", codes.Where(x => !string.IsNullOrEmpty(x)));
        }

        /// <summary>
        /// Build string from Offer object, needed to compare offers and requests to get this offers
        /// </summary>
        /// <param name="offer"></param>
        /// <returns></returns>
        public static string BuildOfferRequestCode(Offer offer)
        {
            if (offer == null)
            {
                return "";
            }
            var codes = new List<string>();
            codes.Add(offer.Accom?.Code);
            codes.Add(offer.Accom?.PackageId);
            codes.Add(offer.Transport?.Routes?.FirstOrDefault(x => x.Direction == Direction.Outbound)?.Id);
            codes.Add(offer.Transport?.Routes?.FirstOrDefault(x => x.Direction == Direction.Inbound)?.Id);
            codes.Add(offer.Transfers?.FirstOrDefault()?.Code);
            codes.Add(offer.Stay.ToString());
            codes.Add(offer.Accom?.Unit?.FirstOrDefault()?.Board);
            codes.Add(DateFormatUtils.DateOnly(offer.Date));
            codes.Add(string.Join("|", offer.Accom?.Unit?.Select(x => $"{x.Occupation.Adults}-{x.Occupation.Children}-{x.Occupation.Infants}-{x.Code}") ?? new List<string>()));

            return string.Join("_", codes.Where(x => !string.IsNullOrEmpty(x)));
        }

        /// <summary>
        /// Compare AccommodationRequest object and Offer object. 
        /// If all important values are equal between objects then will return true
        /// </summary>
        /// <param name="request"></param>
        /// <param name="offer"></param>
        /// <returns></returns>
        public static bool CompareAccomadationRequestAndOfferInfo(AccommodationOfferRequest request, Offer offer)
        {
            return BuildAccomodationRequestCode(request) == BuildOfferRequestCode(offer);
        }

        /// <summary>
        /// Compare to AccommadationRequest if the will return the same offers
        /// </summary>
        /// <param name="first"></param>
        /// <param name="second"></param>
        /// <param name="checkExpired"></param>
        /// <returns></returns>
        public static bool CompareAccomadationRequests(AccommodationOfferRequest first, AccommodationOfferRequest second, bool checkExpired = false)
        {
            var isEqual = BuildAccomodationRequestCode(first, checkExpired) == BuildAccomodationRequestCode(second, checkExpired);
            if (isEqual && first.StartDate != second.StartDate)
            {
                return DateFormatUtils.Parse(first.StartDate).DateTime < DateTime.Now;
            }
            return isEqual;
        }

        public static void EnrichCurrency(IMarketService marketService, List<Offer> offers)
        {
            var marketSettings = marketService.GetCurrentMarket();
            if (marketSettings == null)
                return;

            offers.ForEach(offer =>
            {
                offer.Currency = marketSettings.Currency;
                offer.Accom?.Unit?.ForEach(unit =>
                {
                    unit.Currency = marketSettings.Currency;
                });
                offer.AltBoards?.ForEach(altBoard =>
                {
                    altBoard.Currency = marketSettings.Currency;
                });
            });
        }

        public static void EnrichCurrency(IMarketService marketService, List<AlternativeOffer> offers)
        {
            var marketSettings = marketService.GetCurrentMarket();
            if (marketSettings == null)
                return;

            offers.ForEach(offer => offer.Currency = marketSettings.Currency);
        }
    }
}
