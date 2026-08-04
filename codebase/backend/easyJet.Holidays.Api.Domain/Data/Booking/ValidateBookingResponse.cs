using easyJet.Holidays.Api.Domain.Data.AmendBooking.Payment;
using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.Settings;
using System.Runtime.Serialization;
using easyJet.Holidays.Api.Domain.Data.AirportParking;
using easyJet.Holidays.Api.Domain.Data.Promotion;

namespace easyJet.Holidays.Api.Domain.Data.Booking
{
    /// <summary>
    /// Model for Validate Booking response
    /// </summary>
    [Serializable]
    [DataContract]
    public class ValidateBookingResponse
    {
        /// <summary>
        /// Session ID
        /// </summary>
        //[DataMember(Name = "sessionId")] this field should not be serialized to front end
        public string SessionId { get; set; }

        /// <summary>
        /// Request ID
        /// </summary>
        [DataMember(Name = "requestId")]
        public string RequestId { get; set; }

        /// <summary>
        /// Booking reference
        /// </summary>
        //[DataMember(Name = "bookingReference")] this field should not be serialized to front end
        public string BookingReference { get; set; }

        [DataMember(Name = "bookingStatus")]
        public string ResultStatus { get; set; }

        /// <summary>
        /// Promotion code
        /// </summary>
        [DataMember(Name = "Prom")]
        public string DiscountCode { get; set; }

        /// <summary>
        /// Offer currency
        /// </summary>
        [DataMember(Name = "currency")]
        public Currency Currency { get; set; }

        /// <summary>
        /// Market code
        /// </summary>
        [DataMember(Name = "marketCode")]
        public string MarketCode { get; set; }

        /// <summary>
        /// Accommodation details
        /// </summary>
        public BookingAccommodation Accom { get; set; }

        /// <summary>
        /// Booking passengers list
        /// </summary>
        [DataMember(Name = "guests")]
        public List<PersonWithDetails> Guests { get; set; }

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
        /// Payment Info
        /// </summary>
        [DataMember(Name = "paymentInfo")]
        public PriceInfo PaymentInfo { get; set; }

        /// <summary>
        /// Luggage info with the default and extra luggage items
        /// </summary>
        [DataMember(Name = "extraLuggageInfo")]
        public ExtraLuggageInfo ExtraLuggageInfo { get; set; }

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
        /// Accommodation information messages
        /// </summary>
        [DataMember]
        public List<Memo> Memos { get; set; }

        /// <summary>
        /// Whether credits are enabled and can be used to pay for the booking
        /// By default it's <code>true</code>.
        /// </summary>
        [DataMember]
        public bool CreditIsEnabled { get; set; } = true;

        //TODO Remove after implementing errata with geog level
        [IgnoreDataMember]
        public List<string> ErrataInfo { get; set; }

        /// <summary>
        /// Seat selection data
        /// </summary>
        [DataMember(Name = "seatSelection")]
        public List<SeatMap> SeatSelection { get; set; }

        /// <summary>
        /// Airport parking data
        /// </summary>
        [DataMember(Name = "airportParking")]
        public AirportParkingItem AirportParking { get; set; }
        
        /// <summary>
        /// Gets or sets promotion for the package if available
        /// </summary>
        [DataMember(Name = "promotion")]
        public SinglePromotionInfo Promotion { get; set; }

        /// <summary>
        /// Caught api errors during mapping
        /// </summary>
        [IgnoreDataMember]
        public ApiError[] ApiErrors { get; set; }

        /// <summary>
        /// Gets or sets the taxes and fees for the booking.
        /// </summary>
        [DataMember(Name = "taxesAndFees")]
        public List<TaxesAndFees> TaxesAndFees { get; set; }
    }

    /// <summary>
    /// Taxes and fees model
    /// </summary>
    [Serializable]
    [DataContract]
    public class TaxesAndFees
    {
        /// <summary>
        /// Gets or sets the amount of the tax or fee.
        /// </summary>
        [IgnoreDataMember]
        public decimal Quantity { get; set; }
        
        /// <summary>
        /// Gets or sets the local amount of the tax or fee.
        /// </summary>
        [DataMember(Name = "paylocalAmount")]
        public decimal PaylocalAmount { get; set; }

        /// <summary>
        /// Gets or sets the currency of the local amount of the tax or fee.
        /// </summary>
        [DataMember(Name = "paylocalAmountCurrency")]
        public string PaylocalAmountCurrency { get; set; }

        /// <summary>
        /// Gets or sets the converted currency of the local amount of the tax or fee.
        /// </summary>
        [DataMember(Name = "paylocalAmountConvertedCurrency")]
        public string PaylocalAmountConvertedCurrency { get; set; }

