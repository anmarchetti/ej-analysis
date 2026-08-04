using System.Text.Json.Serialization;

namespace PointsOfInterest.Models;

internal sealed class Resort
{
    public required string ResortCode { get; init; }

    public required string ResortName { get; init; }

    public IList<Hotel> Hotels { get; set; } = [];

    public string Theme { get; set; } = string.Empty;

    public int Radiuskm  { get; set; }

    public List<PointOfInterest> PointsOfInterests { get; set; } = [];

    public string CountryCode { get; set; } = string.Empty;

    public List<Hotel> UsedHotels { get; set; } = [];

    public List<Hotel> ExcludedHotels { get; set; } = [];
    
    public double QueryPositionLatitude { get; set; }
    
    public double QueryPositionLongitude { get; set; }
}

internal sealed class PointOfInterest
{
    public string Category { get; set; } = string.Empty;
    public Category PrimaryCategory { get; set; } = new();
    public string PlaceId { get; set; } = string.Empty;
    public IList<double> Position { get; internal set; } = [];
    public string PlaceType { get; set; } = string.Empty;
    public bool? AdultsOnly { get; set; }
    public int? NumberOfVisits { get; set; }
    public Dictionary<string, string> Title { get; set; } = new();
}

internal sealed record Hotel
{
    [JsonPropertyName("HotelCode")]
    public required string GiataCode { get; set; }

    public string? AtcomId { get; set; }

    [JsonPropertyName("HotelName")]
    public required string HotelName { get; init; }

    [JsonPropertyName("Longitude")]
    public double Longitude { get; init; }

    [JsonPropertyName("Latitude")]
    public double Latitude { get; init; }
}

internal sealed record HotelByParentCode
{
    [JsonPropertyName("Code")]
    public required string AtcomId { get; set; }

    [JsonPropertyName("Name")]
    public required string HotelName { get; init; }

    [JsonPropertyName("Longitude")]
    public double Longitude { get; set; }

    [JsonPropertyName("Latitude")]
    public double Latitude { get; set; }
}

internal sealed class HotelTheme
{
    public string  Name { get; init; } = string.Empty;
}

internal sealed class Country
{
    public string  Code{ get; init; } = string.Empty;
    public string  Name { get; init; } = string.Empty;
}
