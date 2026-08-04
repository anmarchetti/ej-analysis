using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using AutoFixture;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.AccommodationOffer;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.AWS.Services.ShortList;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.AWS.Tests.Services.ShortList
{
    public class ShortListServiceTests
    {

        private void BuildAwsSetttings(IFixture _fixture)
        {
            var awsSettings = _fixture.Freeze<Mock<IOptions<AwsSettings>>>();
            awsSettings
                .SetupGet(x => x.Value)
                .Returns(new AwsSettings
                {
                    Storage = new AwsSettingsStorage
                    {
                        Tables = new AwsSettingsStorageTables()
                        {
                            ShortList = "ShortList-Table"
                        }
                    },
                    UserData = new AwsUserData()
                    {
                        DefaultGroupping = "shortList"
                    }
                });
        }
        [Fact]
        public async Task GetUserShortList_Success_Result()
        {
            IFixture _fixture = FixtureUtils.AutoMoqFixture();

            BuildAwsSetttings(_fixture);

            var dynamoClient = _fixture.Freeze<Mock<IAmazonDynamoDB>>();

            dynamoClient
                .Setup(x => x.GetItemAsync(It.IsAny<GetItemRequest>(), It.IsAny<System.Threading.CancellationToken>()))
                .ReturnsAsync(new GetItemResponse
                {
                    Item = new Dictionary<string, AttributeValue>()
                    {
                        { "Data", new AttributeValue() {
                            SS = new List<string>()
                            {
                                "{\"iDep\":\"LGW\",\"iOrg\":\"AGP\",\"iTheme\":\"BF\",\"Id\":\"5f8e8315-254c-490a-a98b-5fd414eb2684\",\"CreatedAt\":\"2020-06-09T11:46:58.6135660Z\",\"Transfer\":\"ESCD0030AGPS\",\"IsExt\":false,\"AccommodationId\":\"ESCD0030\",\"OutboundRouteId\":\"E963d6dbea40aacf9f27c627c71f048d3\",\"InboundRouteId\":\"Ef25b10fa6443ee61bae3b01a51ac179d\",\"PackageId\":\"2151518079/2/975/7\",\"StartDate\":\"2010-09-02\",\"Duration\":[7],\"Departure\":\"LGW,LTN,STN,SEN\",\"Room\":[{\"Adults\":2,\"Children\":0,\"Infants\":0,\"RoomCode\":\"DB02\"}],\"BoardType\":\"AI\",\"TripAdvisorRating\":0,\"PriceFrom\":0.0,\"PriceTo\":0.0,\"IsPricePP\":false}"
                            }

                        } }
                    }
                });

            var awsClient = _fixture.Freeze<Mock<AwsClient>>();
            awsClient
                .Setup(x => x.GetClient())
                .Returns(dynamoClient.Object);

            _fixture.Inject(awsClient.Object);

            var sut = _fixture.Create<ShortListService>();

            var actual = await sut.GetUserShortList("test");

            actual.Count().Should().Be(1);
        }

        [Fact]
        public async Task GetUserShortList_Failed_Result()
        {
            IFixture _fixture = FixtureUtils.AutoMoqFixture();

            BuildAwsSetttings(_fixture);

            var dynamoClient = _fixture.Freeze<Mock<IAmazonDynamoDB>>();

            dynamoClient
                .Setup(x => x.GetItemAsync(It.IsAny<GetItemRequest>(), It.IsAny<System.Threading.CancellationToken>()))
                .ThrowsAsync(new Exception("Soemething went wrong"));

            var awsClient = _fixture.Freeze<Mock<AwsClient>>();
            awsClient
                .Setup(x => x.GetClient())
                .Returns(dynamoClient.Object);

            _fixture.Inject(awsClient.Object);

            var sut = _fixture.Create<ShortListService>();

            ApiException ex = null;

            try
            {
                var actual = await sut.GetUserShortList("test");
            }
            catch (ApiException e)
            {
                ex = e;
            }

            ex.Should().NotBeNull();
            ex.Code.Should().Be(ApiExceptionCodes.ShortListFailedToGet);
        }

        [Fact]
        public async Task CreateOrUpdate_Success_Result()
        {
            IFixture _fixture = FixtureUtils.AutoMoqFixture();

            BuildAwsSetttings(_fixture);

            var dynamoClient = _fixture.Freeze<Mock<IAmazonDynamoDB>>();

            dynamoClient
                .Setup(x => x.PutItemAsync(It.IsAny<PutItemRequest>(), It.IsAny<System.Threading.CancellationToken>()))
                .ReturnsAsync(new PutItemResponse());

            dynamoClient
                .Setup(x => x.GetItemAsync(It.IsAny<GetItemRequest>(), It.IsAny<System.Threading.CancellationToken>()))
                .ReturnsAsync(new GetItemResponse
                {
                    Item = new Dictionary<string, AttributeValue>()
                    {
                        { "Data", new AttributeValue() {
                            SS = new List<string>()
                            {
                                "{\"iDep\":\"LGW\",\"iOrg\":\"AGP\",\"iTheme\":\"BF\",\"Id\":\"5f8e8315-254c-490a-a98b-5fd414eb2684\",\"CreatedAt\":\"2020-06-09T11:46:58.6135660Z\",\"Transfer\":\"ESCD0030AGPS\",\"IsExt\":false,\"AccommodationId\":\"ESCD0030\",\"OutboundRouteId\":\"E963d6dbea40aacf9f27c627c71f048d3\",\"InboundRouteId\":\"Ef25b10fa6443ee61bae3b01a51ac179d\",\"PackageId\":\"2151518079/2/975/7\",\"StartDate\":\"2010-09-02\",\"Duration\":[7],\"Departure\":\"LGW,LTN,STN,SEN\",\"Room\":[{\"Adults\":2,\"Children\":0,\"Infants\":0,\"RoomCode\":\"DB02\"}],\"BoardType\":\"AI\",\"TripAdvisorRating\":0,\"PriceFrom\":0.0,\"PriceTo\":0.0,\"IsPricePP\":false}"
                            }
                        } }
                    }
                });

            var awsClient = _fixture.Freeze<Mock<AwsClient>>();
            awsClient
                .Setup(x => x.GetClient())
                .Returns(dynamoClient.Object);

            _fixture.Inject(awsClient.Object);

            var sut = _fixture.Create<ShortListService>();

            await sut.CreateOrUpdateUserShortList("test", new ShortListOfferRequest());

            dynamoClient.Verify(x => x.PutItemAsync(It.Is<PutItemRequest>(y => y.Item["Data"].SS.Count() == 2), It.IsAny<System.Threading.CancellationToken>()), Times.Once());
        }

        [Fact]
        public async Task CreateOrUpdate_Failed_Result()
        {
            IFixture _fixture = FixtureUtils.AutoMoqFixture();

            BuildAwsSetttings(_fixture);
            var dynamoClient = _fixture.Freeze<Mock<IAmazonDynamoDB>>();

            dynamoClient
                .Setup(x => x.PutItemAsync(It.IsAny<PutItemRequest>(), It.IsAny<System.Threading.CancellationToken>()))
                .ThrowsAsync(new Exception("Soemething went wrong"));

            dynamoClient
                .Setup(x => x.GetItemAsync(It.IsAny<GetItemRequest>(), It.IsAny<System.Threading.CancellationToken>()))
                .ReturnsAsync(new GetItemResponse
                {
                    Item = new Dictionary<string, AttributeValue>()
                    {
                        { "Data", new AttributeValue() {
                            SS = new List<string>()
                            {
                                "{\"iDep\":\"LGW\",\"iOrg\":\"AGP\",\"iTheme\":\"BF\",\"Id\":\"5f8e8315-254c-490a-a98b-5fd414eb2684\",\"CreatedAt\":\"2020-06-09T11:46:58.6135660Z\",\"Transfer\":\"ESCD0030AGPS\",\"IsExt\":false,\"AccommodationId\":\"ESCD0030\",\"OutboundRouteId\":\"E963d6dbea40aacf9f27c627c71f048d3\",\"InboundRouteId\":\"Ef25b10fa6443ee61bae3b01a51ac179d\",\"PackageId\":\"2151518079/2/975/7\",\"StartDate\":\"2010-09-02\",\"Duration\":[7],\"Departure\":\"LGW,LTN,STN,SEN\",\"Room\":[{\"Adults\":2,\"Children\":0,\"Infants\":0,\"RoomCode\":\"DB02\"}],\"BoardType\":\"AI\",\"TripAdvisorRating\":0,\"PriceFrom\":0.0,\"PriceTo\":0.0,\"IsPricePP\":false}"
                            }

                        } }
                    }
                });

            var awsClient = _fixture.Freeze<Mock<AwsClient>>();
            awsClient
                .Setup(x => x.GetClient())
                .Returns(dynamoClient.Object);

            _fixture.Inject(awsClient.Object);

            var sut = _fixture.Create<ShortListService>();

            ApiException ex = null;

            try
            {
                await sut.CreateOrUpdateUserShortList("test", new ShortListOfferRequest());
            }
            catch (ApiException e)
            {
                ex = e;
            }

            ex.Should().NotBeNull();
            ex.Code.Should().Be(ApiExceptionCodes.ShortListFailedToUpdate);
        }

        [Fact]
        public async Task RemoveOfferFormList_Success_Result()
        {
            IFixture _fixture = FixtureUtils.AutoMoqFixture();

            BuildAwsSetttings(_fixture);

            var dynamoClient = _fixture.Freeze<Mock<IAmazonDynamoDB>>();

            dynamoClient
                .Setup(x => x.PutItemAsync(It.IsAny<PutItemRequest>(), It.IsAny<System.Threading.CancellationToken>()))
                .ReturnsAsync(new PutItemResponse());

            dynamoClient
                .Setup(x => x.GetItemAsync(It.IsAny<GetItemRequest>(), It.IsAny<System.Threading.CancellationToken>()))
                .ReturnsAsync(new GetItemResponse
                {
                    Item = new Dictionary<string, AttributeValue>()
                    {
                        { "Data", new AttributeValue() {
                            SS = new List<string>()
                            {
                                "{\"iDep\":\"LGW\",\"iOrg\":\"AGP\",\"iTheme\":\"BF\",\"Id\":\"5f8e8315-254c-490a-a98b-5fd414eb2684\",\"CreatedAt\":\"2020-06-09T11:46:58.6135660Z\",\"Transfer\":\"ESCD0030AGPS\",\"IsExt\":false,\"AccommodationId\":\"ESCD0030\",\"OutboundRouteId\":\"E963d6dbea40aacf9f27c627c71f048d3\",\"InboundRouteId\":\"Ef25b10fa6443ee61bae3b01a51ac179d\",\"PackageId\":\"2151518079/2/975/7\",\"StartDate\":\"2010-09-02\",\"Duration\":[7],\"Departure\":\"LGW,LTN,STN,SEN\",\"Room\":[{\"Adults\":2,\"Children\":0,\"Infants\":0,\"RoomCode\":\"DB02\"}],\"BoardType\":\"AI\",\"TripAdvisorRating\":0,\"PriceFrom\":0.0,\"PriceTo\":0.0,\"IsPricePP\":false}",
                                "{\"iDep\":\"LGW\",\"iOrg\":\"AGP\",\"iTheme\":\"BF\",\"Id\":\"6f8e8315-254c-490a-a98b-5fd414eb2684\",\"CreatedAt\":\"2020-06-09T11:46:58.6135660Z\",\"Transfer\":\"ESCD0030AGPS\",\"IsExt\":false,\"AccommodationId\":\"ESCD0030\",\"OutboundRouteId\":\"E963d6dbea40aacf9f27c627c71f048d3\",\"InboundRouteId\":\"Ef25b10fa6443ee61bae3b01a51ac179d\",\"PackageId\":\"2151518079/2/975/7\",\"StartDate\":\"2010-09-02\",\"Duration\":[7],\"Departure\":\"LGW,LTN,STN,SEN\",\"Room\":[{\"Adults\":2,\"Children\":0,\"Infants\":0,\"RoomCode\":\"DB02\"}],\"BoardType\":\"AI\",\"TripAdvisorRating\":0,\"PriceFrom\":0.0,\"PriceTo\":0.0,\"IsPricePP\":false}"
                            }
                        } }
                    }
                });

            var awsClient = _fixture.Freeze<Mock<AwsClient>>();
            awsClient
                .Setup(x => x.GetClient())
                .Returns(dynamoClient.Object);

            _fixture.Inject(awsClient.Object);

            var sut = _fixture.Create<ShortListService>();

            await sut.RemoveOfferFormList("test", new List<string> { "5f8e8315-254c-490a-a98b-5fd414eb2684" });

            dynamoClient.Verify(x => x.PutItemAsync(It.Is<PutItemRequest>(y => y.Item["Data"].SS.Count() == 1), It.IsAny<System.Threading.CancellationToken>()), Times.Once());
        }

        [Fact]
        public async Task RemoveOfferFromList_Failed_Result()
        {
            IFixture _fixture = FixtureUtils.AutoMoqFixture();

            BuildAwsSetttings(_fixture);
            var dynamoClient = _fixture.Freeze<Mock<IAmazonDynamoDB>>();

            dynamoClient
                .Setup(x => x.PutItemAsync(It.IsAny<PutItemRequest>(), It.IsAny<System.Threading.CancellationToken>()))
                .ThrowsAsync(new Exception("Soemething went wrong"));

            dynamoClient
                .Setup(x => x.GetItemAsync(It.IsAny<GetItemRequest>(), It.IsAny<System.Threading.CancellationToken>()))
                .ReturnsAsync(new GetItemResponse
                {
                    Item = new Dictionary<string, AttributeValue>()
                    {
                        { "Data", new AttributeValue() {
                            SS = new List<string>()
                            {
                                "{\"iDep\":\"LGW\",\"iOrg\":\"AGP\",\"iTheme\":\"BF\",\"Id\":\"5f8e8315-254c-490a-a98b-5fd414eb2684\",\"CreatedAt\":\"2020-06-09T11:46:58.6135660Z\",\"Transfer\":\"ESCD0030AGPS\",\"IsExt\":false,\"AccommodationId\":\"ESCD0030\",\"OutboundRouteId\":\"E963d6dbea40aacf9f27c627c71f048d3\",\"InboundRouteId\":\"Ef25b10fa6443ee61bae3b01a51ac179d\",\"PackageId\":\"2151518079/2/975/7\",\"StartDate\":\"2010-09-02\",\"Duration\":[7],\"Departure\":\"LGW,LTN,STN,SEN\",\"Room\":[{\"Adults\":2,\"Children\":0,\"Infants\":0,\"RoomCode\":\"DB02\"}],\"BoardType\":\"AI\",\"TripAdvisorRating\":0,\"PriceFrom\":0.0,\"PriceTo\":0.0,\"IsPricePP\":false}"
                            }

                        } }
                    }
                });

            var awsClient = _fixture.Freeze<Mock<AwsClient>>();
            awsClient
                .Setup(x => x.GetClient())
                .Returns(dynamoClient.Object);

            _fixture.Inject(awsClient.Object);

            var sut = _fixture.Create<ShortListService>();

            ApiException ex = null;

            try
            {
                await sut.RemoveOfferFormList("test", new List<string> { "5f8e8315-254c-490a-a98b-5fd414eb2684" });
            }
            catch (ApiException e)
            {
                ex = e;
            }

            ex.Should().NotBeNull();
            ex.Code.Should().Be(ApiExceptionCodes.ShortListFailedToUpdate);
        }

        [Fact]
        public async Task CreateOrUpdateUserShortList_HotelIsShortlistedWithGiataCode_SaveCountNotIncreasedAndNoIdCreated()
        {
            IFixture _fixture = FixtureUtils.AutoMoqFixture();

            BuildAwsSetttings(_fixture);

            var dynamoClient = _fixture.Freeze<Mock<IAmazonDynamoDB>>();

            dynamoClient
                .Setup(x => x.GetItemAsync(It.IsAny<GetItemRequest>(), It.IsAny<System.Threading.CancellationToken>()))
                .ReturnsAsync(new GetItemResponse
                {
                    Item = new Dictionary<string, AttributeValue>()
                    {
                        { "Data", new AttributeValue()
                        {
                            SS = new List<string>()
                            {
                                  "{\"ITheme\":\"BA\",\"Id\":\"2d98d976-e0e3-4c68-af94-8a2a49ebd88d\",\"ShortListType\":\"hotel\",\"CreatedAt\":\"2026-04-14T07:35:46.4893259Z\",\"Language\":\"en\",\"GiataCode\":\"shortlisted-giata\",\"LateRoomCheckout\":false,\"AlternativeAccomodations\":[],\"IsExt\":false,\"FlexibleDays\":0,\"TripAdvisorRating\":0,\"PriceFrom\":0.0,\"PriceTo\":0.0,\"IsPricePP\":false,\"MarketCode\":\"UK\"}",
                            }
                        } }
                    }
                });

            var awsClient = _fixture.Freeze<Mock<AwsClient>>();
            awsClient
                .Setup(x => x.GetClient())
                .Returns(dynamoClient.Object);

            _fixture.Inject(awsClient.Object);

            //act
            var sut = _fixture.Create<ShortListService>();

            var actual = await sut.CreateOrUpdateUserShortList("test", new ShortListOfferRequest
            {
                Id = "5f8e8315-254c-490a-a98b-5fd414eb2684",
                GiataCode = "shortlisted-giata",
                ShortListType = Api.Domain.Data.PackageOffers.ShortList.ShortListType.Hotel
            });

            //assert
            actual.CreatedID.Should().Be(string.Empty);
            actual.SavedOffersCount.Should().Be(1);
        }

        [Fact]
        public async Task CreateOrUpdateUserShortList_HotelIsNotShortlistedWithGiata_Code_SaveCountIncreasedAndIdCreated()
        {
            IFixture _fixture = FixtureUtils.AutoMoqFixture();

            BuildAwsSetttings(_fixture);

            var dynamoClient = _fixture.Freeze<Mock<IAmazonDynamoDB>>();

            dynamoClient
                .Setup(x => x.GetItemAsync(It.IsAny<GetItemRequest>(), It.IsAny<System.Threading.CancellationToken>()))
                .ReturnsAsync(new GetItemResponse
                {
                    Item = new Dictionary<string, AttributeValue>()
                    {
                        { "Data", new AttributeValue()
                        {
                            SS = new List<string>()
                            {
                                  "{\"ITheme\":\"BA\",\"Id\":\"2d98d976-e0e3-4c68-af94-8a2a49ebd88d\",\"ShortListType\":\"hotel\",\"CreatedAt\":\"2026-04-14T07:35:46.4893259Z\",\"Language\":\"en\",\"GiataCode\":\"13472\",\"LateRoomCheckout\":false,\"AlternativeAccomodations\":[],\"IsExt\":false,\"FlexibleDays\":0,\"TripAdvisorRating\":0,\"PriceFrom\":0.0,\"PriceTo\":0.0,\"IsPricePP\":false,\"MarketCode\":\"UK\"}",
                            }
                        } }
                    }
                });

            var awsClient = _fixture.Freeze<Mock<AwsClient>>();
            awsClient
                .Setup(x => x.GetClient())
                .Returns(dynamoClient.Object);

            _fixture.Inject(awsClient.Object);

            //act
            var sut = _fixture.Create<ShortListService>();

            var actual = await sut.CreateOrUpdateUserShortList("test", new ShortListOfferRequest
            {
                Id = "5f8e8315-254c-490a-a98b-5fd414eb2684",
                GiataCode = "new-giata",
                ShortListType = Api.Domain.Data.PackageOffers.ShortList.ShortListType.Hotel
            });

            //assert
            actual.CreatedID.Should().NotBeNullOrEmpty();
            actual.SavedOffersCount.Should().Be(2);
        }

        [Fact]
        public async Task CreateOrUpdateUserShortList_OfferIsNotShortlistedWithGiata_Code_SaveCountIncreasedAndIdCreated()
        {
            IFixture _fixture = FixtureUtils.AutoMoqFixture();

            BuildAwsSetttings(_fixture);

            var dynamoClient = _fixture.Freeze<Mock<IAmazonDynamoDB>>();

            dynamoClient
                .Setup(x => x.GetItemAsync(It.IsAny<GetItemRequest>(), It.IsAny<System.Threading.CancellationToken>()))
                .ReturnsAsync(new GetItemResponse
                {
                    Item = new Dictionary<string, AttributeValue>()
                    {
                        { "Data", new AttributeValue()
                        {
                            SS = new List<string>()
                            {
                                  "{\"ITheme\":\"BA\",\"Id\":\"2d98d976-e0e3-4c68-af94-8a2a49ebd88d\",\"ShortListType\":\"hotel\",\"CreatedAt\":\"2026-04-14T07:35:46.4893259Z\",\"Language\":\"en\",\"GiataCode\":\"13472\",\"LateRoomCheckout\":false,\"AlternativeAccomodations\":[],\"IsExt\":false,\"FlexibleDays\":0,\"TripAdvisorRating\":0,\"PriceFrom\":0.0,\"PriceTo\":0.0,\"IsPricePP\":false,\"MarketCode\":\"UK\"}",
                            }
                        } }
                    }
                });

            var awsClient = _fixture.Freeze<Mock<AwsClient>>();
            awsClient
                .Setup(x => x.GetClient())
                .Returns(dynamoClient.Object);

            _fixture.Inject(awsClient.Object);

            //act
            var sut = _fixture.Create<ShortListService>();

            var actual = await sut.CreateOrUpdateUserShortList("test", new ShortListOfferRequest
            {
                Id = "5f8e8315-254c-490a-a98b-5fd414eb2684",
                AccommodationId = "ACC1",
                ShortListType = Api.Domain.Data.PackageOffers.ShortList.ShortListType.Offer
            });

            //assert
            actual.CreatedID.Should().NotBeNullOrEmpty();
            actual.SavedOffersCount.Should().Be(2);
        }
    }
}
