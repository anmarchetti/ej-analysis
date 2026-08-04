using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Booking;

/// <summary>
/// Extra luggage information
/// </summary>
[Serializable]
[DataContract]
public class ExtraLuggageInfo
{
    /// <summary>
    /// List of items included in default allowance
    /// </summary>
    [DataMember(Name = "items")]
    public List<ExtraLuggageItem> Items { get; set; }
}

/// <summary>
/// Single extra luggage item info
/// </summary>
[Serializable]
[DataContract]
public class ExtraLuggageItem
{
    /// <summary>
    /// ID of the route to which the luggage belongs
    /// </summary>
    [DataMember(Name = "routeId")]
    [Required]
    public string RouteId { get; set; }

    /// <summary>
    /// Luggage item category code 
    /// </summary>
    [DataMember(Name = "itemCategoryCode")]
    [Required]
    public string ItemCategoryCode { get; set; }

    /// <summary>
    /// Is the luggage item complimentary or not
    /// </summary>
    [DataMember(Name = "isComplimentary")]
    public bool IsComplimentary { get; set; }

    /// <summary>
    /// Luggage name from sitecore settings.
    /// </summary>
    [DataMember]
    public string Name { get; set; }

    /// <summary>
    /// Luggage description from sitecore settings.
    /// </summary>
    [DataMember]
    public string Description { get; set; }

    /// <summary>
    /// Luggage icon from sitecore settings.
    /// </summary>
    [DataMember]
    public string Icon { get; set; }

    /// <summary>
    /// Related passenger ID
    /// </summary>
    [DataMember(Name = "passengerId")]
    [Required]
    public string PassengerId { get; set; }

    /// <summary>
    /// Luggage item code 
    /// </summary>
    [DataMember(Name = "itemCode")]
    [Required]
    public string ItemCode { get; set; }

    /// <summary>
    /// Quantity of specified items
    /// </summary>
    [DataMember(Name = "quantity")]
    [Range(1, int.MaxValue)]
    [Required]
    public int Quantity { get; set; }

    /// <summary>
    /// Price to include item in package
    /// </summary>
    [DataMember(Name = "price")]
    [Range(0, double.MaxValue)]
    public double Price { get; set; }
}
