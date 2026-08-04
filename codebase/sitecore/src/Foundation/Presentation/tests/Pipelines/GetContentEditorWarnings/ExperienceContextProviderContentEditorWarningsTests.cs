using System;
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
    public class ExperienceContextProviderContentEditorWarningsTests
    {
        private static readonly ID ProviderTemplateId = Constants.TemplateIds.ExperienceContextProvider;
        private static readonly ID ProviderPageTemplateId = Constants.TemplateIds.ExperienceContextProviderPage;
        private static readonly ID PagesFieldId = Constants.Fields.ExperienceContextProvider.Pages;
        private static readonly ID PageFieldId = Constants.Fields.ExperienceContextProviderPage.Page;
        private static readonly ID Template1Id = new ID("{11111111-1111-1111-1111-111111111111}");
        private static readonly ID OtherTemplateId = new ID("{99999999-9999-9999-9999-999999999999}");

        private readonly IDatabaseProvider mockDatabaseProvider = Substitute.For<IDatabaseProvider>();
        private readonly IPresentationLogger mockLogger = Substitute.For<IPresentationLogger>();
        private readonly IFieldUtilsService mockFieldUtils = Substitute.For<IFieldUtilsService>();
        private readonly TestableProcessor processor;

        public ExperienceContextProviderContentEditorWarningsTests()
        {
            // Extract the fake database before passing to Returns() to avoid NSubstitute
            // CouldNotSetReturnDueToNoLastCallException when creating substitutes inside Returns().
            var masterDatabase = FakeUtil.FakeDatabase("master");
            mockDatabaseProvider.GetDatabase(DatabaseType.Context).Returns(masterDatabase);
            processor = new TestableProcessor(mockFieldUtils, mockDatabaseProvider, mockLogger);
        }

        // ============================================================
        // Core Database / Template Filtering
        // ============================================================
        [Fact]
        public void Process_WhenCoreDatabase_AddsNoInfo()
        {
            // ARRANGE
            var coreDatabase = FakeUtil.FakeDatabase("core");
            var item = new FakeItem(database: coreDatabase).ToSitecoreItem();
            var args = new GetContentEditorWarningsArgs(item);

            // ACT
            processor.Process(args);

            // ASSERT
            args.Warnings.Count.Should().Be(0);
        }

        [Fact]
        public void Process_WhenNonProviderTemplate_AddsNoInfo()
        {
            // ARRANGE
            var item = new FakeItem()
                .WithTemplate(OtherTemplateId)
                .ToSitecoreItem();
            var args = new GetContentEditorWarningsArgs(item);

            // ACT
            processor.Process(args);

            // ASSERT
            args.Warnings.Count.Should().Be(0);
        }

        // ============================================================
        // Provider Item (ExperienceContextProvider template) Scenarios
        // ============================================================
        [Fact]
        public void Process_WhenProviderHasNoPagesField_AddsNoInfo()
        {
            // ARRANGE
            var providerItem = new FakeItem()
                .WithTemplate(ProviderTemplateId)
                .ToSitecoreItem();
            var args = new GetContentEditorWarningsArgs(providerItem);

            // ACT
            processor.Process(args);

            // ASSERT
            args.Warnings.Count.Should().Be(0);
            mockLogger.Received(1).Debug(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]
        public void Process_WhenProviderHasEmptyPagesField_AddsNoInfo()
        {
            // ARRANGE
            var providerItem = new FakeItem()
                .WithTemplate(ProviderTemplateId)
                .WithField(PagesFieldId, string.Empty)
                .ToSitecoreItem();
            var args = new GetContentEditorWarningsArgs(providerItem);

            // ACT
            processor.Process(args);

            // ASSERT
            args.Warnings.Count.Should().Be(0);
            mockLogger.Received(1).Debug(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]
        public void Process_WhenProviderHasPages_DoesNotThrow()
        {
            // ARRANGE
            var providerItem = new FakeItem()
                .WithTemplate(ProviderTemplateId)
                .WithField(PagesFieldId, Template1Id.ToString())
                .ToSitecoreItem();
            var args = new GetContentEditorWarningsArgs(providerItem);

            // ACT
            Action act = () => processor.Process(args);

            // ASSERT
            act.Should().NotThrow();
        }

        // ============================================================
        // Provider Page Item (ExperienceContextProviderPage template) Scenarios
        // ============================================================
        [Fact]
        public void Process_WhenPageItemHasNoPageTemplateField_AddsNoInfo()
        {
            // ARRANGE
            var pageItem = new FakeItem()
                .WithTemplate(ProviderPageTemplateId)
                .ToSitecoreItem();
            var args = new GetContentEditorWarningsArgs(pageItem);

            // ACT
            processor.Process(args);

            // ASSERT
            args.Warnings.Count.Should().Be(0);
            mockLogger.Received(1).Debug(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]
        public void Process_WhenPageItemHasEmptyPageTemplateField_AddsNoInfo()
        {
            // ARRANGE
            var pageItem = new FakeItem()
                .WithTemplate(ProviderPageTemplateId)
                .WithField(PageFieldId, string.Empty)
                .ToSitecoreItem();
            var args = new GetContentEditorWarningsArgs(pageItem);

            // ACT
            processor.Process(args);

            // ASSERT
            args.Warnings.Count.Should().Be(0);
            mockLogger.Received(1).Debug(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]
        public void Process_WhenPageItemHasPageTemplate_DoesNotThrow()
        {
            // ARRANGE
            var pageItem = new FakeItem()
                .WithTemplate(ProviderPageTemplateId)
                .WithField(PageFieldId, Template1Id.ToString())
                .ToSitecoreItem();
            var args = new GetContentEditorWarningsArgs(pageItem);

            // ACT
            Action act = () => processor.Process(args);

            // ASSERT
            act.Should().NotThrow();
        }

        // ============================================================
        // Null / Edge Cases
        // ============================================================
        [Fact]
        public void Process_WhenArgsIsNull_DoesNotThrow()
        {
            // ARRANGE
            // ACT
            Action act = () => processor.Process(null);

            // ASSERT
            act.Should().NotThrow();
        }

        // ============================================================
        // AddNotification — Title and Options
        // ============================================================
        [Fact]
        public void AddNotification_WhenDesignsProvided_SetsTitle()
        {
            // ARRANGE
            var masterDatabase = FakeUtil.FakeDatabase("master");
            var designItem = new FakeItem(database: masterDatabase)
                .WithLanguage("en")
                .WithDisplayName("Slim Design - Flight Plus Hotel")
                .ToSitecoreItem();

            var args = new GetContentEditorWarningsArgs(new FakeItem().ToSitecoreItem());

            // ACT
            processor.InvokeAddNotification(new Item[] { designItem }, args);

            // ASSERT
            args.Warnings.Should().HaveCount(1);
            args.Warnings[0].Title.Should().Be("This Experience Context Provider is assigned to the following Page Designs:");
        }

        [Fact]
        public void AddNotification_WhenDesignsProvided_AddsOneOptionPerDesign()
        {
            // ARRANGE
            var masterDatabase = FakeUtil.FakeDatabase("master");
            var design1 = new FakeItem(database: masterDatabase).WithLanguage("en").WithDisplayName("Design A").ToSitecoreItem();
            var design2 = new FakeItem(database: masterDatabase).WithLanguage("en").WithDisplayName("Design B").ToSitecoreItem();

            var args = new GetContentEditorWarningsArgs(new FakeItem().ToSitecoreItem());

            // ACT
            processor.InvokeAddNotification(new Item[] { design1, design2 }, args);

            // ASSERT
            args.Warnings.Should().HaveCount(1);
            args.Warnings[0].Options.Should().HaveCount(2);
            args.Warnings[0].Options[0].Part1.Should().Be("Design A");
            args.Warnings[0].Options[1].Part1.Should().Be("Design B");
        }

        [Fact]
        public void AddNotification_WhenNoDesigns_AddsNoWarning()
        {
            // ARRANGE
            var args = new GetContentEditorWarningsArgs(new FakeItem().ToSitecoreItem());

            // ACT
            processor.InvokeAddNotification(Array.Empty<Item>(), args);

            // ASSERT
            args.Warnings.Should().BeEmpty();
        }

        // ============================================================
        // Concrete Processor Integration — ProcessWarning via BaseExperienceContextProvider
        // ============================================================
        [Fact]
        public void Process_WhenConcreteProcessorWithMatchingTemplate_AndNoPageDesigns_AddsNoWarning()
        {
            // ARRANGE
            var databaseProvider = Substitute.For<IDatabaseProvider>();
            var logger = Substitute.For<IPresentationLogger>();
            var fieldUtils = Substitute.For<IFieldUtilsService>();
            var masterDatabase = FakeUtil.FakeDatabase("master");
            databaseProvider.GetDatabase(DatabaseType.Context).Returns(masterDatabase);
            var concreteProcessor = new ExperienceContextProviderContentEditorWarningsProcessor(fieldUtils, databaseProvider, logger);
            var providerItem = new FakeItem().WithTemplate(ProviderTemplateId).ToSitecoreItem();
            var args = new GetContentEditorWarningsArgs(providerItem);

            // ACT
            concreteProcessor.Process(args);

            // ASSERT
            args.Warnings.Count.Should().Be(0);
        }

        private sealed class TestableProcessor : BaseExperienceContextProviderContentEditorWarningsProcessor
        {
            public TestableProcessor(IFieldUtilsService pFieldUtils, IDatabaseProvider pDatabaseProvider, IPresentationLogger pLogger)
                : base(pFieldUtils, pDatabaseProvider, pLogger)
            {
            }

            public void InvokeAddNotification(Item[] designs, GetContentEditorWarningsArgs args)
            {
                AddNotification("This Experience Context Provider is assigned to the following Page Designs:", designs, args);
            }

            protected override ID[] MatchingTemplateIds => new[] { ProviderTemplateId, ProviderPageTemplateId };

            protected override ID GetProviderId(Item contextItem) => contextItem.ID;

            protected override void ProcessWarning(Item contextItem, GetContentEditorWarningsArgs arguments)
            {
                if (contextItem.TemplateID == ProviderTemplateId)
                {
                    var pagesField = contextItem.Fields[PagesFieldId];
                    if (pagesField == null || string.IsNullOrEmpty(pagesField.Value))
                    {
                        Logger.Debug("Provider has no pages configured", this);
                        return;
                    }

                    AddNotification(GetAssignedPageDesigns(contextItem.ID), arguments);
                }
                else if (contextItem.TemplateID == ProviderPageTemplateId)
                {
                    var pageTemplateField = contextItem.Fields[PageFieldId];
                    if (pageTemplateField == null || string.IsNullOrEmpty(pageTemplateField.Value))
                    {
                        Logger.Debug("Page item has no page template configured", this);
                        return;
                    }

                    AddNotification(GetAssignedPageDesigns(contextItem.ID), arguments);
                }
            }
        }
    }
}
