using Amazon.DynamoDBv2.DataModel;
using Amazon.DynamoDBv2.DocumentModel;
using AutoFixture;
using AutoFixture.Xunit3;
using easyJet.Holidays.Api.Domain.Data.DynamoDB.FreeNights;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.AWS.Services.FreeNights;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Force.DeepCloner;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.AWS.Tests.Services.FreeNights
{
    public class FreeNightsServiceTests
    {
        private readonly IFixture _fixture;
        private readonly ICacheService _cacheService;
        private readonly IOptions<AwsSettings> _awsSettings;
        private readonly IOptions<CacheSettings> _cacheSettings;
        private readonly Mock<IDynamoDBContext> _dbContext;
        private readonly DynamoDBOperationConfig _config;
        private readonly DateTime _nowDateTime;

        private readonly FreeNightsService _sut;

        public FreeNightsServiceTests()
        {
            _fixture = FixtureUtils.AutoMoqFixture();
            _awsSettings = Options.Create(new AwsSettings
            {
                Storage = new AwsSettingsStorage
                {
                    Tables = new AwsSettingsStorageTables
                    {
                        FreeNights = "FreeNights"
                    }
                }
            });

            _cacheSettings = Options.Create(new CacheSettings()
            {
                Buckets = new Buckets()
                {
                    FreeNights = "FreeNights"
                }
            });

            _cacheService = new CacheServiceStub();
            _dbContext = _fixture.Freeze<Mock<IDynamoDBContext>>();
            _config = new DynamoDBOperationConfig()
            {
                ConsistentRead = true,
                OverrideTableName = _awsSettings.Value.Storage.Tables.FreeNights,
            };

            _nowDateTime = DateTime.UtcNow;

            _sut = new(_dbContext.Object, new Mock<ILogger<FreeNightsService>>().Object, _cacheService, _awsSettings, _cacheSettings);
        }

        [Fact]
        public async Task GetAll_OnError_ReturnsEmpty()
        {
            // Arrange
            _dbContext.Setup(
                mock => mock.FromScanAsync<AccomFreeNights>(It.IsAny<ScanOperationConfig>(), It.IsAny<FromScanConfig>())
            ).Throws(new InvalidOperationException());

            // Act
            var result = (await _sut.GetAll())?.ToList();

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        [Fact]
        public async Task GetAll_SuccessfullyReturnsTableContents()
        {
            // Arrange
            var items = new List<AccomFreeNights>(_fixture.CreateMany<AccomFreeNights>(5));

            var search = new Mock<IAsyncSearch<AccomFreeNights>>();

            search.SetupSequence(mock => mock.IsDone)
                .Returns(false)
                .Returns(false)
                .Returns(true);

            search.SetupSequence(mock => mock.GetNextSetAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(items[..2])
                .ReturnsAsync(items[2..]);

            _dbContext.Setup(
                mock =>
                    mock.FromScanAsync<AccomFreeNights>(It.IsAny<ScanOperationConfig>(),
                        It.Is<FromScanConfig>(arg => arg.OverrideTableName == _config.OverrideTableName))
            ).Returns(search.Object);

            // Act
            var result = (await _sut.GetAll())?.ToList();

            // Assert
            result.Should().NotBeNullOrEmpty();
            result!.Count.Should().Be(items.Count);
        }

        [Theory]
        [AutoData]
        public async Task EnrichWithFreeNightsInfo_Get_ReturnCorrectValue(string accomId, string accomName)
        {
            var accomFreeNights = new AccomFreeNights()
            {
                AccommodationCode = accomId,
                AccommodationName = accomName,
                AvailableFreeNights = new List<FreeNight>()
                {
                    new FreeNight()
                    {
                        CurrentFree = 1,
                        CurrentStay = 7,
                        TravelStartDate = _nowDateTime,
                        TravelEndDate = _nowDateTime.AddDays(7),
                        MinStay = 1,
                        RoomCode = "DB03"
                    }
                }
            };

            _dbContext.Setup(context =>
                    context.LoadAsync<AccomFreeNights>(accomId, It.IsAny<LoadConfig>(), default))
                .ReturnsAsync(accomFreeNights);

            var freeNightsService = new FreeNightsService(_dbContext.Object, null, _cacheService, _awsSettings, _cacheSettings);

            var result = await freeNightsService.Get(accomId);

            result.Should().BeEquivalentTo(accomFreeNights);
        }

        [Theory]
        [AutoData]
        public async Task EnrichWithFreeNightsInfo_UnitIncludes1FreeNights_CorrectFreeNightsInfo(string accomId, string accomName)
        {
            var accomFreeNights = new AccomFreeNights()
            {
                AccommodationCode = accomId,
                AccommodationName = accomName,
                AvailableFreeNights = new List<FreeNight>()
                {
                    new FreeNight()
                    {
                        CurrentFree = 1,
                        CurrentStay = 7,
                        TravelStartDate = _nowDateTime,
                        TravelEndDate = _nowDateTime.AddDays(7),
                        MinStay = 1,
                        RoomCode = "DB03"
                    }
                }
            };

            var offers = new List<Offer>()
            {
                new Offer()
                {
                    Accom = new Accom()
                    {
                        Code = accomId,
                        Date = _nowDateTime,
                        Id = accomId,
                        Stay = 7,
                        Unit = new List<Unit>()
                        {
                            new Unit()
                            {
                                Code = "DB03",
                            }
                        }
                    }
                }
            };

            //to test the similar second method EnrichWithFreeNightsInfo, but with other arguments
            var offersClone = offers.ShallowClone();
            var offerClone = offersClone.FirstOrDefault();

            var freeNightsInfo = new FreeNightsInfo()
            {
                FreeNightsIncluded = 1, //offer dates matches freeNight dates and ((offer.Stay) / (freenight.CurrentStay)) * freenight.CurrentFree = 1 free nights
                FreeNightsPromo = accomFreeNights.AvailableFreeNights
            };

            _dbContext.Setup(context =>
                    context.LoadAsync<AccomFreeNights>(accomId, It.IsAny<LoadConfig>(), default))
                .ReturnsAsync(accomFreeNights);

            var freeNightsService = new FreeNightsService(_dbContext.Object, null, _cacheService, _awsSettings, _cacheSettings);

            await freeNightsService.EnrichWithFreeNightsInfo(offers);

            await freeNightsService.EnrichWithFreeNightsInfo(offerClone.Accom.Code, offerClone.Accom.Date, offerClone.Accom.Stay, offerClone.Accom.Unit);

            var resultOffer = offers.Where(offer => offer.Accom.Code.Equals(accomId)).FirstOrDefault();
            var offerCloneResult = offersClone.Where(offer => offer.Accom.Code.Equals(accomId)).FirstOrDefault();

            resultOffer.Accom.Unit.FirstOrDefault().FreeNights.Should().BeEquivalentTo(freeNightsInfo);
            offerCloneResult.Accom.Unit.FirstOrDefault().FreeNights.Should().BeEquivalentTo(freeNightsInfo);
        }

        [Theory]
        [AutoData]
        public async Task EnrichWithFreeNightsInfo_UnitIncludes2FreeNights_CorrectFreeNightsInfo(string accomId, string accomName)
        {
            var accomFreeNights = new AccomFreeNights()
            {
                AccommodationCode = accomId,
                AccommodationName = accomName,
                AvailableFreeNights = new List<FreeNight>()
                {
                    new FreeNight()
                    {
                        CurrentFree = 1,
                        CurrentStay = 7,
                        TravelStartDate = _nowDateTime,
                        TravelEndDate = _nowDateTime.AddDays(14),
                        MinStay = 1,
                        RoomCode = "DB03"
                    }
                }
            };

            var offers = new List<Offer>()
            {
                new Offer()
                {
                    Accom = new Accom()
                    {
                        Code = accomId,
                        Date = _nowDateTime,
                        Id = accomId,
                        Stay = 14,
                        Unit = new List<Unit>()
                        {
                            new Unit()
                            {
                                Code = "DB03",
                            }
                        }
                    }
                }
            };

            //to test the similar second method EnrichWithFreeNightsInfo, but with other arguments
            var offersClone = offers.ShallowClone();
            var offerClone = offersClone.FirstOrDefault();

            var freeNightsInfo = new FreeNightsInfo()
            {
                FreeNightsIncluded = 2, //offer dates matches freeNight dates and ((offer.Stay) / (freenight.CurrentStay)) * freenight.CurrentFree = 2 free nights
                FreeNightsPromo = accomFreeNights.AvailableFreeNights
            };


            _dbContext.Setup(context =>
                    context.LoadAsync<AccomFreeNights>(accomId, It.IsAny<LoadConfig>(), default))
                .ReturnsAsync(accomFreeNights);

            var freeNightsService = new FreeNightsService(_dbContext.Object, null, _cacheService, _awsSettings, _cacheSettings);

            await freeNightsService.EnrichWithFreeNightsInfo(offers);

            var resultOffer = offers.Where(offer => offer.Accom.Code.Equals(accomId)).FirstOrDefault();
            var offerCloneResult = offersClone.Where(offer => offer.Accom.Code.Equals(accomId)).FirstOrDefault();

            resultOffer.Accom.Unit.FirstOrDefault().FreeNights.Should().BeEquivalentTo(freeNightsInfo);
            offerCloneResult.Accom.Unit.FirstOrDefault().FreeNights.Should().BeEquivalentTo(freeNightsInfo);
        }

        [Theory]
        [AutoData]
        public async Task EnrichWithFreeNightsInfo_UnitNotIncludeFreeNightsByRoomType_NoFreeNights(string accomId, string accomName)
        {
            var accomFreeNights = new AccomFreeNights()
            {
                AccommodationCode = accomId,
                AccommodationName = accomName,
                AvailableFreeNights = new List<FreeNight>()
                {
                    new FreeNight()
                    {
                        CurrentFree = 1,
                        CurrentStay = 7,
                        TravelStartDate = _nowDateTime,
                        TravelEndDate = _nowDateTime.AddDays(14),
                        MinStay = 1,
                        RoomCode = "DB02" //not match with offer RoomCode
                    }
                }
            };

            var offers = new List<Offer>()
            {
                new Offer()
                {
                    Accom = new Accom()
                    {
                        Code = accomId,
                        Date = _nowDateTime,
                        Id = accomId,
                        Stay = 14,
                        Unit = new List<Unit>()
                        {
                            new Unit()
                            {
                                Code = "DB03",
                            }
                        }
                    }
                }
            };

            //to test the similar second method EnrichWithFreeNightsInfo, but with other arguments
            var offersClone = offers.ShallowClone();
            var offerClone = offersClone.FirstOrDefault();

            var freeNightsInfo = new FreeNightsInfo()
            {
                FreeNightsIncluded = 0, //wrong roomCode
                FreeNightsPromo = new List<FreeNight>()
            };

            _dbContext.Setup(context =>
                    context.LoadAsync<AccomFreeNights>(accomId, It.IsAny<LoadConfig>(), default))
                .ReturnsAsync(accomFreeNights);

            var freeNightsService = new FreeNightsService(_dbContext.Object, null, _cacheService, _awsSettings, _cacheSettings);

            await freeNightsService.EnrichWithFreeNightsInfo(offers);

            var resultOffer = offers.Where(offer => offer.Accom.Code.Equals(accomId)).FirstOrDefault();
            var offerCloneResult = offersClone.Where(offer => offer.Accom.Code.Equals(accomId)).FirstOrDefault();

            resultOffer.Accom.Unit.FirstOrDefault().FreeNights.Should().BeEquivalentTo(freeNightsInfo);
            offerCloneResult.Accom.Unit.FirstOrDefault().FreeNights.Should().BeEquivalentTo(freeNightsInfo);
        }

        [Theory]
        [AutoData]
        public async Task EnrichWithFreeNightsInfo_UnitNotIncludeFreeNightsByDates_NoFreeNights(string accomId, string accomName)
        {
            var accomFreeNights = new AccomFreeNights()
            {
                AccommodationCode = accomId,
                AccommodationName = accomName,
                AvailableFreeNights = new List<FreeNight>()
                {
                    new FreeNight()
                    {
                        CurrentFree = 1,
                        CurrentStay = 7,
                        TravelStartDate = _nowDateTime,
                        TravelEndDate = _nowDateTime.AddDays(14),
                        MinStay = 1,
                        RoomCode = "DB03"
                    }
                }
            };

            var offers = new List<Offer>()
            {
                new Offer()
                {
                    Accom = new Accom()
                    {
                        Code = accomId,
                        Date = _nowDateTime.AddDays(14), //not match with freenights dates
                        Id = accomId,
                        Stay = 14,
                        Unit = new List<Unit>()
                        {
                            new Unit()
                            {
                                Code = "DB03",
                            }
                        }
                    }
                }
            };

            //to test the similar second method EnrichWithFreeNightsInfo, but with other arguments
            var offersClone = offers.ShallowClone();
            var offerClone = offersClone.FirstOrDefault();

            var freeNightsInfo = new FreeNightsInfo()
            {
                FreeNightsIncluded = 0,
                FreeNightsPromo = accomFreeNights.AvailableFreeNights //because offer room code matches with freeNights room code
            };


            _dbContext.Setup(context =>
                    context.LoadAsync<AccomFreeNights>(accomId, It.IsAny<LoadConfig>(), default))
                .ReturnsAsync(accomFreeNights);

            var freeNightsService = new FreeNightsService(_dbContext.Object, null, _cacheService, _awsSettings, _cacheSettings);

            await freeNightsService.EnrichWithFreeNightsInfo(offers);

            var resultOffer = offers.Where(offer => offer.Accom.Code.Equals(accomId)).FirstOrDefault();
            var offerCloneResult = offersClone.Where(offer => offer.Accom.Code.Equals(accomId)).FirstOrDefault();

            resultOffer.Accom.Unit.FirstOrDefault().FreeNights.Should().BeEquivalentTo(freeNightsInfo);
            offerCloneResult.Accom.Unit.FirstOrDefault().FreeNights.Should().BeEquivalentTo(freeNightsInfo);
        }

        [Theory]
        [AutoData]
        public async Task EnrichWithFreeNightsInfo_UnitNotIncludeFreeNightsByDatesAndRoomCode_NoFreeNights(string accomId, string accomName)
        {
            var accomFreeNights = new AccomFreeNights()
            {
                AccommodationCode = accomId,
                AccommodationName = accomName,
                AvailableFreeNights = new List<FreeNight>()
                {
                    new FreeNight()
                    {
                        CurrentFree = 1,
                        CurrentStay = 7,
                        TravelStartDate = _nowDateTime,
                        TravelEndDate = _nowDateTime.AddDays(14),
                        MinStay = 1,
                        RoomCode = "DB03"
                    }
                }
            };

            var offers = new List<Offer>()
            {
                new Offer()
                {
                    Accom = new Accom()
                    {
                        Code = accomId,
                        Date = _nowDateTime.AddDays(14), //not match with freenights dates
                        Id = accomId,
                        Stay = 14,
                        Unit = new List<Unit>()
                        {
                            new Unit()
                            {
                                Code = "DB02",
                            }
                        }
                    }
                }
            };

            //to test the similar second method EnrichWithFreeNightsInfo, but with other arguments
            var offersClone = offers.ShallowClone();
            var offerClone = offersClone.FirstOrDefault();

            var freeNightsInfo = new FreeNightsInfo()
            {
                FreeNightsIncluded = 0,
                FreeNightsPromo = new List<FreeNight>() //because offer room code doesn't match with freeNights room code
            };


            _dbContext.Setup(context =>
                    context.LoadAsync<AccomFreeNights>(accomId, It.IsAny<LoadConfig>(), default))
                .ReturnsAsync(accomFreeNights);

            var freeNightsService = new FreeNightsService(_dbContext.Object, null, _cacheService, _awsSettings, _cacheSettings);

            await freeNightsService.EnrichWithFreeNightsInfo(offers);

            var resultOffer = offers.Where(offer => offer.Accom.Code.Equals(accomId)).FirstOrDefault();
            var offerCloneResult = offersClone.Where(offer => offer.Accom.Code.Equals(accomId)).FirstOrDefault();

            resultOffer.Accom.Unit.FirstOrDefault().FreeNights.Should().BeEquivalentTo(freeNightsInfo);
            offerCloneResult.Accom.Unit.FirstOrDefault().FreeNights.Should().BeEquivalentTo(freeNightsInfo);
        }

        [Theory]
        [AutoData]
        public async Task EnrichWithFreeNightsInfo_UnitNotIncludeFreeNightsByOfferDuration_CorrectFreeNightsInfo(string accomId, string accomName)
        {
            var accomFreeNights = new AccomFreeNights()
            {
                AccommodationCode = accomId,
                AccommodationName = accomName,
                AvailableFreeNights = new List<FreeNight>()
                {
                    new FreeNight()
                    {
                        CurrentFree = 1,
                        CurrentStay = 7,
                        TravelStartDate = _nowDateTime,
                        TravelEndDate = _nowDateTime.AddDays(7),
                        MinStay = 1,
                        RoomCode = "DB03"
                    }
                }
            };

            var offers = new List<Offer>()
            {
                new Offer()
                {
                    Accom = new Accom()
                    {
                        Code = accomId,
                        Date = _nowDateTime,
                        Id = accomId,
                        Stay = 6,  // no match with free night currentStay value
                        Unit = new List<Unit>()
                        {
                            new Unit()
                            {
                                Code = "DB03",
                            }
                        }
                    }
                }
            };

            //to test the similar second method EnrichWithFreeNightsInfo, but with other arguments
            var offersClone = offers.ShallowClone();
            var offerClone = offersClone.FirstOrDefault();

            var freeNightsInfo = new FreeNightsInfo()
            {
                FreeNightsIncluded = 0,
                FreeNightsPromo = accomFreeNights.AvailableFreeNights //because offer room code matches with freeNights room code
            };


            _dbContext.Setup(context =>
                    context.LoadAsync<AccomFreeNights>(accomId, It.IsAny<LoadConfig>(), default))
                .ReturnsAsync(accomFreeNights);

            var freeNightsService = new FreeNightsService(_dbContext.Object, null, _cacheService, _awsSettings, _cacheSettings);

            await freeNightsService.EnrichWithFreeNightsInfo(offers);

            var resultOffer = offers.Where(offer => offer.Accom.Code.Equals(accomId)).FirstOrDefault();
            var offerCloneResult = offersClone.Where(offer => offer.Accom.Code.Equals(accomId)).FirstOrDefault();

            resultOffer.Accom.Unit.FirstOrDefault().FreeNights.Should().BeEquivalentTo(freeNightsInfo);
            offerCloneResult.Accom.Unit.FirstOrDefault().FreeNights.Should().BeEquivalentTo(freeNightsInfo);
        }

        [Theory]
        [AutoData]
        public async Task EnrichWithFreeNightsInfo_UnitIncludes1FreeNightsRoomCodeAll_CorrectFreeNightsInfo(string accomId, string accomName)
        {
            var accomFreeNights = new AccomFreeNights()
            {
                AccommodationCode = accomId,
                AccommodationName = accomName,
                AvailableFreeNights = new List<FreeNight>()
                {
                    new FreeNight()
                    {
                        CurrentFree = 1,
                        CurrentStay = 7,
                        TravelStartDate = _nowDateTime,
                        TravelEndDate = _nowDateTime.AddDays(7),
                        MinStay = 1,
                        RoomCode = "ALL"
                    }
                }
            };

            var offers = new List<Offer>()
            {
                new Offer()
                {
                    Accom = new Accom()
                    {
                        Code = accomId,
                        Date = _nowDateTime,
                        Id = accomId,
                        Stay = 7,
                        Unit = new List<Unit>()
                        {
                            new Unit()
                            {
                                Code = "DB03",
                            }
                        }
                    }
                }
            };

            //to test the similar second method EnrichWithFreeNightsInfo, but with other arguments
            var offersClone = offers.ShallowClone();
            var offerClone = offersClone.FirstOrDefault();

            var freeNightsInfo = new FreeNightsInfo()
            {
                FreeNightsIncluded = 1, //offer dates matches freeNight dates and ((offer.Stay) / (freenight.CurrentStay)) * freenight.CurrentFree = 1 free nights
                FreeNightsPromo = accomFreeNights.AvailableFreeNights
            };


            _dbContext.Setup(context =>
                    context.LoadAsync<AccomFreeNights>(accomId, It.IsAny<LoadConfig>(), default))
                .ReturnsAsync(accomFreeNights);

            var freeNightsService = new FreeNightsService(_dbContext.Object, null, _cacheService, _awsSettings, _cacheSettings);

            await freeNightsService.EnrichWithFreeNightsInfo(offers);

            var resultOffer = offers.Where(offer => offer.Accom.Code.Equals(accomId)).FirstOrDefault();
            var offerCloneResult = offersClone.Where(offer => offer.Accom.Code.Equals(accomId)).FirstOrDefault();

            resultOffer.Accom.Unit.FirstOrDefault().FreeNights.Should().BeEquivalentTo(freeNightsInfo);
            offerCloneResult.Accom.Unit.FirstOrDefault().FreeNights.Should().BeEquivalentTo(freeNightsInfo);
        }

        [Theory]
        [AutoData]
        public async Task EnrichWithFreeNightsInfo_UnitIncludes1FreeNightsByOfferPartDuration_CorrectFreeNightsInfo(string accomId, string accomName)
        {
            var accomFreeNights = new AccomFreeNights()
            {
                AccommodationCode = accomId,
                AccommodationName = accomName,
                AvailableFreeNights = new List<FreeNight>()
                {
                    new FreeNight()
                    {
                        CurrentFree = 1,
                        CurrentStay = 7,
                        TravelStartDate = _nowDateTime,
                        TravelEndDate = _nowDateTime.AddDays(7),
                        MinStay = 1,
                        RoomCode = "DB03"
                    }
                }
            };

            var offers = new List<Offer>()
            {
                new Offer()
                {
                    Accom = new Accom()
                    {
                        Code = accomId,
                        Date = _nowDateTime.AddDays(-2), //minus 2 days, but we extend stay to 9 nights
                        Id = accomId,
                        Stay = 9,
                        Unit = new List<Unit>()
                        {
                            new Unit()
                            {
                                Code = "DB03",
                            }
                        }
                    }
                }
            };

            //to test the similar second method EnrichWithFreeNightsInfo, but with other arguments
            var offersClone = offers.ShallowClone();
            var offerClone = offersClone.FirstOrDefault();

            var freeNightsInfo = new FreeNightsInfo()
            {
                FreeNightsIncluded = 1, //part of the offer dates (9-2 = 7 nights) matches freeNight dates and ((offer.Stay) / (freenight.CurrentStay)) * freenight.CurrentFree = 1 free nights
                FreeNightsPromo = accomFreeNights.AvailableFreeNights
            };


            _dbContext.Setup(context =>
                    context.LoadAsync<AccomFreeNights>(accomId, It.IsAny<LoadConfig>(), default))
                .ReturnsAsync(accomFreeNights);

            var freeNightsService = new FreeNightsService(_dbContext.Object, null, _cacheService, _awsSettings, _cacheSettings);

            await freeNightsService.EnrichWithFreeNightsInfo(offers);

            var resultOffer = offers.Where(offer => offer.Accom.Code.Equals(accomId)).FirstOrDefault();
            var offerCloneResult = offersClone.Where(offer => offer.Accom.Code.Equals(accomId)).FirstOrDefault();

            resultOffer.Accom.Unit.FirstOrDefault().FreeNights.Should().BeEquivalentTo(freeNightsInfo);
            offerCloneResult.Accom.Unit.FirstOrDefault().FreeNights.Should().BeEquivalentTo(freeNightsInfo);
        }

        [Theory]
        [AutoData]
        public async Task EnrichWithFreeNightsInfo_OneUnitFromOFfersIncludes1FreeNightsByRoomType_CorrectFreeNightsInfo(string accomId, string accomName)
        {
            var accomFreeNights = new AccomFreeNights()
            {
                AccommodationCode = accomId,
                AccommodationName = accomName,
                AvailableFreeNights = new List<FreeNight>()
                {
                    new FreeNight()
                    {
                        CurrentFree = 1,
                        CurrentStay = 7,
                        TravelStartDate = _nowDateTime,
                        TravelEndDate = _nowDateTime.AddDays(7),
                        MinStay = 1,
                        RoomCode = "DB03"
                    }
                }
            };

            var offers = new List<Offer>()
            {
                new Offer()
                {
                    Accom = new Accom()
                    {
                        Code = accomId,
                        Date = _nowDateTime,
                        Id = accomId,
                        Stay = 7,
                        Unit = new List<Unit>()
                        {
                            new Unit()
                            {
                                Code = "DB03",
                            }
                        }
                    }
                },
                new Offer()
                {
                    Accom = new Accom()
                    {
                        Code = accomId,
                        Date = _nowDateTime,
                        Id = accomId,
                        Stay = 7,
                        Unit = new List<Unit>()
                        {
                            new Unit()
                            {
                                Code = "DB04",  //not match with free nights room code
                            }
                        }
                    }
                }

            };

            //to test the similar second method EnrichWithFreeNightsInfo, but with other arguments
            var offersClone = offers.ShallowClone();
            var offerClone = offersClone.FirstOrDefault();

            var freeNightsInfo = new FreeNightsInfo()
            {
                FreeNightsIncluded = 1, //offer dates matches freeNight dates and ((offer.Stay) / (freenight.CurrentStay)) * freenight.CurrentFree = 1 free nights
                FreeNightsPromo = accomFreeNights.AvailableFreeNights
            };


            _dbContext.Setup(context =>
                    context.LoadAsync<AccomFreeNights>(accomId, It.IsAny<LoadConfig>(), default))
                .ReturnsAsync(accomFreeNights);

            var freeNightsService = new FreeNightsService(_dbContext.Object, null, _cacheService, _awsSettings, _cacheSettings);

            await freeNightsService.EnrichWithFreeNightsInfo(offers);

            var resultOffer = offers.Where(offer => offer.Accom.Code.Equals(accomId)).FirstOrDefault();
            var offerCloneResult = offersClone.Where(offer => offer.Accom.Code.Equals(accomId)).FirstOrDefault();

            resultOffer.Accom.Unit.FirstOrDefault().FreeNights.Should().BeEquivalentTo(freeNightsInfo);
            offerCloneResult.Accom.Unit.FirstOrDefault().FreeNights.Should().BeEquivalentTo(freeNightsInfo);
        }

        [Theory]
        [AutoData]
        public async Task EnrichWithFreeNightsInfo_UnitNotIncludeFreeNightsByMinStay_CorrectFreeNightsInfo(string accomId, string accomName)
        {
            var accomFreeNights = new AccomFreeNights()
            {
                AccommodationCode = accomId,
                AccommodationName = accomName,
                AvailableFreeNights = new List<FreeNight>()
                {
                    new FreeNight()
                    {
                        CurrentFree = 1,
                        CurrentStay = 7,
                        TravelStartDate = _nowDateTime,
                        TravelEndDate = _nowDateTime.AddDays(7),
                        MinStay = 8,
                        RoomCode = "DB03"
                    }
                }
            };

            var offers = new List<Offer>()
            {
                new Offer()
                {
                    Accom = new Accom()
                    {
                        Code = accomId,
                        Date = _nowDateTime,
                        Id = accomId,
                        Stay = 7, //not match with free nights MinStay = 8
                        Unit = new List<Unit>()
                        {
                            new Unit()
                            {
                                Code = "DB03",
                            }
                        }
                    }
                }
            };

            //to test the similar second method EnrichWithFreeNightsInfo, but with other arguments
            var offersClone = offers.ShallowClone();
            var offerClone = offersClone.FirstOrDefault();

            var freeNightsInfo = new FreeNightsInfo()
            {
                FreeNightsIncluded = 0, //offer stay doesn't match with MinStay value
                FreeNightsPromo = accomFreeNights.AvailableFreeNights
            };


            _dbContext.Setup(context =>
                    context.LoadAsync<AccomFreeNights>(accomId, It.IsAny<LoadConfig>(), default))
                .ReturnsAsync(accomFreeNights);

            var freeNightsService = new FreeNightsService(_dbContext.Object, null, _cacheService, _awsSettings, _cacheSettings);

            await freeNightsService.EnrichWithFreeNightsInfo(offers);

            var resultOffer = offers.Where(offer => offer.Accom.Code.Equals(accomId)).FirstOrDefault();
            var offerCloneResult = offersClone.Where(offer => offer.Accom.Code.Equals(accomId)).FirstOrDefault();

            resultOffer.Accom.Unit.FirstOrDefault().FreeNights.Should().BeEquivalentTo(freeNightsInfo);
            offerCloneResult.Accom.Unit.FirstOrDefault().FreeNights.Should().BeEquivalentTo(freeNightsInfo);
        }
    }
}