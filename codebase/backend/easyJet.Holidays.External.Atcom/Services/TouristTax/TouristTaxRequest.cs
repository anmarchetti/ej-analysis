using System.Collections.ObjectModel;

namespace easyJet.Holidays.External.Atcom.Services.TouristTax;


/// <summary>
/// Represents a request to calculate tourist tax for a collection of offers.
/// </summary>
/// <param name="Offers">The list of offers for which the tourist tax calculation is requested. Cannot be null.</param>
public sealed record TouristTaxRequest(ReadOnlyCollection<TouristTaxOffer> Offers);

/// <summary>
/// Tourist Tax Request
/// </summary>
/// <param name="Geography"></param>
/// <param name="Duration"></param>
/// <param name="OfferId"></param>
/// <param name="StarRating"></param>
/// <param name="AdultPaxes"></param>
/// <param name="ChildPaxes"></param>
/// <param name="AccommodationAmount"></param>
/// <param name="TravelFromDate"></param>
/// <param name="TravelToDate"></param>
/// <param name="NumberOfRooms"></param>
public sealed record TouristTaxOffer(string OfferId, 
    string Geography, 
    int Duration, 
    decimal AccommodationAmount, 
    DateOnly TravelFromDate, 
    DateOnly TravelToDate, 
    int StarRating, 
    int NumberOfRooms,
    ReadOnlyCollection<AdultPax> AdultPaxes, 
    ReadOnlyCollection<ChildPax> ChildPaxes);

/// <param name="DateOfBirth"></param>
/// <param name="Age"></param>
public sealed record AdultPax(DateOnly? DateOfBirth = null, int? Age = null);

/// <param name="DateOfBirth"></param>
/// <param name="Age"></param>
public sealed record ChildPax(DateOnly? DateOfBirth = null, uint? Age = null);
