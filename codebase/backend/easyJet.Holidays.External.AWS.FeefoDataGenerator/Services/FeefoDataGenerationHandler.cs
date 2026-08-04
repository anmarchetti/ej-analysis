using Amazon.SQS;
using Amazon.SQS.Model;
using easyJet.Holidays.Api.Domain.Data.Eskel;
using easyJet.Holidays.Api.Domain.Interfaces.Eskel;
using easyJet.Holidays.Api.Domain.Interfaces.Hotels;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.External.AWS.FeefoDataGenerator.Settings;
using easyJet.Holidays.External.Feefo.Models.EnterSale;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Globalization;
using System.Runtime.CompilerServices;
using CollectionExtensions = easyJet.Holidays.Api.Domain.Extensions.CollectionExtensions;
using Hotel = easyJet.Holidays.Api.Domain.Data.Hotels.Hotel;

[assembly: InternalsVisibleTo("easyJet.Holidays.External.AWS.FeefoDataGenerator.Tests")]
namespace easyJet.Holidays.External.AWS.FeefoDataGenerator.Services;

/// <inheritdoc cref="IFeefoDataGenerationHandler"/>
public class FeefoDataGenerationHandler : IFeefoDataGenerationHandler
{
    private readonly IEskelService _bookingsService;
    private readonly IHotelsService _hotelSearchService;
    private readonly IAmazonSQS _sqsClient;
    private readonly ILogger<FeefoDataGenerationHandler> _logger;
    private readonly MarketingSettings _marketingSettings;
    private readonly LambdaSettings _lambdaSettings;
    private readonly FeefoApiSettings _feefoApiSettings;

    /// <summary>
    /// standard ctor
    /// </summary>
    public FeefoDataGenerationHandler(
        IEskelService bookingsService,
        IHotelsService hotelSearchService,
        IAmazonSQS sqsClient,
        ILogger<FeefoDataGenerationHandler> logger,
        IOptions<MarketingSettings> marketingOptions,
        IOptions<LambdaSettings> lambdaOptions,
        IOptions<FeefoApiSettings> feefoApiOptions)
    {
        _bookingsService = bookingsService;
        _hotelSearchService = hotelSearchService;
        _sqsClient = sqsClient;
        _logger = logger;

        ArgumentNullException.ThrowIfNull(marketingOptions);
        _marketingSettings = marketingOptions.Value;

        ArgumentNullException.ThrowIfNull(lambdaOptions);
        _lambdaSettings = lambdaOptions.Value;

        ArgumentNullException.ThrowIfNull(feefoApiOptions);
        _feefoApiSettings = feefoApiOptions.Value;
    }

    /// <inheritdoc />
    public async Task Generate()
    {
        var bookingDate = DateTime.UtcNow.AddDays(-1);
        var bookings = await _bookingsService.GetBookingsByCreatedDate(bookingDate);

        if (bookings is null or [])
        {
            _logger.LogWarning("There are no bookings landing : {BookingDate}", bookingDate);
            return;
        }

        LogListIfVerboseLog(bookings, "bookings from eskel:");
        var allBookings = FilterInvalidAndCancelledBookings(bookings);

        if (allBookings is [])
        {
            var errorText = $"All bookings created {bookingDate.ToShortDateString()} have been cancelled or have empty customer email!!!";
            throw new InvalidOperationException(errorText);
        }

        var feefoEnterSales = await GetFeefoEnterSales(allBookings);

        foreach (var feefoEnterSale in feefoEnterSales)

        {
            await SendMessageToSqs(feefoEnterSale);
        }

        _logger.LogInformation("All messages sent to SQS queue. Count: {Count} ", feefoEnterSales.Count);
    }

