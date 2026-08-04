using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.External.Atcom.Utils;
using Force.DeepCloner;

namespace easyJet.Holidays.External.Atcom.Services.Search
{
    public class SearchAvailablePackagesAggregator
    {
        /// <summary>
        /// Aggregate multiple "available rooms" responses in single one.
        /// Combines all available unit types in one accommodation and updates Price and PrecePerPersn for accommodation and alternative boards
        /// </summary>
        /// <param name="apiResponses">Collection of responses</param>
        /// <param name="numberOfPax">Number of passegers. used to calculate price per person. Includes adults and children</param>
        /// <returns>Single response</returns>
        public static SearchOffersResponse AggregateSingleUnitAccommodation(List<SearchOffersResponse> responses, int numberOfPax)
        {
            if (responses == null || !responses.Any()) return null;

            // Deep clone first response to prevent any side effects
            var targetResponse = responses.FirstOrDefault().DeepClone();

            // If we have just one response we don't need to do anything
            if (responses.Count == 1)
            {
                return targetResponse;
            }

            // Exclude responses without Offers
            if (responses.Any(x => x.Offers == null || !x.Offers.Any()))
            {
                // Cannot combine responses if one of them has no offers.
                return null;
            }

            // Make alt boards list consistent across all responses
            IntersectAltboards(responses);

            // Aggregate responses in first response
            AggregateSingleUnitAccommodations(responses, numberOfPax, targetResponse);

            // get rid of offers where units number is less than number of apiResponses. That means that some offers don't exist for all passengers
            targetResponse.Offers = targetResponse.Offers.Where(o => o.Accom.Unit.Count == responses.Count).ToList();

            // Finally update passenger Ids
            targetResponse.Offers.Select(o => o.Accom).ToList().ForEach(accom =>
            {
                RecalculateGuestIds(accom.Unit);
            });

            return targetResponse;
        }

        /// <summary>
        /// Updates occupation in collection of units to make sure that passenger IDs are in order of adults, then children, then infants
        /// </summary>
        /// <param name="units">Collection of units to update</param>
        public static void RecalculateGuestIds(List<Unit> units)
        {
            if (units == null || !units.Any()) return;

            var guestIds = SearchQueryUtils.BuildGuestIds(units.Select(u => u.Occupation).Select(o => new RoomAllocation
            {
                Adults = o.Adults,
                Children = o.Children,
                Infants = o.Infants
            }).ToList());

            // Before doing updates clean IDs collection
            foreach (var unit in units)
            {
                unit.Occupation.PaxIds = new List<int>();
            }

            for (var i = 0; i < units.Count; i++)
            {
                var unit = units[i];
                unit.Occupation.PaxIds.AddRange(guestIds[i]);
            }
        }

        /// <summary>
        /// Combines units together and recalculates prices for package.
        /// Works fine for single unit accommodations only, because we can't reply on unit type (ultiple room types in single accom)
        /// </summary>
        /// <param name="responses">Collection of responses</param>
        /// <param name="numberOfPax">Number of passengers to calculate Price per person</param>
        /// <param name="targetResponse">Item to merge into</param>
        public static void AggregateSingleUnitAccommodations(IEnumerable<SearchOffersResponse> responses, int numberOfPax, SearchOffersResponse targetResponse)
        {
            if (responses == null || !responses.Any()) return;

            // Group offers by accommodation Id
            Func<Accom, string> offerKey = accom => $"{accom.PackageId}";
            var offersByAccomAndRoom = responses
                .SelectMany(r => r.Offers)
                .GroupBy(x => offerKey(x.Accom))
                .ToDictionary(x => x.Key, v => v.ToList());

            // First response will be result. Other will be aggregated into it.
            targetResponse.Offers.ForEach(o =>
            {
                if (offersByAccomAndRoom.TryGetValue(offerKey(o.Accom), out var offers))
                {
                    // Update with all units(rooms) and update prices

                    // TODO there will be a separate service for PP calculations.
                    // we have info about holiday PP calculations, probaly board shuold follow same rules
                    // InfoBookingResponse does not return total prices at a per person level, but it's something that you could work out from the data returned.
                    // Each<Rm_Cd>,  and<Flt_Extra> contains SubServPax elements containing the total price for that room,
                    // flight or flight extra for that passenger ID.You could add these up to get the total price for each passenger.
                    o.Accom.Unit = offers.SelectMany(a => a.Accom.Unit).ToList();
                    o.Price = offers.Sum(x => x.Price);

                    o.TouristTax = offers.Sum(x => x.TouristTax);
                    o.PriceExcludingTouristTax = offers.Sum(x => x.PriceExcludingTouristTax);

                    o.TaxesAndFees = offers.SelectMany(x => x.TaxesAndFees ?? new Dictionary<string, TaxesAndFeesSummary>())
                        .GroupBy(x => x.Key)
                        .ToDictionary(k => k.Key, v =>
                        {
                            var first = v.FirstOrDefault();
                            return new TaxesAndFeesSummary
                            {
                                TotalLocalPricePP = v.Sum(x => x.Value.TotalLocalPricePP),
                                TotalLocalPrice = v.Sum(x => x.Value.TotalLocalPrice),
                                Currency = first.Value.Currency,
                                ExchRt = first.Value.ExchRt
                            };
                        });

                    // for calculation per person price with consideration of free kids
                    // count of paying customers: number of total passengers minus free kids places (one room - one free kids place)
                    var payingCustomers = numberOfPax - o.Accom.Unit.Count(u => u.FreeForKids);

                    o.PricePP = o.Price / payingCustomers;

                    // And combine Alt boards
                    var allBoards = offers.SelectMany(a => a.AltBoards ?? new List<AltBoardType>()).ToList();
                    o.AltBoards?.ForEach(b =>
                    {
                        var boardsByCode = allBoards.Where(x => x.Code == b.Code);
                        b.Price = boardsByCode.Sum(x => x.Price);
                        b.PricePP = b.Price / payingCustomers;
                    });

                    // And transfers
                    o.Transfers = offers.SelectMany(x => x.Transfers ?? new List<Holidays.Api.Domain.Data.Booking.TransferItem>())
                    .GroupBy(x => x.Code)
                    .ToDictionary(k => k.Key, v =>
                    {
                        var first = v.FirstOrDefault();
                        first.Quantity = (int)v.Sum(x => x.Quantity);
                        return first;
                    })
                    .Values
                    .ToList();
                }
            });
        }

        /// <summary>
        /// Keep only Altboards which exist in all offers and get rid of others
        /// </summary>
        /// <param name="responses">Collection of responses</param>
        public static void IntersectAltboards(List<SearchOffersResponse> responses)
        {
            if (responses == null || !responses.Any() || responses.Count() == 1) return;

            var altBoardCodes = new HashSet<string>();
            for (var i = 0; i < responses.Count(); i++)
            {
                var response = responses[i];
                var boardCodes = new HashSet<string>(response.Offers.SelectMany(o => o.AltBoards ?? new List<AltBoardType>()).Select(b => b.Code));
                if (i == 0)
                {
                    // Put initial value - codes from first offer
                    altBoardCodes.UnionWith(boardCodes);
                }
                else
                {
                    // Intersect to get common codes
                    altBoardCodes.IntersectWith(boardCodes);
                }
            }

            responses.SelectMany(r => r.Offers).ToList().ForEach(o =>
            {
                // Filter boards to include only values from common codes set
                o.AltBoards = o.AltBoards?.Where(b => altBoardCodes.Contains(b.Code)).ToList() ?? new List<AltBoardType>();
            });
        }
    }
}
