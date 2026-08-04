using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using easyJet.Foundation.Presentation;
using easyJet.Foundation.Presentation.Logging;
using easyJet.Foundation.Presentation.Models;
using easyJet.Foundation.Presentation.Repositories;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Collections;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb.Sites;
using Sitecore.NSubstituteUtils;
using Sitecore.Sites;
using Xunit;

namespace easyJet.Foundation.Presentation.Tests.Repositories
{
    /// <summary>
    /// Proves the grouping algorithm of <see cref="PageDesignRepository.ResolveMatches"/> (matching by template,
    /// RootItem ancestor scoping, deepest-RootItem-per-Experience-Context-Provider, standard design first) and the
    /// designs-folder resolution: site presentation query in normal page mode, ancestor walk in the editors or
    /// when no site context / query result is available.
    /// </summary>
    public class PageDesignRepositoryTests
    {
        private const string ContextPath = "/sitecore/content/Holidays/Home/Deals/Spain/Hotel";
        private const string SiteRootPath = "/sitecore/content";
        private static readonly ID TemplateId = ID.NewID;
        private static readonly ID OtherTemplateId = ID.NewID;

        private readonly IPresentationLogger logger = Substitute.For<IPresentationLogger>();
        private readonly Database database = FakeUtil.FakeDatabase("master");

        [Fact]
        public void ResolveMatches_StandardDesign_IsFirst_AndPicksDeepestRootItem()
        {
            // ARRANGE
            var shallow = Design(ID.NewID, TemplateId, "/sitecore/content/Holidays");
            var deep = Design(ID.NewID, TemplateId, "/sitecore/content/Holidays/Home/Deals");

            // ACT
            var result = PageDesignRepository.ResolveMatches(ContextPath, TemplateId, new[] { shallow, deep }, logger);

            // ASSERT
            result.Should().ContainSingle();
            result[0].ProviderId.Should().Be(ID.Null);
            result[0].DesignId.Should().Be(deep.Id);
        }

        [Fact]
        public void ResolveMatches_IgnoresDesignsNotMatchingTemplate()
        {
            // ARRANGE
            var wrongTemplate = Design(ID.NewID, OtherTemplateId, null);

            // ACT
            var result = PageDesignRepository.ResolveMatches(ContextPath, TemplateId, new[] { wrongTemplate }, logger);

            // ASSERT
            result.Should().BeEmpty();
        }

        [Fact]
        public void ResolveMatches_IgnoresDesignsWhoseRootItemIsNotAncestor()
        {
            // ARRANGE
            var otherSite = Design(ID.NewID, TemplateId, "/sitecore/content/TradePortal");

            // ACT
            var result = PageDesignRepository.ResolveMatches(ContextPath, TemplateId, new[] { otherSite }, logger);

            // ASSERT
            result.Should().BeEmpty();
        }

        [Fact]
        public void ResolveMatches_MultipleProviders_OneWinnerPerProvider_StandardFirst()
        {
            // ARRANGE
            var providerA = ID.NewID;
            var providerB = ID.NewID;
            var standard = Design(ID.NewID, TemplateId, null);
            var aShallow = Design(ID.NewID, TemplateId, "/sitecore/content/Holidays", providerA);
            var aDeep = Design(ID.NewID, TemplateId, "/sitecore/content/Holidays/Home/Deals", providerA);
            var b = Design(ID.NewID, TemplateId, "/sitecore/content/Holidays/Home", providerB);

            // ACT
            var result = PageDesignRepository.ResolveMatches(ContextPath, TemplateId, new[] { standard, aShallow, aDeep, b }, logger);

            // ASSERT
            result.Should().HaveCount(3);
            result[0].ProviderId.Should().Be(ID.Null, "the standard design is always first");
            result[0].DesignId.Should().Be(standard.Id);
            result.Should().Contain(r => r.ProviderId == providerA && r.DesignId == aDeep.Id, "deepest RootItem wins for provider A");
            result.Should().Contain(r => r.ProviderId == providerB && r.DesignId == b.Id);
        }

