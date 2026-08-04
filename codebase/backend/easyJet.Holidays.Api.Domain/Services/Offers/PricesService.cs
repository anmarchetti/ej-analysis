using easyJet.Holidays.Api.Domain.Data;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.LivePrice;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.RequestedPrice;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Domain.Services.Offers
{
    /// <summary>
    /// Service to round prices
    /// </summary>
    public class PricesService : IPricesService
    {
        private readonly ApiSettings _apiSettings;

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="apiSettings"></param>
        public PricesService(IOptions<ApiSettings> apiSettings)
        {
            _apiSettings = apiSettings.Value ?? throw new ArgumentNullException(nameof(apiSettings));
        }

        /// <inheritdoc />
        public decimal RoundPrice(decimal value)
        {
            if (RoundingDisabled())
            {
                return value;
            }

            return value > 0 ? Math.Ceiling(value) : Math.Floor(value);
        }

        /// <inheritdoc />
        public decimal? RoundPrice(decimal? value)
        {
            if (value is null)
                return null;

            return RoundPrice(value.Value);
        }

        /// <inheritdoc />
        public double RoundPrice(double value) => RoundingDisabled() ? value : Math.Ceiling(value);

        /// <inheritdoc />
        public void RoundPrice(IEnumerable<IPriceModel> items)
        {
            if (RoundingDisabled() || items == null) return;

            foreach (var item in items.Where(x => x != null))
            {
                item.Price = RoundPrice(item.Price);
                item.PricePP = RoundPrice(item.PricePP);
            }
        }

        /// <inheritdoc />
        public void RoundPrice(IPriceTotalModel item)
        {
            if (RoundingDisabled() || item == null) return;

            item.TotalPrice = RoundPrice(item.TotalPrice);
            item.PricePP = RoundPrice(item.PricePP);
        }

        /// <inheritdoc />
        public void RoundPrice(SearchOffersResponse response)
        {
            if (RoundingDisabled() || response == null) return;

            RoundPrice(response.Offers);

            if (response.Status == null) return;

            response.Status.MaxPrice = RoundPrice(response.Status.MaxPrice);
            response.Status.MaxPricePP = RoundPrice(response.Status.MaxPricePP);
            response.Status.MinPrice = RoundPrice(response.Status.MinPrice);
            response.Status.MinPricePP = RoundPrice(response.Status.MinPricePP);
        }

        /// <inheritdoc />
        public void RoundPrice(IEnumerable<Offer> offers)
        {
            if (RoundingDisabled()) return;

            RoundPrice(offers.EmptyIfNull().AsEnumerable<IPriceModel>());
            RoundPrice(offers.EmptyIfNull().SelectMany(o => o.AltBoards.EmptyIfNull()));
            RoundPrice(offers.EmptyIfNull().SelectMany(o => o.Accom?.Unit ?? Enumerable.Empty<Unit>()));
            RoundPrice(offers.EmptyIfNull().SelectMany(o => o.Transfers.EmptyIfNull()));
        }

        /// <inheritdoc />
        public void RoundPrice(IEnumerable<LivePriceSummaryModel> models)
        {
            if (RoundingDisabled()) return;

            foreach (var item in models.EmptyIfNull().Where(x => x != null))
            {
                item.Price = RoundPrice(item.Price);
                item.PricePP = RoundPrice(item.PricePP);
                item.PriceExcludingTouristTax = RoundPrice(item.PriceExcludingTouristTax);
                item.PricePPExcludingTouristTax = RoundPrice(item.PricePPExcludingTouristTax);

                if (item.NamedSearches != null)
                {
                    item.NamedSearches = item.NamedSearches
                        .Select(x => new KeyValuePair<string, decimal>(x.Key, RoundPrice(x.Value)))
                        .ToDictionary(x => x.Key, y => y.Value);
                }
            }
        }

        /// <summary>
        /// Round requested price models
        /// </summary>
        /// <param name="models">requested price items</param>
        public void RoundPrice(IEnumerable<RequestedPriceSummaryModel> models)
        {
            if (RoundingDisabled()) return;

            foreach (var item in models.EmptyIfNull())
            {
                if (item.RequestedPriceByMathFunctions != null)
                {
                    foreach (var (_, value) in item.RequestedPriceByMathFunctions)
                    {
                        value.Price = RoundPrice(value.Price);
                        value.PricePP = RoundPrice(value.PricePP);
                    }
                }

                if (item.NamedSearches != null)
                {
                    item.NamedSearches = item.NamedSearches
                        .Select(x => new KeyValuePair<string, decimal>(x.Key, RoundPrice(x.Value)))
                        .ToDictionary(x => x.Key, y => y.Value);
                }
            }
        }

        /// <inheritdoc/>
        public void RoundPrice(PriceCategory model)
        {
            if (RoundingDisabled() || model == null) return;

            model.Amount = RoundPrice(model.Amount);
        }

        /// <summary>
        /// Get whether rounding is disabled in settings
        /// </summary>
        /// <returns></returns>
        private bool RoundingDisabled() => !_apiSettings.RoundPrices;
    }
}
