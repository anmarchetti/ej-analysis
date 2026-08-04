using System.Collections.Generic;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyJet.Foundation.Voucherify.Commands;
using easyJet.Foundation.Voucherify.ContentSearch.Repositories;
using easyJet.Foundation.Voucherify.Logging;
using easyJet.Foundation.Voucherify.Models.HotelGiataCodes;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Sitecore.Sites;
using Xunit;

namespace easyJet.Foundation.Voucherify.Tests.Commands
{
    public class HotelGiataCodesUploadCommandTests
    {
        private readonly HotelGiataCodesUploadCommand command;
        private readonly IDestinationsSearchService destinationsSearchService;
        private readonly IPromotionRepository promotionRepository;
        private readonly IDatabaseProvider databaseProvider;
        private readonly IVoucherifyLogger logger;
        private readonly ISitecoreUIService sitecoreUiService;

        public HotelGiataCodesUploadCommandTests()
        {
            destinationsSearchService = Substitute.For<IDestinationsSearchService>();
            promotionRepository = Substitute.For<IPromotionRepository>();
            var csvUtilsService = Substitute.For<ICsvUtilsService>();
            logger = Substitute.For<IVoucherifyLogger>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            var userCreationService = Substitute.For<IUserCreationService>();
            sitecoreUiService = Substitute.For<ISitecoreUIService>();
            command = Substitute.ForPartsOf<HotelGiataCodesUploadCommand>(destinationsSearchService, promotionRepository, csvUtilsService, logger, databaseProvider, userCreationService, sitecoreUiService);

            SiteContext siteContext = new SiteInfoPropertiesBuilder("TestSiteName")
                .WithHostName("test-site-host")
                .WithDatabase("test-database")
                .WithStartItem("/test/start/items");

            var fakeDb = Substitute.For<Database>();
            fakeDb.Name.Returns("fake-db");
            siteContext.Database = fakeDb;

            databaseProvider.GetSiteContext(Arg.Any<Item>()).Returns(siteContext);
        }

        [Fact]
        public void ProcessItems_ShouldBeEmpty_IfGetFileDataIsEmpty()
        {
            // Arrange
            var list = new List<HotelGiataCodesCsv>();
            command.GetFileData<HotelGiataCodesCsv>(Arg.Any<Item>()).Returns(list);
            var contextItem = new FakeItem();

            // Act
            var actual = command.ProcessItems(contextItem);

            // Assert
            actual.Should().BeEmpty();
        }

        [Fact]
        public void ProcessItems_ShouldBeEmpty_IfRowHasNoAtcomCode()
        {
            // Arrange
            var list = new List<HotelGiataCodesCsv>()
            {
                new HotelGiataCodesCsv()
                {
                    GiataCode = "GiataCode",
                    AtcomPromoCodes = null
                }
            };

            command.GetFileData<HotelGiataCodesCsv>(Arg.Any<Item>()).Returns(list);
            var contextItem = new FakeItem();

            // Act
            var actual = command.ProcessItems(contextItem);

            // Assert
            actual.Should().BeEmpty();
            logger.Received().Warn(Arg.Is<string>(x => x.Contains("AtcomPromoCodes not defined")), Arg.Any<object>());
        }

