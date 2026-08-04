using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.RoomVariants;
using easyJet.Holidays.Api.Domain.Data.Payment;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Services.Market;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System.Diagnostics.CodeAnalysis;
using System.Globalization;

namespace easyJet.Holidays.Api.Domain.Monitoring.Analytics;

/// <summary>
/// Implementation of the analytics service
/// </summary>
[ExcludeFromCodeCoverage]
public class OtelAnalyticsService : IOtelAnalyticsService
{
    private readonly IKafkaAnalyticsService _kafkaAnalytics;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<OtelAnalyticsService> _logger;
    private readonly IMarketService _marketService;

    /// <summary>
    /// Creates a new instance of the analytics service
    /// </summary>
    public OtelAnalyticsService(
        IKafkaAnalyticsService kafkaAnalytics,
        IHttpContextAccessor httpContextAccessor,
        ILogger<OtelAnalyticsService> logger, IMarketService marketService)
    {
        _kafkaAnalytics = kafkaAnalytics ?? throw new ArgumentNullException(nameof(kafkaAnalytics));
        _httpContextAccessor = httpContextAccessor ?? throw new ArgumentNullException(nameof(httpContextAccessor));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _marketService = marketService ?? throw new ArgumentNullException(nameof(marketService));
    }

    #region Public Event Tracking Methods

    /// <summary>
    /// Tracks a new booking event
    /// </summary>
    public Task TrackNewBookingAsync(BookingRequest request)
    {
        return TrackEventAsync(MetricConstants.WebNewBookingTotal, builder => 
        {
            // Add booking-specific properties
            AddBookingProperties(builder, request);
            AddOfferProperties(builder, request.Offer);
            AddGuestProperties(builder, request.Guests);
            AddTransportProperties(builder, request.Offer?.Transport);
            AddPaymentProperties(builder, request.PaymentInfo);
            AddDeviceProperties(builder, request.BrowserInfo);
            
            // Add session information if available
            builder.WithPropertyIfNotEmpty(AnalyticsPropertyNames.SessionId, request.SessionId)
                .WithProperty(AnalyticsPropertyNames.MarketCode, _marketService.GetCurrentMarket()?.Code);
        });
    }

    /// <summary>
    /// Tracks a booking amendment event (amend/commit)
    /// </summary>
    public Task TrackAmendBookingAsync(AmendBookingRequest request, BookingResponse response, string amendmentType)
    {
        return TrackEventAsync(MetricConstants.WebAmendBookingTotal, builder =>
        {
            builder.WithPropertyIfNotEmpty(AnalyticsPropertyNames.AmendmentType, amendmentType)
                .WithProperty(AnalyticsPropertyNames.MarketCode, _marketService.GetCurrentMarket()?.Code);

            // Amendment-specific input comes from the request
            if (request != null)
            {
                builder.WithPropertyIfNotEmpty(AnalyticsPropertyNames.BookingReference, request.BookingReference)
                    .WithPropertyIfNotEmpty(AnalyticsPropertyNames.SessionId, request.SessionId);
                AddPaymentProperties(builder, request.PaymentInfo);
                AddDeviceProperties(builder, request.BrowserInfo);
            }

            // Resulting booking state provides consistent accommodation/guest/transport info
            if (response != null)
            {
                AddBookingResponseAccommodationProperties(builder, response);
                AddGuestProperties(builder, response.Guests);
                AddTransportProperties(builder, response.Package?.Transport);
            }
        });
    }

    /// <summary>
    /// Tracks search type discrepancy events when no offers are returned but search price was available
    /// </summary>
    /// <param name="request">Accommodation offer request</param>
    public Task TrackSearchDiscrepancyAsync(AccommodationOfferRequest request)
    {
        return TrackEventAsync(MetricConstants.WebSearchTypeDiscrepancyNoOffers, builder => 
        {
            // Convert entire request to event data properties
            var requestProperties = ConvertObjectToProperties(request);
            builder.WithProperties(requestProperties);
        });
    }

