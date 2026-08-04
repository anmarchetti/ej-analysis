using System;
using System.Collections.Generic;
using easyJet.Foundation.Multisite.ContentSearch.Queries;
using easyJet.Foundation.Multisite.ContentSearch.Repositories;
using easyJet.Foundation.Multisite.ContentSearch.SearchTypes;
using easyJet.Foundation.Multisite.Logging;
using easyJet.Foundation.Multisite.Pipelines.Publishing;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyjet.Foundation.Testing.Attributes;
using NSubstitute;
using Sitecore.ContentSearch.Linq;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Pipelines;
using Xunit;

namespace easyJet.Foundation.Multisite.Tests.Pipelines.Publishing
{
    public class AutoPublishProcessorTests
    {
        private readonly IMultisiteLogger multisiteLogger;
        private readonly IPublishingRepository publishingRepository;
        private readonly IDatabaseProvider databaseProvider;

        public AutoPublishProcessorTests()
        {
            databaseProvider = Substitute.For<IDatabaseProvider>();
            multisiteLogger = Substitute.For<IMultisiteLogger>();
            publishingRepository = Substitute.For<IPublishingRepository>();
        }

        [Theory]
        [AutoDbData]
        public void Process_ShouldPublishedItem_IfItemHasPublishiableDataRange(Item item)
        {
            // Arrange
            var publishableItem = Substitute.For<PublishableSearchResultItem>();

            publishableItem.GetItem().Returns(item);

            var hints = new List<SearchHit<PublishableSearchResultItem>>()
            {
                {
                    new SearchHit<PublishableSearchResultItem>(1, publishableItem)
                }
            };
            var results = new SearchResults<PublishableSearchResultItem>(hints, 1);

            publishingRepository.GetPublishableItem(Arg.Any<PublishableItemQueryArgs>()).Returns(results);

            var autoPublishProcessor = new AutoPublishProcessor(multisiteLogger, databaseProvider, publishingRepository);
            databaseProvider.GetItem(Arg.Any<ItemUri>()).Returns(item);
            // Act
            autoPublishProcessor.Process(new PipelineArgs() { ProcessorItem = item });

            // Assert
            multisiteLogger.Received().Info(Arg.Is<string>(x => x == "Started auto publish"), Arg.Any<object>());
            multisiteLogger.Received().Info(Arg.Is<string>(x => x == $"{1} items have been successfully published."), Arg.Any<object>());
        }

        [Fact]
        public void Process_ShouldLogException_IfMethodThrowException()
        {
            // Arrange
            var args = new PipelineArgs()
            {
                ProcessorItem = null
            };

            var autoPublishProcessor = new AutoPublishProcessor(multisiteLogger, databaseProvider, publishingRepository);

            // Act
            autoPublishProcessor.Process(args);

            // Assert
            multisiteLogger.Received().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }
    }
}