        [Fact]
        public void ResolveMatches_NestedRootItems_DeeperWinsWithinProvider()
        {
            // ARRANGE — a RootItem inside another RootItem, both ancestors of the page
            var provider = ID.NewID;
            var outer = Design(ID.NewID, TemplateId, "/sitecore/content/Holidays/Home", provider);
            var inner = Design(ID.NewID, TemplateId, "/sitecore/content/Holidays/Home/Deals/Spain", provider);

            // ACT
            var result = PageDesignRepository.ResolveMatches(ContextPath, TemplateId, new[] { outer, inner }, logger);

            // ASSERT
            result.Should().ContainSingle();
            result[0].ProviderId.Should().Be(provider);
            result[0].DesignId.Should().Be(inner.Id);
        }

        [Fact]
        public void ResolveMatches_DesignAssignedToTwoProviders_AppearsForBoth()
        {
            // ARRANGE
            var providerA = ID.NewID;
            var providerB = ID.NewID;
            var shared = Design(ID.NewID, TemplateId, "/sitecore/content/Holidays/Home", providerA, providerB);

            // ACT
            var result = PageDesignRepository.ResolveMatches(ContextPath, TemplateId, new[] { shared }, logger);

            // ASSERT
            result.Should().HaveCount(2);
            result.Should().OnlyContain(r => r.DesignId == shared.Id);
            result.Select(r => r.ProviderId).Should().BeEquivalentTo(new[] { providerA, providerB });
        }

        [Fact]
        public void RootItemDepth_HandlesEmptyRoot_Ancestor_And_SegmentBoundaries()
        {
            // ASSERT
            PageDesignRepository.RootItemDepth(null, ContextPath).Should().Be(0);
            PageDesignRepository.RootItemDepth("/", ContextPath).Should().Be(0);
            PageDesignRepository.RootItemDepth("/sitecore/content/Holidays/Home", ContextPath).Should().Be(4);
            PageDesignRepository.RootItemDepth("/sitecore/content/TradePortal", ContextPath).Should().Be(-1);
            PageDesignRepository.RootItemDepth("/sitecore/content/Holidays/Home", "/sitecore/content/Holidays/HomePage").Should().Be(-1);
        }

        [Fact]
        public void ResolveMatches_NullPool_ReturnsEmpty()
        {
            // ACT
            var result = PageDesignRepository.ResolveMatches(ContextPath, TemplateId, null, logger);

            // ASSERT
            result.Should().BeEmpty();
        }

        [Fact]
        public void ResolveMatches_AmbiguousRootItems_SameDepth_LogsWarning_AndPicksOne()
        {
            // ARRANGE — two standard designs with identical root-folder depth: tie triggers a warning
            var designA = Design(ID.NewID, TemplateId, "/sitecore/content/Holidays/Home");
            var designB = Design(ID.NewID, TemplateId, "/sitecore/content/Holidays/Home");

            // ACT
            var result = PageDesignRepository.ResolveMatches(ContextPath, TemplateId, new[] { designA, designB }, logger);

            // ASSERT
            result.Should().ContainSingle("a winner is still chosen despite ambiguity");
            logger.Received(1).Warn(Arg.Any<string>(), Arg.Any<Type>());
        }

        [Fact]
        public void ResolveActivePageDesign_NullItem_ReturnsNull()
        {
            // ARRANGE
            var sut = CreateSut(Array.Empty<PageDesignMatch>());

            // ACT
            var result = sut.ResolveActivePageDesign(null, "FPH");

            // ASSERT
            result.Should().BeNull();
        }

        [Fact]
        public void ResolveActivePageDesign_NoMatchingDesigns_ReturnsNull()
        {
            // ARRANGE
            var item = CreateFakeItem();
            var sut = CreateSut(Array.Empty<PageDesignMatch>());

            // ACT
            var result = sut.ResolveActivePageDesign(item, "FPH");

            // ASSERT
            result.Should().BeNull();
        }