    /// <summary>
    /// Tracks price jump events when the price changes between search results and hotel details
    /// </summary>
    /// <param name="request">Accommodation offer request</param>
    /// <param name="response">The first offer from the response</param>
    public Task TrackPriceJumpSearchResultsDetailsAsync(AccommodationOfferRequest request, AccommodationOffersResponse response)
    {
        if (response != null && request != null)
        {
            var priceDifference = response.Offers[0].Price - request.SearchPrice.GetValueOrDefault();
        
            if (priceDifference == 0)
            {
                return Task.CompletedTask;
            }

            return TrackEventAsync(MetricConstants.WebPriceJumpSearchDetailsTotal, builder => 
            {
                // Convert entire request to event data properties
                var requestProperties = ConvertObjectToProperties(request);
                builder.WithProperties(requestProperties);
            
                // Add specific price change properties
                var direction = priceDifference > 0 ? "increase" : "decrease";
                builder.WithProperty(AnalyticsPropertyNames.AccommodationCode, response.Offers[0].Accom?.Code)
                    .WithProperty(AnalyticsPropertyNames.PriceChangeDirection, direction)
                    .WithProperty(AnalyticsPropertyNames.PriceDifference, Math.Abs(priceDifference))
                    .WithProperty(AnalyticsPropertyNames.OldPrice, request.SearchPrice.GetValueOrDefault())
                    .WithProperty(AnalyticsPropertyNames.NewPrice, response.Offers[0].Price);
            
                // Calculate percentage change
                if (request.SearchPrice.GetValueOrDefault() > 0)
                {
                    var percentageChange = Math.Round(priceDifference / request.SearchPrice.GetValueOrDefault() * 100, 2);
                    builder.WithProperty(AnalyticsPropertyNames.PercentageChange, percentageChange);
                }
            
                // Add currency if available
                builder.WithPropertyIfNotEmpty(AnalyticsPropertyNames.Currency, response.Offers[0].Currency?.Code);
            });
        }
        return Task.CompletedTask;
    }

    /// <summary>
    /// Tracks scenarios where NO_TRANSFER is more expensive than other transfer options
    /// </summary>
    /// <param name="offer">The offer containing accommodation and transport details</param>
    public Task TrackExpensiveNoTransferAsync(Offer offer)
    {
        return TrackEventAsync(MetricConstants.WebPaidSelfTransferTotal, builder => 
        {
            AddOfferProperties(builder, offer);
            AddAirportProperties(builder, offer.Transport);
            AddOccupancyProperties(builder, offer.Accom?.Unit?.FirstOrDefault()?.Occupation);
        });
    }

    /// <summary>
    /// Tracks hotels that are not found in the CMS
    /// </summary>
    /// <param name="hotelCode">Hotel code not found in the CMS</param>
    public Task TrackHotelNotInCmsAsync(string hotelCode)
    {
        return TrackEventAsync(MetricConstants.WebHotelsNotInCmsTotal, builder => 
        {
            builder.WithPropertyIfNotEmpty(AnalyticsPropertyNames.AccommodationCode, hotelCode);
        });
    }

    /// <summary>
    /// Tracks booking availability validation metrics
    /// </summary>
    public Task TrackAvailabilityMetricsAsync(ValidateBookingRequest request, string errorReason, string status)
    {
        return TrackEventAsync(MetricConstants.WebPackageAvailabilityCheckTotal, builder => 
        {
            AddOfferProperties(builder, request.Offer);
            AddGuestProperties(builder, request.Guests);
            AddTransportProperties(builder, request.Offer?.Transport);
            builder.WithPropertyIfNotEmpty("error_reason", errorReason)
                .WithPropertyIfNotEmpty("status", status)
                .WithProperty(AnalyticsPropertyNames.MarketCode, _marketService.GetCurrentMarket()?.Code);
        });
    }
    
