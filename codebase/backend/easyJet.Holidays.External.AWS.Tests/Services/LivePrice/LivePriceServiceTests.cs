using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.LivePrice;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Services;
using easyJet.Holidays.External.AWS.Services.LivePrice;
using easyJet.Holidays.External.AWS.Utils;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Newtonsoft.Json.Linq;
using Polly;
using Polly.Registry;
using System.Globalization;
using Xunit;

namespace easyJet.Holidays.External.AWS.Tests.Services.LivePrice
{
    public class LivePriceServiceTests
    {
        private IFixture _fixture { get; set; }
        private IOptions<AwsSettings> _awsSettings;
        private IMarketService _marketService;
        private ILanguageService _languageService;
        private readonly ResiliencePipelineProvider<string> _pipelineProvider;

        public LivePriceServiceTests()
        {
            _fixture = FixtureUtils.AutoMoqFixture();
            _awsSettings = Options.Create(new AwsSettings
            {
                Storage = new AwsSettingsStorage
                {
                    Tables = new AwsSettingsStorageTables
                    {
                        LivePrice = "LivePrice"
                    }
                }
            });

            var marketServiceMock = _fixture.Freeze<Mock<IMarketService>>();
            marketServiceMock.Setup(x => x.GetCurrentMarket()).Returns(new MarketSettings { Code = "EN" });
            _marketService = marketServiceMock.Object;

            var languageServiceMock = _fixture.Freeze<Mock<ILanguageService>>();
            languageServiceMock.Setup(x => x.GetCurrentLanguage()).Returns("en");
            _languageService = languageServiceMock.Object;

            var pipelineMock = new Mock<ResiliencePipelineProvider<string>>();
            pipelineMock.Setup(p => p.GetPipeline<BatchWriteItemResponse>(AwsConfigurationExtensions.DynamoDbBatchWritePipelineKey))
                .Returns(ResiliencePipeline<BatchWriteItemResponse>.Empty);
            _pipelineProvider = pipelineMock.Object;
        }

