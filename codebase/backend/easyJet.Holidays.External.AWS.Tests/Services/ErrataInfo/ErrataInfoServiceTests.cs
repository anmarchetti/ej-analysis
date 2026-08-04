using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.AWS.Services.ErrataInfo;
using easyJet.Holidays.External.AWS.Utils;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Polly;
using Polly.Registry;
using Xunit;

namespace easyJet.Holidays.External.AWS.Tests.Services.ErrataInfo
{
    public class ErrataInfoServiceTests
    {
        private readonly IFixture _fixture;
        private readonly IOptions<AwsSettings> _awsSettings;
        private readonly ILogger<ErrataInfoService> _logger;
        private readonly ResiliencePipelineProvider<string> _pipelineProvider;
        public static readonly string Code = "Code";

        public ErrataInfoServiceTests()
        {
            _fixture = FixtureUtils.AutoMoqFixture();
            _awsSettings = Options.Create(new AwsSettings
            {
                Storage = new AwsSettingsStorage
                {
                    Tables = new AwsSettingsStorageTables
                    {
                        ErrataInfo = "HOL-CI-HOTEL-ERRATA",
                        FlightErrataInfo = "HOL-CI-FLIGHT-ERRATA"
                    }
                },
                Errata = new AwsSettingsErrata { ChunkDelayMs = 0 }
            });
            _logger = _fixture.Freeze<ILogger<ErrataInfoService>>();

            var pipelineMock = new Mock<ResiliencePipelineProvider<string>>();
            pipelineMock.Setup(p => p.GetPipeline<BatchWriteItemResponse>(AwsConfigurationExtensions.DynamoDbBatchWritePipelineKey))
                .Returns(ResiliencePipeline<BatchWriteItemResponse>.Empty);
            _pipelineProvider = pipelineMock.Object;
        }

        [Fact]
        public async Task EnrichWithErrataInfo_RelevantErrataExists_EnrichOffersWithErrata()
        {
            //Arrange
            var preparedErrataFromDynamoDbData = PrepareErrataFromDynamoDb();

            preparedErrataFromDynamoDbData.Item.TryGetValue(Code, out var hotelAttributeValue);
            var hotelCodeFromDynamoDb = hotelAttributeValue?.S;

            var preparedOffersTestData = PrepareOffersWithRelevantErrataInDynamoDb().ToList();

            var awsClient = _fixture.Freeze<Mock<IAmazonDynamoDB>>();

            awsClient.Setup(db =>
                    db.GetItemAsync(
                        It.Is<GetItemRequest>(request => request.Key.Values.Any(value => value.S.Equals(hotelCodeFromDynamoDb))),
                        default))
                .ReturnsAsync(preparedErrataFromDynamoDbData);

            var awsServiceMock = _fixture.Freeze<Mock<AwsClient>>();
            awsServiceMock.Setup(x => x.GetClient()).Returns(awsClient.Object);

            var errataInfoService = new ErrataInfoService(awsServiceMock.Object, _awsSettings, _logger, _pipelineProvider);

            //Act
            await errataInfoService.EnrichWithErrataInfo(preparedOffersTestData, "en");

            //Assert

            //X9002111 has errata info
            preparedOffersTestData.Where(offer => offer.Accom.Code == "X9002111").SelectMany(offer => offer.ErrataInfo)
                .Should().NotBeNullOrEmpty();

            //CYPF0001 doesn't have errata info
            preparedOffersTestData.Where(offer => offer.Accom.Code == "CYPF0001").SelectMany(offer => offer.ErrataInfo)
                .Should().BeNullOrEmpty();
        }

