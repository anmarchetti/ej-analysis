using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.External.Atcom.Extensions;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using System.Collections.ObjectModel;
using System.Globalization;

namespace easyJet.Holidays.External.Atcom.Services.TouristTax;

/// <summary>
/// Tourist tax calculator interface
/// </summary>
public interface ITouristTaxCalculator
{
    /// <summary>
    /// Calculate tourist tax for the given request
    /// </summary>
    /// <param name="touristTaxRequest"></param>
    /// <returns></returns>
    Task<TouristTaxResponse> CalculateTouristTax(TouristTaxRequest touristTaxRequest);

    /// <summary>
    /// Populates each offer in the provided list with the applicable tourist tax information asynchronously.
    /// </summary>
    /// <param name="offers">A list of offers to be updated with tourist tax details. Cannot be null.</param>
    /// <param name="hotel">Hotel data to calculate against otherwise offer hotel data will be used.</param>
    /// <returns>A task that represents the asynchronous operation.</returns>
    Task EnrichOffersWithTouristTax(ReadOnlyCollection<Offer> offers, OfferHotel hotel = null);

    /// <summary>
    /// Overload that accepts a concrete list of offers and enriches them with tourist tax information.
    /// </summary>
    /// <param name="avCacheResultOffersOfferExtended">Concrete list of offers.</param>
    /// <returns>A task that represents the asynchronous operation.</returns>
    Task EnrichOffersWithTouristTax(ReadOnlyCollection<AvCacheResultOffersOfferExtended> avCacheResultOffersOfferExtended);
}

internal sealed class TouristTaxCalculator : ITouristTaxCalculator
{
    private const int MaxChildAge = 15;
    private readonly IPaxCalculator _paxBasedCalculator;
    private readonly IRoomCalculator _roomBasedCalculator;
    private readonly IPercentageCalculator _percentageBasedCalculator;
    private readonly INoTaxCalculator _noTaxBasedCalculator;
    private readonly ITouristTaxRepository _touristTaxRepository;
    private readonly IReferenceDataService _referenceDataService;

    public TouristTaxCalculator(IPaxCalculator paxFlatBasedCalculator,
        IRoomCalculator roomBasedCalculator, IPercentageCalculator percentageBasedCalculator,
        INoTaxCalculator noTaxBasedCalculator, ITouristTaxRepository touristTaxRepository,
        IReferenceDataService referenceDataService)
    {
        ArgumentNullException.ThrowIfNull(paxFlatBasedCalculator);
        ArgumentNullException.ThrowIfNull(roomBasedCalculator);
        ArgumentNullException.ThrowIfNull(percentageBasedCalculator);
        ArgumentNullException.ThrowIfNull(noTaxBasedCalculator);
        ArgumentNullException.ThrowIfNull(touristTaxRepository);
        ArgumentNullException.ThrowIfNull(referenceDataService);

        _paxBasedCalculator = paxFlatBasedCalculator;
        _roomBasedCalculator = roomBasedCalculator;
        _percentageBasedCalculator = percentageBasedCalculator;
        _noTaxBasedCalculator = noTaxBasedCalculator;
        _touristTaxRepository = touristTaxRepository;
        _referenceDataService = referenceDataService;
    }

    public async Task<TouristTaxResponse> CalculateTouristTax(TouristTaxRequest touristTaxRequest)
    {
        var touristTaxSetting = await _referenceDataService.GetTouristTaxSettings();
        if (touristTaxSetting is not null && !touristTaxSetting.IsTouristTaxEnabled)
        {
            return new TouristTaxResponse(touristTaxRequest.Offers.Select(_noTaxBasedCalculator.Calculate).ToList().AsReadOnly());
        }

        List<OfferTax> offerTaxes = new();
        TouristTaxResponse touristTaxResponse = new(offerTaxes.AsReadOnly());
        foreach (var offer in touristTaxRequest.Offers)
        {
            var rules = await _touristTaxRepository.GetConfig(offer);
            OfferTax offerTax = null;

            if (rules is null || !rules.Any())
            {
                // No rules configured for this offer → default to no tax
                offerTaxes.Add(_noTaxBasedCalculator.Calculate(offer));
                continue;
            }

            foreach (var rule in rules)
            {
                switch (rule.ApplicationType)
                {
                    case nameof(PaxBased):
                        offerTax = await _paxBasedCalculator.Calculate(offer, rule);
                        break;
                    case nameof(RoomBased):
                        offerTax = await _roomBasedCalculator.Calculate(offer, rule);
                        break;
                    case nameof(PercentageBased):
                        offerTax = await _percentageBasedCalculator.Calculate(offer, rule);
                        break;
                    default:
                        offerTax = _noTaxBasedCalculator.Calculate(offer);
                        break;
                }
            }

            // Fallback to no tax if none of the rules produced a value
            if (offerTax is null)
            {
                offerTax = _noTaxBasedCalculator.Calculate(offer);
            }

            offerTaxes.Add(offerTax);
        }
        return touristTaxResponse;
    }

