using easyJet.Foundation.Presentation.Logging;
using easyJet.Foundation.Presentation.Pipelines.GetContentEditorWarnings;
using easyJet.Foundation.Presentation.Services;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Sitecore.Pipelines.GetContentEditorWarnings;
using Xunit;

namespace easyJet.Foundation.Presentation.Tests.Pipelines.GetContentEditorWarnings
{
    public class ExperienceContextProviderPageContentEditorWarningsProcessorTests
    {
        private static readonly ID ProviderTemplateId = Constants.TemplateIds.ExperienceContextProvider;
        private static readonly ID ProviderPageTemplateId = Constants.TemplateIds.ExperienceContextProviderPage;
        private static readonly ID PageFieldId = Constants.Fields.ExperienceContextProviderPage.Page;

        private readonly IPageTemplateResolverService pageTemplateResolver;
        private readonly TestableExperienceContextProviderPageContentEditorWarningsProcessor sut;

        public ExperienceContextProviderPageContentEditorWarningsProcessorTests()
        {
            var databaseProvider = Substitute.For<IDatabaseProvider>();
            var logger = Substitute.For<IPresentationLogger>();
            var fieldUtils = Substitute.For<IFieldUtilsService>();
            pageTemplateResolver = Substitute.For<IPageTemplateResolverService>();
            sut = new TestableExperienceContextProviderPageContentEditorWarningsProcessor(fieldUtils, databaseProvider, logger, pageTemplateResolver);
        }

        [Fact]
        public void MatchingTemplateIds_ShouldContainExperienceContextProviderPageTemplate()
        {
            // ARRANGE

            // ACT
            var result = TestableExperienceContextProviderPageContentEditorWarningsProcessor.GetMatchingTemplateIds(sut);

            // ASSERT
            result.Should().ContainSingle().Which.Should().Be(ProviderPageTemplateId);
        }

        [Fact]
        public void GetProviderId_WhenParentProviderDoesNotExist_ShouldReturnNullId()
        {
            // ARRANGE
            var masterDatabase = FakeUtil.FakeDatabase("master");
            var pageItem = new FakeItem(database: masterDatabase)
                .WithRuntimeSettings()
                .WithItemAxes()
                .WithUri()
                .WithTemplate(ProviderPageTemplateId)
                .ToSitecoreItem();

            pageItem.Axes.SelectSingleItem(Arg.Any<string>()).ReturnsForAnyArgs((Item)null);

            // ACT
            var result = TestableExperienceContextProviderPageContentEditorWarningsProcessor.GetProviderId(sut, pageItem);

            // ASSERT
            result.Should().Be(ID.Null);
        }

        [Fact]
        public void TryGetPageId_WhenPageTemplateFieldIsMissing_ShouldReturnFalse()
        {
            // ARRANGE
            var pageItem = new FakeItem()
                .WithTemplate(ProviderPageTemplateId)
                .ToSitecoreItem();

            // ACT
            var result = TestableExperienceContextProviderPageContentEditorWarningsProcessor.TryGetPageId(sut, pageItem, out var pageId);

            // ASSERT
            result.Should().BeFalse();
            pageId.Should().Be(ID.Null);
        }

        [Fact]
        public void TryGetPageId_WhenPageTemplateFieldIsInvalid_ShouldReturnFalse()
        {
            // ARRANGE
            var pageItem = new FakeItem()
                .WithTemplate(ProviderPageTemplateId)
                .WithField(PageFieldId, "not-a-guid")
                .ToSitecoreItem();

            // ACT
            var result = TestableExperienceContextProviderPageContentEditorWarningsProcessor.TryGetPageId(sut, pageItem, out var pageId);

            // ASSERT
            result.Should().BeFalse();
            pageId.Should().Be(ID.Null);
        }

