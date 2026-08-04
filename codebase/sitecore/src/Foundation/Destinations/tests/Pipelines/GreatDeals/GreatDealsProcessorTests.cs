using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Pipelines.Arguments;
using easyJet.Foundation.Destinations.Pipelines.GreatDealsUpload;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.Multisite;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyjet.Foundation.Testing.Attributes;
using FluentAssertions;
using NSubstitute;
using Sitecore.ContentSearch.Linq;
using Sitecore.FakeDb;
using Sitecore.Globalization;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Pipelines.GreatDeals
{
    public class GreatDealsProcessorTests
    {
        private readonly IDestinationsSearchService destinationsSearchService;
        private readonly IDestinationsRepository destinationsRepository;
        private readonly IDestinationsLogger logger;
        private readonly IMultiSiteContext multiSiteContext;
        private readonly IUserCreationService userCreationService;

        private readonly GreatDealsProcessor processor;
        private readonly IDatabaseProvider databaseProvider;

        public GreatDealsProcessorTests()
        {
            destinationsSearchService = Substitute.For<IDestinationsSearchService>();
            destinationsRepository = Substitute.For<IDestinationsRepository>();
            logger = Substitute.For<IDestinationsLogger>();
            multiSiteContext = Substitute.For<IMultiSiteContext>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            userCreationService = Substitute.For<IUserCreationService>();
            processor = new GreatDealsProcessor(destinationsSearchService, destinationsRepository, multiSiteContext, databaseProvider, logger, userCreationService);
        }

        [Theory]
        [AutoDbData]
        public void SynchronizeItems_ShouldBeEmpty_IfHotelsNotFound(Db db)
        {
            // Arrange
            var fileModel = new List<GreatDealUploadRow>();
            var hits = new List<SearchHit<HotelSyncSearchResultItem>>();
            var results = new SearchResults<HotelSyncSearchResultItem>(hits, 1);

            var contextItem = new DbItem("Item");
            contextItem.Fields.Add(new DbField(Constants.Fields.Message.Output));
            db.Add(contextItem);

            var args = new UploadPipelineArgs<GreatDealUploadRow>()
            {
                ContextItem = db.GetItem(contextItem.ID),
                UploadData = fileModel
            };
            destinationsRepository.SearchSyncHotelsByQuery(Arg.Any<Expression<Func<HotelSyncSearchResultItem, bool>>>(), Arg.Any<Language>(), Arg.Any<List<string>>()).Returns(results);

            // Act
            processor.ProcessSync(args);

            // Assert
            args.ProcessedItems.Should().BeEmpty();
        }

        [Theory]
        [AutoDbData]
        public void SynchronizeItems_ShouldBeNotEmpty_IfSearchHasNoHotelsWithCodes(Db db)
        {
            // Arrange
            var fileModel = new List<GreatDealUploadRow>()
            {
                new GreatDealUploadRow()
                {
                    GiataCode = "CODE2",
                    HotelName = "HotelName"
                }
            };

            var hits = new List<SearchHit<HotelSyncSearchResultItem>>();
            var accommodationDbItem = new DbItem("Hotel 1")
            {
                new DbField(Constants.Fields.AccommodationItem.GiataCode)
                {
                    Value = "CODE1"
                },
                new DbField(Constants.Fields.AccommodationItem.GreatDeal)
            };
            db.Add(accommodationDbItem);

            var accommodationDbItem2 = new DbItem("Hotel 2")
            {
                new DbField(Constants.Fields.AccommodationItem.GiataCode)
                {
                    Value = "CODE3"
                },
                new DbField(Constants.Fields.AccommodationItem.GreatDeal)
            };
            db.Add(accommodationDbItem2);

            var contextItem = new DbItem("Item");
            contextItem.Fields.Add(new DbField(Constants.Fields.Message.Output));
            db.Add(contextItem);

            var args = new UploadPipelineArgs<GreatDealUploadRow>()
            {
                ContextItem = db.GetItem(contextItem.ID),
                UploadData = fileModel
            };

            var accommodationItem = db.GetItem(accommodationDbItem.ID);
            var accommodationItem2 = db.GetItem(accommodationDbItem2.ID);

            hits.Add(new SearchHit<HotelSyncSearchResultItem>(1, new HotelSyncSearchResultItem()
            {
                Uri = accommodationItem.Uri,
                SourceCodes = new[] { "СODE1" }
            }));

            hits.Add(new SearchHit<HotelSyncSearchResultItem>(1, new HotelSyncSearchResultItem()
            {
                Uri = accommodationItem2.Uri,
                SourceCodes = new[] { "СODE3" }
            }));

            destinationsSearchService.GetHotelsByGiataCodes(new[] { "CODE1" }).ReturnsForAnyArgs(new[]
            {
                new BaseHotelSearchResultItem()
                {
                    ItemName = accommodationDbItem.Name,
                    Code = "CODE1",
                    GiataCode = "CODE1",
                    TemplateId = Constants.TemplateIds.Accommodation,
                    Uri = accommodationItem.Uri
                }
            });

            destinationsSearchService.GetHotelsByGiataCodes(new[] { "CODE3" }).ReturnsForAnyArgs(new[]
            {
                new BaseHotelSearchResultItem()
                {
                    ItemName = accommodationDbItem2.Name,
                    Code = "CODE3",
                    GiataCode = "CODE3",
                    TemplateId = Constants.TemplateIds.Accommodation,
                    Uri = accommodationItem2.Uri
                }
            });
            var results = new SearchResults<HotelSyncSearchResultItem>(hits, 1);
            destinationsRepository.SearchSyncHotelsByQuery(Arg.Any<Expression<Func<HotelSyncSearchResultItem, bool>>>(), Arg.Any<Language>(), Arg.Any<List<string>>()).Returns(results);

            databaseProvider.GetItem(accommodationItem.Uri, Arg.Any<Language>()).Returns(accommodationItem);
            databaseProvider.GetItem(accommodationItem2.Uri, Arg.Any<Language>()).Returns(accommodationItem2);
            // Act
            processor.ProcessSync(args);

            // Assert
            args.ProcessedItems.Count().Should().Be(3);
            args.ProcessedItems.ElementAt(0).Fields[Constants.Fields.AccommodationItem.GreatDeal].Value.Should().Be(Constants.Common.CheckboxFalseValue);
        }

        [Theory]
        [AutoDbData]
        public void SynchronizeItems_ShouldBeNotEmpty_IfSearchHasHotelsWithCodes(Db db)
        {
            // Arrange
            const string giataCode = "CODE1";
            var fileModel = new List<GreatDealUploadRow>()
            {
                new GreatDealUploadRow()
                {
                    GiataCode = giataCode,
                    HotelName = "HotelName"
                }
            };

            var hits = new List<SearchHit<HotelSyncSearchResultItem>>();
            var accommodationDbItem = new DbItem("Hotel 1")
            {
                new DbField(Constants.Fields.AccommodationItem.GiataCode)
                {
                    Value = giataCode
                },
                new DbField(Constants.Fields.AccommodationItem.GreatDeal)
            };
            db.Add(accommodationDbItem);

            var accommodationItem = db.GetItem(accommodationDbItem.ID);

            hits.Add(new SearchHit<HotelSyncSearchResultItem>(1, new HotelSyncSearchResultItem()
            {
                Uri = accommodationItem.Uri
            }));

            destinationsSearchService.GetHotelsByGiataCodes(Arg.Any<string[]>()).ReturnsForAnyArgs(new[]
            {
                new BaseHotelSearchResultItem()
                {
                    ItemName = accommodationDbItem.Name,
                    Code = giataCode,
                    GiataCode = giataCode,
                    TemplateId = Constants.TemplateIds.Accommodation,
                    Uri = accommodationItem.Uri
                }
            });
            var results = new SearchResults<HotelSyncSearchResultItem>(hits, 1);
            destinationsRepository.SearchSyncHotelsByQuery(Arg.Any<Expression<Func<HotelSyncSearchResultItem, bool>>>(), Arg.Any<Language>(), Arg.Any<List<string>>()).Returns(results);

            var contextItem = new DbItem("Item");
            contextItem.Fields.Add(new DbField(Constants.Fields.Message.Output));
            db.Add(contextItem);

            var args = new UploadPipelineArgs<GreatDealUploadRow>()
            {
                ContextItem = db.GetItem(contextItem.ID),
                UploadData = fileModel
            };
            databaseProvider.GetItem(accommodationItem.Uri, Arg.Any<Language>()).Returns(accommodationItem);
            // Act
            processor.ProcessSync(args);

            // Assert
            args.ProcessedItems.Count().Should().Be(2);
            args.ProcessedItems.ElementAt(1).Fields[Constants.Fields.AccommodationItem.GreatDeal].Value.Should().Be(Constants.Common.CheckboxTrueValue);
        }
    }
}
