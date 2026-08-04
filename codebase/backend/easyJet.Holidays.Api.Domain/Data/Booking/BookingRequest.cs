using easyJet.Holidays.Api.Domain.CustomJsonConverters;
using easyJet.Holidays.Api.Domain.Data.AirportParking;
using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Payment;
using Newtonsoft.Json;
using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Booking;

/// <summary>
/// Class representing booking request model
/// </summary>
[Serializable]
[DataContract]
[KnownType(typeof(BookingChangeRequest))]
public class BookingRequest
{
    /// <summary>
    /// Lead passenger details. Required for Flight booking
    /// </summary>
    [DataMember(Name = "leadPassenger")]
    public LeadPassenger LeadPassenger { get; set; }

    /// <summary>
    /// Payment information
    /// </summary>
    [DataMember(Name = "paymentInfo")]
    [JsonConverter(typeof(PaymentInfoConverter))]
    public PaymentInfo PaymentInfo { get; set; }

    /// <summary>
    /// Lists of passengers to validate booking
    /// </summary>
    [DataMember(Name = "guests")]
    [Required]
    public List<PersonWithDetails> Guests { get; set; }

    /// <summary>
    /// Selected offer
    /// </summary>
    [DataMember(Name = "offer")]
    [Required]
    public Offer Offer { get; set; }

    /// <summary>
    /// Discount code
    /// </summary>
    [DataMember(Name = "discount")]
    public string DiscountCode { get; set; }
    
    /// <summary>
    /// Original offer price with discount applied. Required for price validation
    /// Contains value only if the request has promo code applied
    /// </summary>
    [IgnoreDataMember]
    public decimal? OfferPriceWithDiscountApplied { get; set; }

    /// <summary>
    /// Browser Info
    /// </summary>
    [DataMember(Name = "browserInfo")]
    [Required]
    public BrowserInfo BrowserInfo { get; set; }

    /// <summary>
    /// Booking reference
    /// </summary>
    [DataMember(Name = "bookingReference")]
    public string BookingReference { get; set; }

    /// <summary>
    /// Session ID
    /// </summary>
    [DataMember(Name = "sessionId")]
    public string SessionId { get; set; }

    /// <summary>
    /// Device ID (InAuth), used as part of fraud assessment
    /// </summary>
    [DataMember(Name = "deviceId")]
    public string DeviceId { get; set; }

    /// <summary>
    /// Request ID
    /// </summary>
    public string RequestId { get; set; }

    /// <summary>
    /// Collection of special requests
    /// </summary>
    [DataMember(Name = "specialRequests")]
    public string SpecialRequests { get; set; }

    /// <summary>
    /// Seat selection data
    /// </summary>
    [DataMember(Name = "seatSelection")]
    public List<SeatMap> SeatSelection { get; set; }

    /// <summary>
    /// Luggage to book
    /// </summary>
    [DataMember(Name = "extraLuggageInfo")]
    public ExtraLuggageInfo ExtraLuggageInfo { get; set; }

    /// <summary>
    /// Airport parking data
    /// </summary>
    [DataMember(Name = "airportParking")]
    public AirportParkingItem AirportParking { get; set; }

    /// <summary>
    /// Create Booking Request from Validate Booking request
    /// </summary>
    /// <param name="request">Booking request</param>
    /// <returns>validate package request</returns>
    public static BookingRequest FromValidateBookingRequest(ValidateBookingRequest request)
    {
        return new BookingRequest
        {
            Offer = request.Offer,
            DiscountCode = request.DiscountCode,
            Guests = request.Guests.Select(g => new PersonWithDetails
            {
                Age = g.Age,
                Sex = g.Sex,
                Type = g.Type
            }).ToList(),
            SeatSelection = request.SeatSelection,
            ExtraLuggageInfo = request.ExtraLuggageInfo,
            AirportParking = request.AirportParking
        };
    }

    /// <summary>
    /// Create booking request from modify booking request
    /// </summary>
    /// <param name="request">Booking request</param>
    /// <returns>validate package request</returns>
    public static BookingRequest FromModifyBookingRequest(AmendBookingRequest request)
    {
        var bookingRequest = new BookingRequest()
        {
            BookingReference = request.BookingReference,
            BrowserInfo = request.BrowserInfo,
            DeviceId = request.DeviceId,
            SessionId = request.SessionId,
            LeadPassenger = request.LeadPassenger,
            PaymentInfo = request.PaymentInfo,
            RequestId = request.RequestId,
            DiscountCode = request.DiscountCode,
            Offer = new Offer()
            {
                Transport = request.Transport,
                Transfers = request.Transfers?.ToList(),
            }
        };

        return bookingRequest;
    }
}