        [Fact]
        public async Task Save_ShouldSaveUsingChunksInDynamoDB()
        {
            // Arrange
            var awsClientMock = _fixture.Freeze<Mock<IAmazonDynamoDB>>();
            var tableSettings = new LivePriceTableSetting
            {
                ChunkSize = 2,
                TableName = "LivePrice"
            };

            var awsServiceMock = _fixture.Freeze<Mock<AwsClient>>();

            var sutMock = new Mock<LivePriceService>(awsServiceMock.Object, Options.Create(new AwsSettings()), _fixture.Freeze<ILogger<LivePriceService>>(), _marketService, _languageService, _pipelineProvider);
            sutMock.Setup(x => x.GetClientForSave(It.IsAny<LivePriceTableSetting>())).Returns(awsClientMock.Object);

            var data = new Dictionary<string, GeogPricesModel> {
                {
                    "ES",
                    new GeogPricesModel {
                        Summaries = new[] { new LivePriceSummaryModel {
                            PackageId = "0000000001/1/0001/1",
                            Geog = "ES",
                            Price = 60,
                            Currency = "GBP",
                            Market = "EN",
                            Language = "en",
                            TouristTax = 12.34m,
                            TouristTaxPP = 6.17m,
                            PriceExcludingTouristTax = 47.66m,
                            PricePPExcludingTouristTax = 23.83m,
                            TaxesAndFees = new Dictionary<string, TaxesAndFeesSummary>
                            {
                                {
                                    "summaryTax",
                                    new TaxesAndFeesSummary
                                    {
                                        TotalLocalPricePP = 6.17m,
                                        ExchRt = 1.0m,
                                        Currency = "GBP",
                                        TotalLocalPrice = 12.34m
                                    }
                                }
                            },
                            SearchCriteria = new SearchCriteria {
                                Name = "beach",
                                Language = "en",
                                Adults = 2,
                                Children = 1,
                                ChildAges = new List<string> { "5" },
                                Duration = 1,
                                Infants = 1,
                                ThemeTypesCodes = new List<string>{ "B" },
                                Range = new DateRange {
                                    Start = DateTimeOffset.Parse("2020-06-01T00:00:00+00:00", CultureInfo.InvariantCulture),
                                    End = DateTimeOffset.Parse("2020-08-01T00:00:00+00:00", CultureInfo.InvariantCulture),
                                },
                                DepPt= "LGW",
                                Date = new DateTimeOffset(2020, 03, 04, 0,0,0, TimeSpan.Zero)
                            },
                            NamedSearches = new Dictionary<string, decimal> {
                                { "city", 99.12m},
                                { "beach", 60}
                            }
                        } },
                        NamedSearchPrices = new List<LivePriceModel> {
                            new LivePriceModel {
                                PackageId = "0000000001/1/0001/1",
                                Geog = "ES",
                                SearchCriteria = new SearchCriteria() {
                                    Name = "city",
                                    Language = "en",
                                    Adults = 2,
                                    Duration = 7,
                                    Range = new DateRange {
                                        Start = DateTimeOffset.Parse("2020-06-01T00:00:00+00:00", CultureInfo.InvariantCulture),
                                        End = DateTimeOffset.Parse("2020-08-01T00:00:00+00:00", CultureInfo.InvariantCulture),
                                    },
                                    DepPt= "LTN",
                                    Date = new DateTimeOffset(2020, 04, 05, 0,0,0, TimeSpan.Zero)
                                },
                                Currency = "GBP",
                                Market = "EN",
                                Language = "en",
                                Price = 99.12m,
                                TouristTax = 1.11m,
                                TouristTaxPP = 0.55m,
                                PriceExcludingTouristTax = 98.01m,
                                PricePPExcludingTouristTax = 49.01m,
                                TaxesAndFees = new Dictionary<string, TaxesAndFeesSummary>
                                {
                                    {
                                        "cityTax",
                                        new TaxesAndFeesSummary
                                        {
                                            TotalLocalPricePP = 0.55m,
                                            ExchRt = 1.15m,
                                            Currency = "EUR",
                                            TotalLocalPrice = 1.11m
                                        }
                                    }
                                },
                            },
                            new LivePriceModel {
                                PackageId = "0000000001/1/0001/1",
                                Geog = "ES",
                                SearchCriteria = new SearchCriteria()
                                {
                                    Name = "beach",
                                    Language = "en",
                                },
                                Currency = "GBP",
                                Market = "EN",
                                Language = "en",
                                Price = 60,
                                TouristTax = 3.33m,
                                TouristTaxPP = 1.66m,
                                PriceExcludingTouristTax = 56.67m,
                                PricePPExcludingTouristTax = 28.34m,
                                TaxesAndFees = new Dictionary<string, TaxesAndFeesSummary>
                                {
                                    {
                                        "beachTax",
                                        new TaxesAndFeesSummary
                                        {
                                            TotalLocalPricePP = 1.66m,
                                            ExchRt = 0.9m,
                                            Currency = "CHF",
                                            TotalLocalPrice = 3.33m
                                        }
                                    }
                                },
                            }
                        }
                    }
                }
            };
            awsClientMock.Setup(x => x.BatchWriteItemAsync(It.IsAny<BatchWriteItemRequest>(), default)).ReturnsAsync((BatchWriteItemResponse)null);
            // Act
            await sutMock.Object.Save(tableSettings, data, 2);
            // Assert
            // First batch: summary and 1st data object            
            awsClientMock.Verify(x => x.BatchWriteItemAsync(It.Is<BatchWriteItemRequest>(r =>
                ValidateRequest(
                    r.RequestItems["LivePrice"][0],
                    "ES",
                    "-",
                    "{\"Range\":{\"Start\":\"2020-06-01T00:00:00+00:00\",\"End\":\"2020-08-01T00:00:00+00:00\"},\"Date\":\"2020-03-04T00:00:00+00:00\",\"DepPt\":\"LGW\",\"Id\":\"beach(en)\",\"Name\":\"beach\",\"Language\":\"en\",\"Adults\":2,\"Children\":1,\"Infants\":1,\"Duration\":1,\"ChildAges\":[\"5\"],\"ThemeTypesCodes\":[\"B\"]}",
                    "GBP",
                    "EN",
                    "en",
                    60,
                    "{\"city\":99.12,\"beach\":60.0}",
                    12.34m,
                    6.17m,
                    47.66m,
                    23.83m,
                    "{\"summaryTax\":{\"totalLocalPricePP\":6.17,\"exchRt\":1.0,\"currency\":\"GBP\",\"totalLocalPrice\":12.34}}")
            ), default), Times.Once, "Summary model");
            awsClientMock.Verify(x => x.BatchWriteItemAsync(It.Is<BatchWriteItemRequest>(r =>
                r.RequestItems["LivePrice"].Count > 1
                && ValidateRequest(
                    r.RequestItems["LivePrice"][1],
                    "ES",
                    "city",
                    "{\"Range\":{\"Start\":\"2020-06-01T00:00:00+00:00\",\"End\":\"2020-08-01T00:00:00+00:00\"},\"Date\":\"2020-04-05T00:00:00+00:00\",\"DepPt\":\"LTN\",\"Id\":\"city(en)\",\"Name\":\"city\",\"Language\":\"en\",\"Adults\":2,\"Children\":0,\"Infants\":0,\"Duration\":7,\"ChildAges\":null,\"ThemeTypesCodes\":null}",
                    "GBP",
                    "EN",
                    "en",
                    99.12m,
                    null,
                    1.11m,
                    0.55m,
                    98.01m,
                    49.01m,
                    "{\"cityTax\":{\"totalLocalPricePP\":0.55,\"exchRt\":1.15,\"currency\":\"EUR\",\"totalLocalPrice\":1.11}}")
                ), default), Times.Once, "City data model");

            // Second batch: 2nd data object
            awsClientMock.Verify(x => x.BatchWriteItemAsync(It.Is<BatchWriteItemRequest>(r =>
                ValidateRequest(
                    r.RequestItems["LivePrice"][0],
                    "ES",
                    "beach",
                    "{\"Range\":null,\"Date\":null,\"DepPt\":null,\"Id\":\"beach(en)\",\"Name\":\"beach\",\"Language\":\"en\",\"Adults\":0,\"Children\":0,\"Infants\":0,\"Duration\":0,\"ChildAges\":null,\"ThemeTypesCodes\":null}",
                    "GBP",
                    "EN",
                    "en",
                    60,
                    null,
                    3.33m,
                    1.66m,
                    56.67m,
                    28.34m,
                    "{\"beachTax\":{\"totalLocalPricePP\":1.66,\"exchRt\":0.9,\"currency\":\"CHF\",\"totalLocalPrice\":3.33}}")
                ), default), Times.Once, "Beach data model");
        }

