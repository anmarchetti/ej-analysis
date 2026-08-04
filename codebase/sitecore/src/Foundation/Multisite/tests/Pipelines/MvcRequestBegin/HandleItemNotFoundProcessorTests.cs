using System;
using System.Net;
using System.Web;
using System.Web.Routing;
using easyJet.Foundation.Multisite.Pipelines.HttpRequestBegin;
using easyjet.Foundation.Testing.Attributes;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.FakeDb;
using Sitecore.LayoutService.Mvc.ItemResolving;
using Sitecore.LayoutService.Mvc.Routing;
using Sitecore.Mvc.Pipelines.Request.RequestBegin;
using Xunit;

namespace easyJet.Foundation.Multisite.Tests.Pipelines.MvcRequestBegin
{
    public class HandleItemNotFoundProcessorTests
    {
        private readonly IItemResolver itemResolver;
        private readonly IRouteMapper routeMapper;
        private readonly HandleItemNotFoundProcessor handleItemNotFoundProcessor;

        public HandleItemNotFoundProcessorTests()
        {
            itemResolver = Substitute.For<IItemResolver>();
            routeMapper = Substitute.For<IRouteMapper>();

            handleItemNotFoundProcessor = new HandleItemNotFoundProcessor(itemResolver, routeMapper);
        }

        [Fact]
        public void Process_ShouldThrowException_IfArgsNull()
        {
            // Act
            Action actual = () => handleItemNotFoundProcessor.Process(null);

            // Assert
            actual.Should().Throw<ArgumentNullException>();
        }

        [Fact]
        public void Process_ShouldNotThrowException_IfArgsNotNull()
        {
            // Arrange
            var requestContext = new RequestContext();
            var args = new RequestBeginArgs(requestContext);

            // Act
            Action actual = () => handleItemNotFoundProcessor.Process(args);

            // Assert
            actual.Should().NotThrow<ArgumentNullException>();
        }

        [Theory]
        [AutoDbData]
        public void Process_ShouldAsignContextItem_IfItemNotFoundPageItemExist(Db db)
        {
            // Arrange
            var requestContext = new RequestContext();

            requestContext.HttpContext =
                new HttpContextWrapper(new HttpContext(new HttpRequest("fake", "http://sc.holidays.local", "item=qwe"), new HttpResponse(null)));

            var args = new RequestBeginArgs(requestContext)
            {
                PageContext = new Sitecore.Mvc.Presentation.PageContext()
                {
                    RequestContext = new RequestContext()
                }
            };

            var item = new DbItem("Setting", ID.NewID, Templates.Settings.Id);

            var referenceDbItem = new DbItem("Page");
            var referenceDbField = new DbField("Item Not Found Page")
            {
                Type = "Lookup",
                Value = referenceDbItem.ID.ToString()
            };

            item.Fields.Add(referenceDbField);

            var fakeSite = new Sitecore.FakeDb.Sites.FakeSiteContext(
                    new Sitecore.Collections.StringDictionary
                    {
                        { "rootPath", "/sitecore/content" }
                    });

            using (new Sitecore.FakeDb.Sites.FakeSiteContextSwitcher(fakeSite))
            {
                db.Add(item);
                db.Add(referenceDbItem);
                routeMapper.IsLayoutServiceRoute(Arg.Any<RequestContext>()).Returns(true);

                // Act
                handleItemNotFoundProcessor.Process(args);
                var actual = args.RequestContext.HttpContext.Response;

                // Assert
                actual.StatusCode.Should().Be((int)HttpStatusCode.NotFound);
            }
        }
    }
}