        [Fact]
        public void ResolveActivePageDesign_EmptyEcp_ReturnsStandardDesign()
        {
            // ARRANGE
            var standardDesign = CreateFakeItem();
            var item = CreateFakeItem();
            var sut = CreateSut(new[] { new PageDesignMatch(standardDesign, ID.Null) });

            // ACT
            var result = sut.ResolveActivePageDesign(item, string.Empty);

            // ASSERT
            result.Should().Be(standardDesign);
        }

        [Fact]
        public void ResolveActivePageDesign_ProviderNotActive_LogsWarnAndReturnsStandardDesign()
        {
            // ARRANGE
            var standardDesign = CreateFakeItem();
            var item = CreateFakeItem();
            var ecpRepo = Substitute.For<IExperienceContextProviderRepository>();
            ecpRepo.IsProviderActiveForPage(Arg.Any<string>(), Arg.Any<ID>()).Returns(false);
            var sut = CreateSutWithEcp(new[] { new PageDesignMatch(standardDesign, ID.Null) }, ecpRepo);

            // ACT
            var result = sut.ResolveActivePageDesign(item, "FPH");

            // ASSERT
            result.Should().Be(standardDesign);
            logger.Received(1).Warn(Arg.Any<string>(), Arg.Any<Type>());
        }

        [Fact]
        public void ResolveActivePageDesign_ProviderActive_ButProviderIdIsNull_LogsWarnAndReturnsStandard()
        {
            // ARRANGE
            var standardDesign = CreateFakeItem();
            var item = CreateFakeItem();
            var ecpRepo = Substitute.For<IExperienceContextProviderRepository>();
            ecpRepo.IsProviderActiveForPage(Arg.Any<string>(), Arg.Any<ID>()).Returns(true);
            ecpRepo.GetProviderItemId(Arg.Any<string>()).Returns(ID.Null);
            var sut = CreateSutWithEcp(new[] { new PageDesignMatch(standardDesign, ID.Null) }, ecpRepo);

            // ACT
            var result = sut.ResolveActivePageDesign(item, "FPH");

            // ASSERT
            result.Should().Be(standardDesign);
            logger.Received(1).Warn(Arg.Any<string>(), Arg.Any<Type>());
        }

        [Fact]
        public void ResolveActivePageDesign_ProviderActive_NoDesignForProvider_LogsWarnAndReturnsStandard()
        {
            // ARRANGE
            var standardDesign = CreateFakeItem();
            var item = CreateFakeItem();
            var ecpRepo = Substitute.For<IExperienceContextProviderRepository>();
            ecpRepo.IsProviderActiveForPage(Arg.Any<string>(), Arg.Any<ID>()).Returns(true);
            ecpRepo.GetProviderItemId(Arg.Any<string>()).Returns(ID.NewID);
            var matches = new[] { new PageDesignMatch(standardDesign, ID.Null) };
            var sut = CreateSutWithEcp(matches, ecpRepo);

            // ACT
            var result = sut.ResolveActivePageDesign(item, "FPH");

            // ASSERT
            result.Should().Be(standardDesign);
            logger.Received(1).Warn(Arg.Any<string>(), Arg.Any<Type>());
        }

        [Fact]
        public void ResolveActivePageDesign_ProviderActive_WithMatchingDesign_LogsDebugAndReturnsProviderDesign()
        {
            // ARRANGE
            var standardDesign = CreateFakeItem();
            var providerDesign = CreateFakeItem();
            var item = CreateFakeItem();
            var providerId = ID.NewID;
            var ecpRepo = Substitute.For<IExperienceContextProviderRepository>();
            ecpRepo.IsProviderActiveForPage(Arg.Any<string>(), Arg.Any<ID>()).Returns(true);
            ecpRepo.GetProviderItemId(Arg.Any<string>()).Returns(providerId);
            var matches = new[]
            {
                new PageDesignMatch(standardDesign, ID.Null),
                new PageDesignMatch(providerDesign, providerId),
            };
            var sut = CreateSutWithEcp(matches, ecpRepo);

            // ACT
            var result = sut.ResolveActivePageDesign(item, "FPH");

            // ASSERT
            result.Should().Be(providerDesign);
            logger.Received(1).Debug(Arg.Any<string>(), Arg.Any<Type>());
        }

