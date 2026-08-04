using easyJet.Holidays.Api.Domain.Data.AirportParking;
using easyJet.Holidays.Api.Domain.Data.SmartSeer;
using easyJet.Holidays.Api.Domain.CustomJsonConverters;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.DynamoDB.FreeNights;
using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Data.LivePrice;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.ShortList;
using easyJet.Holidays.Api.Domain.Data.Promotion;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Data.Themes;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking;
using GeoJSON.Net.Feature;
using Newtonsoft.Json;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.PackageOffers
{
    /// <summary>
    /// Offers response. reused among some of endpoints like alternative-flights and offers,
    /// since Atcom has `Offer` model, that it returns for search calls of different types
    /// </summary>
    [Serializable]
    [DataContract]
    public class SearchOffersResponse
    {
        /// <summary>
        /// Search status
        /// </summary>
        [DataMember(Name = "status")]
        public Status Status { get; set; }

        /// <summary>
        /// Offers
        /// </summary>
        [DataMember(Name = "offers")]
        public List<Offer> Offers { get; set; }

        /// <summary>
        /// list of filters available on search results page, e.g. "Board Type", "Room Type"
        /// </summary>
        [DataMember(Name = "filters")]
        public List<Filter> Filters { get; set; }

        /// <summary>
        /// Indicates whether the filters should be reordered in the response.
        /// </summary>
        [DataMember(Name = "reorderFilters")]
        public bool ReorderFilters { get; set; }

        /// <summary>
        ///  Flag indicating whether Offers are coming from Cache.
        ///  Nothing to do with CMS cache
        /// </summary>
        [IgnoreDataMember]
        public bool FromCache { get; set; }
    }

    /// <summary>
    /// Represents the geo-based response for search offers, including status and filters.
    /// </summary>
    [Serializable]
    [DataContract]
    public class SearchOffersGeoResponse
    {
        /// <summary>
        /// Search status
        /// </summary>
        [DataMember(Name = "status")]
        public Status Status { get; set; }

        /// <summary>
        /// Geo-json response for offers
        /// </summary>
        [DataMember(Name = "geoOffers")]
        public FeatureCollection GeoOffers { get; set; }

        /// <summary>
        /// list of filters available on search results page, e.g. "Board Type", "Room Type"
        /// </summary>
        [DataMember(Name = "filters")]
        public IList<Filter> Filters { get; set; }

        /// <summary>
        ///  Flag indicating whether Offers are coming from Cache.
        ///  Nothing to do with CMS cache
        /// </summary>
        [IgnoreDataMember]
        public bool FromCache { get; set; }
    }

    /// <summary>
    /// Search status
    /// </summary>
    [Serializable]
    [DataContract]
    public class Status
    {
        /// <summary>
        /// Total offer count
        /// </summary>
        [DataMember(Name = "total")]
        public uint Total { get; set; }

        /// <summary>
        /// Minimal price among the offers
        /// </summary>
        [DataMember(Name = "minPrice")]
        public decimal MinPrice { get; set; }

        /// <summary>
        /// Maximal price among the offers
        /// </summary>
        [DataMember(Name = "maxPrice")]
        public decimal MaxPrice { get; set; }

        /// <summary>
        /// Minimal price per person
        /// </summary>
        [DataMember(Name = "minPricePP")]
        public decimal MinPricePP { get; set; }

        /// <summary>
        /// Maximal price per person
        /// </summary>
        [DataMember(Name = "maxPricePP")]
        public decimal MaxPricePP { get; set; }

        /// <summary>
        /// If offer has discount
        /// </summary>
        [DataMember(Name = "hasDiscont")]
        public bool HasDiscont { get; set; }

        /// <summary>
        /// Upsell value
        /// </summary>
        [DataMember(Name = "upsell")]
        public decimal? Upsell { get; set; }

        /// <summary>
        /// SmartSeer tracking info.
        /// </summary>
        [DataMember(Name = "tracking")]
        public SmartSeerTrackingInfo Tracking { get; set; }
    }

    /// <summary>
    /// Offer model
    /// </summary>
    [Serializable]
    [DataContract]
    public class Offer : ISortableOffer
    {
        /// <summary>
        /// unique ID
        /// </summary>
        [DataMember(Name = "id")]
        public string Id { get; set; }

        /// <summary>
        /// Promotion type for offer, based on promotions
        /// </summary>
        [DataMember(Name = "promotionType")]
        public string PromotionType { get; set; }

        /// <summary>
        /// Date, the holiday starts with
        /// </summary>
        [DataMember(Name = "date")]
        public DateTime? Date { get; set; }

        /// <summary>
        /// Offer stay duration in days
        /// </summary>
        [DataMember(Name = "stay")]
        public byte? Stay { get; set; }

        /// <summary>
        /// Total price
        /// </summary>
        [DataMember(Name = "price")]
        public decimal Price { get; set; }

        /// <summary>
        /// Price per person
        /// </summary>
        [DataMember(Name = "pricePP")]
        public decimal PricePP { get; set; }

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

        /// <summary>
        /// Amendments charges
        /// </summary>
        [DataMember(Name = "amendmentsCharges")]
        public decimal? AmendmentsCharges { get; set; }

        /// <summary>
        /// Offer deposit value
        /// </summary>
        [DataMember(Name = "deposit")]
        public decimal? Deposit { get; set; }

        /// <summary>
        /// Accommodation details
        /// </summary>
        [DataMember(Name = "accom")]
        public Accom Accom { get; set; }

        /// <summary>
        /// Hotel Giata code, that refers to the accommodation offer
        /// </summary>
        [DataMember(Name = "giataCode")]
        public string GiataCode { get; set; }

        /// <summary>
        /// References to alternative channels with offers for the same physical hotel
        /// </summary>
        [DataMember(Name = "altAcc")]
        public List<AlternativeAccommodation> AlternativeAccommodations { get; set; }

        /// <summary>
        /// Alternative boards for unit
        /// </summary>
        [DataMember(Name = "altBoards")]
        public List<AltBoardType> AltBoards { get; set; }

        /// <summary>
        /// Offer location
        /// </summary>
        [DataMember(Name = "location")]
        public Location Location { get; set; }

        /// <summary>
        /// Offer transport data
        /// </summary>
        [DataMember(Name = "transport")]
        public Transport Transport { get; set; }

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
        /// Default transfer code for offer. It's used to get correct collection of alternative transfers
        /// </summary>
        [DataMember(Name = "defaultTransferCode")]
        public string DefaultTransferCode { get; set; }

        /// <summary>
        /// Offer hotel
        /// </summary>
        [DataMember(Name = "hotel")]
        public OfferHotel Hotel { get; set; }

        /// <summary>
        /// Hotel deeplink
        /// </summary>
        [DataMember(Name = "deepLink")]
        public string DeepLink { get; set; }

        /// <summary>
        /// does offer has distressed flights
        /// </summary>
        [DataMember(Name = "hasDistressedFlights")]
        public bool? hasDistressedFlights { get; set; }

        /// <summary>
        /// Indicates whether the offer includes a free board update.
        /// </summary>
        [DataMember(Name = "hasFreeBoardUpdate")]
        public bool? HasFreeBoardUpdate { get; set; }

        [DataMember(Name = "shortlist")]
        public ShortlistInfo Shortlist { get; set; }

        /// <summary>
        /// Available offer promotion
        /// </summary>
        [DataMember(Name = "promotion")]
        public SinglePromotionInfo Promotion { get; set; }

        /// <summary>
        /// Is hotel sponsored
        /// </summary>
        [DataMember(Name = "isSponsored")]
        public bool? IsSponsored { get; set; }

        /// <summary>
        /// Other available routes
        /// </summary>
        [DataMember(Name = "otherRoutes")]
        public string[] OtherRoutes { get; set; }

        [DataMember(Name = "livePrice")]
        public LivePriceSummaryModel LivePrice { get; set; }

        /// <summary>
        /// Array with errata
        /// </summary>
        [DataMember(Name = "errataInfo")]
        public string[] ErrataInfo { get; set; }

        /// <summary>
        /// Information about current seat selection
        /// </summary>
        [DataMember(Name = "seatSelection")]
        public List<SeatMap> SeatSelection { get; set; }

        /// <summary>
        /// Currency
        /// </summary>
        [DataMember(Name = "currency")]
        public Currency Currency { get; set; }

        /// <summary>
        /// Modified price
        /// </summary>
        [DataMember(Name = "modifiedPrice")]
        public decimal ModifiedPrice { get; set; }

        /// <summary>
        /// Luggage info
        /// </summary>
        [DataMember(Name = "extraLuggageInfo")]
        public ExtraLuggageInfo ExtraLuggageInfo { get; set; }

        /// <summary>
        /// Used by endpoints that return alternative flights, contais distance to original airport in km
        /// </summary>
        [DataMember(Name = "distanceToOriginalAirport")]
        public int? DistanceToOriginalAirport { get; set; }

        /// <summary>
        /// Parking info
        /// </summary>
        [DataMember(Name = "airportParking")]
        public AirportParkingItem AirportParkingItem { get; set; }

        /// <summary>
        /// Available promotional collections for the offer.
        /// </summary>
        [DataMember(Name = "promoCollections")]
        public IList<string> PromotionCollections { get; set; }

        /// <summary>
        /// SmartSeer tracking info. Only initialized for recommended carousels if hotel is sponsored.
        /// </summary>
        [DataMember(Name = "tracking")]
        public object Tracking { get; set; }

        /// <summary>
        /// Discount percentage for the offer
        /// </summary>
        [DataMember(Name = "discountPercentage")]
        public int? DiscountPercentage { get; set; }

        /// <summary>
        /// Gets or sets the amount of local tourist tax to be applied.
        /// </summary>
        [DataMember(Name = "touristTaxLocal")]
        public decimal TouristTaxLocal { get; set; }

        /// <summary>
        /// Gets or sets the local per-person tourist tax amount applied to the booking.
        /// </summary>
        [DataMember(Name = "touristTaxPPLocal")]
        public decimal TouristTaxPPLocal { get; set; }

        /// <summary>
        /// Gets or sets the exchange rate used for currency conversion operations.
        /// </summary>
        [DataMember(Name = "exchangeRate")]
        public decimal ExchangeRate { get; set; }

        /// <summary>
        /// Gets or sets the currency in which the tourist tax is denominated.
        /// </summary>
        [DataMember(Name = "touristTaxCurrency")]
#pragma warning disable CA2235 // Currency is serializable
        public Currency TouristTaxCurrency { get; set; }
#pragma warning restore CA2235 // Currency is serializable

        /// <summary>
        /// Gets a value indicating whether the board upgrade is available at a discounted rate.
        /// </summary>
        [DataMember(Name = "hasDiscountedBoardUpgrade")]
        public bool HasDiscountedBoardUpgrade { get; set; }

        /// <summary>
        /// Gets or sets the price excluding any tax payments or fees.
        /// </summary>
        [DataMember(Name = "priceExcludingTouristTax")]
        public decimal PriceExcludingTouristTax { get; set; }

        /// <summary>
        /// Gets or sets the price per person excluding any tax payments or fees.
        /// </summary>
        [DataMember(Name = "pricePPExcludingTouristTax")]
        public decimal PricePPExcludingTouristTax { get; set; }

        /// <summary>
        /// Gets or sets the taxes and fees associated with the offer
        /// </summary>
        [DataMember(Name = "taxesAndFees")]
        public IReadOnlyDictionary<string, TaxesAndFeesSummary> TaxesAndFees { get; set; }
    }

    /// <summary>
    /// Information about alternative accommodation
    /// </summary>
    [Serializable]
    [DataContract]
    public class TaxesAndFeesSummary
    {
        /// <summary>
        /// Total Local Price PP
        /// </summary>
        [DataMember(Name = "totalLocalPricePP")]
        public decimal TotalLocalPricePP { get; set; }

        /// <summary>
        /// Exchange rate used 
        /// </summary>
        [DataMember(Name = "exchRt")]
        public decimal ExchRt { get; set; }

        /// <summary>
        /// The local currency
        /// </summary>
        [DataMember(Name = "currency")]
        public string Currency { get; set; }

        /// <summary>
        /// Total local taxes and fees 
        /// </summary>
        [DataMember(Name = "totalLocalPrice")]
        public decimal TotalLocalPrice { get; set; }
    }


    /// <summary>
    /// Information about alternative accommodation
    /// </summary>
    [Serializable]
    [DataContract]
    public class AlternativeAccommodation
    {
        /// <summary>
        /// Alternative accommodation code
        /// </summary>
        [DataMember(Name = "accomCode")]
        public string Code { get; set; }

        /// <summary>
        /// Alternative accommodation package id
        /// </summary>
        [DataMember(Name = "packageId")]
        public string PackageId { get; set; }
    }

    /// <summary>
    /// Object, that represents hotel location
    /// </summary>
    [Serializable]
    [DataContract]
    public class Location
    {
        /// <summary>
        /// City/town
        /// </summary>
        [DataMember(Name = "city")]
        public string City { get; set; }

        /// <summary>
        /// Region
        /// </summary>
        [DataMember(Name = "region")]
        public string Region { get; set; }

        /// <summary>
        /// Country
        /// </summary>
        [DataMember(Name = "country")]
        public string Country { get; set; }
    }

    [Serializable]
    [DataContract]
    public class Transport
    {
        /// <summary>
        /// Available routes
        /// </summary>
        [DataMember(Name = "routes")]
        public List<Route> Routes { get; set; }

        /// <summary>
        /// Errata
        /// </summary>
        [DataMember(Name = "errataFlightInfo")]
        public IEnumerable<string> FlightErrataInfo { get; set; }

        /// <summary>
        /// Information about outbound flight
        /// </summary>
        [IgnoreDataMember]
        public Route OutboundFlight { get => Routes?.FirstOrDefault(x => x.Direction == Direction.Outbound); }

        /// <summary>
        /// Information about return flight
        /// </summary>
        [IgnoreDataMember]
        public Route ReturnFlight { get => Routes?.FirstOrDefault(x => x.Direction == Direction.Inbound); }
    }

    /// <summary>
    /// Flight route
    /// </summary>
    [Serializable]
    [DataContract]
    public class Route
    {
        /// <summary>
        /// Id, looks like Ee50d8469bd330496cf0ed1c0cc6a6020
        /// </summary>
        [DataMember(Name = "id")]
        public string Id { get; set; }

        /// <summary>
        /// The date, flight should happen on
        /// </summary>
        [DataMember(Name = "cycDate")]
        public string CycDate { get; set; }

        /// <summary>
        /// Departure airport. 3-letter code
        /// </summary>
        [DataMember(Name = "depPt")]
        public string DepPt { get; set; }

        /// <summary>
        /// Exact expected departure datetime
        /// </summary>
        [DataMember(Name = "depDate")]
        public DateTimeOffset? DepDate { get; set; }

        /// <summary>
        /// Departure airport name
        /// </summary>
        [DataMember(Name = "depName")]
        public string DepName { get; set; }

        /// <summary>
        /// Departure airport item name
        /// </summary>
        [DataMember(Name = "depItemName")]
        public string DepItemName { get; set; }

        /// <summary>
        /// Departure airport country
        /// </summary>
        [DataMember(Name = "depLocation")]
        public string DepLocation { get; set; }

        /// <summary>
        /// Arrival airport. 3-letter code
        /// </summary>
        [DataMember(Name = "arrPt")]
        public string ArrPt { get; set; }

        /// <summary>
        /// Exact expected arrival datetime
        /// </summary>
        [DataMember(Name = "arrDate")]
        public DateTimeOffset? ArrDate { get; set; }

        /// <summary>
        /// Arrival airport name
        /// </summary>
        [DataMember(Name = "arrName")]
        public string ArrName { get; set; }

        /// <summary>
        /// Arrival airport item name
        /// </summary>
        [DataMember(Name = "arrItemName")]
        public string ArrItemName { get; set; }

        /// <summary>
        /// Arrival airport country
        /// </summary>
        [DataMember(Name = "arrLocation")]
        public string ArrLocation { get; set; }

        /// <summary>
        /// Route code. looks like BJVLTN6ABJVLTN
        /// </summary>
        [DataMember(Name = "routeCd")]
        public string RouteCd { get; set; }

        /// <summary>
        /// Route id
        /// </summary>
        [DataMember(Name = "routeId")]
        public string RouteId { get; set; }

        /// <summary>
        /// Availability count
        /// </summary>
        [DataMember(Name = "avail")]
        public uint? Avail { get; set; }

        /// <summary>
        /// Flight number. looks like EZY1337
        /// </summary>
        [DataMember(Name = "fltNo")]
        public string FltNo { get; set; }

        /// <summary>
        /// Second part of flight number, which contain numbers. e.g. 1337
        /// </summary>
        [IgnoreDataMember]
        public string FlightNumberWithoutCar => string.IsNullOrWhiteSpace(Car) ? FltNo : FltNo?.Replace(Car, string.Empty);

        /// <summary>
        /// First part of a flight number, which contain letters. e.g. EZY
        /// </summary>
        [DataMember(Name = "car")]
        public string Car { get; set; }

        /// <summary>
        /// Direction of a route. inbound - to the home airport, outbound - to the hotel airport
        /// </summary>
        [DataMember(Name = "direction")]
        public Direction Direction { get; set; }

        /// <summary>
        /// External reference, that is mandatory for some (they do not disclose exactly, which) Atcom's internal stuff
        /// </summary>
        [DataMember(Name = "extRefId")]
        public string ExtRefId { get; set; }

        /// <summary>
        /// Values for external routes are calculated additionally on the backend side
        /// </summary>
        [DataMember(Name = "isExt")]
        public bool IsExternal { get; set; }

        /// <summary>
        /// Passengers of a route
        /// </summary>
        [DataMember(Name = "paxs")]
        public IEnumerable<RoutePax> Paxs { get; set; }

        /// <summary>
        /// Booking class
        /// </summary>
        [DataMember(Name = "bkgCls")]
        public string BookingClass { get; set; }

        /// <summary>
        /// Terminal
        /// </summary>
        [DataMember(Name = "terminal")]
        public string Terminal { get; set; }

        /// <summary>
        /// Arrival Terminal
        /// </summary>
        [DataMember(Name = "arrTerminal")]
        public string ArrTerminal { get; set; }

        /// <summary>
        /// Departure Terminal
        /// </summary>
        [DataMember(Name = "depTerminal")]
        public string DepTerminal { get; set; }

        /// <summary>
        /// Fight duration
        /// </summary>
        [DataMember(Name = "duration")]
        public string Duration { get; set; }

        /// <summary>
        /// Indicates if seat reservation is possible for the route.
        /// </summary>
        [IgnoreDataMember]
        public bool IsSeatReservationPossible { get; set; }

        /// <summary>
        /// Sector ID
        /// </summary>
        public string SectorId { get; set; }
        
        /// <summary>
        /// Total route price exclude any fees and charges.
        /// </summary>
        [IgnoreDataMember]
        public decimal TotalPrice { get; set; }
    }

    /// <summary>
    /// Model, representing the accommodation
    /// </summary>
    [Serializable]
    [DataContract]
    public class Accom
    {
        /// <summary>
        /// Date of the accommodation
        /// </summary>
        [DataMember(Name = "date")]
        public DateTime Date { get; set; }

        /// <summary>
        /// Count of days to stay
        /// </summary>
        [DataMember(Name = "stay")]
        public byte Stay { get; set; }

        /// <summary>
        /// Accommodation id. Id + PackageId are supposed to uniquely identify the booking
        /// </summary>
        [DataMember(Name = "id")]
        public string Id { get; set; }

        /// <summary>
        /// Package id to have the accommodation at particular time. Id + PackageId are supposed to uniquely identify the booking
        /// </summary>
        [DataMember(Name = "packageId")]
        public string PackageId { get; set; }

        /// <summary>
        /// Accommodation Code. Depends on Atcom implementation for particular customer.
        /// For EasyJet case the AccomCode and the AccomId fields contain same value
        /// </summary>
        [DataMember(Name = "code")]
        public string Code { get; set; }

        /// <summary>
        /// Atcom type - Family  / Adult / Undiscovered / Luxury / Boutique /
        /// </summary>
        [DataMember(Name = "type")]
        public ThemeType Type { get; set; }

        /// <summary>
        /// Atcom theme - Beach/City/Lake
        /// </summary>
        [DataMember(Name = "theme")]
        public PackageTheme Theme { get; set; }

        [DataMember(Name = "unit")]
        public List<Unit> Unit { get; set; }

        [DataMember(Name = "prom")]
        public string Prom { get; set; }

        [DataMember(Name = "isExt")]
        public bool IsExternal { get; set; }

        /// <summary>
        /// Accommodation latitude
        /// </summary>
        [DataMember]
        public decimal? Latitude { get; set; }

        /// <summary>
        /// Accommodation longitude
        /// </summary>
        [DataMember]
        public decimal? Longitude { get; set; }

        /// <summary>
        /// Respresents Country
        /// </summary>
        public string Country { get; set; }

        /// <summary>
        /// Respresents Location
        /// </summary>
        public string Region { get; set; }

        /// <summary>
        /// Respresents Resort
        /// </summary>
        public string Resort { get; set; }

        /// <summary>
        /// Transfer duration in minutes
        /// </summary>
        [DataMember(Name = "transferDuration")]
        public int? TransferDuration { get; set; }
    }

    /// <summary>
    /// Unit details. "Room" and "Unit" terms are equal in context of this project
    /// </summary>
    [Serializable]
    [DataContract]
    public class Unit : IPriceModel
    {
        /// <summary>
        /// This room type code
        /// </summary>
        [DataMember(Name = "code")]
        [JsonConverter(typeof(PreserveWhitespaceStringConverter))]
        public string Code { get; set; }

        /// <summary>
        /// Room name. Ignore it on UI because it will be in RoomType object
        /// </summary>
        [IgnoreDataMember]
        public string Name { get; set; }

        /// <summary>
        /// Price value
        /// </summary>
        [DataMember(Name = "price")]
        public decimal Price { get; set; }

        /// <summary>
        /// Price per person
        /// </summary>
        [DataMember(Name = "pricePP")]
        public decimal PricePP { get; set; }

        /// <summary>
        /// Currency
        /// </summary>
        [DataMember(Name = "currency")]
        public Currency Currency { get; set; }

        /// <summary>
        /// Unit discount
        /// </summary>
        [DataMember(Name = "discount")]
        public decimal? Discount { get; set; }

        /// <summary>
        /// Unit discount per person
        /// </summary>
        [DataMember(Name = "discountPP")]
        public decimal? DiscountPP { get; set; }

        /// <summary>
        /// Unit availability for offer
        /// </summary>
        [DataMember(Name = "avail")]
        public uint Availability { get; set; }

        /// <summary>
        /// Whether kids go free into this Unit
        /// </summary>
        [DataMember(Name = "isFreeForKids")]
        public bool FreeForKids { get; set; }

        /// <summary>
        /// Detailed Room Type description
        /// </summary>
        [DataMember(Name = "roomType")]
        public RoomType RoomType { get; set; }

        /// <summary>
        /// number of rooms of this type
        /// </summary>
        // //TODO Do we need this property (0 references)?
        [DataMember(Name = "qrty")]
        public string Qrty { get; set; }

        /// <summary>
        /// Selected Board code
        /// </summary>
        [DataMember(Name = "board")]
        public string Board { get; set; }

        /// <summary>
        /// Selected Board Name from Atcom
        /// </summary>
        public string BoardName { get; set; }

        /// <summary>
        /// Detailed Board Type description
        /// </summary>
        [DataMember(Name = "boardType")]
        public BoardType BoardType { get; set; }

        /// <summary>
        /// Room occupation model
        /// </summary>
        [DataMember]
        public Occupation Occupation { get; set; }

        /// <summary>
        /// Per person unit prices
        /// </summary>
        public List<PaxPrice> PaxPrices { get; set; }

        /// <summary>
        /// Information about free nights to stay in a hotel
        /// </summary>
        [DataMember(Name = "freeNights")]
        public FreeNightsInfo FreeNights { get; set; }

        /// <summary>
        /// External code of the room from Dynamic system
        /// </summary>
        [DataMember(Name = "extRoomCode")]
        [JsonConverter(typeof(PreserveWhitespaceStringConverter))]
        public string ExternalRoomCode { get; set; }

        /// <summary>
        /// External code of the board from Dynamic system
        /// </summary>
        [DataMember(Name = "extBoardCode")]
        public string ExternalBoardCode { get; set; }

        /// <summary>
        /// Accommodation code of source channel
        /// </summary>
        [DataMember(Name = "accommodationId")]
        public string AccommodationId { get; set; }

        /// <summary>
        /// Package id of source channel
        /// </summary>
        [DataMember(Name = "packageId")]
        public string PackageId { get; set; }

        /// <summary>
        /// Indicates whether choice of the room requires board alteration or not
        /// </summary>
        [DataMember(Name = "requireBoardAlteration")]
        public string RequireBoardAlteration { get; set; }

        /// <summary>
        /// Indicates whether choice of the room requires alteration of other selected rooms
        /// </summary>
        [DataMember(Name = "requireMoreRoomAlteration")]
        public bool? RequireMoreRoomAlteration { get; set; }

        /// <summary>
        /// Indicates whether the room from external accommodation or not
        /// </summary>
        [DataMember(Name = "isExt")]
        public bool? IsExternal { get; set; }

        /// <summary>
        /// Indicates whether the selected board is for free or not.
        /// </summary>
        [DataMember(Name = "isFreeBoardUpgrade")]
        public bool? IsFreeBoardUpgrade { get; set; }

        /// <summary>
        /// Gets or sets the discount percentage applied by the board, if any.
        /// </summary>

        [DataMember(Name = "boardDiscountPercentage")]
        public decimal? BoardDiscountPercentage { get; set; }
        
        /// <summary>
        /// Indicates whether the room is refundable or not
        /// </summary>
        [DataMember(Name = "isRefundable")]
        public bool? IsRefundable { get; set; }
    }

    /// <summary>
    /// Information about free nights to stay in a hotel
    /// </summary>
    [Serializable]
    [DataContract]
    public class FreeNightsInfo
    {
        /// <summary>
        /// Free nights count for hotel
        /// </summary>
        [DataMember(Name = "freeNightsIncluded")]
        public byte FreeNightsIncluded { get; set; }

        /// <summary>
        /// Variants of free nights
        /// </summary>
        [DataMember(Name = "freeNightsPromo")]
        public IEnumerable<FreeNight> FreeNightsPromo { get; set; }
    }

    /// <summary>
    /// per-person unit price
    /// </summary>
    public class PaxPrice
    {
        /// <summary>
        /// Passenger Index
        /// </summary>
        public string PaxIndex { get; set; }

        /// <summary>
        /// Price for this passenger
        /// </summary>
        public double Price { get; set; }
    }

    /// <summary>
    /// Unit passengers model
    /// </summary>
    [DataContract]
    public class Occupation
    {
        /// <summary>
        /// Number of adults
        /// </summary>
        [DataMember]
        public int Adults { get; set; }

        /// <summary>
        /// Number of children
        /// </summary>
        [DataMember]
        public int Children { get; set; }

        /// <summary>
        /// Number of infants
        /// </summary>
        [DataMember]
        public int Infants { get; set; }

        /// <summary>
        /// Passenger ids
        /// </summary>
        [DataMember]
        public List<int> PaxIds { get; set; }

        /// <summary>
        /// Child ages
        /// </summary>
        [DataMember]
        public List<uint> ChildAges { get; set; }
    }

    /// <summary>
    /// Room type model for
    /// </summary>
    [DataContract]
    public class RoomType
    {
        /// <summary>
        /// room type code
        /// </summary>
        [DataMember(Name = "code")]
        public string Code { get; set; }

        /// <summary>
        /// room type Title
        /// </summary>
        [DataMember(Name = "title")]
        public string Title { get; set; }

        /// <summary>
        /// room type short description
        /// </summary>
        [DataMember(Name = "description")]
        public string Description { get; set; }

        /// <summary>
        /// room type Full description
        /// </summary>
        [DataMember(Name = "content")]
        public string Content { get; set; }

        /// <summary>
        /// Icon url
        /// </summary>
        [DataMember(Name = "iconUrl")]
        public string IconUrl { get; set; }

        /// <summary>
        /// Item name
        /// </summary>
        [DataMember(Name = "itemName")]
        public string ItemName { get; set; }

        /// <summary>
        /// Collection of room images
        /// </summary>
        [DataMember]
        public IEnumerable<HotelImage> Images { get; set; }

        /// <summary>
        /// Room facilities
        /// </summary>
        [DataMember]
        public IEnumerable<HotelFacility> Facilities { get; set; }

        /// <summary>
        /// Room stay configuration
        /// </summary>
        [DataMember]
        public IEnumerable<RoomTypeStay> Stays { get; set; }
        
        /// <summary>
        /// Bed group details
        /// </summary>
        [DataMember]
        public IEnumerable<BedGroup> BedGroups { get; set; }
    }

    /// <summary>
    /// Room configuration model
    /// </summary>
    [DataContract]
    public class RoomTypeStay
    {
        /// <summary>
        /// Configuration type
        /// </summary>
        [DataMember]
        public string StayType { get; set; }

        /// <summary>
        /// Description
        /// </summary>
        [DataMember]
        public string Description { get; set; }

        /// <summary>
        /// Collection of facilities
        /// </summary>
        [DataMember]
        public IEnumerable<HotelFacility> Facilities { get; set; }
    }

    /// <summary>
    /// Model for board type
    /// </summary>
    [DataContract]
    public class BoardType
    {
        /// <summary>
        /// Code
        /// </summary>
        [DataMember(Name = "code")]
        public string Code { get; set; }

        /// <summary>
        /// Title
        /// </summary>
        [DataMember(Name = "title")]
        public string Title { get; set; }

        /// <summary>
        /// Item name
        /// </summary>
        [DataMember(Name = "itemName")]
        public string ItemName { get; set; }

        /// <summary>
        /// Full description
        /// </summary>
        [DataMember(Name = "content")]
        public string Content { get; set; }

        /// <summary>
        /// Short description
        /// </summary>
        [DataMember(Name = "description")]
        public string Description { get; set; }

        /// <summary>
        /// Image url
        /// </summary>
        [DataMember(Name = "imageUrl")]
        public string ImageUrl { get; set; }

        /// <summary>
        /// Icon url
        /// </summary>
        [DataMember(Name = "iconUrl")]
        public string IconUrl { get; set; }

        /// <summary>
        /// Board group info.
        /// </summary>
        [DataMember(Name = "boardGroup")]
        public BoardGroup BoardGroup { get; set; }

        /// <summary>
        ///Board type unit code
        /// </summary>
        [DataMember(Name = "unitCode")]
        public string UnitCode { get; set; }

        /// <summary>
        ///Board type unit code
        /// </summary>
        [DataMember(Name = "unitCodes")]
        public Dictionary<string, string> UnitCodes { get; set; }

        /// <summary>
        /// Indicates whether the board type includes a free board upgrade.
        /// </summary>
        [DataMember(Name = "isFreeBoardUpgrade")]
        public bool? IsFreeBoardUpgrade { get; set; }
    }

    /// <summary>
    /// Model for alternative board type
    /// </summary>
    [DataContract]
    public class AltBoardType : BoardType, IPriceModel
    {
        /// <summary>
        /// Price value
        /// </summary>
        [DataMember(Name = "price")]
        public decimal Price { get; set; }

        /// <summary>
        /// Price per person
        /// </summary>
        [DataMember(Name = "pricePP")]
        public decimal PricePP { get; set; }

        /// <summary>
        /// Currency
        /// </summary>
        [DataMember(Name = "currency")]
        public Currency Currency { get; set; }

        /// <summary>
        /// Indicates whether choice of the board requires room alteration or not
        /// </summary>
        [DataMember(Name = "roomAlterations")]
        public Dictionary<string, string> RoomAlterations { get; set; }

        /// <summary>
        /// Accommodation code
        /// </summary>
        [DataMember(Name = "accommodationId")]
        public string AccommodationId { get; set; }

        /// <summary>
        /// Package id
        /// </summary>
        [DataMember(Name = "packageId")]
        public string PackageId { get; set; }

        /// <summary>
        /// Deep link for alternative board
        /// </summary>
        [DataMember(Name = "deepLink")]
        public string DeepLink { get; set; }

        /// <summary>
        /// Indicates whether the board from external accommodation or not
        /// </summary>
        [DataMember(Name = "isExt")]
        public bool? IsExternal { get; set; }

        /// <summary>
        /// Gets the percentage discount applied to the item, if any.
        /// </summary>
        [DataMember(Name = "discountPercent")]
        public decimal? DiscountPercent { get; set; }

        /// <summary>
        /// Gets the price excluding TT 
        /// </summary>
        [DataMember(Name = "priceExcludingTouristTax")]
        public decimal PriceExcludingTouristTax { get; set; }

        /// <summary>
        /// Gets the price PP excluding TT 
        /// </summary>
        [DataMember(Name = "pricePPExcludingTouristTax")]
        public decimal PricePPExcludingTouristTax { get; set; }

        public AltBoardType() { }
        public AltBoardType(BoardType board)
        {
            if (board != null)
            {
                Code = board.Code;
                Content = board.Content;
                Title = board.Title;
                ItemName = board.ItemName;
                Description = board.Description;
                IconUrl = board.IconUrl;
                ImageUrl = board.ImageUrl;
                UnitCode = board.UnitCode;
            }
        }
    }

    /// <summary>
    /// Data model for airport
    /// </summary>
    [DataContract]
    public class Airport
    {
        /// <summary>
        /// arport code, e.g. LTN
        /// </summary>
        [DataMember(Name = "code")]
        public string Code { get; set; }

        /// <summary>
        /// Airport name, e.g. Luton
        /// </summary>
        [DataMember(Name = "name")]
        public string Name { get; set; }

        /// <summary>
        /// Airpot group, e.g. London
        /// </summary>
        [DataMember(Name = "group")]
        public string Group { get; set; }
    }

    /// <summary>
    /// Hotel facilities group
    /// </summary>
    [DataContract]
    public class HotelFacilityGroup
    {
        /// <summary>
        /// Name of the Facility group
        /// </summary>
        [DataMember]
        public string Name { get; set; }

        /// <summary>
        /// Code of the Facility group
        /// </summary>
        [DataMember]
        public string Code { get; set; }

        /// <summary>
        /// Code of the Facility group
        /// </summary>
        [DataMember]
        public string IconUrl { get; set; }

        /// <summary>
        /// Group Id
        /// </summary>
        [DataMember]
        public string Id { get; set; }

        /// <summary>
        /// Group description
        /// </summary>
        [DataMember]
        public string Description { get; set; }

        /// <summary>
        /// Hotel facility image.
        /// </summary>
        [DataMember]
        public HotelImage Image { get; set; }

        /// <summary>
        /// Group Title
        /// </summary>
        [DataMember]
        public string Title { get; set; }

        /// <summary>
        /// Group facilities
        /// </summary>
        [DataMember]
        public IEnumerable<HotelFacility> Items { get; set; }
    }

    /// <summary>
    /// Hotel facitlity model
    /// </summary>
    [DataContract]
    [Serializable]
    public class HotelFacility
    {
        /// <summary>
        /// Name of the Facility
        /// </summary>
        [DataMember]
        public string Name { get; set; }

        /// <summary>
        /// Code of the Facility
        /// </summary>
        [DataMember]
        public string Code { get; set; }

        /// <summary>
        /// Distance in meters
        /// </summary>
        [DataMember]
        public float? Distance { get; set; }

        /// <summary>
        /// Facility value (number is string because of CMS API type)
        /// </summary>
        [DataMember]
        public string Number { get; set; }

        /// <summary>
        /// Facility group value
        /// </summary>
        [DataMember]
        public FacilityFilterGroup FacilityFilterGroup { get; set; }

        /// <summary>
        /// Disclaimer Message of the facility
        /// </summary>
        [DataMember]
        public string DisclaimerMessage { get; set; }

        /// <summary>
        /// Indicates that the facility is set as errata message.
        /// </summary>
        [DataMember]
        public bool IsErrataInfo { get; set; }

        /// <summary>
        /// Icon of facility
        /// </summary>
        [DataMember]
        public string Icon { get; set; }

        /// <summary>
        /// Tooltip
        /// </summary>
        [DataMember]
        public string Tooltip { get; set; }
    }

    /// <summary>
    /// Represents hotel Location, e.g. Majorca
    /// </summary>
    [DataContract]
    [Serializable]
    public class HotelLocation : IDestinationDatasource
    {
        /// <summary>
        /// Location Code, e.g. ESMJ
        /// </summary>
        [DataMember(Name = "code")]
        public string Code { get; set; }

        /// <summary>
        /// Location Name, e.g. Majorca
        /// </summary>
        [DataMember(Name = "name")]
        public string Name { get; set; }

        /// <summary>
        /// Location item name
        /// </summary>
        [DataMember(Name = "itemName")]
        public string ItemName { get; set; }

        /// <summary>
        /// Location Name, e.g. /Spain/Majorca
        /// </summary>
        [DataMember(Name = "url")]
        public string Url { get; set; }
    }

    /// <summary>
    /// Represents hotel Country, e.g. Spain
    /// </summary>
    [DataContract]
    [Serializable]
    public class HotelCountry : IDestinationDatasource
    {
        /// <summary>
        /// Country code, e.g. ES
        /// </summary>
        [DataMember(Name = "code")]
        public string Code { get; set; }

        /// <summary>
        /// Country code, e.g. Spain
        /// </summary>
        [DataMember(Name = "name")]
        public string Name { get; set; }

        /// <summary>
        /// Country item name
        /// </summary>
        [DataMember(Name = "itemName")]
        public string ItemName { get; set; }

        /// <summary>
        /// Country url, e.g. /Spain
        /// </summary>
        [DataMember(Name = "url")]
        public string Url { get; set; }
    }

    /// <summary>
    /// Represents hotel Resort, e.g. Alcudia
    /// </summary>
    [DataContract]
    [Serializable]
    public class HotelResort : IDestinationDatasource
    {
        /// <summary>
        /// Resort code, e.g. ESMJAL
        /// </summary>
        [DataMember(Name = "code")]
        public string Code { get; set; }

        /// <summary>
        /// Resort name, e.g. Alcudia
        /// </summary>
        [DataMember(Name = "name")]
        public string Name { get; set; }

        /// <summary>
        /// Item name
        /// </summary>
        [DataMember(Name = "itemName")]
        public string ItemName { get; set; }

        /// <summary>
        /// Resort name, e.g. /Spain/Majorca/Alcudia
        /// </summary>
        [DataMember(Name = "url")]
        public string Url { get; set; }
    }

    [DataContract]
    [Serializable]
    public class OfferHotel
    {
        /// <summary>
        /// Hotel name
        /// </summary>
        [DataMember(Name = "name")]
        public string Name { get; set; }

        /// <summary>
        /// Short description
        /// </summary>
        [DataMember(Name = "strapline")]
        public string Strapline { get; set; }

        /// <summary>
        /// Description
        /// </summary>
        [DataMember(Name = "description")]
        public string Description { get; set; }

        /// <summary>
        /// Rating in Atcom stars
        /// </summary>
        [DataMember]
        public string StarRating { get; set; }

        /// <summary>
        /// TripAdvisor rating
        /// </summary>
        [DataMember(Name = "rating")]
        public double TripAdvisorRating { get; set; }

        /// <summary>
        /// TripAdvisor reviews count
        /// </summary>
        [DataMember]
        public int NumberOfReviews { get; set; }

        /// <summary>
        /// Longitude of the hotel
        /// </summary>
        [DataMember]
        public string Longitude { get; set; }

        /// <summary>
        /// Latitude of the hotel
        /// </summary>
        [DataMember]
        public string Latitude { get; set; }

        /// <summary>
        /// All address details of the hotel
        /// </summary>
        [DataMember]
        public FullHotelAddress FullHotelAddress { get; set; }

        /// <summary>
        /// Address of the hotel
        /// </summary>
        [DataMember]
        public string Address { get; set; }

        /// <summary>
        /// City of the hotel
        /// </summary>
        [DataMember(Name = "city")]
        public string City { get; set; }

        /// <summary>
        /// Hotel post code
        /// </summary>
        [DataMember]
        public string PostalCode { get; set; }

        /// <summary>
        /// Website URL of the hotel or the chain
        /// </summary>
        [DataMember]
        public string Website { get; set; }

        /// <summary>
        /// Hotel contact email
        /// </summary>
        [DataMember]
        public string Email { get; set; }

        /// <summary>
        /// Hotel booking phone
        /// </summary>
        [DataMember]
        public string BookingPhone { get; set; }

        /// <summary>
        /// Hotel management phone
        /// </summary>
        [DataMember]
        public string ManagementPhone { get; set; }

        /// <summary>
        /// Hotel contact phone
        /// </summary>
        [DataMember]
        public string HotelPhone { get; set; }

        /// <summary>
        /// Hotel fax number
        /// </summary>
        [DataMember]
        public string FaxNumber { get; set; }

        /// <summary>
        /// Hotel Images
        /// </summary>
        [DataMember(Name = "images")]
        public IEnumerable<HotelImage> Images { get; set; }

        /// <summary>
        /// Room Types, avaialbel at this Hotel
        /// </summary>
        [DataMember(Name = "roomTypes")]
        public List<RoomType> RoomTypes { get; set; }

        /// <summary>
        /// Board Types available at this hotel
        /// </summary>
        [DataMember(Name = "boardTypes")]
        public List<BoardType> BoardTypes { get; set; }

        /// <summary>
        /// Airports nearby, available as a transportation option for this hotel
        /// </summary>
        [DataMember(Name = "airports")]
        public List<string> Airports { get; set; }

        /// <summary>
        /// List of facilities, amenities and installations in the room of the hotel
        /// </summary>
        [DataMember]
        public IEnumerable<HotelFacilityGroup> Facilities { get; set; }

        /// <summary>
        /// List of errata facilities
        /// </summary>
        [DataMember]
        public IEnumerable<HotelFacility> ErrataFacilities { get; set; }

        /// <summary>
        /// Closest facility
        /// </summary>
        [DataMember]
        public HotelFacility ClosestFacility { get; set; }

        /// <summary>
        /// Eco facility
        /// </summary>
        [DataMember]
        public HotelFacility EcoFacility { get; set; }

        /// <summary>
        /// Hotel Country
        /// </summary>
        [DataMember(Name = "country")]
        public HotelCountry Country { get; set; }

        /// <summary>
        /// Hotel Location
        /// </summary>
        [DataMember(Name = "location")]
        public HotelLocation Location { get; set; }

        /// <summary>
        /// Hotel Resort
        /// </summary>
        [DataMember(Name = "resort")]
        public HotelResort Resort { get; set; }

        /// <summary>
        /// First key selling point
        /// </summary>
        [DataMember(Name = "ksp1")]
        public string KeySellingPoint1 { get; set; }

        /// <summary>
        /// Second key selling point
        /// </summary>
        [DataMember(Name = "ksp2")]
        public string KeySellingPoint2 { get; set; }

        /// <summary>
        /// Hotel theme - Beach/City/Lake
        /// </summary>
        [DataMember(Name = "theme")]
        public PackageTheme Theme { get; set; }

        /// <summary>
        /// Hotel type - Adults/Family/Luxury from atcom
        /// </summary>
        [DataMember(Name = "type")]
        public ThemeType Type { get; set; }

        /// <summary>
        /// Hotel type - Adults/Family/Luxury from facility matrix in sitecore
        /// </summary>
        [DataMember(Name = "hotelType")]
        public ThemeType HotelType { get; set; }

        /// <summary>
        /// Hotel tripAdvisor id
        /// </summary>
        [DataMember(Name = "tripAdvisorId")]
        public string TripAdvisorId { get; set; }

        /// <summary>
        /// Is hotel Great Deal
        /// </summary>
        [DataMember(Name = "isGreatDeal")]
        public bool IsGreatDeal { get; set; }

        /// <summary>
        /// fallback-sensitive Language of the CMS hotel
        /// </summary>
        [DataMember(Name = "languageOfHotel")]
        public string LanguageOfHotel { get; set; }

        /// <summary>
        /// Hotel Url of the CMS hotel
        /// </summary>
        [DataMember(Name = "url")]
        public string Url { get; set; }

        /// <summary>
        /// Hotel Youtube Video Id
        /// </summary>
        [DataMember(Name = "youtubeVideoId")]
        public string YoutubeVideoId { get; set; }

        /// <summary>
        /// Hotel Video Placeholder Image Url
        /// </summary>
        [DataMember(Name = "videoPlaceholder")]
        public string VideoPlaceholder { get; set; }
        
        /// <summary>
        /// Hotel Cloudinary Video Id
        /// </summary>
        [DataMember(Name = "cloudinaryVideoSrc")]
        public string CloudinaryVideoSrc { get; set; }

        /// <summary>
        /// Hotel's Giata code
        /// </summary>
        [DataMember(Name = "giataCode")]
        public string GiataCode { get; internal set; }
        
        /// <summary>
        /// Hotel Promo collections configured in CMS
        /// </summary>
        [DataMember(Name = "promoCollections")]
        public IEnumerable<string> PromoCollections { get; set; }
    }

    /// <summary>
    /// All address details of the hotel
    /// </summary>
    [DataContract]
    [Serializable]
    public class FullHotelAddress
    {
        /// <summary>
        /// street
        /// </summary>
        [DataMember]
        public string Street { get; set; }

        /// <summary>
        /// PostalCode
        /// </summary>
        [DataMember]
        public string PostalCode { get; set; }

        /// <summary>
        /// City
        /// </summary>
        [DataMember]
        public string City { get; set; }

        /// <summary>
        /// Region
        /// </summary>
        [DataMember]
        public string Region { get; set; }

        /// <summary>
        /// Country Code
        /// </summary>
        [DataMember]
        public string CountryCode { get; set; }
        /// <summary>
        /// Country name
        /// </summary>
        [DataMember]
        public string Country { get; set; }
    }

    /// <summary>
    /// Route pax
    /// </summary>
    [DataContract]
    public class RoutePax
    {
        /// <summary>
        /// Pax id
        /// </summary>
        [DataMember(Name = "paxId")]
        public string PaxId { get; set; }

        /// <summary>
        /// External PNR
        /// </summary>
        [DataMember(Name = "externalPNR")]
        public string ExternalPNR { get; set; }

        /// <summary>
        /// Selected seat
        /// </summary>
        [DataMember(Name = "seat")]
        public string Seat { get; set; }
    }

    /// <summary>
    /// Flight direction
    /// </summary>
    [DataContract]
    public enum Direction
    {
        /// <summary>
        /// Outbound flight
        /// </summary>
        [EnumMember(Value = "outbound")]
        Outbound,

        /// <summary>
        /// Inbound flight
        /// </summary>
        [EnumMember(Value = "inbound")]
        Inbound
    }

    /// <summary>
    /// Hotel images model
    /// </summary>
    [DataContract]
    public class HotelImage
    {
        /// <summary>
        /// Gets or sets small Image size url
        /// </summary>
        [DataMember]
        public string Small { get; set; }

        /// <summary>
        /// Gets or sets medium Image size url
        /// </summary>
        [DataMember]
        public string Medium { get; set; }

        /// <summary>
        /// Gets or sets large Image size url
        /// </summary>
        [DataMember]
        public string Large { get; set; }

        /// <summary>
        /// Gets or sets large Image description
        /// </summary>
        [DataMember]
        public string Description { get; set; }
    }
}