    internal List<Booking> FilterInvalidAndCancelledBookings(Booking[] bookings)
    {
        var allBookings = bookings
            //filter not valid or cancelled bookings 
            .Where(booking => !booking.CancellationDateTime.HasValue && booking.ConfirmedDateTime.HasValue &&
                              !string.IsNullOrWhiteSpace(booking.EmailAddress) &&
                              IsValidBooking(booking) &&
                              HasBookingWebsiteAgentCode(booking))
            .DistinctBy(booking => booking.EmailAddress)
            .ToList();

        return allBookings;
    }
    internal async Task<List<FeefoEnterSale>> GetFeefoEnterSales(List<Booking> allBookings)
    {
        var hotelCodes = allBookings
            .Select(booking =>
            {
                var firstHotel = booking.Hotels?.FirstOrDefault();
                return firstHotel?.Code;
            })
            .Where(hotelCode => !string.IsNullOrEmpty(hotelCode)).Distinct().ToArray();

        LogListIfVerboseLog(hotelCodes, "All Hotel Codes:");

        var hotels = new List<Hotel>(hotelCodes.Length);
        var hotelCodeChunks = CollectionExtensions.Split(hotelCodes, _lambdaSettings.SearchHotelChunkSize);
        foreach (var hotelCodeChunk in hotelCodeChunks)
        {
            var hotelSearchResults = await _hotelSearchService.GetHotelsByCodes(hotelCodeChunk.ToArray(), "en");
            hotels.AddRange(hotelSearchResults);
        }

        LogListIfVerboseLog(hotels, $"All {nameof(hotels)}:");

        var hotelMapping = hotels.ToDictionary(hotel => hotel.Code, hotel => hotel);

        LogListIfVerboseLog(hotelMapping, $"All {nameof(hotelMapping)}:");
        LogListIfVerboseLog(allBookings, $"All {nameof(allBookings)} from eskel:");

        var feefoMerchantIdentifier = _feefoApiSettings.MerchantIdentifier;

        var feefoSales = allBookings // delete duplicates
            .Select(booking => CreateFeefoSale(booking, feefoMerchantIdentifier, hotelMapping))
            .Where(feefoEnterSale => feefoEnterSale != null)
            .ToList();
        return feefoSales;
    }
    internal FeefoEnterSale CreateFeefoSale(
            Booking eskelBooking,
            string feefoMerchantIdentifier,
            Dictionary<string, Hotel> hotelMapping)
    {
        var reservationId = eskelBooking.ReseverationId.ToString(CultureInfo.InvariantCulture);
        var email = eskelBooking.EmailAddress;
        var unsubscribeLink = string.IsNullOrEmpty(email) ? null : GetUnsubscribeLink(email);

        if (string.IsNullOrEmpty(email) || (string.IsNullOrEmpty(reservationId) || eskelBooking.ReseverationId == 0))
        {
            _logger.LogInformation("{EMail} || {ResId} is null or empty", nameof(email), nameof(reservationId));
            return null;
        }

        var eskelHotelCode = eskelBooking.Hotels?.FirstOrDefault()?.Code;
        if (eskelHotelCode == null || (hotelMapping == null || !hotelMapping.TryGetValue(eskelHotelCode, out Hotel hotel)))
        {
            _logger.LogInformation("{EMail} || {ResId} is null or empty or not in the hotelCodeDictionary", nameof(email), nameof(reservationId));
            return null;
        }

        return new FeefoEnterSale()
        {
            Email = email,
            Date = eskelBooking.CreatedDateTime,
            Name = GetName(eskelBooking),
            OrderReference = GetOrderRef(reservationId),
            MerchantIdentifier = feefoMerchantIdentifier,
            Amount = eskelBooking.BookingPrice,
            Currency = "GBP",
            DestinationCountryName = hotel.Country?.Name,
            DestinationRegionName = hotel.Location?.Name,
            ResortName = hotel.Resort?.Name,
            HotelName = hotel.Name,
            PackageType = hotel.HighestPriorityType?.Name ?? string.Empty,
            HotelTheme = hotel.HotelTheme?.Name,
            Description = hotel.Location?.Name,
            ProductSearchCode = hotel.Location?.Code,
            CustomerReference = hotel.Name,
            NumberOfPassengers = eskelBooking.Guests?.Length ?? -1,
            UnsubscribeLink = unsubscribeLink
        };
    }

    internal static string GetName(Booking eskelBooking)
    {
        var leadPassenger = eskelBooking.Guests?.FirstOrDefault(guest => guest.IsLeadPassenger) ?? eskelBooking.Guests?.FirstOrDefault();

        if (leadPassenger == null)
        {
            return null;
        }

        return $"{leadPassenger.Forename} {leadPassenger.Surname}";
    }

    private async Task SendMessageToSqs(FeefoEnterSale feefoEnterSale)
    {
        var jsonBody = JsonConvert.SerializeObject(feefoEnterSale);

        var sendMessageRequest = new SendMessageRequest
        {
            QueueUrl = _lambdaSettings.QueueUrl,
            MessageBody = jsonBody
        };
        await _sqsClient.SendMessageAsync(sendMessageRequest);
    }

    private string GetOrderRef(string reservationID)
    {
        if (!_lambdaSettings.UseDebug)
        {
            return reservationID;
        }

        var guid = Guid.NewGuid();
        return $"{reservationID}_{guid:N}";
    }
    private void LogListIfVerboseLog<T>(IEnumerable<T> objects, string message)
    {
        if (_lambdaSettings.VerboseLog)
        {
            _logger.LogInformation("verbose: {Msg}", message);
            LogObject(objects);
        }
    }
    private void LogObject(object feefoSale)
    {
        try
        {
            _logger.LogInformation("serialized: {Obj}", JsonConvert.SerializeObject(feefoSale));
        }
        catch (Exception e)
        {
            _logger.LogError(e, "Deserialization fails. {Message}", e.Message);
        }
    }
    private static bool IsValidBooking(Booking booking)
    {
        return booking.BookingStatus?.Equals("BKG", StringComparison.OrdinalIgnoreCase) ?? false;
    }
    private bool HasBookingWebsiteAgentCode(Booking booking)
    {
        if (string.IsNullOrEmpty(booking.AgentCode))
            return false;

        return _lambdaSettings.WebsiteAgentCodes.Split(',', StringSplitOptions.RemoveEmptyEntries).Contains(booking.AgentCode);
    }
    private string GetUnsubscribeLink(string email)
    {
        var encryptedEmail = EncryptionUtils.EncryptValue(email, _marketingSettings.EncryptionPassword, _marketingSettings.EncryptionSalt);

        return _marketingSettings.UnsubscribeLink.Replace("{encEmail}", encryptedEmail, StringComparison.OrdinalIgnoreCase) + "&source=feefo";
    }
}