        [Fact]
        public void GetPool_InvokesHtmlCacheRepository_WithKeyContainingFolderID()
        {
            // ARRANGE
            var fakeCache = new GetOrAddCapturingCacheRepository();
            var folderId = ID.NewID;
            var folder = new FakeItem(folderId, database).ToSitecoreItem();
            folder.Children.Returns(Substitute.For<ChildList>(folder, new ItemList()));
            var sut = new PageDesignRepository(
                fakeCache,
                Substitute.For<IFieldUtilsService>(),
                Substitute.For<IExperienceContextProviderRepository>(),
                logger);

            // ACT
            var result = sut.GetPool(folder);

            // ASSERT
            fakeCache.LastCapturedKey.Should().Contain(folderId.ToString());
            result.Should().BeEmpty();
        }

        [Fact]
        public void GetPool_WhenFolderHasDesignChild_BuildsNonEmptyPool()
        {
            // ARRANGE
            var fakeCache = new GetOrAddCapturingCacheRepository();
            var designFakeItem = new FakeItem(ID.NewID, database)
                .WithTemplate(Templates.PageDesign.Id);
            var folder = new FakeItem(ID.NewID, database)
                .WithChild(designFakeItem)
                .ToSitecoreItem();
            var fieldUtils = Substitute.For<IFieldUtilsService>();
            fieldUtils.GetMultilistTargetIds(Arg.Any<string>(), Arg.Any<Item>()).Returns(Array.Empty<ID>());
            var sut = new PageDesignRepository(
                fakeCache,
                fieldUtils,
                Substitute.For<IExperienceContextProviderRepository>(),
                logger);

            // ACT
            var result = sut.GetPool(folder);

            // ASSERT
            result.Should().ContainSingle();
        }

        [Fact]
        public void GetMatchingPageDesigns_NullItem_ReturnsEmpty()
        {
            // ARRANGE
            var sut = new PageDesignRepository(
                Substitute.For<IHtmlCacheRepository>(),
                Substitute.For<IFieldUtilsService>(),
                Substitute.For<IExperienceContextProviderRepository>(),
                logger);

            // ACT
            var result = sut.GetMatchingPageDesigns(null);

            // ASSERT
            result.Should().BeEmpty();
        }

        [Fact]
        public void GetMatchingPageDesigns_ItemWithNoDesignsFolder_ReturnsEmpty()
        {
            // ARRANGE
            var item = new FakeItem(ID.NewID, database).ToSitecoreItem();
            item.Children.Returns(Substitute.For<ChildList>(item, new ItemList()));
            var sut = new PageDesignRepository(
                Substitute.For<IHtmlCacheRepository>(),
                Substitute.For<IFieldUtilsService>(),
                Substitute.For<IExperienceContextProviderRepository>(),
                logger);

            // ACT
            var result = sut.GetMatchingPageDesigns(item);

            // ASSERT
            result.Should().BeEmpty();
        }

