using System.Globalization;
using easyJet.Holidays.Api.Domain.Constants;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.External.Atcom.Mappers.Guests;
using easyJet.Holidays.External.Atcom.Models.Internal;
using Product = easyJet.Holidays.Api.Domain.Data.Booking.Product;
using Seat = easyJet.Holidays.External.Atcom.Models.Internal.Seat;

namespace easyJet.Holidays.External.Atcom.Mappers.Booking;

public class SeatsMapper
{
    public List<SeatMap> GetSeatSelection(List<Route> routes, Seat_Map[] seatMap, List<Benefit> benefitsContentData)
    {
        var visibleBenefits = benefitsContentData?
            .Where(benefit => benefit.IsVisibleOnSeatMapPlan)
            .Select(benefit => benefit.Code) ?? Enumerable.Empty<string>();

        return routes?.Select(route =>
        {
            var seats = seatMap?.FirstOrDefault(sm => sm.SeatMapSec?.SecId.FirstOrDefault() == route.SectorId)?.Seat;

            return new SeatMap
            {
                IsSeatReservationPossible = route.IsSeatReservationPossible,
                SectorId = route.SectorId,
                FlightNumber = route.FltNo,
                Seats = route.Paxs?
                    .Where(pax => !string.IsNullOrWhiteSpace(pax.Seat) && !string.IsNullOrWhiteSpace(pax.PaxId))
                    .Select(pax =>
                    {
                        var seat = seats?.FirstOrDefault(s => s.Pax?.Index == pax.PaxId);
                        decimal.TryParse(seat?.StPrc?.Amt, CultureInfo.InvariantCulture, out var seatPrice);

                        return new Holidays.Api.Domain.Data.Booking.Seat
                        {
                            PaxIndex = int.Parse(pax.PaxId),
                            SeatNumber = pax.Seat,
                            PriceBand = seat?.PrcCat,
                            Price = seatPrice,
                            Products = seat?.SeatAttr?
                                .IntersectBy(visibleBenefits, attr => attr.Name)
                                .Select(attr =>
                                {
                                    var cmsBenefit = benefitsContentData?.FirstOrDefault(ben => ben.Code == attr.Name);
                                    return new Product
                                    {
                                        Id = attr.Name,
                                        Name = cmsBenefit?.Name ?? attr.Desc,
                                        Icon = cmsBenefit?.Icon,
                                        Description = cmsBenefit?.Description
                                    };
                                }).ToList()
                        };
                    }).ToList()
            };
        }).ToList();
    }

    public static Seat_Map[] GetAtcomSeatMap<T>(List<SeatMap> seatSelection, List<T> guests, bool includePrices = false)
    where T : Holidays.Api.Domain.Data.Guests.Person
    {
        var sortedGuests = GuestUtils.SortGuests(guests, guest => guest.Type).ToList();

        return seatSelection?
            .Where(seatMap => seatMap.Seats?.Any() ?? false)
            .Select(seatMap => new Seat_Map
            {
                SeatMapSec = new SeatMapSec { SecId = new[] { seatMap.SectorId } },
                Seat = seatMap
                    .Seats?
                    .Union(GetInfantSeats(seatMap.Seats))
                    .Select(seat => new Seat
                    {
                        Row = seat.Row.ToString(),
                        Col = seat.Column,
                        PrcCat = seat.PriceBand,
                        Pax = new Pax { Index = seat.PaxIndex.ToString(CultureInfo.InvariantCulture), Pax_Tp = GuestsMapper.MapType(sortedGuests[seat.PaxIndex - 1].Type) },
                        StPrc = GetSeatPrice(seat)
                    })
                    .ToArray()
            }).ToArray();


        Prc GetSeatPrice(Holidays.Api.Domain.Data.Booking.Seat seat)
        {
            // Infant seats must not contain price
            if (sortedGuests[seat.PaxIndex - 1].Type == PersonType.Infant)
            {
                return null;
            }

            return includePrices && seat.Price > 0
                ? new Prc { Amt = seat.Price.ToString("#.##", CultureInfo.InvariantCulture), CurISO = B2BConstants.GBPCurrencyCode }
                : null;
        }

        IEnumerable<Holidays.Api.Domain.Data.Booking.Seat> GetInfantSeats(IList<Holidays.Api.Domain.Data.Booking.Seat> allSeats)
        {
            if (allSeats.IsNullOrEmpty() || sortedGuests.IsNullOrEmpty())
            {
                yield break;
            }

            var infantIndex = sortedGuests.FindIndex(guest => guest.Type == PersonType.Infant);
            if (infantIndex <= 0)
            {
                yield break;
            }

            infantIndex++;
            int currentAdultSeatIndex = 0;
            for (; infantIndex <= sortedGuests.Count; infantIndex++)
            {
                // No more adult seats
                if (currentAdultSeatIndex > allSeats.Count - 1)
                {
                    yield break;
                }

                // Skip infants which already have a seat
                if (allSeats.Any(s => s.PaxIndex == infantIndex))
                {
                    continue;
                }

                while (currentAdultSeatIndex < allSeats.Count)
                {
                    var currentSeat = allSeats[currentAdultSeatIndex];

                    // Infants cannot be assigned to children
                    if (sortedGuests[currentSeat.PaxIndex - 1].Type != PersonType.Adult)
                    {
                        currentAdultSeatIndex++;
                        continue;
                    }

                    // Skip if adult already have an infant
                    if (allSeats.Count(seat => seat.SeatNumber == currentSeat.SeatNumber) > 1)
                    {
                        currentAdultSeatIndex++;
                        continue;
                    }

                    yield return new Holidays.Api.Domain.Data.Booking.Seat
                    {
                        PaxIndex = infantIndex,
                        Price = 0,
                        SeatNumber = currentSeat.SeatNumber
                    };

                    currentAdultSeatIndex++;
                    break; // Take the next infant
                }
            }
        }
    }
}