    /// <summary>
    /// Tracks booking availability validation failures caused by price jumps between search cache and VRP
    /// </summary>
    public Task TrackPriceJumpAvailabilityMetricsAsync(ValidateBookingRequest request, string errorReason, string status, decimal vrpPrice, decimal vrpPricePp)
    {
        return TrackEventAsync(MetricConstants.WebPackageAvailabilityCheckTotal, builder => 
        {
            AddOfferProperties(builder, request.Offer);
            AddGuestProperties(builder, request.Guests);
            AddTransportProperties(builder, request.Offer?.Transport);
            
            // Get cached prices from request
            var cachePrice = request.Offer?.PriceExcludingTouristTax ?? 0;
            var cachePricePp = request.Offer?.PricePPExcludingTouristTax ?? 0;
            
            // Calculate price differences
            var priceDifference = vrpPrice - cachePrice;
            var priceDifferencePp = vrpPricePp - cachePricePp;
            var direction = priceDifference > 0 ? "increase" : "decrease";
            
            builder.WithPropertyIfNotEmpty("error_reason", errorReason)
                .WithPropertyIfNotEmpty("status", status)
                .WithProperty("vrp_price", vrpPrice)
                .WithProperty("vrp_price_pp", vrpPricePp)
                .WithProperty(AnalyticsPropertyNames.PreviousPrice, cachePrice)
                .WithProperty(AnalyticsPropertyNames.PriceJumpAmount, Math.Abs(priceDifference))
                .WithProperty(AnalyticsPropertyNames.PriceChangeDirection, direction)
                .WithProperty(AnalyticsPropertyNames.MarketCode, _marketService.GetCurrentMarket()?.Code);
            
            // Add cache price per person if it exists
            if (cachePricePp > 0)
            {
                builder.WithProperty("cache_price_pp", cachePricePp)
                    .WithProperty("price_jump_amount_pp", Math.Abs(priceDifferencePp));
            }
            
            // Calculate percentage change if cache price exists
            if (cachePrice > 0)
            {
                var percentageChange = Math.Round(priceDifference / cachePrice * 100, 2);
                builder.WithProperty(AnalyticsPropertyNames.PercentageChange, percentageChange);
            }
        });
    }
    
    /// <summary>
    /// Tracks promo code validation (success or failure)
    /// </summary>
    public Task TrackPromoCodeValidationAsync(ValidateBookingRequest request, bool isSuccess, string errorSource = null)
    {
        return TrackEventAsync(MetricConstants.WebPromoCodeValidationTotal, builder => 
        {
            AddOfferProperties(builder, request.Offer);
            AddGuestProperties(builder, request.Guests);
            AddTransportProperties(builder, request.Offer?.Transport);
            
            var status = isSuccess ? MetricConstants.SuccessMetricStatus : MetricConstants.FailureMetricStatus;
            
            builder.WithPropertyIfNotEmpty(AnalyticsPropertyNames.PromoCode, request.DiscountCode)
                .WithProperty(AnalyticsPropertyNames.ValidationStatus, status);
            
            // Add error source for failures
            if (!isSuccess && !string.IsNullOrEmpty(errorSource))
            {
                builder.WithProperty(AnalyticsPropertyNames.ErrorSource, errorSource);
            }
        });
    }

    #endregion

    #region Private Helper Methods

    /// <summary>
    /// Generic event tracking method to handle common pattern
    /// </summary>
    private async Task TrackEventAsync(string eventType, Action<AnalyticsEventBuilder> configureBuilder)
    {
        try
        {
            var builder = new AnalyticsEventBuilder()
                .WithEventType(eventType)
                .WithCorrelationId(GetCorrelationId());
                
            // Call the configuration action
            configureBuilder(builder);
            
            // Add common context properties
            AddContextProperties(builder);
            
            var analyticsEvent = builder.Build();
            
            // Send to default logger to get forwarded to Splunk logs
#pragma warning disable CA2254 // In this specific case we don't want to have message formatted as structured log, because Splunk needs to get raw JSON as body
            _logger.LogInformation(JsonConvert.SerializeObject(analyticsEvent));
#pragma warning restore CA2254
            
            // Send to Kafka to get logged into separate index in ELK
            await _kafkaAnalytics.SendEventAsync(analyticsEvent);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error tracking {EventType} event", eventType);
        }
    }

    private string GetCorrelationId()
    {
        return _httpContextAccessor.HttpContext?.TraceIdentifier ?? Guid.NewGuid().ToString();
    }

