using easyJet.Holidays.Api.Domain.Data.DynamoDB.DiscountedOffer;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Interfaces.DiscountedOffer;

namespace easyJet.Holidays.External.AWS.Services.DiscountedOffer;

/// <summary>
/// Concrete implementation of <see cref="IHbgHotelDiscountsService"/> that enriches offer models
/// with discount information (e.g. discount percentage) sourced from the discounted offers repository.
/// </summary>
/// <remarks>
/// The service loads all discounted offers once per enrichment invocation and performs in-memory
/// matching by accommodation code and travel window date range. Matching is case-insensitive on the
/// accommodation code. If no discounted offers are available, the input collection is left unchanged.
/// </remarks>
public class HbgHotelDiscountsService : IHbgHotelDiscountsService
{
    private readonly IHbgHotelDiscountsRepository _hbgHotelDiscountsRepository;

    /// <summary>
    /// Initializes a new instance of the <see cref="HbgHotelDiscountsService"/> class.
    /// </summary>
    /// <param name="hbgHotelDiscountsRepository">Repository used to retrieve discounted offers data.</param>
    /// <exception cref="ArgumentNullException">Thrown when <paramref name="hbgHotelDiscountsRepository"/> is null.</exception>
    public HbgHotelDiscountsService(
        IHbgHotelDiscountsRepository hbgHotelDiscountsRepository)
    {
        ArgumentNullException.ThrowIfNull(hbgHotelDiscountsRepository);
        _hbgHotelDiscountsRepository = hbgHotelDiscountsRepository;
    }

    /// <inheritdoc/>
    public async Task EnrichOffersWithDiscounts(IList<Offer> offers)
    {
        ArgumentNullException.ThrowIfNull(offers);

        if (offers.Count == 0)
        {
            return;
        }

        var discountedOffers = await LoadDiscountedOffers();

        if (discountedOffers == null || discountedOffers.Count == 0)
        {
            return;
        }

        foreach (var offer in offers)
        {
            if (!offer.Date.HasValue)
            {
                continue;
            }

            if (!offer.Stay.HasValue)
            {
                continue;
            }

            if (HasAtcomDiscount(offer))
            {
                continue;
            }

            var startTravelDate = DateOnly.FromDateTime(offer.Date.Value);
            var endTravelDate = DateOnly.FromDateTime(offer.Date.Value.AddDays((int)offer.Stay.Value));

            var matchingOffer = GetOfferDiscount(startTravelDate, endTravelDate, discountedOffers, offer);

            if (matchingOffer != null)
            {
                offer.DiscountPercentage = matchingOffer.DiscountPercentage;
            }
        }
    }

    private static bool HasAtcomDiscount(Offer offer) => offer.Accom.Unit.Any(u => (u.Discount.HasValue && u.Discount.Value > 0) || 
        (u.DiscountPP.HasValue && u.DiscountPP.Value > 0));

    private async Task<IList<HbgHotelDiscount>> LoadDiscountedOffers()
    {
        var discountedOffers = await _hbgHotelDiscountsRepository.GetAll();

        if (discountedOffers == null || discountedOffers.Count == 0)
        {
            return Enumerable.Empty<HbgHotelDiscount>().ToList();
        }

        return discountedOffers;
    }

    private static Discount GetOfferDiscount(DateOnly startDate, DateOnly endDate, IList<HbgHotelDiscount> discountedOffers, Offer offer)
    {
        var discount = discountedOffers.FirstOrDefault(d => d.AccommodationCode.Equals(offer.Accom.Code, StringComparison.OrdinalIgnoreCase));

        if(discount is null)
        {
            return null;
        }
        return discount.Discounts.OrderByDescending(d => d.DiscountPercentage).FirstOrDefault(d => startDate >= d.TravelWindowFromDate && endDate <= d.TravelWindowToDate);
    }
}
