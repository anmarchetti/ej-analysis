using System;
using easyJet.Foundation.Presentation.Models;
using easyJet.Foundation.Presentation.Pipelines.GetContentEditorWarnings;
using easyJet.Foundation.Presentation.Repositories;
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
    public class ProviderPageDesignMissingRuleContentEditorWarningsProcessorTests
    {
        private const string ContextPath = "/sitecore/content/Holidays/Home/Flight plus Hotel/Help";
        private const string WarningTitle = "Provider page design without matching provider configuration:";
        private static readonly ID PageTemplateId = ID.NewID;

        private readonly IPageDesignRepository pageDesignRepository = Substitute.For<IPageDesignRepository>();
        private readonly IFieldUtilsService fieldUtils = Substitute.For<IFieldUtilsService>();
        private readonly Database database = FakeUtil.FakeDatabase("master");

        [Fact]
        public void ProcessWarning_WhenNoMatches_AddsNoWarning()
        {
            // ARRANGE
            pageDesignRepository.GetMatchingPageDesigns(Arg.Any<Item>()).Returns(Array.Empty<PageDesignMatch>());
            var processor = new TestableProcessor(pageDesignRepository, fieldUtils);
            var args = new GetContentEditorWarningsArgs(CreateContextPage());

            // ACT
            processor.Process(args);

            // ASSERT
            args.Warnings.Should().BeEmpty();
        }

        [Fact]
        public void ProcessWarning_WhenOnlyStandardDesign_AddsNoWarning()
        {
            // ARRANGE
            var standard = CreateDesign("Default");
            pageDesignRepository.GetMatchingPageDesigns(Arg.Any<Item>())
                .Returns(new[] { new PageDesignMatch(standard, ID.Null) });
            var processor = new TestableProcessor(pageDesignRepository, fieldUtils);
            var args = new GetContentEditorWarningsArgs(CreateContextPage());

            // ACT
            processor.Process(args);

            // ASSERT
            args.Warnings.Should().BeEmpty();
        }

        [Fact]
        public void ProcessWarning_WhenProviderHasPageRuleForItem_AddsNoWarning()
        {
            // ARRANGE
            var page = CreateContextPage();
            var providerId = CreateProvider("FPH", PageRule(page.ID));
            var design = CreateDesign("Slim Design - Flight plus Hotel - Info");
            pageDesignRepository.GetMatchingPageDesigns(Arg.Any<Item>())
                .Returns(new[] { new PageDesignMatch(design, providerId) });
            var processor = new TestableProcessor(pageDesignRepository, fieldUtils);
            var args = new GetContentEditorWarningsArgs(page);

            // ACT
            processor.Process(args);

            // ASSERT
            args.Warnings.Should().BeEmpty();
        }

        [Fact]
        public void ProcessWarning_WhenProviderHasTemplateRuleForTemplate_AddsNoWarning()
        {
            // ARRANGE
            var page = CreateContextPage();
            var providerId = CreateProvider("FPH", TemplateRule(PageTemplateId));
            var design = CreateDesign("Slim Design - Flight plus Hotel - Info");
            pageDesignRepository.GetMatchingPageDesigns(Arg.Any<Item>())
                .Returns(new[] { new PageDesignMatch(design, providerId) });
            var processor = new TestableProcessor(pageDesignRepository, fieldUtils);
            var args = new GetContentEditorWarningsArgs(page);

            // ACT
            processor.Process(args);

            // ASSERT
            args.Warnings.Should().BeEmpty();
        }

        [Fact]
        public void ProcessWarning_WhenProviderHasNoMatchingRule_AddsWarningLinkingToProvider()
        {
            // ARRANGE
            var page = CreateContextPage();
            var providerId = CreateProvider("FPH", PageRule(ID.NewID)); // rule points at a different page
            var design = CreateDesign("Slim Design - Flight plus Hotel - Info");
            pageDesignRepository.GetMatchingPageDesigns(Arg.Any<Item>())
                .Returns(new[] { new PageDesignMatch(design, providerId) });
            var processor = new TestableProcessor(pageDesignRepository, fieldUtils);
            var args = new GetContentEditorWarningsArgs(page);

            // ACT
            processor.Process(args);

            // ASSERT
            args.Warnings.Should().HaveCount(1);
            args.Warnings[0].Title.Should().Be(WarningTitle);
            args.Warnings[0].Icon.Should().Be("Applications/32x32/warning.png");
            args.Warnings[0].Options.Should().ContainSingle();
            args.Warnings[0].Options[0].Part1.Should().Contain("Slim Design - Flight plus Hotel - Info");
            args.Warnings[0].Options[0].Part1.Should().Contain("FPH");
            args.Warnings[0].Options[0].Part2.Should().Contain(providerId.ToString());
        }

        [Fact]
        public void ProcessWarning_WhenSomeProvidersConfiguredAndSomeNot_WarnsOnlyForUnconfigured()
        {
            // ARRANGE
            var page = CreateContextPage();
            var configuredProviderId = CreateProvider("MANAGE", PageRule(page.ID));
            var unconfiguredProviderId = CreateProvider("FPH", PageRule(ID.NewID));
            var manageDesign = CreateDesign("Manage Design");
            var fphDesign = CreateDesign("FPH Info Design");
            pageDesignRepository.GetMatchingPageDesigns(Arg.Any<Item>()).Returns(new[]
            {
                new PageDesignMatch(manageDesign, configuredProviderId),
                new PageDesignMatch(fphDesign, unconfiguredProviderId),
            });
            var processor = new TestableProcessor(pageDesignRepository, fieldUtils);
            var args = new GetContentEditorWarningsArgs(page);

            // ACT
            processor.Process(args);

            // ASSERT
            args.Warnings.Should().HaveCount(1);
            args.Warnings[0].Options.Should().ContainSingle();
            args.Warnings[0].Options[0].Part1.Should().Contain("FPH Info Design");
            args.Warnings[0].Options[0].Part1.Should().Contain("FPH");
        }

        [Fact]
        public void Process_WhenNullArguments_DoesNotThrow()
        {
            // ARRANGE
            var processor = new TestableProcessor(pageDesignRepository, fieldUtils);

            // ACT
            processor.Process(null);

            // ASSERT
            pageDesignRepository.DidNotReceive().GetMatchingPageDesigns(Arg.Any<Item>());
        }

        private Item CreateContextPage()
        {
            return new FakeItem(ID.NewID, database).WithTemplate(PageTemplateId).WithPath(ContextPath).ToSitecoreItem();
        }

        private Item CreateDesign(string name)
        {
            return new FakeItem(ID.NewID, database)
                .WithLanguage("en")
                .WithDisplayName(name)
                .WithPath($"/sitecore/content/Holidays/Presentation/Page Designs/{name}")
                .ToSitecoreItem();
        }

        private Item PageRule(ID targetPageId)
        {
            return new FakeItem(ID.NewID, database)
                .WithTemplate(Constants.TemplateIds.ExperienceContextProviderPage)
                .WithField(Constants.Fields.ExperienceContextProviderPage.Page, targetPageId.ToString())
                .ToSitecoreItem();
        }

        private Item TemplateRule(ID targetTemplateId)
        {
            return new FakeItem(ID.NewID, database)
                .WithTemplate(Constants.TemplateIds.ExperienceContextProviderPageTemplate)
                .WithField(Constants.Fields.ExperienceContextProviderPageTemplate.PageTemplate, targetTemplateId.ToString())
                .ToSitecoreItem();
        }

        private ID CreateProvider(string identifier, params Item[] rules)
        {
            var providerId = ID.NewID;
            var providerItem = new FakeItem(providerId, database)
                .WithLanguage("en")
                .WithDisplayName($"{identifier} Provider")
                .WithField(Constants.Fields.ExperienceContextProvider.Identifier, identifier)
                .ToSitecoreItem();
            database.GetItem(providerId).Returns(providerItem);
            fieldUtils.GetMultilistTargetItems(Constants.Fields.ExperienceContextProvider.Pages, providerItem).Returns(rules);
            return providerId;
        }

        private sealed class TestableProcessor : ProviderPageDesignMissingRuleContentEditorWarningsProcessor
        {
            public TestableProcessor(IPageDesignRepository pageDesignRepository, IFieldUtilsService fieldUtils)
                : base(pageDesignRepository, fieldUtils)
            {
            }

            protected override bool IsMatch(Item item) => true;
        }
    }
}