    private void AddContextProperties(AnalyticsEventBuilder builder)
    {
        if (_httpContextAccessor.HttpContext == null) return;
        
        var httpContext = _httpContextAccessor.HttpContext;

        // Add IP address
        if (httpContext.Connection.RemoteIpAddress != null)
        {
            builder.WithProperty(AnalyticsPropertyNames.UserIp, httpContext.Connection.RemoteIpAddress.ToString());
        }

        // Add user agent and referer
        builder.WithPropertyIfHeaderExists(httpContext, "User-Agent", AnalyticsPropertyNames.UserAgent)
               .WithPropertyIfHeaderExists(httpContext, "Referer", AnalyticsPropertyNames.Referer);
    }

    /// <summary>
    /// Add booking-specific properties to the event
    /// </summary>
    private static void AddBookingProperties(AnalyticsEventBuilder builder, BookingRequest request)
    {
        if (request == null) return;
        
        builder.WithPropertyIfNotEmpty(AnalyticsPropertyNames.BookingReference, request.BookingReference)
               .WithPropertyIfNotEmpty(AnalyticsPropertyNames.SessionId, request.SessionId);
    }

    /// <summary>
    /// Add offer properties to the event
    /// </summary>
    private static void AddOfferProperties(AnalyticsEventBuilder builder, Offer offer)
    {
        if (offer == null) return;
        
        // Add accommodation details
        if (offer.Accom != null)
        {
            builder.WithPropertyIfNotEmpty(AnalyticsPropertyNames.AccommodationCode, offer.Accom.Code)
                .WithPropertyIfNotEmpty(AnalyticsPropertyNames.AccommodationSource,
                    HotelExtensions.GetHotelType(offer.Accom.Code))
                .WithPropertyIfNotEmpty(AnalyticsPropertyNames.HotelName, offer.Hotel?.Name);
            
            // Add room and board information for the first unit
            if (offer.Accom.Unit is { Count: > 0 })
            {
                builder.WithProperty(AnalyticsPropertyNames.RoomTypes, string.Join("|", offer.Accom.Unit.Select(u => u.Code)));
                builder.WithProperty(AnalyticsPropertyNames.BoardTypes, string.Join("|", offer.Accom.Unit.Select(u => u.Board)));
            }
        }
        
        // Add price information
        builder.WithProperty(AnalyticsPropertyNames.TotalPrice, offer.Price)
               .WithPropertyIfNotEmpty(AnalyticsPropertyNames.Currency, offer.Currency?.Code);
        
        // Add date and duration
        if (offer.Date.HasValue)
        {
            builder.WithProperty(AnalyticsPropertyNames.StartDate, offer.Date.Value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture))
                   .WithProperty(AnalyticsPropertyNames.Duration, offer.Stay);
        }
        
