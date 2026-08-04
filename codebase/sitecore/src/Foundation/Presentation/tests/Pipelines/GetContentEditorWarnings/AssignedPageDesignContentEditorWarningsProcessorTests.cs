using System;
using easyJet.Foundation.Presentation.Models;
using easyJet.Foundation.Presentation.Pipelines.GetContentEditorWarnings;
using easyJet.Foundation.Presentation.Repositories;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Sitecore.Pipelines.GetContentEditorWarnings;
using Xunit;

namespace easyJet.Foundation.Presentation.Tests.Pipelines.GetContentEditorWarnings
{
    public class AssignedPageDesignContentEditorWarningsProcessorTests
    {
        private const string ContextPath = "/sitecore/content/Holidays/Home/Deals/Spain";
        private static readonly ID PageTemplateId = ID.NewID;

        private readonly IPageDesignRepository repository = Substitute.For<IPageDesignRepository>();
        private readonly Database database = FakeUtil.FakeDatabase("master");

        [Fact]
        public void ProcessWarning_WhenNoMatches_AddsNoWarning()
        {
            // ARRANGE
            repository.GetMatchingPageDesigns(Arg.Any<Item>()).Returns(Array.Empty<PageDesignMatch>());
            var processor = new TestableProcessor(repository);
            var args = new GetContentEditorWarningsArgs(CreateContextPage());

            // ACT
            processor.Process(args);

            // ASSERT
            args.Warnings.Should().BeEmpty();
        }

        [Fact]
        public void ProcessWarning_WhenOnlyStandardDesign_AddsSingleLink()
        {
            // ARRANGE
            var standard = CreateDesign("Default");
            repository.GetMatchingPageDesigns(Arg.Any<Item>()).Returns(new[] { new PageDesignMatch(standard, ID.Null) });
            var processor = new TestableProcessor(repository);
            var args = new GetContentEditorWarningsArgs(CreateContextPage());

            // ACT
            processor.Process(args);

            // ASSERT
            args.Warnings.Should().HaveCount(1);
            args.Warnings[0].Title.Should().Be("Assigned Page Designs:");
            args.Warnings[0].Icon.Should().Be("Applications/32x32/information.png");
            args.Warnings[0].Options.Should().ContainSingle();
            args.Warnings[0].Options[0].Part1.Should().Be("Default");
        }

        [Fact]
        public void ProcessWarning_WhenStandardAndProviderDesigns_AddsWithoutAndWithEcpLinks()
        {
            // ARRANGE
            var standard = CreateDesign("Default");
            var providerId = ID.NewID;
            var providerItem = new FakeItem(providerId, database)
                .WithField(Constants.Fields.ExperienceContextProvider.Identifier, "FPH")
                .ToSitecoreItem();
            database.GetItem(providerId).Returns(providerItem);
            var providerDesign = CreateDesign("Info Design");
            repository.GetMatchingPageDesigns(Arg.Any<Item>()).Returns(new[]
            {
                new PageDesignMatch(standard, ID.Null),
                new PageDesignMatch(providerDesign, providerId),
            });
            var processor = new TestableProcessor(repository);
            var args = new GetContentEditorWarningsArgs(CreateContextPage());

            // ACT
            processor.Process(args);

            // ASSERT
            args.Warnings.Should().HaveCount(1);
            var options = args.Warnings[0].Options;
            options.Should().HaveCount(2);
            options.Should().Contain(o => o.Part1 == "Default" && o.Part2.Contains(standard.ID.ToString()));
            options.Should().Contain(o => o.Part1.Contains("Info Design") && o.Part1.Contains("FPH") && o.Part2.Contains(providerDesign.ID.ToString()));
        }

        [Fact]
        public void Process_WhenNullArguments_DoesNotThrow()
        {
            // ARRANGE
            var processor = new TestableProcessor(repository);

            // ACT
            processor.Process(null);

            // ASSERT
            repository.DidNotReceive().GetMatchingPageDesigns(Arg.Any<Item>());
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

        private sealed class TestableProcessor : AssignedPageDesignContentEditorWarningsProcessor
        {
            public TestableProcessor(IPageDesignRepository repository)
                : base(repository)
            {
            }

            protected override bool IsMatch(Item item) => true;
        }
    }
}
