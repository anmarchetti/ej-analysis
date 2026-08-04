using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using AutoFixture.Xunit2;
using easyJet.Foundation.Atcom.Logging;
using easyJet.Foundation.Atcom.Models.Domain;
using easyJet.Foundation.Atcom.Models.External;
using easyJet.Foundation.Atcom.Services;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using FluentAssertions;
using NSubstitute;
using Sitecore.Abstractions;
using Xunit;

namespace easyJet.Foundation.Atcom.Tests.Services
{
    public class VrpWebServiceTests
    {
        private readonly VrpWebService sut;
        private readonly BaseSettings settings;
        private readonly ICustomCacheRepository cache;

        public VrpWebServiceTests()
        {
            var loggerSub = Substitute.For<IAtcomLogger>();
            settings = Substitute.For<BaseSettings>();
            cache = Substitute.For<ICustomCacheRepository>();
            sut = Substitute.ForPartsOf<VrpWebService>(loggerSub, cache, settings);
        }

        [Theory]
        [AutoData]
        public void GetDataCollection_ShouldBeEmpty_IfResponseIsNull(string responseString)
        {
            AccommodationHeaderDataExportResponse response = null;

            // Arrange
            sut.GetResponseString(Arg.Any<string>(), Arg.Any<string>()).Returns(responseString);
            sut.GetResponse<AccommodationHeaderDataExportResponse>(Arg.Any<string>()).Returns(response);

            // Act
            var actual = sut.GetDataCollection();

            // Assert
            actual.Should().BeEmpty();
        }

        [Theory]
        [AutoData]
        public void GetDataCollection_ShouldBeGroupOfferByAccommodation_IfResponseHasData(string responseString)
        {
            AccommodationHeaderDataExportResponse response = new AccommodationHeaderDataExportResponse()
            {
                AccommodationHeaderDataEntry = new AccommodationHeaderDataEntry[]
                {
                    new AccommodationHeaderDataEntry() { Acc_Cd = "X90001" },
                    new AccommodationHeaderDataEntry() { Acc_Cd = "X90002" },
                }
            };

            // Arrange
            sut.GetResponseString(Arg.Any<string>(), Arg.Any<string>()).Returns(responseString);
            sut.GetResponse<AccommodationHeaderDataExportResponse>(Arg.Any<string>()).Returns(response);
            cache.StoreItem(Arg.Any<string>(), Arg.Any<Dictionary<string, AccommodationHeaderDataEntry>>(), Arg.Any<int>()).Returns(args => args[1]);

            // Act
            var actual = sut.GetDataCollection();

            // Assert
            actual.Should().NotBeNull();
            actual.Should().ContainKey("X90001");
            actual.Should().ContainKey("X90002");
        }

        [Theory]
        [AutoData]
        public void GetSpecialRequests_ShouldBeEmpty_IfResponseIsNull(string responseString)
        {
            SpecialRequestDataExportResponse response = null;

            // Arrange
            sut.GetResponseString(Arg.Any<string>(), Arg.Any<string>()).Returns(responseString);
            sut.GetResponse<SpecialRequestDataExportResponse>(Arg.Any<string>()).Returns(response);

            // Act
            var actual = sut.GetDataCollection();

            // Assert
            actual.Should().BeEmpty();
        }

        [Theory]
        [AutoData]
        public void GetSpecialRequests_ShouldBeGroupOfferByAccommodation_IfResponseHasData(string responseString)
        {
            SpecialRequestDataExportResponse response = new SpecialRequestDataExportResponse()
            {
                SpecialRequestType = new SpecialRequestDataExportResponseSpecialRequestType[]
                {
                    new SpecialRequestDataExportResponseSpecialRequestType()
                    {
                        TypeCode = "TypeCode01",
                        Desc = "Desc01",
                        SpecialRequest = new SpecialRequestDataExportResponseSpecialRequestTypeSpecialRequest[]
                        {
                            new SpecialRequestDataExportResponseSpecialRequestTypeSpecialRequest()
                            {
                                Code = "Code01",
                                Desc = "Desc01"
                            }
                        }
                    },
                    new SpecialRequestDataExportResponseSpecialRequestType()
                    {
                        TypeCode = "TypeCode02",
                        Desc = "Desc02",
                        SpecialRequest = new SpecialRequestDataExportResponseSpecialRequestTypeSpecialRequest[]
                        {
                            new SpecialRequestDataExportResponseSpecialRequestTypeSpecialRequest()
                            {
                                Code = "Code02",
                                Desc = "Desc02"
                            }
                        }
                    },
                }
            };

            // Arrange
            sut.GetResponseString(Arg.Any<string>(), Arg.Any<string>()).Returns(responseString);
            sut.GetResponse<SpecialRequestDataExportResponse>(Arg.Any<string>()).Returns(response);
            cache.StoreItem(Arg.Any<string>(), Arg.Any<List<SpecialRequestType>>(), Arg.Any<int>()).Returns(args => args[1]);

            // Act
            var actual = sut.GetSpecialRequests();

            // Assert
            actual.Should().NotBeNull();
            actual[0].Code.Should().Be("TypeCode01");
            actual[1].Code.Should().Be("TypeCode02");
            actual[0].SpecialRequests.First().Code.Should().Be("Code01");
            actual[1].SpecialRequests.First().Code.Should().Be("Code02");
        }
    }
}