        [Fact]
        public void TryGetPageId_WhenPageItemNotFoundInDatabase_ShouldReturnFalse()
        {
            // ARRANGE
            var pageItemId = ID.NewID;
            var pageItem = new FakeItem()
                .WithTemplate(ProviderPageTemplateId)
                .WithField(PageFieldId, pageItemId.ToString())
                .ToSitecoreItem();

            pageTemplateResolver.ResolveTemplateId(pageItemId, DatabaseType.Content).Returns(ID.Null);

            // ACT
            var result = TestableExperienceContextProviderPageContentEditorWarningsProcessor.TryGetPageId(sut, pageItem, out var pageId);

            // ASSERT
            result.Should().BeFalse();
            pageId.Should().Be(ID.Null);
        }

        [Fact]
        public void TryGetPageId_WhenPageFieldIsValid_ShouldReturnTrueAndResolvedTemplateId()
        {
            // ARRANGE
            var pageItemId = ID.NewID;
            var expectedTemplateId = ID.NewID;
            var pageItem = new FakeItem()
                .WithTemplate(ProviderPageTemplateId)
                .WithField(PageFieldId, pageItemId.ToString())
                .ToSitecoreItem();

            pageTemplateResolver.ResolveTemplateId(pageItemId, DatabaseType.Content).Returns(expectedTemplateId);

            // ACT
            var result = TestableExperienceContextProviderPageContentEditorWarningsProcessor.TryGetPageId(sut, pageItem, out var pageId);

            // ASSERT
            result.Should().BeTrue();
            pageId.Should().Be(expectedTemplateId);
        }

        // ============================================================
        // Process Integration
        // ============================================================
        [Fact]
        public void Process_WhenProviderPageItem_WithNoParentProvider_AddsNoWarning()
        {
            // ARRANGE
            var databaseProvider = Substitute.For<IDatabaseProvider>();
            var logger = Substitute.For<IPresentationLogger>();
            var fieldUtils = Substitute.For<IFieldUtilsService>();
            var resolver = Substitute.For<IPageTemplateResolverService>();
            var actualProcessor = new ExperienceContextProviderPageContentEditorWarningsProcessor(fieldUtils, databaseProvider, logger, resolver);
            var masterDatabase = FakeUtil.FakeDatabase("master");
            var pageItem = new FakeItem(database: masterDatabase)
                .WithRuntimeSettings()
                .WithItemAxes()
                .WithUri()
                .WithTemplate(ProviderPageTemplateId)
                .ToSitecoreItem();

            pageItem.Axes.SelectSingleItem(Arg.Any<string>()).ReturnsForAnyArgs((Item)null);

            var args = new GetContentEditorWarningsArgs(pageItem);

            // ACT
            actualProcessor.Process(args);

            // ASSERT
            args.Warnings.Count.Should().Be(0);
        }

        [Fact]
        public void Process_WhenProviderPageItem_WithParentProvider_AndNoPageDesigns_AddsNoWarning()
        {
            // ARRANGE
            var databaseProvider = Substitute.For<IDatabaseProvider>();
            var logger = Substitute.For<IPresentationLogger>();
            var masterDatabase = FakeUtil.FakeDatabase("master");
            databaseProvider.GetDatabase(DatabaseType.Context).Returns(masterDatabase);
            var fieldUtils = Substitute.For<IFieldUtilsService>();
            var resolver = Substitute.For<IPageTemplateResolverService>();
            var actualProcessor = new ExperienceContextProviderPageContentEditorWarningsProcessor(fieldUtils, databaseProvider, logger, resolver);
            var parentItem = new FakeItem(database: masterDatabase)
                .WithRuntimeSettings()
                .WithUri()
                .WithTemplate(ProviderTemplateId)
                .ToSitecoreItem();

            var pageItem = new FakeItem(database: masterDatabase)
                .WithRuntimeSettings()
                .WithItemAxes()
                .WithUri()
                .WithTemplate(ProviderPageTemplateId)
                .ToSitecoreItem();

            pageItem.Axes.SelectSingleItem(Arg.Any<string>()).ReturnsForAnyArgs(parentItem);

            var args = new GetContentEditorWarningsArgs(pageItem);

            // ACT
            actualProcessor.Process(args);

            // ASSERT
            args.Warnings.Count.Should().Be(0);
        }

