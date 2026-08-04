using easyJet.Foundation.Presentation.Logging;
using easyJet.Foundation.Presentation.Pipelines.GetContentEditorWarnings;
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
    public class ExperienceContextProviderPageTemplateContentEditorWarningsProcessorTests
    {
        private static readonly ID ProviderTemplateId = Constants.TemplateIds.ExperienceContextProvider;
        private static readonly ID ProviderPageTemplateTemplateId = Constants.TemplateIds.ExperienceContextProviderPageTemplate;
        private static readonly ID PageTemplateFieldId = Constants.Fields.ExperienceContextProviderPageTemplate.PageTemplate;

        private readonly TestableExperienceContextProviderPageTemplateContentEditorWarningsProcessor sut;

        public ExperienceContextProviderPageTemplateContentEditorWarningsProcessorTests()
        {
            var databaseProvider = Substitute.For<IDatabaseProvider>();
            var logger = Substitute.For<IPresentationLogger>();
            var fieldUtils = Substitute.For<IFieldUtilsService>();
            sut = new TestableExperienceContextProviderPageTemplateContentEditorWarningsProcessor(fieldUtils, databaseProvider, logger);
        }

        // ============================================================
        // MatchingTemplateIds
        // ============================================================
        [Fact]
        public void MatchingTemplateIds_ShouldContainExperienceContextProviderPageTemplate()
        {
            // ARRANGE

            // ACT
            var result = TestableExperienceContextProviderPageTemplateContentEditorWarningsProcessor.GetMatchingTemplateIds(sut);

            // ASSERT
            result.Should().ContainSingle().Which.Should().Be(ProviderPageTemplateTemplateId);
        }

        // ============================================================
        // GetProviderId
        // ============================================================
        [Fact]
        public void GetProviderId_WhenParentProviderDoesNotExist_ShouldReturnNullId()
        {
            // ARRANGE
            var masterDatabase = FakeUtil.FakeDatabase("master");
            var pageTemplateItem = new FakeItem(database: masterDatabase)
                .WithRuntimeSettings()
                .WithItemAxes()
                .WithUri()
                .WithTemplate(ProviderPageTemplateTemplateId)
                .ToSitecoreItem();

            pageTemplateItem.Axes.SelectSingleItem(Arg.Any<string>()).ReturnsForAnyArgs((Item)null);

            // ACT
            var result = TestableExperienceContextProviderPageTemplateContentEditorWarningsProcessor.GetProviderId(sut, pageTemplateItem);

            // ASSERT
            result.Should().Be(ID.Null);
        }

        // ============================================================
        // TryGetPageId
        // ============================================================
        [Fact]
        public void TryGetPageId_WhenPageTemplateFieldIsMissing_ShouldReturnFalse()
        {
            // ARRANGE
            var pageTemplateItem = new FakeItem()
                .WithTemplate(ProviderPageTemplateTemplateId)
                .ToSitecoreItem();

            // ACT
            var result = TestableExperienceContextProviderPageTemplateContentEditorWarningsProcessor.TryGetPageId(sut, pageTemplateItem, out var pageId);

            // ASSERT
            result.Should().BeFalse();
            pageId.Should().Be(ID.Null);
        }

        [Fact]
        public void TryGetPageId_WhenPageTemplateFieldIsInvalid_ShouldReturnFalse()
        {
            // ARRANGE
            var pageTemplateItem = new FakeItem()
                .WithTemplate(ProviderPageTemplateTemplateId)
                .WithField(PageTemplateFieldId, "not-a-guid")
                .ToSitecoreItem();

            // ACT
            var result = TestableExperienceContextProviderPageTemplateContentEditorWarningsProcessor.TryGetPageId(sut, pageTemplateItem, out var pageId);

            // ASSERT
            result.Should().BeFalse();
            pageId.Should().BeNull();
        }

        [Fact]
        public void TryGetPageId_WhenPageTemplateFieldIsValidId_ShouldReturnTrueAndParsedId()
        {
            // ARRANGE
            var expectedTemplateId = ID.NewID;
            var pageTemplateItem = new FakeItem()
                .WithTemplate(ProviderPageTemplateTemplateId)
                .WithField(PageTemplateFieldId, expectedTemplateId.ToString())
                .ToSitecoreItem();

            // ACT
            var result = TestableExperienceContextProviderPageTemplateContentEditorWarningsProcessor.TryGetPageId(sut, pageTemplateItem, out var pageId);

            // ASSERT
            result.Should().BeTrue();
            pageId.Should().Be(expectedTemplateId);
        }

        // ============================================================
        // Process Integration
        // ============================================================
        [Fact]
        public void Process_WhenItemHasPageTemplateTemplate_WithNoParentProvider_AddsNoWarning()
        {
            // ARRANGE
            var databaseProvider = Substitute.For<IDatabaseProvider>();
            var logger = Substitute.For<IPresentationLogger>();
            var fieldUtils = Substitute.For<IFieldUtilsService>();
            var actualProcessor = new ExperienceContextProviderPageTemplateContentEditorWarningsProcessor(fieldUtils, databaseProvider, logger);
            var masterDatabase = FakeUtil.FakeDatabase("master");
            var pageTemplateItem = new FakeItem(database: masterDatabase)
                .WithRuntimeSettings()
                .WithItemAxes()
                .WithUri()
                .WithTemplate(ProviderPageTemplateTemplateId)
                .ToSitecoreItem();

            pageTemplateItem.Axes.SelectSingleItem(Arg.Any<string>()).ReturnsForAnyArgs((Item)null);

            var args = new GetContentEditorWarningsArgs(pageTemplateItem);

            // ACT
            actualProcessor.Process(args);

            // ASSERT
            args.Warnings.Count.Should().Be(0);
        }

        [Fact]
        public void Process_WhenItemHasPageTemplateTemplate_WithParentProvider_AndNoPageDesigns_AddsNoWarning()
        {
            // ARRANGE
            var databaseProvider = Substitute.For<IDatabaseProvider>();
            var logger = Substitute.For<IPresentationLogger>();
            var masterDatabase = FakeUtil.FakeDatabase("master");
            databaseProvider.GetDatabase(DatabaseType.Content).Returns(masterDatabase);
            var fieldUtils = Substitute.For<IFieldUtilsService>();
            var actualProcessor = new ExperienceContextProviderPageTemplateContentEditorWarningsProcessor(fieldUtils, databaseProvider, logger);

            var parentItem = new FakeItem(database: masterDatabase)
                .WithRuntimeSettings()
                .WithUri()
                .WithTemplate(ProviderTemplateId)
                .ToSitecoreItem();

            var pageTemplateItem = new FakeItem(database: masterDatabase)
                .WithRuntimeSettings()
                .WithItemAxes()
                .WithUri()
                .WithTemplate(ProviderPageTemplateTemplateId)
                .ToSitecoreItem();

            pageTemplateItem.Axes.SelectSingleItem(Arg.Any<string>()).ReturnsForAnyArgs(parentItem);
            masterDatabase.GetItem(Arg.Any<ID>()).Returns((Item)null);

            var args = new GetContentEditorWarningsArgs(pageTemplateItem);

            // ACT
            actualProcessor.Process(args);

            // ASSERT
            args.Warnings.Count.Should().Be(0);
        }

        [Fact]
        public void Process_WhenItemHasPageTemplateTemplate_WithParentAndTemplateId_AndNoPageDesigns_AddsNoWarning()
        {
            // ARRANGE
            var databaseProvider = Substitute.For<IDatabaseProvider>();
            var logger = Substitute.For<IPresentationLogger>();
            var masterDatabase = FakeUtil.FakeDatabase("master");
            databaseProvider.GetDatabase(DatabaseType.Content).Returns(masterDatabase);
            var fieldUtils = Substitute.For<IFieldUtilsService>();
            var actualProcessor = new ExperienceContextProviderPageTemplateContentEditorWarningsProcessor(fieldUtils, databaseProvider, logger);

            var parentItem = new FakeItem(database: masterDatabase)
                .WithRuntimeSettings()
                .WithUri()
                .WithTemplate(ProviderTemplateId)
                .ToSitecoreItem();

            var pageTemplateItem = new FakeItem(database: masterDatabase)
                .WithRuntimeSettings()
                .WithItemAxes()
                .WithUri()
                .WithTemplate(ProviderPageTemplateTemplateId)
                .WithField(PageTemplateFieldId, ID.NewID.ToString())
                .ToSitecoreItem();

            pageTemplateItem.Axes.SelectSingleItem(Arg.Any<string>()).ReturnsForAnyArgs(parentItem);
            masterDatabase.GetItem(Arg.Any<ID>()).Returns((Item)null);

            var args = new GetContentEditorWarningsArgs(pageTemplateItem);

            // ACT
            actualProcessor.Process(args);

            // ASSERT
            args.Warnings.Count.Should().Be(0);
        }

        [Fact]
        public void Process_WhenRuleNotSelectedInProviderPages_AddsWarning()
        {
            // ARRANGE
            var databaseProvider = Substitute.For<IDatabaseProvider>();
            var logger = Substitute.For<IPresentationLogger>();
            var fieldUtils = Substitute.For<IFieldUtilsService>();
            var masterDatabase = FakeUtil.FakeDatabase("master");
            databaseProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns(masterDatabase);

            var providerId = ID.NewID;
            var provider = new FakeItem(providerId, masterDatabase)
                .WithRuntimeSettings().WithLanguage("en").WithUri().WithTemplate(ProviderTemplateId).ToSitecoreItem();

            var ruleId = ID.NewID;
            var ruleItem = new FakeItem(ruleId, masterDatabase)
                .WithRuntimeSettings().WithLanguage("en").WithUri().WithTemplate(ProviderPageTemplateTemplateId).ToSitecoreItem();

            var settingsRoot = new FakeItem(Constants.ItemIds.ExperienceContextProvidersSettingsRoot, masterDatabase)
                .WithRuntimeSettings().WithLanguage("en").WithUri().ToSitecoreItem();
            masterDatabase.GetItem(providerId).Returns(provider);
            masterDatabase.GetItem(Constants.ItemIds.ExperienceContextProvidersSettingsRoot).Returns(settingsRoot);

            // Provider active, but this template rule is not selected in its Pages field.
            fieldUtils.GetMultilistTargetIds(Constants.Fields.ExperienceContextProvider.Pages, provider).Returns(new[] { ID.NewID });
            fieldUtils.GetMultilistTargetIds(Constants.Fields.ExperienceContextProviders.ActiveProviders, settingsRoot).Returns(new[] { providerId });

            var processor = new StubProviderIdPageTemplateProcessor(fieldUtils, databaseProvider, logger, providerId);
            var args = new GetContentEditorWarningsArgs(ruleItem);

            // ACT
            processor.Process(args);

            // ASSERT
            args.Warnings.Should().ContainSingle();
            args.Warnings[0].Title.Should().Contain("not selected in the provider's Pages field");
        }

        // Overrides only the provider-resolution seam so the base ProcessWarning config-warning logic can be
        // exercised without faking JSS ancestor resolution.
        private sealed class StubProviderIdPageTemplateProcessor : ExperienceContextProviderPageTemplateContentEditorWarningsProcessor
        {
            private readonly ID stubProviderId;

            public StubProviderIdPageTemplateProcessor(IFieldUtilsService pFieldUtils, IDatabaseProvider pDatabaseProvider, IPresentationLogger pLogger, ID providerId)
                : base(pFieldUtils, pDatabaseProvider, pLogger)
            {
                stubProviderId = providerId;
            }

            protected override ID GetProviderId(Item contextItem) => stubProviderId;
        }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("StyleCop.CSharp.OrderingRules", "SA1202", Justification = "Proxy class for testing.")]
        private sealed class TestableExperienceContextProviderPageTemplateContentEditorWarningsProcessor : ExperienceContextProviderPageTemplateContentEditorWarningsProcessor
        {
            public TestableExperienceContextProviderPageTemplateContentEditorWarningsProcessor(IFieldUtilsService pFieldUtils, IDatabaseProvider pDatabaseProvider, IPresentationLogger pLogger)
                : base(pFieldUtils, pDatabaseProvider, pLogger)
            {
            }

            public static ID[] GetMatchingTemplateIds(TestableExperienceContextProviderPageTemplateContentEditorWarningsProcessor processor)
            {
                return processor.MatchingTemplateIds;
            }

            public static ID GetProviderId(TestableExperienceContextProviderPageTemplateContentEditorWarningsProcessor processor, Item contextItem)
            {
                return processor.GetProviderId(contextItem);
            }

            public static bool TryGetPageId(TestableExperienceContextProviderPageTemplateContentEditorWarningsProcessor processor, Item contextItem, out ID pageId)
            {
                return processor.TryGetPageId(contextItem, out pageId);
            }

            protected override void ProcessWarning(Item contextItem, GetContentEditorWarningsArgs arguments)
            {
                _ = contextItem;
                _ = arguments;
                throw new System.NotSupportedException();
            }
        }
    }
}
