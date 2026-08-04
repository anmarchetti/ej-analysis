using easyJet.Holidays.Api.Domain.Data.AirportParking;
using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;
using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.Api.Domain.Data.Settings;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Booking;

/// <summary>
/// Booking commit response Api response model
/// </summary>
[Serializable]
[DataContract]
public class BookingResponse
{
    /// <summary>
    /// Booking status: e.g. CONFIRMED
    /// </summary>
    [DataMember(Name = "bookingStatus")]
    public string BookingStatus { get; set; }

    /// <summary>
    /// Booking reference
    /// </summary>
    [DataMember(Name = "bookingReference")]
    public string BookingReference { get; set; }

    /// <summary>
    /// Booking date
    /// </summary>
    [DataMember(Name = "bookingDate")]
    public DateTimeOffset BookingDate { get; set; }

    /// <summary>
    /// cancellationDate date
    /// </summary>
    [DataMember(Name = "cancellationDate")]
    public DateTime? CancellationDate { get; set; }

    /// <summary>
    /// Lead passenger details
    /// </summary>
    [DataMember(Name = "leadPassenger")]
    public LeadPassenger LeadPassenger { get; set; }

    /// <summary>
    /// Booking passengers list
    /// </summary>
    [DataMember(Name = "guests")]
    public List<PersonWithDetails> Guests { get; set; }

    /// <summary>
    /// Offer details
    /// </summary>
    [DataMember(Name = "package")]
    public BookingPackage Package { get; set; }

    /// <summary>
    /// Offer currency
    /// </summary>
    [DataMember(Name = "currency")]
    public Currency Currency { get; set; }

    /// <summary>
    /// Offer language
    /// </summary>
    [DataMember(Name = "language")]
    public string Language { get; set; }

    /// <summary>
    /// Market code
    /// </summary>
    [DataMember(Name = "marketCode")]
    public string MarketCode { get; set; }

    /// <summary>
    /// Price Breakdown by categories
    /// </summary>
    [DataMember(Name = "priceBreakdown")]
    public PriceCategory[] PriceBreakdown { get; set; }

    /// <summary>
    /// Price Breakdown by categories for trade agents
    /// </summary>
    [DataMember(Name = "tradeAgentPriceBreakdown")]
    public PriceCategory[] TradeAgentPriceBreakdown { get; set; }

    /// <summary>
    /// Extra Price Breakdown
    /// </summary>
    [DataMember(Name = "extraPriceBreakdown")]
    public PriceCategory[] ExtraPriceBreakdown { get; set; }

    /// <summary>
    /// Promo code used in booking
    /// </summary>
    [DataMember(Name = "discountCode")]
    public string DiscountCode { get; set; }

    /// <summary>
    /// Payment Info
    /// </summary>
    [DataMember(Name = "paymentInfo")]
    public PriceInfo PaymentInfo { get; set; }
    
    /// <summary>
    /// booking tourist taxes and fees
    /// </summary>
    [DataMember(Name = "taxesAndFees")]
    public List<TaxesAndFees> TaxesAndFees { get; set; }

    /// <summary>
    /// Luggage info with the default and extra luggage items
    /// </summary>
    [DataMember(Name = "extraLuggageInfo")]
    public ExtraLuggageInfo ExtraLuggageInfo { get; set; }

    /// <summary>
    /// Airport parking data
    /// </summary>
    [DataMember(Name = "airportParking")]
    public AirportParkingItem AirportParking { get; set; }

    /// <summary>
    /// Collection of offer transfers
    /// </summary>
    [DataMember(Name = "transfers")]
    public IList<TransferItem> Transfers { get; set; }

    /// <summary>
    /// Late room checkout (if available)
    /// </summary>
    [DataMember(Name = "lateRoomCheckout")]
    public LateRoomCheckoutItem LateRoomCheckout { get; set; }

    /// <summary>
    /// Booking hotel details
    /// </summary>
    [DataMember]
    public Hotels.Hotel Hotel { get; set; }

    /// <summary>
    /// Promotion code
    /// </summary>
    [DataMember]
    public string Prom { get; set; }

    /// <summary>
    /// Promotion code
    /// </summary>
    public string CustomerId { get; set; }

    /// <summary>
    /// Customer details
    /// </summary>
    public CustomerDetails CustomerDetails { get; set; }

    /// <summary>
    /// Included luggage Info
    /// </summary>
    [DataMember(Name = "memo")]
    public List<Memo> Memo { get; set; }

    /// <summary>
    /// Whether booking can be changed or not
    /// </summary>
    [DataMember(Name = "canBeChanged")]
    [Obsolete("replaced with credit functionality")]
    public bool CanBeChanged { get; set; }

    /// <summary>
    /// Whether booking can be converted to credit
    /// </summary>
    //[DataMember(Name = "isEligibleForCredit")]
    //public bool IsEligibleForCredit { get; set; }

    /// <summary>
    /// Whether booking can be refunded/credited
    /// </summary>
    [DataMember(Name = "refund")]
    public EligibleForRefund Refund { get; set; }

    /// <summary>
    /// The refund summary of the already canceled booking
    /// </summary>
    [DataMember(Name = "cancelledBookingSummary")]
    public CancelledBookingRefundSummary CancelledBookingRefundSummary { get; set; }
    
    /// <summary>
    /// True when booking is blocked for cancellation due to reach maximum allowed failures 
    /// </summary>
    [DataMember(Name = "cancellationIsBlocked")]
    public bool CancellationIsBlocked { get; set; }

    /// <summary>
    /// Returns true if booking is from external agency
    /// </summary>
    [DataMember(Name = "isExternalAgency")]
    public bool IsExternalAgency { get; set; }