        [Fact]
        public async Task GetPrice_KeysWithAndWithoutType_ShouldParseKeysAndBuildRequestModel()
        {
            // Arrange
            var awsClient = _fixture.Freeze<Mock<IAmazonDynamoDB>>();
            awsClient.Setup(x => x.GetItemAsync(It.IsAny<GetItemRequest>(), default)).ReturnsAsync(new GetItemResponse());

            var awsServiceMock = _fixture.Freeze<Mock<AwsClient>>();
            awsServiceMock.Setup(x => x.GetClient()).Returns(awsClient.Object);

            var marketServiceMock = _fixture.Freeze<Mock<IMarketService>>();
            marketServiceMock.Setup(x => x.GetCurrentMarket()).Returns(new MarketSettings { Code = "UK" });

            var sut = new LivePriceService(awsServiceMock.Object, _awsSettings, _fixture.Freeze<ILogger<LivePriceService>>(), _marketService, _languageService, _pipelineProvider);

            // Act
            var result = await sut.GetPrice(new[] { "ES", "ES.theme" });

            // Assert
            awsClient.Verify(x => x.GetItemAsync(It.Is<GetItemRequest>(r =>
                r.TableName == "LivePrice"
                && r.Key["Code"].S == "ES"
                && r.Key["SearchType"].S == "-|UK|en"
            ), default), Times.Once);
            awsClient.Verify(x => x.GetItemAsync(It.Is<GetItemRequest>(r =>
                r.TableName == "LivePrice"
                && r.Key["Code"].S == "ES"
                && r.Key["SearchType"].S == "theme|UK|en"
            ), default), Times.Once);
        }

        [Fact]
        public async Task GetPrice_EmptyKeys_ShouldIgnoreThem()
        {
            // Arrange
            var awsClient = _fixture.Freeze<Mock<IAmazonDynamoDB>>();
            awsClient.Setup(x => x.GetItemAsync(It.IsAny<GetItemRequest>(), default)).ReturnsAsync(new GetItemResponse());

            var awsServiceMock = _fixture.Freeze<Mock<AwsClient>>();
            awsServiceMock.Setup(x => x.GetClient()).Returns(awsClient.Object);

            var sut = new LivePriceService(awsServiceMock.Object, _awsSettings, _fixture.Freeze<ILogger<LivePriceService>>(), _marketService, _languageService, _pipelineProvider);

            // Act
            var result = await sut.GetPrice(new string[] { "ES", "", null, "  " });

            // Assert
            awsClient.Verify(x => x.GetItemAsync(It.IsAny<GetItemRequest>(), default), Times.Once);
        }

