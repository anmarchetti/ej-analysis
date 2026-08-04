using Newtonsoft.Json;

namespace easyJet.Holidays.Api.Domain.Data.Settings.Ancillaries;

/// <summary>
/// Complimentary luggage.
/// </summary>
[Serializable]
public class ComplimentaryLuggage
{
    /// <summary>
    /// Luggage code.
    /// </summary>
    public string Code { get; set; }

    public int Adult { get; set; }
    public int Child { get; set; }
    public int Infant { get; set; }

    /// <summary>
    /// Luggage quantity.
    /// </summary>
    [JsonIgnore]
    public (int Adult, int Child, int Infant) Quantity
    {
        get => (Adult, Child, Infant);
        set => (Adult, Child, Infant) = value;
    }
}