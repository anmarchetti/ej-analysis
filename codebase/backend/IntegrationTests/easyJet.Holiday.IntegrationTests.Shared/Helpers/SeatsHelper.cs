using easyJet.Holidays.Api.Domain.Data.Seats;
using Refit;

namespace easyJet.Holiday.IntegrationTests.Shared.Helpers;

/// <summary>
/// Seat selection utils
/// </summary>
public static class SeatsHelper
{
    /// <summary>
    /// Returns the specified <param name="number">number</param> of available seats from a specified <param name="priceBand">price band</param>.
    /// If the <param name="priceBand">price band</param> value is null, seats will be taken from all price bands.
    /// If <param name="forInfants">forInfants</param> is true, only 1 seat per row will be taken.
    /// </summary>
    public static IEnumerable<SeatMapSeat> GetAvailableSeats(this ApiResponse<GetSeatsMapResponse> seatsMapResponse, int number, bool forInfants, string? priceBand = null)
    {
        var availableSeats = FetchSeats(seatsMapResponse, forInfants).ToList();
        if (priceBand != null)
        {
            foreach (var seatMapSeat in availableSeats.Where(seat => seat.PriceBand == priceBand).Take(number))
            {
                yield return seatMapSeat;
            }
            yield break;
        }

        var priceBands = availableSeats.Select(seat => seat.PriceBand).Distinct().OrderBy(band => band).ToList();

        for (int i = 0; i < number; i++)
        {
            var band = priceBands[i % priceBands.Count];
            var seat = availableSeats
                .Where(seat => seat.IsAvailable && seat.PriceBand == band)
                .Skip(i / priceBands.Count)
                .FirstOrDefault();

            if (seat == null)
            {
                yield break;
            }

            yield return seat;
        }
    }

    private static IEnumerable<SeatMapSeat> FetchSeats(ApiResponse<GetSeatsMapResponse> seatsMapResponse, bool forInfants)
    {
        if (forInfants) // return 1 seat from each row
        {
            return seatsMapResponse.Content
                ?.Rows?.SelectMany(row => row
                   ?.Blocks?.SelectMany(block => block
                       ?.Seats.Where(seat => seat.IsAvailableForInfant) ?? Enumerable.Empty<SeatMapSeat>()).Take(1)
                   ?? Enumerable.Empty<SeatMapSeat>())
                ?? Enumerable.Empty<SeatMapSeat>();
        }

        return seatsMapResponse.Content
            ?.Rows?.SelectMany(row => row
               ?.Blocks?.SelectMany(block => block
                   ?.Seats ?? Enumerable.Empty<SeatMapSeat>())
               ?? Enumerable.Empty<SeatMapSeat>())
            ?? Enumerable.Empty<SeatMapSeat>();
    }
}