        [Fact]
        public async Task GetPrice_NoValueInDynamo_ShouldIgnoreThem()
        {
            // Arrange
            var awsClient = _fixture.Freeze<Mock<IAmazonDynamoDB>>();
            awsClient.Setup(x => x.GetItemAsync(It.Is<GetItemRequest>(r => r.Key["Code"].S == "ES"), default)).ReturnsAsync(new GetItemResponse
            {
                Item = new Dictionary<string, AttributeValue> {
                    { "Code", new AttributeValue { S = "ES"} },
                    { "PackageId", new AttributeValue { S = "0000000001/1/0001/1"} },
                    { "PromoCollections", new AttributeValue { S = "[\"lux\"]"} },
                    { "Price", new AttributeValue { N = "12.34"} },
                    { "SearchDate", new AttributeValue { N = "98888"} },
                }
            });
            awsClient.Setup(x => x.GetItemAsync(It.Is<GetItemRequest>(r => r.Key["Code"].S == "NODATA"), default)).ReturnsAsync(new GetItemResponse());
            var awsServiceMock = _fixture.Freeze<Mock<AwsClient>>();
            awsServiceMock.Setup(x => x.GetClient()).Returns(awsClient.Object);

            var sut = new LivePriceService(awsServiceMock.Object, _awsSettings, _fixture.Freeze<ILogger<LivePriceService>>(), _marketService, _languageService, _pipelineProvider);

            // Act
            var result = await sut.GetPrice(new[] { "ES", "NODATA" });
            // Assert
            result.Should().BeEquivalentTo(new List<LivePriceSummaryModel> {
                new LivePriceSummaryModel {
                    PackageId = "0000000001/1/0001/1",
                    Geog = "ES",
                    Price = 12.34m,
                    SearchDate = DateTimeOffset.FromUnixTimeSeconds(98888),
                    PromotionCollections = new List<string> { "lux" },
                }
            });
        }