        [Fact]
        public void Process_WhenProviderPageItem_WithParentAndPageTemplateId_AndNoPageDesigns_AddsNoWarning()
        {
            // ARRANGE
            var databaseProvider = Substitute.For<IDatabaseProvider>();
            var logger = Substitute.For<IPresentationLogger>();
            var masterDatabase = FakeUtil.FakeDatabase("master");
            databaseProvider.GetDatabase(DatabaseType.Context).Returns(masterDatabase);
            var fieldUtils = Substitute.For<IFieldUtilsService>();
            var resolver = Substitute.For<IPageTemplateResolverService>();
            resolver.ResolveTemplateId(Arg.Any<ID>(), Arg.Any<DatabaseType>()).Returns(ID.Null);
            var actualProcessor = new ExperienceContextProviderPageContentEditorWarningsProcessor(fieldUtils, databaseProvider, logger, resolver);
            var parentItem = new FakeItem(database: masterDatabase)
                .WithRuntimeSettings()
                .WithUri()
                .WithTemplate(ProviderTemplateId)
                .ToSitecoreItem();

            var pageItem = new FakeItem(database: masterDatabase)
                .WithRuntimeSettings()
                .WithItemAxes()
                .WithUri()
                .WithTemplate(ProviderPageTemplateId)
                .WithField(PageFieldId, ID.NewID.ToString())
                .ToSitecoreItem();

            pageItem.Axes.SelectSingleItem(Arg.Any<string>()).ReturnsForAnyArgs(parentItem);

            var args = new GetContentEditorWarningsArgs(pageItem);

            // ACT
            actualProcessor.Process(args);

            // ASSERT
            args.Warnings.Count.Should().Be(0);
        }

        [Fact]
        public void Process_WhenRuleNotSelectedInProviderPages_AddsWarning()
        {
            // ARRANGE
            var fieldUtils = Substitute.For<IFieldUtilsService>();
            var scenario = ArrangeConfigScenario(fieldUtils, pagesContainsRule: false, providerIsActive: true);

            // ACT
            scenario.Processor.Process(scenario.Args);

            // ASSERT
            scenario.Args.Warnings.Should().ContainSingle();
            scenario.Args.Warnings[0].Title.Should().Contain("not selected in the provider's Pages field");
            scenario.Args.Warnings[0].Icon.Should().Be("Applications/32x32/warning.png");
        }

        [Fact]
        public void Process_WhenProviderNotActive_AddsWarning()
        {
            // ARRANGE
            var fieldUtils = Substitute.For<IFieldUtilsService>();
            var scenario = ArrangeConfigScenario(fieldUtils, pagesContainsRule: true, providerIsActive: false);

            // ACT
            scenario.Processor.Process(scenario.Args);

            // ASSERT
            scenario.Args.Warnings.Should().ContainSingle();
            scenario.Args.Warnings[0].Title.Should().Contain("not configured in Active Providers");
            scenario.Args.Warnings[0].Icon.Should().Be("Applications/32x32/warning.png");
        }

        [Fact]
        public void Process_WhenRuleSelectedAndProviderActive_AddsNoConfigWarning()
        {
            // ARRANGE
            var fieldUtils = Substitute.For<IFieldUtilsService>();
            var scenario = ArrangeConfigScenario(fieldUtils, pagesContainsRule: true, providerIsActive: true);

            // ACT
            scenario.Processor.Process(scenario.Args);

            // ASSERT
            scenario.Args.Warnings.Should().BeEmpty();
        }

