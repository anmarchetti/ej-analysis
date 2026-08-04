using easyJet.Foundation.Multisite.Pipelines.GetContentEditorWarnings;
using easyJet.Foundation.Multisite.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Sitecore.Pipelines.GetContentEditorWarnings;
using Xunit;

namespace easyJet.Foundation.Multisite.Tests.Pipelines.GetContentEditorWarnings
{
    public class DelegatedAreaWarningTests
    {
        private readonly IDelegatedAreaService service;
        private readonly DelegatedAreaWarning proccessor;

        public DelegatedAreaWarningTests()
        {
            service = Substitute.For<IDelegatedAreaService>();
            proccessor = new DelegatedAreaWarning(service);
        }

        [Fact]
        public void Process_ShouldNotAddWarning_IfItemDatabaseIsCore()
        {
            // Arrange
            var database = FakeUtil.FakeDatabase("core");
            var item = new FakeItem(database: database);
            var args = new GetContentEditorWarningsArgs(item);

            // Act
            proccessor.Process(args);

            // Assert
            args.Warnings.Count.Should().Be(0);
        }

        [Fact]
        public void Process_ShouldNotAddWarning_IfItemIsNotInDelegatedArea()
        {
            // Arrange
            var item = new FakeItem();
            var args = new GetContentEditorWarningsArgs(item);
            service.CheckForDelegatedArea(Arg.Any<Item>()).Returns(false);

            // Act
            proccessor.Process(args);

            // Assert
            args.Warnings.Count.Should().Be(0);
        }

        [Fact]
        public void Process_ShouldAddWarning_IfItemIsInDelegatedArea()
        {
            // Arrange
            var item = new FakeItem();
            var source = new FakeItem();
            item.WithSource(source);
            item.WithLanguage("en");
            item.WithItemVersions();

            item.ToSitecoreItem().Versions.GetLatestVersion().Returns(item);

            var args = new GetContentEditorWarningsArgs(item);
            service.CheckForDelegatedArea(Arg.Any<Item>()).Returns(true);

            // Act
            proccessor.Process(args);

            // Assert
            args.Warnings.Count.Should().Be(1);
        }
    }
}