    public async Task EnrichOffersWithTouristTax(ReadOnlyCollection<Offer> offers, OfferHotel hotel = null)
    {
        var touristTaxRequests = offers.Select(o =>
        {
            if (!int.TryParse(hotel?.StarRating ?? o.Hotel?.StarRating, NumberStyles.Integer, CultureInfo.InvariantCulture, out var starRating))
            {
                starRating = 1;
            }

            List<uint> childAges = [];
            foreach (var unit in o.Accom.Unit)
            {
                childAges.AddRange(unit.Occupation.ChildAges);
            }
            return CreateTouristTaxOffer(o.Accom.Unit.Sum(u => u.Price),
                    o.Accom.Resort, o.Accom.Unit.Sum(u => u.Occupation.Adults),
                    childAges,
                    o.Accom.Unit.Count,
                    starRating,
                    o.Id,
                    (int)o.Stay!, DateOnly.FromDateTime(o.Date!.Value));
        }).ToList().AsReadOnly();

        TouristTaxRequest touristTaxRequest = new(touristTaxRequests.ToList().AsReadOnly());

        var response = await CalculateTouristTax(touristTaxRequest);

        foreach (var tax in response.OfferTaxes)
        {
            var offer = offers.First(o => o.Id == tax.OfferId);
            offer.TouristTax = tax.TouristTax;
            offer.TouristTaxPP = tax.TouristTaxPP;
            offer.TouristTaxLocal = tax.TouristTaxLocal;
            offer.TouristTaxPPLocal = tax.TouristTaxPPLocal;
            offer.ExchangeRate = tax.ExchangeRate;
            offer.TouristTaxCurrency = new Holidays.Api.Domain.Data.Settings.Currency { Code = tax.Currency };
        }
    }

    public async Task EnrichOffersWithTouristTax(ReadOnlyCollection<AvCacheResultOffersOfferExtended> avCacheResultOffersOfferExtended)
    {
        var touristTaxRequests = avCacheResultOffersOfferExtended.Select(o =>
        {
            List<uint> childAges = [];
            foreach (var unit in o.Accommodation.Unit)
            {
                childAges.AddRange(unit.Occ.Pax.Where(p => p.Age <= MaxChildAge).Select(p => p.Age));
            }

            return CreateTouristTaxOffer(o.Accommodation.Unit.Sum(u => u.Price),
                o.Accommodation.Cty3, o.Accommodation.Unit.Sum(u => u.Occ.Ad),
                childAges,
                o.Accommodation.Unit.Length,
                o.Accommodation.StarRating,
                o.GetPackageId(),
                o.Stay!, DateOnly.FromDateTime(o.Date));
        }).ToList().AsReadOnly();

        TouristTaxRequest touristTaxRequest = new(touristTaxRequests.ToList().AsReadOnly());

        var response = await CalculateTouristTax(touristTaxRequest);

        foreach (var tax in response.OfferTaxes)
        {
            var offer = avCacheResultOffersOfferExtended.First(o => o.GetPackageId() == tax.OfferId);
            offer.TouristTax = tax.TouristTax;
            offer.TouristTaxPP = tax.TouristTaxPP;
            offer.TouristTaxLocal = tax.TouristTaxLocal;
            offer.TouristTaxLocalPP = tax.TouristTaxPPLocal;
            offer.ExchangeRate = tax.ExchangeRate;
            offer.TouristTaxCurrency = tax.Currency;
        }
    }

    private static TouristTaxOffer CreateTouristTaxOffer(decimal accommodationAmount, string geography, int adultPaxCount, List<uint> childAges, int numberOfRooms,
        int starRating, string packageId, int duration, DateOnly holidayStart)
    {
        List<AdultPax> adults = [];
        for (var i = 1; i <= adultPaxCount; i++)
        {
            adults.Add(new());
        }

        var children = childAges.Select(ca => new ChildPax(null, ca)).ToList();

        return new TouristTaxOffer(packageId, geography, duration, accommodationAmount, holidayStart,
            holidayStart.AddDays(duration), starRating, numberOfRooms, adults.AsReadOnly(), children.AsReadOnly());
    }
}