        [Fact]
        public async Task GetPrice_ValidData_ShouldCovertValues()
        {
            // Arrange
            var awsClient = _fixture.Freeze<Mock<IAmazonDynamoDB>>();
            awsClient.Setup(x => x.GetItemAsync(It.Is<GetItemRequest>(r => r.Key["Code"].S == "ES"), default)).ReturnsAsync(new GetItemResponse
            {
                Item = new Dictionary<string, AttributeValue> {
                    { "Code", new AttributeValue { S = "ES"} },
                    { "PackageId", new AttributeValue { S = "0000000001/1/0001/1"} },
                    { "Price", new AttributeValue { N = "12.34"} },
                    { "SearchDate", new AttributeValue { N = "98888"} },
                    { "SearchType", new AttributeValue { S = "-"} },
                    { "SearchCriteria", new AttributeValue { S = "{\"Name\":\"city\",\"Language\":\"en\",\"Adults\":2,\"Children\":1,\"Infants\":1,\"ChildAges\":[\"5\",\"7\"],\"Duration\":5,\"ThemeTypesCodes\":[\"C\"],\"Range\":{\"Start\":\"2020-02-01T00:00:00+00:00\",\"End\":\"2020-05-01T00:00:00+00:00\"}}"} },
                    { "NamedSearches", new AttributeValue { S = "{\"beach\":1497.66,\"family\":1183.14}"} },
                    { "PromoCollections", new AttributeValue { S = "[\"lux\"]"} },
                    { "TouristTax", new AttributeValue { N = "1.23"} },
                    { "TouristTaxPP", new AttributeValue { N = "0.61"} },
                }
            });
            var awsServiceMock = _fixture.Freeze<Mock<AwsClient>>();
            awsServiceMock.Setup(x => x.GetClient()).Returns(awsClient.Object);

            var sut = new LivePriceService(awsServiceMock.Object, _awsSettings, _fixture.Freeze<ILogger<LivePriceService>>(), _marketService, _languageService, _pipelineProvider);

            // Act
            var result = await sut.GetPrice(new[] { "ES" });

            // Assert
            result.Should().BeEquivalentTo(new List<LivePriceSummaryModel> {
                new LivePriceSummaryModel {
                    PackageId = "0000000001/1/0001/1",
                    Geog = "ES",
                    Price = 12.34m,
                    SearchDate = DateTimeOffset.FromUnixTimeSeconds(98888),
                    PromotionCollections = new List<string> { "lux" },
                    SearchCriteria = new SearchCriteria {
                        Name = "city",
                        Language = "en",
                        Adults = 2,
                        Children = 1,
                        ChildAges = new List<string>{"5,7" },
                        Infants = 1,
                        Duration = 5,
                        ThemeTypesCodes = new List<string>{"C" },
                        Range = new DateRange {
                             Start = DateTimeOffset.Parse("2020-02-01T00:00:00+00:00", CultureInfo.InvariantCulture),
                             End = DateTimeOffset.Parse("2020-05-01T00:00:00+00:00", CultureInfo.InvariantCulture),
                        }
                    },
                    NamedSearches = new Dictionary<string, decimal> {
                        { "beach", 1497.66m},
                        { "family", 1183.14m},
                    },
                    TouristTax = 1.23m,
                    TouristTaxPP = 0.61m,
                }
            });
        }
        [Fact]
        public async Task GetPrice_NoAttributes_ShouldHandleNoValues()
        {
            // Arrange
            var awsClient = _fixture.Freeze<Mock<IAmazonDynamoDB>>();
            awsClient.Setup(x => x.GetItemAsync(It.Is<GetItemRequest>(r => r.Key["Code"].S == "ES"), default)).ReturnsAsync(new GetItemResponse
            {
                Item = new Dictionary<string, AttributeValue> {
                    { "Code", new AttributeValue { S = "ES"} },
                    { "PackageId", new AttributeValue { S = "0000000001/1/0001/1"} },
                    { "PromoCollections", new AttributeValue { S = "[\"lux\"]"} },
                }
            });
            var awsServiceMock = _fixture.Freeze<Mock<AwsClient>>();
            awsServiceMock.Setup(x => x.GetClient()).Returns(awsClient.Object);

            var sut = new LivePriceService(awsServiceMock.Object, _awsSettings, _fixture.Freeze<ILogger<LivePriceService>>(), _marketService, _languageService, _pipelineProvider);

            // Act
            var result = await sut.GetPrice(new[] { "ES" });

            // Assert
            result.Should().BeEquivalentTo(new List<LivePriceSummaryModel> {
                new LivePriceSummaryModel {
                    PackageId = "0000000001/1/0001/1",
                    Geog = "ES",
                    Price = 0,
                    SearchDate = DateTimeOffset.FromUnixTimeSeconds(0),
                    SearchCriteria = null,
                    NamedSearches = null,
                    PromotionCollections = new List<string> { "lux" },
                }
            });
        }

        private static bool ValidateRequest(WriteRequest request, string code, string searchType, string searchCriteria, string currency, string market, string language, decimal price, string namedSearches, decimal touristTax, decimal touristTaxPp, decimal priceExcludingTouristTax, decimal pricePPExcludingTouristTax, string taxesAndFees)
        {
            var item = request.PutRequest.Item;
            return item["Code"].S == code
                && item["SearchType"].S == searchType + "|" + market + "|" + language
                && item["SearchCriteria"].S == searchCriteria
                && item["Currency"].S == currency
                && item["Market"].S == market
                && item["Price"].N == price.ToString(CultureInfo.InvariantCulture)
                && (namedSearches == null || item["NamedSearches"].S == namedSearches)
                && item["TouristTax"].N == touristTax.ToString(CultureInfo.InvariantCulture)
                && item["TouristTaxPP"].N == touristTaxPp.ToString(CultureInfo.InvariantCulture)
                && item["PriceExcludingTouristTax"].N == priceExcludingTouristTax.ToString(CultureInfo.InvariantCulture)
                && item["PricePPExcludingTouristTax"].N == pricePPExcludingTouristTax.ToString(CultureInfo.InvariantCulture)
                && JToken.DeepEquals(JToken.Parse(item["TaxesAndFees"].S), JToken.Parse(taxesAndFees));
        }
    }
}
