namespace easyJet.Holidays.Api.Domain.Data.PackageOffers.AccommodationOffer;

/// <summary>
/// Model to create search type 26 to Atcom cache.
/// </summary>
public class AlternativeHotelRoomsSearchRequest : AmendHotelBaseSearchRequest
{
    /// <summary>
    /// Accom package id.
    /// </summary>
    public string PkgId { get; set; }
}