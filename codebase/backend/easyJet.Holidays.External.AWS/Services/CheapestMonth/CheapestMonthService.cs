using Amazon.DynamoDBv2.Model;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Search;
using easyJet.Holidays.Api.Domain.Interfaces.CheapestMonth;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.AWS.Services.CheapestMonth;
/// <summary>
/// CheapestMonthService
/// </summary>
public class CheapestMonthService : ICheapestMonthService
{
    private readonly AwsSettings _awsSettings;
    private readonly AwsClient _awsClient;
    private readonly ILogger<CheapestMonthService> _logger;

    /// <summary>
    /// Initializes a new instance of the <see cref="CheapestMonthService"/> class.
    /// </summary>
    /// <param name="awsClient">The aws client.</param>
    /// <param name="awsSettings">The aws settings.</param>
    /// <param name="logger">The logger.</param>
    public CheapestMonthService(
            AwsClient awsClient,
            IOptions<AwsSettings> awsSettings,
            ILogger<CheapestMonthService> logger)
    {
        _awsSettings = awsSettings != null ? awsSettings.Value : throw new ArgumentNullException(nameof(awsSettings));
        _awsClient = awsClient;
        _logger = logger;
    }

    /// <summary>
    /// Gets the cheapest months.
    /// </summary>
    /// <param name="cheapestMonthRequest">The cheapest month request.</param>
    /// <returns>A Task.</returns>
    public async Task<List<CheapestMonthDetails>> GetCheapestMonths(CheapestMonthRequest cheapestMonthRequest)
    {
        ArgumentNullException.ThrowIfNull(cheapestMonthRequest);

        var lowestOfferDetailsForFirstRange = new CheapestMonthDetails { Price = decimal.MaxValue };
        var lowestOfferDetailsForSecondRange = new CheapestMonthDetails { Price = decimal.MaxValue };

        var airports = cheapestMonthRequest.Airports.Split(',').Select(a => a.Trim()).ToList();
        var destinations = cheapestMonthRequest.Destinations.Split(';').Select(a => a.Trim()).ToList();

        try
        {
            using (var client = _awsClient.GetClient())
            {
                foreach (var airport in airports)
                {
                    var cheapestMonths = new List<Api.Domain.Data.Search.CheapestMonth>();

                    var request = new QueryRequest
                    {
                        TableName = _awsSettings.Storage.Tables.CheapestMonth,
                        KeyConditionExpression = "Airport = :airportValue",
                        ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                        {
                            { ":airportValue", new AttributeValue { S = airport} },
                        }
                    };

                    var response = await client.QueryAsync(request);

                    foreach (var item in response.Items)
                    {
                        var cheapestMonth = MapToCheapestMonth(item);

                        if (cheapestMonth != null)
                            cheapestMonths.Add(cheapestMonth);
                    }

                    var cheapestMonthForSelectedDest = cheapestMonths.Where(c => destinations.Contains(c.Destination)).ToList();

                    var minForAirportFirstRange = cheapestMonthForSelectedDest.MinBy(f => f.Prices.ElementAtOrDefault(0)?.TotalPrice);
                    lowestOfferDetailsForFirstRange = CheckMinPrice(lowestOfferDetailsForFirstRange, minForAirportFirstRange, 0);

                    var minForAirportSecondRange = cheapestMonthForSelectedDest.Where(f => f.Prices.Count > 1).MinBy(f => f.Prices[1].TotalPrice);
                    lowestOfferDetailsForSecondRange = CheckMinPrice(lowestOfferDetailsForSecondRange, minForAirportSecondRange, 1);
                }
            }
            return SetCheapestMonthResponse(lowestOfferDetailsForFirstRange, lowestOfferDetailsForSecondRange);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Was not able to connect to Dynamo DB");
            throw new ApiException(ApiExceptionCodes.SearchCheapestMonthError, [], ex.Message);
        }
    }

    private static Api.Domain.Data.Search.CheapestMonth MapToCheapestMonth(Dictionary<string, AttributeValue> item)
    {
        var prices = item.TryGetValue("Prices", out var pricesAttr) ? pricesAttr.L : throw new KeyNotFoundException("Prices key not found");

        return new Api.Domain.Data.Search.CheapestMonth
        {
            Airport = item.TryGetValue("Airport", out var airportAttr) ? airportAttr.S : throw new KeyNotFoundException("Airport key not found"),
            Destination = item.TryGetValue("Destination", out var destinationAttr) ? destinationAttr.S : throw new KeyNotFoundException("Destination key not found"),
            Prices = prices.Select(l =>
            {
                var monthAttr = l.M.TryGetValue("Month", out var month) ? month : throw new KeyNotFoundException("Month key not found in Prices");
                var yearAttr = l.M.TryGetValue("Year", out var year) ? year : throw new KeyNotFoundException("Year key not found in Prices");
                var priceAttr = l.M.TryGetValue("Price", out var price) ? price : throw new KeyNotFoundException("Price key not found in Prices");
                var pricePPAttr = l.M.TryGetValue("PricePP", out var pricePP) ? pricePP : throw new KeyNotFoundException("PricePP key not found in Prices");

                return 
                new Price
                    {
                        Month = int.TryParse(monthAttr.N, out var monthValue) ? monthValue : throw new FormatException("Month value is not valid int"),
                        Year = int.TryParse(yearAttr.N, out var yearValue) ? yearValue : throw new FormatException("Year value is not valid int"),
                        TotalPrice = decimal.TryParse(priceAttr.N, out var totalPriceValue) ? totalPriceValue : throw new FormatException("Total price value is not valid decimal"),
                        PricePP = decimal.TryParse(pricePPAttr.N, out var pricePPValue) ? pricePPValue : throw new FormatException("Price PP value is not valid decimal"),
                };
            }
            ).ToList()
        };
    }

    private static CheapestMonthDetails CheckMinPrice(CheapestMonthDetails currentMin, Api.Domain.Data.Search.CheapestMonth cheapestMonth, int priceIndex)
    {
        var price = cheapestMonth?.Prices.ElementAtOrDefault(priceIndex);
        if (price != null && currentMin.Price > price.TotalPrice)
        {
            return new CheapestMonthDetails
            {
                AirportCode = cheapestMonth?.Airport,
                Destination = cheapestMonth?.Destination,
                Month = price.Month,
                Year = price.Year,
                Price = price.TotalPrice,
                PricePP = price.PricePP,
            };
        }
        return currentMin;
    }

    private static List<CheapestMonthDetails> SetCheapestMonthResponse(CheapestMonthDetails lowestOfferDetailsForFirstRange, CheapestMonthDetails lowestOfferDetailsForSecondRange)
    {
        var list = new List<CheapestMonthDetails>();
        if (lowestOfferDetailsForFirstRange.Price == decimal.MaxValue)
            return list;
        
        list.Add(lowestOfferDetailsForFirstRange);

        if (lowestOfferDetailsForSecondRange.Price != decimal.MaxValue)
            list.Add(lowestOfferDetailsForSecondRange);

        return list;
    }
}
