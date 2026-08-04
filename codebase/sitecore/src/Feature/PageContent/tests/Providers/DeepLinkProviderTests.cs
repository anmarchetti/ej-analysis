using AutoFixture.Xunit2;
using easyJet.Feature.PageContent.Pipelines.Arguments;
using easyJet.Feature.PageContent.Pipelines.TransparentFolder;
using easyJet.Feature.PageContent.Providers;
using FluentAssertions;
using NSubstitute;
using Sitecore.Abstractions;
using Sitecore.Collections;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Pipelines;
using Sitecore.FakeDb.Sites;
using Sitecore.Links.UrlBuilders;
using Sitecore.Sites;
using Xunit;
using Specialized = System.Collections.Specialized;

namespace easyJet.Feature.PageContent.Tests.Providers
{
    public class DeepLinkProviderTests
    {
        private readonly DeepLinkProvider provider;
        private readonly BaseFactory factory;

        public DeepLinkProviderTests()
        {
            factory = Substitute.For<BaseFactory>();
            provider = new DeepLinkProvider(factory);
        }

        [Theory]
        [AutoData]
        public void GetItemUrl_ShouldReturnItemUrl_IfItemTemplateIsNotDeepLink(
            Db db,
            Specialized.NameValueCollection config,
            string testUrl)
        {
            // Arrange
            RegisterPipelines(db);
            var pageDbItem = new DbItem("Simple page");
            db.Add(pageDbItem);

            var pageItem = db.GetItem(pageDbItem.ID);

            var expectedResult = GetPageUrl(pageItem, config, testUrl);

            var builder = GetUrlBuilder(testUrl);
            factory.CreateObject(Arg.Any<string>(), Arg.Any<bool>()).Returns(builder);
            provider.Initialize("test", config);

            var fakeSite = new FakeSiteContext(new StringDictionary
            {
                { "name", "website" }, { "database", "web" }
            });

            using (new SiteContextSwitcher(fakeSite))
            {
                // Act
                var act = provider.GetItemUrl(pageItem, new ItemUrlBuilderOptions());

                // Assert
                act.Should().Be(expectedResult);
            }
        }

        [Theory]
        [AutoData]
        public void GetItemUrl_ShouldReturnFaqItemUrl_IfItemTemplateIsFaq(
            Db db,
            string faqCategoryNavigationParameter,
            string faqItemNavigationParameter,
            Specialized.NameValueCollection config,
            string testUrl)
        {
            // Arrange
            RegisterPipelines(db);
            var pageDbItem = new DbItem("Simple page", ID.NewID, Constants.TemplateIds.BasePage);
            var pageComponentsDbItem = new DbItem("Page Components", ID.NewID, ID.NewID);
            var faqFolderDbItem = new DbItem("FAQ", ID.NewID, ID.NewID);

            var faqCategoryDbItem = new DbItem("Faq category 1", ID.NewID, Constants.TemplateIds.FaqCategory);
            faqCategoryDbItem.Fields.Add(new DbField(Constants.Fields.DeepLinkItem.NavigationParameter) { Value = faqCategoryNavigationParameter });

            var faqDbItem = new DbItem("Faq item 1", ID.NewID, Constants.TemplateIds.FaqItem);
            faqDbItem.Fields.Add(new DbField(Constants.Fields.DeepLinkItem.NavigationParameter) { Value = faqItemNavigationParameter });

            faqCategoryDbItem.Add(faqDbItem);
            faqFolderDbItem.Add(faqCategoryDbItem);
            pageComponentsDbItem.Add(faqFolderDbItem);
            pageDbItem.Add(pageComponentsDbItem);
            db.Add(pageDbItem);

            var faqItem = db.GetItem(faqDbItem.ID);
            var fakeSite = new FakeSiteContext(new StringDictionary
            {
                { "name", "website" }, { "database", "web" }
            });

            using (new SiteContextSwitcher(fakeSite))
            {
                var expectedResult =
                    $"{GetPageUrl(db.GetItem(pageDbItem.ID), config, testUrl)}?{Constants.QueryParameters.DeepLink.HelpCategory}={faqCategoryNavigationParameter}&{Constants.QueryParameters.DeepLink.HelpQuestion}={faqItemNavigationParameter}";

                var builder = GetUrlBuilder(testUrl);
                factory.CreateObject(Arg.Any<string>(), Arg.Any<bool>()).Returns(builder);
                provider.Initialize("test", config);

                // Act
                var act = provider.GetItemUrl(faqItem, new ItemUrlBuilderOptions());

                // Assert
                act.Should().Be(expectedResult);
            }
        }

