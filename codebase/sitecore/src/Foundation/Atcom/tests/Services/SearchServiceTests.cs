using System.Collections.Generic;
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
    public class SearchServiceTests
    {
        private readonly SearchService sut;
        private readonly BaseSettings settings;
        private readonly ICustomCacheRepository cache;

        public SearchServiceTests()
        {
            var loggerSub = Substitute.For<IAtcomLogger>();
            settings = Substitute.For<BaseSettings>();
            cache = Substitute.For<ICustomCacheRepository>();
            sut = Substitute.ForPartsOf<SearchService>(loggerSub, cache, settings);
        }

        [Theory]
        [AutoData]
        public void GetDataCollection_ShouldBeEmpty_IfResponseIsNull(string responseString)
        {
            AvCache avCache = null;

            // Arrange
            sut.GetResponseString(Arg.Any<string>()).Returns(responseString);
            sut.GetResponse<AvCache>(Arg.Any<string>()).Returns(avCache);

            // Act
            var actual = sut.GetDataCollection();

            // Assert
            actual.Should().BeEmpty();
        }

        [Theory]
        [AutoData]
        public void GetDataCollection_ShouldBeGroupOfferByAccommodation_IfResponseHasData(string responseString, AvCacheResultOffersOffer[] offers)
        {
            AvCache avCache = new AvCache()
            {
                Result = new AvCacheResult()
                {
                    Offers = new AvCacheResultOffers()
                    {
                        Offer = offers
                    }
                }
            };

            // Arrange
            sut.GetResponseString(Arg.Any<string>()).Returns(responseString);
            sut.GetResponse<AvCache>(Arg.Any<string>()).Returns(avCache);
            cache.StoreItem(Arg.Any<string>(), Arg.Any<Dictionary<string, AtcomAccommodation>>(), Arg.Any<int>()).Returns(args => args[1]);

            // Act
            var actual = sut.GetDataCollection();

            // Assert
            actual.Should().NotBeNull();
            actual.Should().ContainKey(offers[0].Accom[0].Code);
        }
    }
}
