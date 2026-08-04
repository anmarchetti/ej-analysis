using System.Collections.Generic;
using System.Linq;
using AutoFixture;
using AutoFixture.Xunit2;
using easyJet.Foundation.Presentation.Pipelines.GetLayoutServiceContext;
using FluentAssertions;
using NSubstitute;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Sites;
using Sitecore.JavaScriptServices.Configuration;
using Sitecore.LayoutService.ItemRendering.Pipelines.GetLayoutServiceContext;
using Xunit;

namespace easyJet.Foundation.Presentation.Tests.Pipelines.GetLayoutServiceContext
{
    public class ExtendContextDataProcessorTests : ExtendContextDataProcessor
    {
        private readonly Fixture fixture;
        private readonly Db db;

        public ExtendContextDataProcessorTests()
            : base(Substitute.For<IConfigurationResolver>())
        {
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
        }

        [Fact]
        public void DoProcess_ShouldNotSetParentsKey_IfRenderingItemNull()
        {
            // Arrange
            var args = new GetLayoutServiceContextArgs();

            // Act
            DoProcess(args, null);

            var actual = args.CustomData.Keys;

            // Assert
            actual.Should().NotContain("url");
        }

        [Fact]
        public void DoProcess_ShouldSetUrlKey_IfItemHasUrl()
        {
            // Arrange
            var parentItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            item.TemplateID = Constants.TemplateIds.BasePage;

            var dateField = new DbField(Constants.Fields.BaseName.Name);
            dateField.Value = "fake";
            item.Fields.Add(dateField);

            parentItem.Children.Add(item);
            db.Add(parentItem);

            var args = new GetLayoutServiceContextArgs();
            args.RenderedItem = db.GetItem(item.ID);

            var fakeSiteContext = new FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                {
                    { "name", "fake" },
                    { "database", "master" }
                });

            // Act
            using (new FakeSiteContextSwitcher(fakeSiteContext))
            {
                // Act
                DoProcess(args, null);
                var actual = args.ContextData.Keys;

                // Assert
                actual.Should().Contain("url");
            }
        }

        [Fact]
        public void DoProcess_ShouldSetParentPagesKey_IfItemHasUrl()
        {
            // Arrange
            var parentItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            item.TemplateID = Constants.TemplateIds.BasePage;

            parentItem.Children.Add(item);
            db.Add(parentItem);

            var args = new GetLayoutServiceContextArgs();
            args.RenderedItem = db.GetItem(item.ID);

            var fakeSiteContext = new FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                {
                    { "name", "fake" },
                    { "database", "master" }
                });

            // Act
            using (new FakeSiteContextSwitcher(fakeSiteContext))
            {
                // Act
                DoProcess(args, null);
                var actual = args.ContextData.Keys;

                // Assert
                actual.Should().Contain("parentPages");
            }
        }

        [Theory]
        [AutoData]
        public void DoProcess_ShouldSetPageNameValue_IfItemHasValueInNameField(string name)
        {
            // Arrange
            var parentItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            item.TemplateID = Constants.TemplateIds.BasePage;

            var dateField = new DbField(Constants.Fields.BaseName.Name);
            dateField.Value = name;
            item.Fields.Add(dateField);

            parentItem.Children.Add(item);
            db.Add(parentItem);

            var args = new GetLayoutServiceContextArgs();
            args.RenderedItem = db.GetItem(item.ID);

            var fakeSiteContext = new FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                {
                    { "name", name },
                    { "database", "master" }
                });

            // Act
            using (new FakeSiteContextSwitcher(fakeSiteContext))
            {
                // Act
                DoProcess(args, null);
                var parentPage = args.ContextData["parentPages"] as Stack<KeyValuePair<string, string>>;
                var actual = parentPage.FirstOrDefault().Key;

                // Assert
                actual.Should().Be(name);
            }
        }
    }
}