        [Fact]
        public void GetMatchingPageDesigns_NormalPageMode_ResolvesDesignsFolderFromSiteQuery()
        {
            // Arrange
            var fakeCache = new GetOrAddCapturingCacheRepository();
            var queryFolderId = ID.NewID;
            var queryFolder = new FakeItem(queryFolderId, database).ToSitecoreItem();
            queryFolder.Children.Returns(Substitute.For<ChildList>(queryFolder, new ItemList()));
            database.SelectSingleItem(Arg.Any<string>()).Returns(queryFolder);

            var item = new FakeItem(ID.NewID, database)
                .WithTemplate(TemplateId)
                .WithPath(ContextPath)
                .ToSitecoreItem();

            var sut = CreateSutWithCache(fakeCache);
            var site = CreateFakeSite(DisplayMode.Normal);
            var expectedQuery = $"{SiteRootPath}/*[@@templateid ='{Templates.Presentation.Id}']/*[@@templateid ='{Templates.PageDesignsFolder.Id}']";

            // Act
            using (new SiteContextSwitcher(site))
            {
                sut.GetMatchingPageDesigns(item);
            }

            // Assert
            database.Received(1).SelectSingleItem(expectedQuery);
            fakeCache.LastCapturedKey.Should().Contain(queryFolderId.ToString(), "the folder resolved by the site query feeds the pool");
        }

        [Fact]
        public void GetMatchingPageDesigns_ExperienceEditor_UsesAncestorWalkInsteadOfSiteQuery()
        {
            // Arrange
            var fakeCache = new GetOrAddCapturingCacheRepository();
            var walkFolderId = ID.NewID;
            var item = CreateItemWithPresentationStructure(walkFolderId);
            var sut = CreateSutWithCache(fakeCache);
            var site = CreateFakeSite(DisplayMode.Edit);

            // Act
            using (new SiteContextSwitcher(site))
            {
                sut.GetMatchingPageDesigns(item);
            }

            // Assert
            database.DidNotReceive().SelectSingleItem(Arg.Any<string>());
            fakeCache.LastCapturedKey.Should().Contain(walkFolderId.ToString(), "in the editor the folder is located by walking the ancestors");
        }

        [Fact]
        public void GetMatchingPageDesigns_NormalPageMode_QueryFindsNothing_FallsBackToAncestorWalk()
        {
            // Arrange
            var fakeCache = new GetOrAddCapturingCacheRepository();
            var walkFolderId = ID.NewID;
            var item = CreateItemWithPresentationStructure(walkFolderId);
            database.SelectSingleItem(Arg.Any<string>()).Returns((Item)null);
            var sut = CreateSutWithCache(fakeCache);
            var site = CreateFakeSite(DisplayMode.Normal);

            // Act
            using (new SiteContextSwitcher(site))
            {
                sut.GetMatchingPageDesigns(item);
            }

            // Assert
            database.Received(1).SelectSingleItem(Arg.Any<string>());
            fakeCache.LastCapturedKey.Should().Contain(walkFolderId.ToString(), "an empty query result falls back to the ancestor walk");
        }

        [Fact]
        public void GetMatchingPageDesigns_NoSiteContext_UsesAncestorWalk()
        {
            // Arrange
            var fakeCache = new GetOrAddCapturingCacheRepository();
            var walkFolderId = ID.NewID;
            var item = CreateItemWithPresentationStructure(walkFolderId);
            var sut = CreateSutWithCache(fakeCache);

            // Act — no site context switcher: Context.Site is null in the test runner
            sut.GetMatchingPageDesigns(item);

            // Assert
            database.DidNotReceive().SelectSingleItem(Arg.Any<string>());
            fakeCache.LastCapturedKey.Should().Contain(walkFolderId.ToString(), "without a site context the folder is located by walking the ancestors");
        }

        /// <summary>
        /// Builds a fake Holidays site and forces its display mode by writing the private field the
        /// <see cref="SiteContext.DisplayMode"/> getter is backed by — SetDisplayMode needs an HttpContext.
        /// </summary>
        private static FakeSiteContext CreateFakeSite(DisplayMode displayMode)
        {
            var site = new FakeSiteContext(new StringDictionary
            {
                { "name", "Holidays" },
                { "database", "master" },
                { "rootPath", SiteRootPath }
            });

            typeof(SiteContext)
                .GetField("displayMode", BindingFlags.NonPublic | BindingFlags.Instance)
                .SetValue(site, displayMode);

            return site;
        }

