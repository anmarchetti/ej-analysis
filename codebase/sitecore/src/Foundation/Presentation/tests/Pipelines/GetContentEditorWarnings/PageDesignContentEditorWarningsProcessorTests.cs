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
    public class PageDesignContentEditorWarningsProcessorTests
    {
        private static readonly ID PageDesignTemplateId = Constants.TemplateIds.PageDesign;
        private static readonly ID OtherTemplateId = new ID("{99999999-9999-9999-9999-999999999999}");

        private readonly IFieldUtilsService mockFieldUtils = Substitute.For<IFieldUtilsService>();
        private readonly IPresentationLogger mockLogger = Substitute.For<IPresentationLogger>();

        // ============================================================
        // Template Filtering
        // ============================================================
        [Fact]
        public void Process_WhenItemTemplateDoesNotMatch_AddsNoWarning()
        {
            // ARRANGE
            var processor = new PageDesignContentEditorWarningsProcessor(mockFieldUtils, mockLogger);
            var item = new FakeItem().WithTemplate(OtherTemplateId).ToSitecoreItem();
            var args = new GetContentEditorWarningsArgs(item);

            // ACT
            processor.Process(args);

            // ASSERT
            args.Warnings.Should().BeEmpty();
        }

        [Fact]
        public void Process_WhenExperienceContextProvidersFieldIsEmpty_AddsNoWarning()
        {
            // ARRANGE
            var processor = new PageDesignContentEditorWarningsProcessor(mockFieldUtils, mockLogger);
            var item = new FakeItem().WithTemplate(PageDesignTemplateId).ToSitecoreItem();
            var args = new GetContentEditorWarningsArgs(item);

            // ACT
            processor.Process(args);

            // ASSERT
            args.Warnings.Should().BeEmpty();
        }

        // ============================================================
        // Notification — Options Count
        // ============================================================
        [Fact]
        public void Process_WhenExperienceContextProvidersFieldHasProviders_AddsWarning()
        {
            // ARRANGE
            var masterDatabase = FakeUtil.FakeDatabase("master");
            var provider1 = new FakeItem(database: masterDatabase).WithLanguage("en").WithDisplayName("Provider A").ToSitecoreItem();
            var provider2 = new FakeItem(database: masterDatabase).WithLanguage("en").WithDisplayName("Provider B").ToSitecoreItem();

            var testableProcessor = new TestablePageDesignProcessor(
                mockFieldUtils,
                mockLogger,
                new[] { provider1, provider2 });

            var item = new FakeItem().WithTemplate(PageDesignTemplateId).ToSitecoreItem();
            var args = new GetContentEditorWarningsArgs(item);

            // ACT
            testableProcessor.Process(args);

            // ASSERT
            args.Warnings.Should().HaveCount(1);
            args.Warnings[0].Options.Should().HaveCount(2);
        }

        // ============================================================
        // Notification — Title
        // ============================================================
        [Fact]
        public void Process_WhenExperienceContextProvidersFieldHasProviders_SetsTitle()
        {
            // ARRANGE
            var masterDatabase = FakeUtil.FakeDatabase("master");
            var provider = new FakeItem(database: masterDatabase).WithLanguage("en").WithDisplayName("Provider").ToSitecoreItem();

            var testableProcessor = new TestablePageDesignProcessor(
                mockFieldUtils,
                mockLogger,
                new[] { provider });

            var item = new FakeItem().WithTemplate(PageDesignTemplateId).ToSitecoreItem();
            var args = new GetContentEditorWarningsArgs(item);

            // ACT
            testableProcessor.Process(args);

            // ASSERT
            args.Warnings.Should().HaveCount(1);
            args.Warnings[0].Title.Should().Be("This Page Design has the following Experience Context Providers assigned:");
        }

        // ============================================================
        // Notification — Icon
        // ============================================================
        [Fact]
        public void Process_WhenExperienceContextProvidersFieldHasProviders_SetsInfoIcon()
        {
            // ARRANGE
            var masterDatabase = FakeUtil.FakeDatabase("master");
            var provider = new FakeItem(database: masterDatabase).WithLanguage("en").WithDisplayName("Provider").ToSitecoreItem();

            var testableProcessor = new TestablePageDesignProcessor(
                mockFieldUtils,
                mockLogger,
                new[] { provider });

            var item = new FakeItem().WithTemplate(PageDesignTemplateId).ToSitecoreItem();
            var args = new GetContentEditorWarningsArgs(item);

            // ACT
            testableProcessor.Process(args);

            // ASSERT
            args.Warnings.Should().HaveCount(1);
            args.Warnings[0].Icon.Should().Be("Applications/32x32/information.png");
        }

        private sealed class TestablePageDesignProcessor : PageDesignContentEditorWarningsProcessor
        {
            private readonly Item[] providerItems;

            public TestablePageDesignProcessor(IFieldUtilsService pFieldUtils, IPresentationLogger pLogger, Item[] pProviderItems)
                : base(pFieldUtils, pLogger)
            {
                providerItems = pProviderItems;
            }

            protected override void ProcessWarning(Item contextItem, GetContentEditorWarningsArgs arguments)
            {
                AddNotification("This Page Design has the following Experience Context Providers assigned:", providerItems, arguments);
            }
        }
    }
}
