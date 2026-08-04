using System.Collections.Generic;
using System.Linq;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.ContentSearch.Linq;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Services
{
    public class TransfersInfoSearchServiceTests
    {
        private readonly ITransferInfoRepository transferInfoRepository;
        private readonly ITransfersInfoSearchService transfersInfoSearchService;

        public TransfersInfoSearchServiceTests()
        {
            transferInfoRepository = Substitute.For<ITransferInfoRepository>();
            transfersInfoSearchService = new TransfersInfoSearchService(transferInfoRepository);
        }

        [Theory]
        [AutoData]
        public async void GetTransfersInfoByProductIds_ShouldReturnDocuments_IfItemsInSolr(string[] productIds)
        {
            // Arrange
            var hits = new List<SearchHit<BaseTransferInfoSearchResultItem>>()
            {
                new SearchHit<BaseTransferInfoSearchResultItem>(1, new BaseTransferInfoSearchResultItem()
                {
                    AirportId = "10",
                    ProductId = "10",
                    ResortId = "10"
                }),
                new SearchHit<BaseTransferInfoSearchResultItem>(1, new BaseTransferInfoSearchResultItem()
                {
                    AirportId = "20",
                    ProductId = "20",
                    ResortId = "20"
                })
            };

            var results = new SearchResults<BaseTransferInfoSearchResultItem>(hits, 2);

            transferInfoRepository.GetTransfersByProductIds(Arg.Any<string[]>()).ReturnsForAnyArgs(results);

            // Act
            var actual = await transfersInfoSearchService.GetTransfersInfoByProductIds(productIds, 10);

            // Assert
            actual.Count().Should().Be(2);
        }
    }
}