        [Fact]
        public async Task EnrichWithErrataInfo_RelevantErrataExistsForAirport_EnrichOffersWithErrata()
        {
            //Arrange
            var offers = new List<Offer>()
            {
                new Offer()
                {
                    Accom = new Accom()
                    {
                        Code = "X9002111"
                    },
                    Date = DateTime.Parse("2021-09-05T00:00:00"),
                    Transport = new Transport {
                        Routes = new List<Route> {
                            new Route {
                                ArrPt = "JER"
                            }
                        }
                    }
                },
                new Offer()
                {
                    Accom = new Accom()
                    {
                        Code = "CYPF0001"
                    },
                    Date = DateTime.Parse("2021-09-05T00:00:00"),
                }
            };

            Func<string, string, GetItemResponse> buildErrata = (code, errata) => new GetItemResponse()
            {
                Item = new Dictionary<string, AttributeValue>()
                {
                    {Code, new AttributeValue() {S = code}},
                    {
                        "ErratasInfo",
                        new AttributeValue()
                        {
                            S =
                                $"[{{\"Errata\":\"{errata}\",\"ErrataCode\":0,\"EffectiveDate\":\"2021-05-03T00:00:00\",\"DepartureStartDate\":\"2021-05-03T00:00:00\",\"DepartureEndDate\":\"2022-05-03T00:00:00\",\"BookStartDate\":\"2000-05-03T00:00:00\",\"BookEndDate\":\"2999-05-03T00:00:00\"}}]"
                        }
                    }
                }
            };

            var awsClient = _fixture.Freeze<Mock<IAmazonDynamoDB>>();
            awsClient.Setup(db =>
                    db.GetItemAsync(
                        It.Is<GetItemRequest>(request => request.Key.Values.Any(value => value.S.Equals("X9002111"))),
                        default))
                .ReturnsAsync(buildErrata("X9002111", "Errata for X9002111"));
            awsClient.Setup(db =>
                    db.GetItemAsync(
                        It.Is<GetItemRequest>(request => request.Key.Values.Any(value => value.S.Equals("JER"))),
                        default))
                .ReturnsAsync(buildErrata("JER", "Errata for JER"));


            var awsServiceMock = _fixture.Freeze<Mock<AwsClient>>();
            awsServiceMock.Setup(x => x.GetClient()).Returns(awsClient.Object);

            var errataInfoService = new ErrataInfoService(awsServiceMock.Object, _awsSettings, _logger, _pipelineProvider);

            //Act
            await errataInfoService.EnrichWithErrataInfo(offers, "en");

            //Assert

            //X9002111 has errata info for both accom and airport
            offers.Where(offer => offer.Accom.Code == "X9002111").SelectMany(offer => offer.ErrataInfo)
                .Should().Contain(new[] {
                    "Errata for X9002111",
                    "Errata for JER"
                });

            //CYPF0001 doesn't have errata info
            offers.Where(offer => offer.Accom.Code == "CYPF0001").SelectMany(offer => offer.ErrataInfo)
                .Should().BeNullOrEmpty();
        }

        [Fact]
        public async Task EnrichWithErrataInfo_NoErrata_OffersWithoutErrata()
        {
            //Arrange
            var preparedErrataFromDynamoDbData = PrepareErrataFromDynamoDb();

            preparedErrataFromDynamoDbData.Item.TryGetValue(Code, out var hotelAttributeValue);
            var hotelCodeFromDynamoDb = hotelAttributeValue?.S;

            var preparedOffersTestData = PrepareOffersWithoutErrataInDynamoDb().ToList();

            var awsClient = _fixture.Freeze<Mock<IAmazonDynamoDB>>();

            awsClient.Setup(db =>
                    db.GetItemAsync(
                        It.Is<GetItemRequest>(request => request.Key.Values.Any(value => value.S.Equals(hotelCodeFromDynamoDb))),
                        default))
                .ReturnsAsync(preparedErrataFromDynamoDbData);

            var awsServiceMock = _fixture.Freeze<Mock<AwsClient>>();
            awsServiceMock.Setup(x => x.GetClient()).Returns(awsClient.Object);

            var errataInfoService = new ErrataInfoService(awsServiceMock.Object, _awsSettings, _logger, _pipelineProvider);

            //Act
            await errataInfoService.EnrichWithErrataInfo(preparedOffersTestData, "en");

            //Assert

            //no errata info
            preparedOffersTestData.SelectMany(offer => offer.ErrataInfo).Should().BeNullOrEmpty();
        }

        [Fact]
        public async Task EnrichWithErrataInfo_NotRelevantErrataByDepartureDate_OffersWithoutErrata()
        {
            //Arrange
            var preparedErrataFromDynamoDbData = PrepareErrataFromDynamoDb();

            preparedErrataFromDynamoDbData.Item.TryGetValue(Code, out var hotelAttributeValue);
            var hotelCodeFromDynamoDb = hotelAttributeValue?.S;

            var preparedOffersTestData = PrepareOffersWithoutRelevantErrataInDynamoDb().ToList();

            var awsClient = _fixture.Freeze<Mock<IAmazonDynamoDB>>();

            awsClient.Setup(db =>
                    db.GetItemAsync(
                        It.Is<GetItemRequest>(request => request.Key.Values.Any(value => value.S.Equals(hotelCodeFromDynamoDb))),
                        default))
                .ReturnsAsync(preparedErrataFromDynamoDbData);

            var awsServiceMock = _fixture.Freeze<Mock<AwsClient>>();
            awsServiceMock.Setup(x => x.GetClient()).Returns(awsClient.Object);

            var errataInfoService = new ErrataInfoService(awsServiceMock.Object, _awsSettings, _logger, _pipelineProvider);

            //Act
            await errataInfoService.EnrichWithErrataInfo(preparedOffersTestData, "en");

            //Assert

            //no errata info
            preparedOffersTestData.SelectMany(offer => offer.ErrataInfo).Should().BeNullOrEmpty();
        }