        /// <summary>
        /// Gets or sets the converted local amount of the tax or fee. 
        /// </summary>
        [DataMember(Name = "paylocalAmountConverted")]
        public decimal PaylocalAmountConverted { get; set; }

        /// <summary>
        /// Gets or sets the exchange rate used for currency conversion operations.
        /// </summary>
        [DataMember(Name = "exchangeRate")]
        public decimal ExchangeRate { get; set; }

        /// <summary>
        /// Gets or sets the converted local amount per person of the tax or fee.
        /// </summary>
        [DataMember(Name = "paylocalAmountPPConverted")]
        public decimal PaylocalAmountPPConverted { get; set; }
    }

    /// <summary>
    /// Memo model
    /// </summary>
    [Serializable]
    [DataContract]
    public class Memo
    {
        /// <summary>
        /// Code
        /// </summary>
        [DataMember]
        public string Code { get; set; }

        /// <summary>
        /// Description
        /// </summary>
        [DataMember]
        public string Text { get; set; }

        /// <summary>
        /// Description
        /// </summary>
        [IgnoreDataMember]
        public string Key { get; set; }
    }

    /// <summary>
    /// Booking pricing - total, per person and deposit info if any
    /// </summary>
    [Serializable]
    [DataContract]
    public class PriceInfo : IPriceTotalModel
    {
        /// <summary>
        /// Total amount to be paid
        /// </summary>
        [DataMember(Name = "totalPrice")]
        public decimal TotalPrice { get; set; }

        /// <summary>
        /// Extra amount to be paid
        /// </summary>
        [IgnoreDataMember]
        public decimal AmendmentCharges { get; set; }

        /// <summary>
        /// Price per person to be paid, for reference
        /// </summary>
        [DataMember(Name = "pricePP")]
        public decimal PricePP { get; set; }

        /// <summary>
        /// Current currency
        /// </summary>
        [DataMember(Name = "currency")]
        public string Currency { get; set; }
        /// <summary>
        /// Deposit price to be paid. If ZERO - only full payment will be accepted
        /// </summary>
        [DataMember(Name = "depositPrice")]
        public decimal DepositPrice { get; set; }

        /// <summary>
        /// Deposit price to be paid. If ZERO - only full payment will be accepted
        /// </summary>
        [DataMember(Name = "balanceDueAmount")]
        public decimal BalanceDueAmount { get; set; }

        /// <summary>
        /// Due Date where remaining balance should be paid
        /// </summary>
        [DataMember(Name = "balanceDueDate")]
        public DateTimeOffset BalanceDueDate { get; set; }

        /// <summary>
        /// Due Date where remaining balance is allowed to be paid
        /// </summary>
        [DataMember(Name = "allowPayBalanceDueDate")]
        public DateTimeOffset AllowPayBalanceDueDate { get; set; }

        /// <summary>
        /// Number of days where remaining balance is allowed to be paid, derived from appsettings
        /// </summary>
        [DataMember(Name = "allowPayOutstandingBalanceDays")]
        public int AllowPayOutstandingBalanceDays { get; set; }

        /// <summary>
        /// Due Date where remaining balance should be paid
        /// </summary>
        [DataMember(Name = "depositDueDate")]
        public DateTimeOffset DepositDueDate { get; set; }

        /// <summary>
        /// History of payments made
        /// </summary>
        [DataMember(Name = "paymentHistory")]
        public PaymentHistoryItem[] PaymentHistory { get; set; }
        
        /// <summary>
        /// Payment received
        /// </summary>
        [DataMember(Name = "paymentReceived")]
        public decimal PaymentReceived { get; set; }

        /// <summary>
        /// History of payments made
        /// </summary>
        [DataMember(Name = "commissionIncludingVat", EmitDefaultValue = false)]
        public decimal CommissionIncludingVAT { get; set; }

        /// <summary>
        /// Agent commission
        /// </summary>
        [DataMember(Name = "agentComission", EmitDefaultValue = false)]
        public decimal AgentComission { get; set; }

        /// <summary>
        /// Gets or sets the booking price exclude fees.
        /// </summary>
        /// <value>
        /// The booking price exclude fees.
        /// </value>
        [IgnoreDataMember]
        public decimal BookingPriceEx { get; set; }

        /// <summary>
        /// Gets or sets the booking price include fees.
        /// </summary>
        /// <value>
        /// The booking price include fees.
        /// </value>
        [IgnoreDataMember]
        public decimal BookingPriceInc { get; set; }

