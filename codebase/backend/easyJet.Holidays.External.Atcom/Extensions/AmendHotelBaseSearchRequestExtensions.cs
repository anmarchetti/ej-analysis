using easyJet.Holidays.Api.Domain.Data.PackageOffers.AccommodationOffer;
using easyJet.Holidays.Api.Domain.Extensions;
using System.Globalization;

namespace easyJet.Holidays.External.Atcom.Extensions;

/// <summary>
/// Extension methods for AmendHotelBaseSearchRequest and derived classes to build Atcom query parameters.
/// </summary>
public static class AmendHotelBaseSearchRequestExtensions
{
    /// <summary>
    /// Builds Atcom query parameters from an AlternativeHotelsSearchRequest.
    /// </summary>
    /// <param name="request">The request containing hotel search parameters.</param>
    /// <param name="requestTemplate">The template string format for the request.</param>
    /// <returns>A formatted query string for the Atcom API.</returns>
    /// <exception cref="ArgumentNullException">Thrown when request is null.</exception>
    public static string BuildAtcomQueryParams(this AlternativeHotelsSearchRequest request, string requestTemplate)
    {
        ArgumentNullException.ThrowIfNull(request);

        var paramList = new List<string>();
        
        paramList.AddRange(request.GetBaseSerchParameter());

        if (!request.Proms.IsNullOrEmpty())
        {
            paramList.Add($"prom={string.Join(',', request.Proms)}");
            paramList.Add($"prom_no={request.Proms.Count()}");
        }
        
        paramList.Add($"cur_accom={request.AccomCode}/{request.BookingStartDate}/{request.Duration}");
        paramList.Add($"cur_fltprc={request.RouteTotalPrice}");

        var paramsString = string.Join('&', paramList);
        var result = string.Format(CultureInfo.InvariantCulture, requestTemplate, paramsString);
        
        return result;
    }

    /// <summary>
    /// Builds Atcom query parameters from an AlternativeHotelRoomsSearchRequest.
    /// </summary>
    /// <param name="request">The request containing hotel room search parameters.</param>
    /// <param name="requestTemplate">The template string format for the request.</param>
    /// <returns>A formatted query string for the Atcom API.</returns>
    /// <exception cref="ArgumentNullException">Thrown when request is null.</exception>
    public static string BuildAtcomQueryParams(this AlternativeHotelRoomsSearchRequest request, string requestTemplate)
    {
        ArgumentNullException.ThrowIfNull(request);

        var paramList = new List<string>();
        
        paramList.AddRange(request.GetBaseSerchParameter());
        
        paramList.Add($"pkg={request.PkgId}");
        
        var paramsString = string.Join('&', paramList);
        var result = string.Format(CultureInfo.InvariantCulture, requestTemplate, paramsString);
        
        return result;
    }

    /// <summary>
    /// Gets the common base search parameters from an AmendHotelBaseSearchRequest.
    /// </summary>
    /// <param name="request">The request containing the base search parameters.</param>
    /// <returns>A list of parameter strings for the Atcom API.</returns>
    private static List<string> GetBaseSerchParameter(this AmendHotelBaseSearchRequest request)
    {
        var paramList = new List<string>
        {
            $"pax_ad={request.Adults}",
            $"pax_in={request.Infants}",
            $"pax_ch={request.Children}"
        };
        if (request.Children > 0)
        {
            paramList.Add($"ch_age={string.Join(',', request.ChildAges)}");
        }
        
        paramList.Add($"rooms={request.RoomComposition.Count}");
        foreach (var unit in request.RoomComposition)
        {
            paramList.Add($"rm_{unit.Key}={unit.Value}");
        }
        
        paramList.Add($"cur_tra_o={request.DepartureAirportCode}/{request.ArrivalAirportCode}/{request.OutboundDepartureDate}/{request.OutboundFlightNumber}/{request.OutboundArrivalDate}");
        paramList.Add($"cur_tra_i={request.ArrivalAirportCode}/{request.DepartureAirportCode}/{request.InboundDepartureDate}/{request.InboundFlightNumber}/{request.InboundArrivalDate}");
        paramList.Add($"dep={request.DepartureAirportCode}");

        return paramList;
    }
}