        [Fact]
        public async Task EnrichWithErrataInfo_NotRelevantErrataByBookDate_OffersWithoutErrata()
        {
            //Arrange
            var preparedErrataFromDynamoDbData = PrepareErrataFromDynamoDbWithBookDatesInPast();

            preparedErrataFromDynamoDbData.Item.TryGetValue(Code, out var hotelAttributeValue);
            var hotelCodeFromDynamoDb = hotelAttributeValue?.S;

            var preparedOffersTestData = PrepareOffersWithRelevantErrataInDynamoDb().ToList();

            var awsClient = _fixture.Freeze<Mock<IAmazonDynamoDB>>();

            awsClient.Setup(db =>
                    db.GetItemAsync(
                        It.Is<GetItemRequest>(request => request.Key.Values.Any(value => value.S.Equals(hotelCodeFromDynamoDb))),
                        default))
                .ReturnsAsync(preparedErrataFromDynamoDbData);

            var awsServiceMock = _fixture.Freeze<Mock<AwsClient>>();
            awsServiceMock.Setup(x => x.GetClient()).Returns(awsClient.Object);

            var errataInfoService = new ErrataInfoService(awsServiceMock.Object, _awsSettings, _logger, _pipelineProvider);

            //Act
            await errataInfoService.EnrichWithErrataInfo(preparedOffersTestData, "en");

            //Assert

            //no errata info
            preparedOffersTestData.SelectMany(offer => offer.ErrataInfo).Should().BeNullOrEmpty();
        }

        [Fact]
        public async Task EnrichWithErrataInfo_NotRelevantErrataByEffectiveDate_OffersWithoutErrata()
        {
            //Arrange
            var preparedErrataFromDynamoDbData = PrepareErrataFromDynamoDbWithEffectiveDateInFuture();

            preparedErrataFromDynamoDbData.Item.TryGetValue(Code, out var hotelAttributeValue);
            var hotelCodeFromDynamoDb = hotelAttributeValue?.S;

            var preparedOffersTestData = PrepareOffersWithRelevantErrataInDynamoDb().ToList();

            var awsClient = _fixture.Freeze<Mock<IAmazonDynamoDB>>();

            awsClient.Setup(db =>
                    db.GetItemAsync(
                        It.Is<GetItemRequest>(request => request.Key.Values.Any(value => value.S.Equals(hotelCodeFromDynamoDb))),
                        default))
                .ReturnsAsync(preparedErrataFromDynamoDbData);

            var awsServiceMock = _fixture.Freeze<Mock<AwsClient>>();
            awsServiceMock.Setup(x => x.GetClient()).Returns(awsClient.Object);

            var errataInfoService = new ErrataInfoService(awsServiceMock.Object, _awsSettings, _logger, _pipelineProvider);

            //Act
            await errataInfoService.EnrichWithErrataInfo(preparedOffersTestData, "en");

            //Assert

            //no errata info
            preparedOffersTestData.SelectMany(offer => offer.ErrataInfo).Should().BeNullOrEmpty();
        }

