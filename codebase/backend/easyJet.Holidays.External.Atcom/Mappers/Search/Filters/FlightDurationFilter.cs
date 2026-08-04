using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.External.Atcom.Models.Extensions;

namespace easyJet.Holidays.External.Atcom.Mappers.Search.Filters;

/// <summary>
/// Filters offers by flight duration, picks longest of 2 flights
/// </summary>
public class FlightDurationFilter : IFilter
{
    public Task<List<AvCacheResultOffersOfferExtended>> FilterBy(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request)
    {
        if (request.FlightDurationFrom is null && request.FlightDurationTo is null)
            return Task.FromResult(offers);

        var durationFrom = request.FlightDurationFrom ?? 0;
        var durationTo = request.FlightDurationTo ?? int.MaxValue;

        var result = offers
            .Where(x =>
            {
                var maxFlightDuration = Math.Max(x.Transport.JnyDurOut, x.Transport.JnyDurRet);
                var flightDurationInMinutes = ConvertFlightDurationToMinutes(maxFlightDuration);
                return flightDurationInMinutes >= durationFrom && flightDurationInMinutes <= durationTo;
            })
            .ToList();

        return Task.FromResult(result);
    }

    /// <summary>
    /// Convert from atcom time format to minutes, for ex. 430 means 4 hours 30 minutes
    /// </summary>
    private int ConvertFlightDurationToMinutes(decimal duration)
    {
        const int minutesInHour = 60;

        var hours = (int)Math.Floor(duration / 100);
        var minutes = (int)duration % 100;
        var result = hours * minutesInHour + minutes;
        return result;
    }

    public async Task<FilterOptions> GetOptions(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request, ApplyAllFiltersFunc applyAllOtherFilters)
    {
        // this is a range filter, no options are returned
        var options = await Task.FromResult(new List<FilterOption>());

        return new FilterOptions
        {
            Options = options
        };
    }
}