        // Add location information
        if (offer.Location != null)
        {
            builder.WithPropertyIfNotEmpty(AnalyticsPropertyNames.Country, offer.Location.Country)
                   .WithPropertyIfNotEmpty(AnalyticsPropertyNames.Region, offer.Location.Region);
        }
    }

    /// <summary>
    /// Add accommodation/price/location properties from an amended booking response
    /// </summary>
    private static void AddBookingResponseAccommodationProperties(AnalyticsEventBuilder builder, BookingResponse response)
    {
        var accom = response.Package?.Accom;
        if (accom != null)
        {
            builder.WithPropertyIfNotEmpty(AnalyticsPropertyNames.AccommodationCode, accom.Code)
                .WithPropertyIfNotEmpty(AnalyticsPropertyNames.AccommodationSource, HotelExtensions.GetHotelType(accom.Code))
                .WithPropertyIfNotEmpty(AnalyticsPropertyNames.HotelName, accom.Hotel?.Name)
                .WithPropertyIfNotEmpty(AnalyticsPropertyNames.StartDate, accom.StartDate);

            if (accom.Rooms is { Count: > 0 })
            {
                builder.WithProperty(AnalyticsPropertyNames.RoomTypes, string.Join("|", accom.Rooms.Select(u => u.Code)));
                builder.WithProperty(AnalyticsPropertyNames.BoardTypes, string.Join("|", accom.Rooms.Select(u => u.Board)));
            }
        }

        builder.WithProperty(AnalyticsPropertyNames.TotalPrice, response.PaymentInfo?.TotalPrice)
            .WithPropertyIfNotEmpty(AnalyticsPropertyNames.Currency, response.Currency?.Code);

        if (response.Package?.Location != null)
        {
            builder.WithPropertyIfNotEmpty(AnalyticsPropertyNames.Country, response.Package.Location.Country)
                .WithPropertyIfNotEmpty(AnalyticsPropertyNames.Region, response.Package.Location.Region);
        }
    }

    /// <summary>
    /// Add guest information to the event
    /// </summary>
    private static void AddGuestProperties(AnalyticsEventBuilder builder, List<PersonWithDetails> guests)
    {
        if (guests == null) return;
        
        int adultsCount = guests.Count(g => g.Type == PersonType.Adult);
        int childrenCount = guests.Count(g => g.Type == PersonType.Child);
        int infantsCount = guests.Count(g => g.Type == PersonType.Infant);
        
        builder.WithProperty(AnalyticsPropertyNames.AdultsCount, adultsCount)
            .WithProperty(AnalyticsPropertyNames.ChildrenCount, childrenCount)
            .WithProperty(AnalyticsPropertyNames.InfantsCount, infantsCount);
    }
    
    /// <summary>
    /// Add guest information to the event
    /// </summary>
    private static void AddGuestProperties(AnalyticsEventBuilder builder, List<Person> guests)
    {
        if (guests == null) return;
        
        int adultsCount = guests.Count(g => g.Type == PersonType.Adult);
        int childrenCount = guests.Count(g => g.Type == PersonType.Child);
        int infantsCount = guests.Count(g => g.Type == PersonType.Infant);
        
        builder.WithProperty(AnalyticsPropertyNames.AdultsCount, adultsCount)
            .WithProperty(AnalyticsPropertyNames.ChildrenCount, childrenCount)
            .WithProperty(AnalyticsPropertyNames.InfantsCount, infantsCount);
    }

    /// <summary>
    /// Add transport properties to the event
    /// </summary>
    private static void AddTransportProperties(AnalyticsEventBuilder builder, Transport transport)
    {
        if (transport?.Routes == null || transport.Routes.Count == 0) return;
        
        var outboundFlight = transport.Routes.FirstOrDefault(r => r.Direction == 0);
        
        if (outboundFlight != null)
        {
            builder.WithPropertyIfNotEmpty(AnalyticsPropertyNames.DepartureAirport, outboundFlight.DepPt)
                   .WithPropertyIfNotEmpty(AnalyticsPropertyNames.ArrivalAirport, outboundFlight.ArrPt);
        }
    }

    /// <summary>
    /// Add airport information to the event
    /// </summary>
    private static void AddAirportProperties(AnalyticsEventBuilder builder, Transport transport)
    {
        if (transport?.Routes == null || transport.Routes.Count == 0) return;
        
        var arrivalAirport = transport.Routes.FirstOrDefault()?.ArrPt;
        builder.WithPropertyIfNotEmpty(AnalyticsPropertyNames.ArrivalAirport, arrivalAirport);
    }

    /// <summary>
    /// Add occupancy information to the event
    /// </summary>
    private static void AddOccupancyProperties(AnalyticsEventBuilder builder, Occupation occupation)
    {
        if (occupation == null) return;
        
        builder.WithProperty(AnalyticsPropertyNames.AdultsCount, occupation.Adults)
               .WithProperty(AnalyticsPropertyNames.ChildrenCount, occupation.Children)
               .WithProperty(AnalyticsPropertyNames.InfantsCount, occupation.Infants);
    }

    /// <summary>
    /// Add payment information to the event
    /// </summary>
    private static void AddPaymentProperties(AnalyticsEventBuilder builder, PaymentInfo paymentInfo)
    {
        if (paymentInfo == null) return;
        
        builder.WithProperty(AnalyticsPropertyNames.PaymentMethod, paymentInfo.CardType.ToString())
               .WithProperty(AnalyticsPropertyNames.PaymentAmount, paymentInfo.Amount);
    }

    /// <summary>
    /// Add device information to the event
    /// </summary>
    private static void AddDeviceProperties(AnalyticsEventBuilder builder, BrowserInfo browserInfo)
    {
        if (browserInfo == null) return;
        
        string deviceType = DetermineDeviceType(browserInfo);
        builder.WithProperty(AnalyticsPropertyNames.DeviceType, deviceType);
    }

    /// <summary>
    /// Determine device type from browser info
    /// </summary>
    private static string DetermineDeviceType(BrowserInfo browserInfo)
    {
        // Try to determine device type from screen resolution
        if (browserInfo.ScreenWidth >= 1024 && browserInfo.ScreenHeight >= 768)
        {
            return "desktop";
        }
        if (browserInfo.ScreenWidth >= 768)
        {
            return "tablet";
        }
        if (browserInfo.ScreenWidth > 0)
        {
            return "mobile";
        }
        
        return "unknown";
    }

    /// <summary>
    /// Converts an object to a dictionary of property name/value pairs
    /// </summary>
    private Dictionary<string, object> ConvertObjectToProperties(object obj)
    {
        var result = new Dictionary<string, object>();
        
        if (obj == null)
        {
            return result;
        }
        
        try
        {
            // Get all properties of the object
            var properties = obj.GetType().GetProperties();
            
            foreach (var property in properties)
            {
                try
                {
                    // Get property value
                    var value = property.GetValue(obj);
                    
                    if (value != null)
                    {
                        // Convert property name to snake_case for consistency
                        var propertyName = ConvertToSnakeCase(property.Name);
                        
                        // Add to dictionary
                        result[propertyName] = value;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to get property {PropertyName}", property.Name);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to convert object to properties");
        }
        
        return result;
    }

    /// <summary>
    /// Converts a PascalCase string to snake_case
    /// </summary>
    private static string ConvertToSnakeCase(string input)
    {
        // Try to get a predefined analytics property name first
        var predefinedName = GetPredefinedPropertyName(input);
        if (predefinedName != null)
        {
            return predefinedName;
        }
        
        // Otherwise, convert PascalCase to snake_case
        if (string.IsNullOrEmpty(input))
        {
            return input;
        }
        
        var result = new System.Text.StringBuilder();
        
        for (int i = 0; i < input.Length; i++)
        {
            if (i > 0 && char.IsUpper(input[i]))
            {
                result.Append('_');
            }
            
            result.Append(char.ToLowerInvariant(input[i]));
        }
        
        return result.ToString();
    }

    /// <summary>
    /// Gets a predefined analytics property name if it exists
    /// </summary>
    private static string GetPredefinedPropertyName(string propertyName)
    {
        var analyticsPropertyInfo = typeof(AnalyticsPropertyNames).GetFields(
            System.Reflection.BindingFlags.Public | 
            System.Reflection.BindingFlags.Static);
        
        foreach (var field in analyticsPropertyInfo)
        {
            // If property name matches a constant in AnalyticsPropertyNames, use that value
            if (field.Name == propertyName && field.GetValue(null) is string value)
            {
                return value;
            }
        }
        
        return null;
    }

    #endregion
}

/// <summary>
/// Extensions for the AnalyticsEventBuilder to make code more concise
/// </summary>
///
[ExcludeFromCodeCoverage]
public static class AnalyticsEventBuilderExtensions
{
    /// <summary>
    /// Adds a property if the string value is not null or empty
    /// </summary>
    public static AnalyticsEventBuilder WithPropertyIfNotEmpty(
        this AnalyticsEventBuilder builder, 
        string name, 
        string value)
    {
        if (!string.IsNullOrEmpty(value))
        {
            builder?.WithProperty(name, value);
        }
        return builder;
    }
    
    /// <summary>
    /// Adds a property from an HTTP header if the header exists
    /// </summary>
    public static AnalyticsEventBuilder WithPropertyIfHeaderExists(
        this AnalyticsEventBuilder builder,
        HttpContext httpContext,
        string headerName,
        string propertyName)
    {
        if (httpContext != null && httpContext.Request.Headers.TryGetValue(headerName, out var headerValue))
        {
            builder?.WithProperty(propertyName, headerValue.ToString());
        }
        return builder;
    }
}