        [Fact]
        public async Task EnrichWithErrataInfo_NotRelevantErrataByLanguage_OffersWithoutErrata()
        {
            //Arrange
            var preparedErrataFromDynamoDbData = PrepareErrataFromDynamoDbWithForeignLanguage();

            preparedErrataFromDynamoDbData.Item.TryGetValue(Code, out var hotelAttributeValue);
            var hotelCodeFromDynamoDb = hotelAttributeValue?.S;

            var preparedOffersTestData = PrepareOffersWithRelevantErrataInDynamoDb().ToList();

            var awsClient = _fixture.Freeze<Mock<IAmazonDynamoDB>>();

            awsClient.Setup(db =>
                    db.GetItemAsync(
                        It.Is<GetItemRequest>(request => request.Key.Values.Any(value => value.S.Equals(hotelCodeFromDynamoDb))),
                        default))
                .ReturnsAsync(preparedErrataFromDynamoDbData);

            var awsServiceMock = _fixture.Freeze<Mock<AwsClient>>();
            awsServiceMock.Setup(x => x.GetClient()).Returns(awsClient.Object);

            var errataInfoService = new ErrataInfoService(awsServiceMock.Object, _awsSettings, _logger, _pipelineProvider);

            //Act
            await errataInfoService.EnrichWithErrataInfo(preparedOffersTestData, "en");

            //Assert

            //no errata info
            preparedOffersTestData.SelectMany(offer => offer.ErrataInfo).Should().BeNullOrEmpty();
        }

        [Fact]
        public async Task EnrichWithErrataInfo_RelevantErrataExistsWithDuplicates_EnrichOffersWithErrataWithoutDuplicates()
        {
            //Arrange
            var preparedErrataFromDynamoDbData = PrepareErrataFromDynamoDbWithDuplicate();

            preparedErrataFromDynamoDbData.Item.TryGetValue(Code, out var hotelAttributeValue);
            var hotelCodeFromDynamoDb = hotelAttributeValue?.S;

            var preparedOffersTestData = PrepareOffersWithRelevantErrataInDynamoDb().ToList();

            var awsClient = _fixture.Freeze<Mock<IAmazonDynamoDB>>();

            awsClient.Setup(db =>
                    db.GetItemAsync(
                        It.Is<GetItemRequest>(request => request.Key.Values.Any(value => value.S.Equals(hotelCodeFromDynamoDb))),
                        default))
                .ReturnsAsync(preparedErrataFromDynamoDbData);

            var awsServiceMock = _fixture.Freeze<Mock<AwsClient>>();
            awsServiceMock.Setup(x => x.GetClient()).Returns(awsClient.Object);

            var errataInfoService = new ErrataInfoService(awsServiceMock.Object, _awsSettings, _logger, _pipelineProvider);

            //Act
            await errataInfoService.EnrichWithErrataInfo(preparedOffersTestData, "en");

            //Assert

            //X9002111 has errata info without duplicates
            preparedOffersTestData.Where(offer => offer.Accom.Code == "X9002111")
                .SelectMany(offer => offer.ErrataInfo)
                .Count()
                .Should().Be(1);

            //CYPF0001 doesn't have errata info
            preparedOffersTestData.Where(offer => offer.Accom.Code == "CYPF0001").SelectMany(offer => offer.ErrataInfo)
                .Should().BeNullOrEmpty();
        }

        private static IEnumerable<Offer> PrepareOffersWithRelevantErrataInDynamoDb()
        {
            return new List<Offer>()
            {
                new Offer()
                {
                    Accom = new Accom()
                    {
                        Code = "X9002111"
                    },
                    Date = DateTime.Parse("2021-09-05T00:00:00"),
                },
                new Offer()
                {
                    Accom = new Accom()
                    {
                        Code = "CYPF0001"
                    },
                    Date = DateTime.Parse("2021-09-05T00:00:00"),
                }
            };
        }

        private static IEnumerable<Offer> PrepareOffersWithoutErrataInDynamoDb()
        {
            return new List<Offer>()
            {
                new Offer()
                {
                    Accom = new Accom()
                    {
                        Code = "Test1"
                    },
                    Date = DateTime.Parse("2021-09-05T00:00:00"),
                },
                new Offer()
                {
                    Accom = new Accom()
                    {
                        Code = "Test2"
                    },
                    Date = DateTime.Parse("2021-09-05T00:00:00"),
                }
            };
        }


        private static IEnumerable<Offer> PrepareOffersWithoutRelevantErrataInDynamoDb()
        {
            return new List<Offer>()
            {
                new Offer()
                {
                    Accom = new Accom()
                    {
                        Code = "X9002111"
                    },
                    Date = DateTime.Parse("2020-09-05T00:00:00"),
                },
                new Offer()
                {
                    Accom = new Accom()
                    {
                        Code = "X9002111"
                    },
                    Date = DateTime.Parse("2022-09-05T00:00:00"),
                }
            };
        }