        /// <summary>
        /// Gets or sets the amendment fees items.
        /// </summary>
        /// <value>
        /// The amendment fees items.
        /// </value>
        [IgnoreDataMember]
#pragma warning disable CA1819
        public FeeItem[] AmendmentFeesItems { get; set; }
#pragma warning restore CA1819
    }

    /// <summary>
    /// Included luggage info - codes, per-guest allowance and pricing
    /// </summary>
    [Serializable]
    [DataContract]
    public class PaymentHistoryItem
    {
        /// <summary>
        /// Payment amount
        /// </summary>
        [DataMember(Name = "amount")]
        public decimal Amount { get; set; }

        /// <summary>
        /// Date of payment
        /// </summary>
        [DataMember(Name = "paymentDate")]
        public DateTimeOffset? PaymentDate { get; set; }

        /// <summary>
        /// Whether credit payment or not
        /// </summary>
        [DataMember(Name = "isCredit")]
        public bool IsCredit { get; set; }

        /// <summary>
        /// Card details(optional)
        /// </summary>
        [DataMember]
        public PaymentCard Card { get; set; }

        [IgnoreDataMember]
        public string AuthCode { get; set; }
        [IgnoreDataMember]
        public string CurIso { get; set; }
        [IgnoreDataMember]
        public string TransNo { get; set; }
        [IgnoreDataMember]
        public string PayDetails { get; set; }
        [IgnoreDataMember]
        public string AuthSys { get; set; }
        [IgnoreDataMember]
        public DateTimeOffset? PayDtTm { get; set; }
        [IgnoreDataMember]
        public string PayId { get; set; }

        /// <summary>
        /// If current payment is a cash refund contains PayId of original cash payment. Empty for non-cash refunds or normal payments.
        /// </summary>
        [IgnoreDataMember]
        public string RefundAgainstId { get; set; }

        /// <summary>
        /// If payment had cash refunds this property contains amount of payment that can still be refunded.
        /// Credit refunds don't affect this value. Atcom updates this value based on RefundAgainstId, we don't update it in our code.
        /// </summary>
        [IgnoreDataMember]
        public decimal? RefundableAmount { get; set; }

        [IgnoreDataMember]
        public bool IsGiftCardCredit { get; set; }

        [IgnoreDataMember]
        public bool IsPromoCredit { get; set; }

        [IgnoreDataMember]
        public bool IsGoodWill { get; set; }

        /// <summary>
        /// Is true when payment is one time use credit
        /// </summary>
        [IgnoreDataMember]
        public bool IsOneTimeUseCredit { get; set; }

        [IgnoreDataMember]
        public string PayMethodCode { get; set; }
    }

    /// <summary>
    /// Payment card details
    /// </summary>
    [Serializable]
    [DataContract]
    public class PaymentCard
    {
        /// <summary>
        /// Official type name of credit card
        /// </summary>
        [DataMember]
        public string Type { get; set; }

        /// <summary>
        /// Issuer credit card code
        /// </summary>
        [DataMember]
        public string Code { get; set; }

        /// <summary>
        /// Card number: e.g. 4111********1111
        /// </summary>
        [DataMember]
        public string Number { get; set; }

        /// <summary>
        /// Card expiratino date mm/yy, e.g. 08/21
        /// </summary>
        [DataMember]
        public string ExpDate { get; set; }

        /// <summary>
        /// Whether card is loyality card
        /// </summary>
        [DataMember]
        public bool IsLoyaltyCard { get; set; }
    }

    /// <summary>
    /// Price breakdown single category
    /// </summary>
    [Serializable]
    [DataContract]
    public class PriceCategory
    {
        /// <summary>
        /// Category code
        /// </summary>
        [DataMember(Name = "code")]
        public string Code { get; set; }

        /// <summary>
        /// Category Name
        /// </summary>
        [DataMember(Name = "name")]
        public string Name { get; set; }

        /// <summary>
        /// Total category amount
        /// </summary>
        [DataMember(Name = "amount")]
        public decimal Amount { get; set; }

        /// <summary>
        /// Quantity for the category
        /// </summary>
        [DataMember(Name = "quantity")]
        public int Quantity { get; set; }

        /// <summary>
        /// Subcategories of the category
        /// </summary>
        [DataMember(Name = "subcategories")]
        public List<PriceCategory> Subcategories { get; set; }
    }

    /// <summary>
    /// Customer details model
    /// </summary>
    [Serializable]
    [DataContract]
    public class CustomerDetails
    {
        /// <summary>
        /// Code
        /// </summary>
        [DataMember]
        public string Email { get; set; }
    }
}