        private static PageDesignInfo Design(ID id, ID template, string rootItemPath, params ID[] providers)
        {
            return new PageDesignInfo(id, new[] { template }, providers, rootItemPath);
        }

        /// <summary>
        /// Builds an item owning a "Presentation" folder that contains an empty "Page Designs" folder with the
        /// supplied ID, so the ancestor-walk branch of GetPageDesignsFolder resolves to that folder.
        /// </summary>
        private Item CreateItemWithPresentationStructure(ID designsFolderId)
        {
            var designsFolderFake = new FakeItem(designsFolderId, database)
                .WithTemplate(Templates.PageDesignsFolder.Id);
            var presentationFake = new FakeItem(ID.NewID, database)
                .WithTemplate(Templates.Presentation.Id)
                .WithChild(designsFolderFake);

            var designsFolder = designsFolderFake.ToSitecoreItem();
            designsFolder.Children.Returns(Substitute.For<ChildList>(designsFolder, new ItemList()));

            return new FakeItem(ID.NewID, database)
                .WithTemplate(TemplateId)
                .WithPath(ContextPath)
                .WithChild(presentationFake)
                .ToSitecoreItem();
        }

        private PageDesignRepository CreateSutWithCache(IHtmlCacheRepository cacheRepository)
        {
            var fieldUtils = Substitute.For<IFieldUtilsService>();
            fieldUtils.GetMultilistTargetIds(Arg.Any<string>(), Arg.Any<Item>()).Returns(Array.Empty<ID>());
            return new PageDesignRepository(
                cacheRepository,
                fieldUtils,
                Substitute.For<IExperienceContextProviderRepository>(),
                logger);
        }

        private Item CreateFakeItem()
        {
            return new FakeItem(ID.NewID, database).ToSitecoreItem();
        }

        private TestablePageDesignRepository CreateSut(IReadOnlyList<PageDesignMatch> matches)
        {
            return CreateSutWithEcp(matches, Substitute.For<IExperienceContextProviderRepository>());
        }

        private TestablePageDesignRepository CreateSutWithEcp(
            IReadOnlyList<PageDesignMatch> matches,
            IExperienceContextProviderRepository ecpRepo)
        {
            return new TestablePageDesignRepository(
                Substitute.For<IHtmlCacheRepository>(),
                Substitute.For<IFieldUtilsService>(),
                ecpRepo,
                logger,
                matches);
        }

        private sealed class TestablePageDesignRepository : PageDesignRepository
        {
            private readonly IReadOnlyList<PageDesignMatch> matches;

            public TestablePageDesignRepository(
                IHtmlCacheRepository htmlCache,
                IFieldUtilsService fieldUtils,
                IExperienceContextProviderRepository ecpRepo,
                IPresentationLogger pLogger,
                IReadOnlyList<PageDesignMatch> matches)
                : base(htmlCache, fieldUtils, ecpRepo, pLogger)
            {
                this.matches = matches;
            }

            public override IReadOnlyList<PageDesignMatch> GetMatchingPageDesigns(Item item)
                => matches;
        }

        private sealed class GetOrAddCapturingCacheRepository : IHtmlCacheRepository
        {
            public string LastCapturedKey { get; private set; }

            public T GetOrAdd<T>(string key, Func<T> getData, int expirationMinutes = 0)
                where T : class
            {
                LastCapturedKey = key;
                return getData();
            }

            public T GetItem<T>(string key)
                where T : class => throw new NotImplementedException();

            public void RemoveItem(string key) => throw new NotImplementedException();

            public T StoreItem<T>(string key, T item, int expirationMinutes = 0)
                where T : class => throw new NotImplementedException();

            public Task<TResponse> GetOrCreateAsync<TResponse>(Func<Task<TResponse>> method, string key)
                where TResponse : class => throw new NotImplementedException();
        }
    }
}
