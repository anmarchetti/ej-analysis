using Amazon.DynamoDBv2.Model;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Search;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.AWS.Services.CheapestMonth;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using System.Globalization;
using Xunit;

namespace easyJet.Holidays.External.AWS.Tests.Services.CheapestMonth;
public class CheapestMonthServiceTests
{
    private Mock<AwsClient> _awsClientMock;
    private IOptions<AwsSettings> _awsSettings;
    private Mock<ILogger<CheapestMonthService>> _loggerMock;

    private CheapestMonthService _cheapestMonthService;

    public CheapestMonthServiceTests()
    {
        _awsClientMock = new Mock<AwsClient>();
        _awsSettings = Options.Create(new AwsSettings
        {
            Storage = new AwsSettingsStorage
            {
                Tables = new AwsSettingsStorageTables
                {
                    CheapestMonth = "CheapestMonth"
                }
            }
        });
        _loggerMock = new Mock<ILogger<CheapestMonthService>>();

        _cheapestMonthService = new CheapestMonthService(_awsClientMock.Object, _awsSettings, _loggerMock.Object);
    }

    [Fact]
    public async Task GetCheapestMonths_ShouldThrowInvalidOperationException_WhenRequestIsNull()
    {
        //arrange
        CheapestMonthRequest request = null;

        //act
        Func<Task> method = async () => await _cheapestMonthService.GetCheapestMonths(request);

        //assert
        await method.Should()
            .ThrowAsync<ArgumentNullException>();
    }

    [Fact]
    public async Task GetCheapestMonth_ShouldReturnEmptyList_WhenNoDataFound()
    {
        //arrange
        var request = new CheapestMonthRequest
        {
            Airports = "LGW",
            Destinations = "ES,ESTF"
        };

        _awsClientMock.Setup(client => client.GetClient().QueryAsync(It.IsAny<QueryRequest>(), default))
            .ReturnsAsync(new QueryResponse
            {
                Items = new List<Dictionary<string, AttributeValue>>()
            });

        //act
        var result = await _cheapestMonthService.GetCheapestMonths(request);

        //assert
        result.Should().NotBeNull();
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetCheapestMonth_ShouldReturnCheapestMonths_WhenDataIsFound()
    {
        //arrange
        string destination = "FR,FRPA", airportCode = "LGW", price = "1000", pricePP = "500";
        var request = new CheapestMonthRequest
        {
            Airports = airportCode,
            Destinations = destination
        };

        _awsClientMock.Setup(client => client.GetClient().QueryAsync(It.IsAny<QueryRequest>(), default))
            .ReturnsAsync(new QueryResponse
            {
                Items = new List<Dictionary<string, AttributeValue>> { new Dictionary<string, AttributeValue>
                {
                      { "Airport", new AttributeValue() { S = airportCode } },
                      { "Destination", new AttributeValue() { S = destination} },
                      { "UpdatedAt", new AttributeValue(){ S = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture)}},
                      { "Prices", new AttributeValue() { L = new List<AttributeValue>{ new AttributeValue
            {
                M = new Dictionary<string, AttributeValue>
                {
                    { "Month", new AttributeValue() { N = "06"} },
                    { "Year", new AttributeValue() { N = "2026"} },
                    { "Price", new AttributeValue()
                        {
                            N = price
                        }
                    },
                    { "PricePP", new AttributeValue() { N = pricePP} },
                }
            }} }
                }} }
            });

        //act
        var result = await _cheapestMonthService.GetCheapestMonths(request);

        //assert
        result.Should().NotBeNull();
        result.Should().HaveCount(1);
        result[0].AirportCode.Should().Be(airportCode);
        result[0].Destination.Should().Be(destination);
        result[0].Price.Should().Be(decimal.Parse(price));
    }