    /// <summary>
    /// Returns true if booking was credited before
    /// </summary>
    [DataMember(Name = "wasCredited")]
    public bool wasCredited { get; set; }

    /// <summary>
    /// Returns true if booking was refunded
    /// </summary>
    [DataMember(Name = "wasRefunded")]
    public bool WasRefunded { get; set; }

    /// <summary>
    /// Whether logged in customer is lead passenger of booking
    /// </summary>
    [DataMember(Name = "isLoggedInAsLeadPassenger")]
    public bool IsLoggedInAsLeadPassenger { get; set; }

    [DataMember(Name = "specialRequests")]
    public SpecialRequest[] SpecialRequests { get; set; }

    /// <summary>
    /// Accommodation hotel errata info
    /// </summary>
    [DataMember(Name = "errataInfo")]
    public List<string> ErrataInfo { get; set; }

    /// <summary>
    /// Heals entry requirements
    /// </summary>
    [DataMember(Name = "healthEntryRequirements")]
    public IEnumerable<HealthEntryRequirement> HealthEntryRequirements { get; set; }

    /// <summary>
    /// Whether credits are enabled or not
    /// </summary>
    [DataMember]
    public bool CreditIsEnabled { get; set; } = true;

    /// <summary>
    /// Booking privacy
    /// </summary>
    [DataMember(Name = "isPrivate")]
    public bool IsPrivate { get; set; }

    /// <summary>
    /// Allowed amendments info
    /// </summary>
    [DataMember]
    public AmendmentsInfo AmendmentInfo { get; set; }

    /// <summary>
    /// Seat selection data
    /// </summary>
    [DataMember(Name = "seatSelection")]
    public List<SeatMap> SeatSelection { get; set; }

    /// <summary>
    /// Warnings that may disrupt booking and need to be handled
    /// </summary>
    [IgnoreDataMember]
    public ApiError[] ApiWarnings { get; set; }

    /// <summary>
    /// B2B api data
    /// </summary>
    /// <remarks>
    /// This class includes data that is considered sensitive.
    /// </remarks>
    [IgnoreDataMember]
    public B2BData B2BData { get; set; }

    /// <summary>
    /// Disruption Info
    /// </summary>
    [DataMember]
    public DisruptionInfo DisruptionInfo { get; set; }

    /// <summary>
    /// Includes all related agent data
    /// </summary>
    [IgnoreDataMember]
    public BookingAgentData AgentData { get; set; }
    
    
    /// <summary>
    /// Available promotional collections for the offer.
    /// </summary>
    [DataMember(Name = "promoCollections")]
    public IList<string> PromotionCollections { get; set; }
    
    /// <summary>
    /// Is destination rules applied
    /// </summary>
    [DataMember(Name = "isDestinationRulesApplied")]
    public bool IsDestinationRulesApplied { get; set; }

    /// <summary>
    /// Booking is refundable or not
    /// </summary>
    [DataMember(Name = "isRefundable")]
    public bool IsRefundable { get; set; }
}

/// <summary>
/// Details of the agent who created the booking
/// </summary>
[Serializable]
[DataContract]
public class BookingAgentData
{
    /// <summary>
    /// Agent Number of the agent who created the booking
    /// </summary>
    [IgnoreDataMember]
    public string AgentNumber { get; set; }

    /// <summary>
    /// Agent Name who created the booking
    /// </summary>
    [IgnoreDataMember]
    public string AgentName { get; set; }
}

/// <summary>
/// Booking package model
/// </summary>
[Serializable]
[DataContract]
public class BookingPackage
{
    /// <summary>
    /// Accommodation model
    /// </summary>
    [DataMember]
    public BookingAccommodation Accom { get; set; }

    /// <summary>
    /// Hotel location
    /// </summary>
    [DataMember(Name = "location")]
    public Location Location { get; set; }

    /// <summary>
    /// Offer routes
    /// </summary>
    [DataMember(Name = "transport")]
    public Transport Transport { get; set; }

    /// <summary>
    /// Tourist tax per person
    /// </summary>
    [DataMember(Name = "touristTaxPP")]
    public decimal TouristTaxPP { get; set; }

    /// <summary>
    /// Tourist tax
    /// </summary>
    [DataMember(Name = "touristTax")]
    public decimal TouristTax { get; set; }
}

/// <summary>
/// Booking accommodation package model
/// </summary>
[Serializable]
[DataContract]
public class BookingAccommodation
{
    /// <summary>
    /// Accommodation code
    /// </summary>
    [DataMember]
    public string Id { get; set; }

    /// <summary>
    /// Accommodation code
    /// </summary>
    [DataMember]
    public string Code { get; set; }

    /// <summary>
    /// Whther accommodation is external or not
    /// </summary>
    [DataMember]
    public bool IsExt { get; set; }

    /// <summary>
    /// External provider system type
    /// </summary>
    public string System { get; set; }

    /// <summary>
    /// Accommodation start date in ISO format yyyy-MM-dd
    /// </summary>
    [DataMember]
    public string StartDate { get; set; }

    /// <summary>
    /// Accommodation prom code
    /// </summary>
    [DataMember]
    public string Prom { get; set; }

    /// <summary>
    /// Accommodation end date in ISO format yyyy-MM-dd
    /// </summary>
    [DataMember]
    public string EndDate { get; set; }

    /// <summary>
    /// Accommodation rooms
    /// </summary>
    [DataMember(Name = "rooms")]
    public List<Unit> Rooms { get; set; }

    /// <summary>
    /// Offer hotel
    /// </summary>
    [DataMember(Name = "hotel")]
    public OfferHotel Hotel { get; set; }

    /// <summary>
    /// Accommodation information messages
    /// </summary>
    [DataMember]
    public List<Memo> Memos { get; set; }
}