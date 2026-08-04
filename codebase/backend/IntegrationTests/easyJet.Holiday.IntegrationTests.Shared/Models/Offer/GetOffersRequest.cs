using Refit;

namespace easyJet.Holiday.IntegrationTests.Shared.Models.Offer;

public class GetOffersRequest
{
    /// <summary>
    /// The earliest accommodation start date to be searched. Use ISO Format yyyy-MM-dd
    /// </summary>
    [AliasAs("startDate")]
    public string StartDate { get; set; }

    /// <summary>
    /// Stay duration 
    /// </summary
    [AliasAs("duration")]
    public List<int> Duration { get; set; }

    /// <summary>
    /// Whether use flexible start dates(+/- x days)
    /// </summary>
    [AliasAs("flexibleDays")]
    public int FlexibleDays { get; set; }

    /// <summary>
    /// Departure point. Multiple values can be specified as a comma separated list
    /// </summary>
    [AliasAs("departure")]
    public string Departure { get; set; }

    /// <summary>
    /// Comma separated list of child ages (ages between 2 and 18)
    /// </summary>
    public string ChildAges { get; set; }

    [AliasAs("room[0].adults")]
    public int Adults { get; set; }

    [AliasAs("room[0].roomCode")]
    public string RoomCode { get; set; }

    [AliasAs("boardType")]
    public string BoardType { get; set; }

    /// <summary>
    /// Accommodation code
    /// </summary>
    [AliasAs("accommodationId")]
    public string AccommodationId { get; set; }

    /// <summary>
    /// Outbound flight id
    /// </summary>
    [AliasAs("outboundRouteId")]
    public string OutboundRouteId { get; set; }

    /// <summary>
    /// Inbound flight id
    /// </summary>
    [AliasAs("inboundRouteId")]
    public string InboundRouteId { get; set; }

    /// <summary>
    /// Package id
    /// </summary>
    [AliasAs("packageId")]
    public string PackageId { get; set; }

    [AliasAs("altAcc[0].accId")]
    public string AltAccommodationId { get; set; }

    [AliasAs("altAcc[0].packId")]
    public string AltPackageId { get; set; }

    /// <summary>
    /// Whether accommodation is external or not
    /// </summary>
    public bool IsExt { get; set; }


    /// <summary>
    /// Optional selected transfer code
    /// </summary>
    [AliasAs("transfer")]
    public string Transfer { get; set; }

    /// <summary>
    /// Whether include Late room checkout (if available) or not
    /// </summary>        
    public bool LateRoomCheckout { get; set; }

    /// <summary>
    /// Selected seat numbers separated by |, Seats[0] for the outbound flight, Seats[1] for the inbound
    /// </summary>
    public List<string> Seats { get; set; }
}