        [Theory]
        [AutoData]
        public void GetItemUrl_ShouldReturnFaqItemUrl_IfItemTemplateIsFaqCategory(
            Db db,
            string faqCategoryNavigationParameter,
            Specialized.NameValueCollection config,
            string testUrl)
        {
            // Arrange
            RegisterPipelines(db);
            var pageDbItem = new DbItem("Simple page", ID.NewID, Constants.TemplateIds.BasePage);
            var pageComponentsDbItem = new DbItem("Page Components", ID.NewID, ID.NewID);
            var faqFolderDbItem = new DbItem("FAQ", ID.NewID, ID.NewID);

            var faqCategoryDbItem = new DbItem("Faq category 1", ID.NewID, Constants.TemplateIds.FaqCategory);
            faqCategoryDbItem.Fields.Add(new DbField(Constants.Fields.DeepLinkItem.NavigationParameter) { Value = faqCategoryNavigationParameter });

            faqFolderDbItem.Add(faqCategoryDbItem);
            pageComponentsDbItem.Add(faqFolderDbItem);
            pageDbItem.Add(pageComponentsDbItem);
            db.Add(pageDbItem);

            var faqCategoryItem = db.GetItem(faqCategoryDbItem.ID);

            var expectedResult = $"{GetPageUrl(db.GetItem(pageDbItem.ID), config, testUrl)}?{Constants.QueryParameters.DeepLink.HelpCategory}={faqCategoryNavigationParameter}";

            var builder = GetUrlBuilder(testUrl);
            factory.CreateObject(Arg.Any<string>(), Arg.Any<bool>()).Returns(builder);
            provider.Initialize("test", config);

            // Act
            var act = provider.GetItemUrl(faqCategoryItem, new ItemUrlBuilderOptions());

            // Assert
            act.Should().Be(expectedResult);
        }

        [Theory]
        [AutoData]
        public void GetItemUrl_ShouldReturnQaItemUrl_IfItemTemplateIsQuestionAndAnswer(
            Db db,
            string qaNavigationParameter,
            Specialized.NameValueCollection config,
            string testUrl)
        {
            // Arrange
            RegisterPipelines(db);
            var pageDbItem = new DbItem("Simple page", ID.NewID, Constants.TemplateIds.BasePage);
            var pageComponentsDbItem = new DbItem("Page Components", ID.NewID, ID.NewID);
            var qaFolderDbItem = new DbItem("Questions And Answers", ID.NewID, ID.NewID);

            var qaDbItem = new DbItem("QA item 1", ID.NewID, Constants.TemplateIds.QuestionAndAnswer);
            qaDbItem.Fields.Add(new DbField(Constants.Fields.DeepLinkItem.NavigationParameter) { Value = qaNavigationParameter });

            qaFolderDbItem.Add(qaDbItem);
            pageComponentsDbItem.Add(qaFolderDbItem);
            pageDbItem.Add(pageComponentsDbItem);
            db.Add(pageDbItem);

            var qaItem = db.GetItem(qaDbItem.ID);
            var expectedResult = $"{GetPageUrl(db.GetItem(pageDbItem.ID), config, testUrl)}?{Constants.QueryParameters.DeepLink.HelpQuestion}={qaNavigationParameter}";

            var builder = GetUrlBuilder(testUrl);
            factory.CreateObject(Arg.Any<string>(), Arg.Any<bool>()).Returns(builder);
            provider.Initialize("test", config);

            // Act
            var act = provider.GetItemUrl(qaItem, new ItemUrlBuilderOptions());

            // Assert
            act.Should().Be(expectedResult);
        }

        private static Item GetTransparencyResolvedItem(object[] objects)
        {
            var args = objects[0] as GetItemUrlPipelineArgs;

            new RemoveTransparentFolderFromUrlProcessor().Process(args);

            return args?.Item;
        }

        /// <summary>
        /// Gets fake item url.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <param name="nameValueCollection">Config.</param>
        /// <param name="testUrl">Fake url.</param>
        /// <returns>Returns fake sitecore item url.</returns>
        private string GetPageUrl(Item item, System.Collections.Specialized.NameValueCollection nameValueCollection, string testUrl)
        {
            var baseFactory = Substitute.For<BaseFactory>();
            var url = GetUrlBuilder(testUrl);
            baseFactory.CreateObject(Arg.Any<string>(), Arg.Any<bool>()).Returns(url);
            var provider = new TransparencyAwareLinkProvider(baseFactory);
            provider.Initialize("test", nameValueCollection);

            return provider.GetItemUrl(item, new ItemUrlBuilderOptions());
        }

        /// <summary>
        /// Returns mocked item url builder.
        /// </summary>
        /// <param name="testUrl">Fake sitecore item url.</param>
        /// <returns>Return mocked item url builder.</returns>
        private ItemUrlBuilder GetUrlBuilder(string testUrl)
        {
            var url = Substitute.For<ItemUrlBuilder>(new DefaultItemUrlBuilderOptions());
            url.Build(Arg.Any<Item>(), Arg.Any<ItemUrlBuilderOptions>()).Returns(testUrl);
            return url;
        }

        private void RegisterPipelines(Db db)
        {
            var removeTransparencyResolver = Substitute.For<IPipelineProcessor>();
            removeTransparencyResolver.When(p => p.Process(Arg.Any<GetItemUrlPipelineArgs>()))
                .Do(ci => ci.Arg<GetItemUrlPipelineArgs>().Item = GetTransparencyResolvedItem(ci.Args()));

            db.PipelineWatcher.Register(Constants.Pipelines.GetItemUrl, removeTransparencyResolver);
        }
    }
}