    [Fact]
    public async Task GetCheapestMonth_ShouldReturnTheCheapestPrice_WhenManyAirportsAndDestinationsSelected()
    {
        //arrange
        //the cheapest for 1st range LGW Paris 1000
        //the cheapest for 2nd range SEN Paris 500
        string destinationParis = "FR,FRPA",
            airportCodeLGW = "LGW", priceLGWParis = "1000", pricePPLGWParis = "500", priceLGWParis2nd = "1000", pricePPLGWParis2nd = "500",
            airportCodeSEN = "SEN", priceSENParis = "2000", pricePPSENParis = "1000", priceSENParis2nd = "500", pricePPSENParis2nd = "250";
            
        var request = new CheapestMonthRequest
        {
            Airports = string.Join(",", airportCodeLGW,airportCodeSEN),
            Destinations = destinationParis
        };

        _awsClientMock.Setup(client => client.GetClient().QueryAsync(It.Is<QueryRequest>(q => q.ExpressionAttributeValues.Values.Any(x => x.S == airportCodeLGW)), default))
            .ReturnsAsync(new QueryResponse
            {
                Items = new List<Dictionary<string, AttributeValue>> { 
                    new Dictionary<string, AttributeValue>
                    {
                      { "Airport", new AttributeValue() { S = airportCodeLGW } },
                      { "Destination", new AttributeValue() { S = destinationParis} },
                      { "UpdatedAt", new AttributeValue(){ S = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture)}},
                      { "Prices", new AttributeValue() { L = new List<AttributeValue>{ 
                          new AttributeValue
                        {
                            M = new Dictionary<string, AttributeValue>
                            {
                                { "Month", new AttributeValue() { N = "06"} },
                                { "Year", new AttributeValue() { N = "2026"} },
                                { "Price", new AttributeValue(){ N = priceLGWParis }},
                                { "PricePP", new AttributeValue() { N = pricePPLGWParis} },
                            }
                        },
                          new AttributeValue
                        {
                            M = new Dictionary<string, AttributeValue>
                            {
                                { "Month", new AttributeValue(){ N = "06"} },
                                { "Year", new AttributeValue() { N = "2027"} },
                                { "Price", new AttributeValue(){ N = priceLGWParis2nd}},
                                { "PricePP", new AttributeValue() { N = pricePPLGWParis2nd} },
                            }
                        }
                      } }
                    }},
                }
            });

        _awsClientMock.Setup(client => client.GetClient().QueryAsync(It.Is<QueryRequest>(q => q.ExpressionAttributeValues.Values.Any(x => x.S == airportCodeSEN)), default))
            .ReturnsAsync(new QueryResponse
            {
                Items = new List<Dictionary<string, AttributeValue>> {
                            new Dictionary<string, AttributeValue>
                            {
                              { "Airport", new AttributeValue() { S = airportCodeSEN } },
                              { "Destination", new AttributeValue() { S = destinationParis} },
                              { "UpdatedAt", new AttributeValue(){ S = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture)}},
                              { "Prices", new AttributeValue() { L = new List<AttributeValue>{
                                  new AttributeValue
                                {
                                    M = new Dictionary<string, AttributeValue>
                                    {
                                        { "Month", new AttributeValue() { N = "06"} },
                                        { "Year", new AttributeValue() { N = "2026"} },
                                        { "Price", new AttributeValue(){ N = priceSENParis }},
                                        { "PricePP", new AttributeValue() { N = pricePPSENParis} },
                                    }
                                },
                                  new AttributeValue
                                {
                                    M = new Dictionary<string, AttributeValue>
                                    {
                                        { "Month", new AttributeValue(){ N = "06"} },
                                        { "Year", new AttributeValue() { N = "2027"} },
                                        { "Price", new AttributeValue(){ N = priceSENParis2nd}},
                                        { "PricePP", new AttributeValue() { N = pricePPSENParis2nd} },
                                    }
                                }
                              } }
                            }}
                }
            });

        //act
        var result = await _cheapestMonthService.GetCheapestMonths(request);

        //assert
        result.Should().NotBeNull();
        result[0].AirportCode.Should().Be(airportCodeLGW);
        result[0].Destination.Should().Be(destinationParis);
        result[0].Price.Should().Be(decimal.Parse(priceLGWParis));
        result[1].AirportCode.Should().Be(airportCodeSEN);
        result[1].Destination.Should().Be(destinationParis);
        result[1].Price.Should().Be(decimal.Parse(priceSENParis2nd));
    }

    [Fact]
    public async Task GetCheapestMonth_ThrowException_WhenErrorOccuredDuringDynamoDbOperation()
    {
        //arrange
        var request = new CheapestMonthRequest
        {
            Airports = "LGW",
            Destinations = "ES,ESTF"
        };

        _awsClientMock.Setup(client => client.GetClient().QueryAsync(It.IsAny<QueryRequest>(), default))
            .ThrowsAsync(new Exception("DynamoDB error"));

        //act
        Func<Task> method = async () => await _cheapestMonthService.GetCheapestMonths(request);

        //assert
        var exception = await method.Should()
             .ThrowAsync<ApiException>();
        exception.Which.Code.Should().Be(ApiExceptionCodes.SearchCheapestMonthError);
    }
}