        [Fact]
        public void ProcessItems_ShouldBeEmpty_IfRowHasNoGiataCode()
        {
            // Arrange
            var list = new List<HotelGiataCodesCsv>()
            {
                new HotelGiataCodesCsv()
                {
                    GiataCode = null,
                    AtcomPromoCodes = null
                }
            };

            command.GetFileData<HotelGiataCodesCsv>(Arg.Any<Item>()).Returns(list);
            var contextItem = new FakeItem();

            // Act
            var actual = command.ProcessItems(contextItem);

            // Assert
            actual.Should().BeEmpty();
            logger.Received().Warn(Arg.Is<string>(x => x.Contains("GiataCode not defined")), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void ProcessItems_ShouldBeEmpty_IfRowHasNoMarketCode(string giataCode, string atcomPromoCode)
        {
            // Arrange
            var list = new List<HotelGiataCodesCsv>()
            {
                new HotelGiataCodesCsv()
                {
                    GiataCode = giataCode,
                    AtcomPromoCodes = atcomPromoCode,
                    MarketCode = null
                }
            };

            command.GetFileData<HotelGiataCodesCsv>(Arg.Any<Item>()).Returns(list);
            var contextItem = new FakeItem();

            // Act
            var actual = command.ProcessItems(contextItem);

            // Assert
            actual.Should().BeEmpty();
            logger.Received().Warn(Arg.Is<string>(x => x.Contains("MarketCode not defined")), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void ProcessItems_ShouldBeEmpty_IfRepositoryHasNoPromotion(string giataCode, string marketCode)
        {
            // Arrange
            var list = new List<HotelGiataCodesCsv>()
            {
                new HotelGiataCodesCsv()
                {
                    GiataCode = giataCode,
                    AtcomPromoCodes = "AtcomPromoCode1|AtcomPromoCode2",
                    MarketCode = marketCode
                }
            };

            command.GetFileData<HotelGiataCodesCsv>(Arg.Any<Item>()).Returns(list);
            var contextItem = new FakeItem();

            // Act
            var actual = command.ProcessItems(contextItem);

            // Assert
            actual.Should().BeEmpty();
            logger.Received().Warn(Arg.Is<string>(x => x.Contains("Promotion with AtcomPromoCode")), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void ProcessItems_ShouldBeEmpty_IfHasNoDestinationsWithGiataCode(string giataCode, string marketCode, string atcomPromoCode)
        {
            // Arrange
            var list = new List<HotelGiataCodesCsv>()
            {
                new HotelGiataCodesCsv()
                {
                    GiataCode = giataCode,
                    AtcomPromoCodes = atcomPromoCode,
                    MarketCode = marketCode
                }
            };

            command.GetFileData<HotelGiataCodesCsv>(Arg.Any<Item>()).Returns(list);
            var contextItem = new FakeItem();
            var promotionItem = new FakeItem();
            promotionRepository.GetPromotionByAtcomCode(Arg.Any<string>(), Arg.Any<string>()).Returns(promotionItem);

            List<BaseHotelSearchResultItem> hotelItems = null;
            destinationsSearchService.GetHotelsByGiataCodes(Arg.Any<string[]>()).Returns(hotelItems);

            // Act
            var actual = command.ProcessItems(contextItem);

            // Assert
            actual.Should().BeEmpty();
            logger.Received().Warn(Arg.Is<string>(x => x.Contains("Hotel Items not found for giataCodes")), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void ProcessItems_ShouldNotBeEmpty_IfHasNoDestinationsWithGiataCode(ID itemId, string giataCode, string marketCode, string atcomPromoCode)
        {
            // Arrange
            var list = new List<HotelGiataCodesCsv>()
            {
                new HotelGiataCodesCsv()
                {
                    GiataCode = giataCode,
                    AtcomPromoCodes = atcomPromoCode,
                    MarketCode = marketCode
                }
            };

            command.GetFileData<HotelGiataCodesCsv>(Arg.Any<Item>()).Returns(list);
            var contextItem = new FakeItem();
            var promotionItem = new FakeItem()
                .WithField(Templates.Promotion.Fields.Destination, string.Empty)
                .WithItemEditing();
            promotionRepository.GetPromotionByAtcomCode(Arg.Any<string>(), Arg.Any<string>()).Returns(promotionItem);

            var hotelItems = new List<BaseHotelSearchResultItem>()
            {
                new BaseHotelSearchResultItem()
                {
                    ItemId = itemId
                }
            };

            destinationsSearchService.GetHotelsByGiataCodes(Arg.Any<string[]>()).Returns(hotelItems);

            // Act
            var actual = command.ProcessItems(contextItem);

            // Assert
            actual.Should().NotBeEmpty();
        }
    }
}