        private static ConfigScenario ArrangeConfigScenario(IFieldUtilsService fieldUtils, bool pagesContainsRule, bool providerIsActive)
        {
            var databaseProvider = Substitute.For<IDatabaseProvider>();
            var logger = Substitute.For<IPresentationLogger>();
            var resolver = Substitute.For<IPageTemplateResolverService>();
            var masterDatabase = FakeUtil.FakeDatabase("master");
            databaseProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns(masterDatabase);

            var providerId = ID.NewID;
            var provider = new FakeItem(providerId, masterDatabase)
                .WithRuntimeSettings().WithLanguage("en").WithUri().WithTemplate(ProviderTemplateId).ToSitecoreItem();

            var ruleId = ID.NewID;
            var ruleItem = new FakeItem(ruleId, masterDatabase)
                .WithRuntimeSettings().WithLanguage("en").WithUri().WithTemplate(ProviderPageTemplateId).ToSitecoreItem();

            var settingsRoot = new FakeItem(Constants.ItemIds.ExperienceContextProvidersSettingsRoot, masterDatabase)
                .WithRuntimeSettings().WithLanguage("en").WithUri().ToSitecoreItem();
            masterDatabase.GetItem(providerId).Returns(provider);
            masterDatabase.GetItem(Constants.ItemIds.ExperienceContextProvidersSettingsRoot).Returns(settingsRoot);

            fieldUtils.GetMultilistTargetIds(Constants.Fields.ExperienceContextProvider.Pages, provider)
                .Returns(pagesContainsRule ? new[] { ruleId } : new[] { ID.NewID });
            fieldUtils.GetMultilistTargetIds(Constants.Fields.ExperienceContextProviders.ActiveProviders, settingsRoot)
                .Returns(providerIsActive ? new[] { providerId } : System.Array.Empty<ID>());

            var processor = new StubProviderIdPageProcessor(fieldUtils, databaseProvider, logger, resolver, providerId);
            return new ConfigScenario(processor, new GetContentEditorWarningsArgs(ruleItem));
        }

        private sealed class ConfigScenario
        {
            public ConfigScenario(ExperienceContextProviderPageContentEditorWarningsProcessor processor, GetContentEditorWarningsArgs args)
            {
                Processor = processor;
                Args = args;
            }

            public ExperienceContextProviderPageContentEditorWarningsProcessor Processor { get; }

            public GetContentEditorWarningsArgs Args { get; }
        }

        // Overrides only the provider-resolution seam (covered separately by the GetProviderId tests) so the
        // base ProcessWarning config-warning logic can be exercised without faking JSS ancestor resolution.
        private sealed class StubProviderIdPageProcessor : ExperienceContextProviderPageContentEditorWarningsProcessor
        {
            private readonly ID stubProviderId;

            public StubProviderIdPageProcessor(IFieldUtilsService pFieldUtils, IDatabaseProvider pDatabaseProvider, IPresentationLogger pLogger, IPageTemplateResolverService pPageTemplateResolver, ID providerId)
                : base(pFieldUtils, pDatabaseProvider, pLogger, pPageTemplateResolver)
            {
                stubProviderId = providerId;
            }

            protected override ID GetProviderId(Item contextItem) => stubProviderId;
        }

        private sealed class TestableExperienceContextProviderPageContentEditorWarningsProcessor : ExperienceContextProviderPageContentEditorWarningsProcessor
        {
            public TestableExperienceContextProviderPageContentEditorWarningsProcessor(IFieldUtilsService pFieldUtils, IDatabaseProvider pDatabaseProvider, IPresentationLogger pLogger, IPageTemplateResolverService pPageTemplateResolver)
                : base(pFieldUtils, pDatabaseProvider, pLogger, pPageTemplateResolver)
            {
            }

            public static ID[] GetMatchingTemplateIds(TestableExperienceContextProviderPageContentEditorWarningsProcessor processor)
            {
                return processor.MatchingTemplateIds;
            }

            public static ID GetProviderId(TestableExperienceContextProviderPageContentEditorWarningsProcessor processor, Item contextItem)
            {
                return processor.GetProviderId(contextItem);
            }

            public static bool TryGetPageId(TestableExperienceContextProviderPageContentEditorWarningsProcessor processor, Item contextItem, out ID pageId)
            {
                return processor.TryGetPageId(contextItem, out pageId);
            }

            protected override void ProcessWarning(Item contextItem, Sitecore.Pipelines.GetContentEditorWarnings.GetContentEditorWarningsArgs arguments)
            {
                _ = contextItem;
                _ = arguments;
                throw new System.NotSupportedException();
            }
        }
    }
}