        private static GetItemResponse PrepareErrataFromDynamoDb()
        {
            return new GetItemResponse()
            {
                Item = new Dictionary<string, AttributeValue>()
                {
                    {Code, new AttributeValue() {S = "X9002111"}},
                    {
                        "ErratasInfo",
                        new AttributeValue()
                        {
                            S =
                                "[{\"Errata\":\"Errata message\",\"ErrataCode\":0,\"EffectiveDate\":\"2021-05-03T00:00:00\",\"DepartureStartDate\":\"2021-05-03T00:00:00\",\"DepartureEndDate\":\"2022-05-03T00:00:00\",\"BookStartDate\":\"2000-05-03T00:00:00\",\"BookEndDate\":\"2999-05-03T00:00:00\"}]"
                        }
                    }
                }
            };
        }

        private static GetItemResponse PrepareErrataFromDynamoDbWithBookDatesInPast()
        {
            return new GetItemResponse()
            {
                Item = new Dictionary<string, AttributeValue>()
                {
                    {Code, new AttributeValue() {S = "X9002111"}},
                    {
                        "ErratasInfo",
                        new AttributeValue()
                        {
                            S =
                                "[{\"Errata\":\"Errata message\",\"ErrataCode\":0,\"EffectiveDate\":\"2021-05-03T00:00:00\",\"DepartureStartDate\":\"2021-05-03T00:00:00\",\"DepartureEndDate\":\"2022-05-03T00:00:00\",\"BookStartDate\":\"2000-05-03T00:00:00\",\"BookEndDate\":\"2001-05-03T00:00:00\"}]"
                        }
                    }
                }
            };
        }

        private static GetItemResponse PrepareErrataFromDynamoDbWithEffectiveDateInFuture()
        {
            return new GetItemResponse()
            {
                Item = new Dictionary<string, AttributeValue>()
                {
                    {Code, new AttributeValue() {S = "X9002111"}},
                    {
                        "ErratasInfo",
                        new AttributeValue()
                        {
                            S =
                                "[{\"Errata\":\"Errata message\",\"ErrataCode\":0,\"EffectiveDate\":\"2999-05-03T00:00:00\",\"DepartureStartDate\":\"2021-05-03T00:00:00\",\"DepartureEndDate\":\"2022-05-03T00:00:00\",\"BookStartDate\":\"2000-05-03T00:00:00\",\"BookEndDate\":\"2001-05-03T00:00:00\"}]"
                        }
                    }
                }
            };
        }

        private static GetItemResponse PrepareErrataFromDynamoDbWithDuplicate()
        {
            return new GetItemResponse()
            {
                Item = new Dictionary<string, AttributeValue>()
                {
                    {Code, new AttributeValue() {S = "X9002111"}},
                    {
                        "ErratasInfo",
                        new AttributeValue()
                        {
                            S =
                                "[{\"Errata\":\"Errata message\",\"ErrataCode\":0,\"EffectiveDate\":\"2021-05-03T00:00:00\",\"DepartureStartDate\":\"2021-05-03T00:00:00\",\"DepartureEndDate\":\"2022-05-03T00:00:00\",\"BookStartDate\":\"2000-05-03T00:00:00\",\"BookEndDate\":\"2999-05-03T00:00:00\"},{\"Errata\":\"Errata message\",\"ErrataCode\":0,\"EffectiveDate\":\"2021-05-03T00:00:00\",\"DepartureStartDate\":\"2021-05-03T00:00:00\",\"DepartureEndDate\":\"2022-05-03T00:00:00\",\"BookStartDate\":\"2000-05-03T00:00:00\",\"BookEndDate\":\"2999-05-03T00:00:00\"}]"
                        }
                    }
                }
            };
        }

        private static GetItemResponse PrepareErrataFromDynamoDbWithForeignLanguage()
        {
            return new GetItemResponse()
            {
                Item = new Dictionary<string, AttributeValue>()
                {
                    {Code, new AttributeValue() {S = "X9002111"}},
                    {
                        "ErratasInfo",
                        new AttributeValue()
                        {
                            S =
                                "[{\"Errata\":\"Errata message\",\"LanguageCode\": \"fr-CH\",\"ErrataCode\":0,\"EffectiveDate\":\"2021-05-03T00:00:00\",\"DepartureStartDate\":\"2021-05-03T00:00:00\",\"DepartureEndDate\":\"2022-05-03T00:00:00\",\"BookStartDate\":\"2000-05-03T00:00:00\",\"BookEndDate\":\"2999-05-03T00:00:00\"}]"
                        }
                    }
                }
            };
        }
    }
}