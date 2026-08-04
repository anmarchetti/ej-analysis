using System.Reflection;
using AutoFixture.Xunit2;
using easyJet.Foundation.SiteModes.Pipelines.GetLayoutServiceContext;
using easyJet.Foundation.SiteModes.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Collections;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Sites;
using Sitecore.JavaScriptServices.Configuration;
using Sitecore.LayoutService.ItemRendering.Pipelines.GetLayoutServiceContext;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.SiteModes.Tests.Pipelines.GetLayoutServiceContext
{
    public class MaintenanceModeContextDataProcessorTests
    {
        private readonly FakeSiteContext siteContext;
        private readonly MaintenanceModeContextDataProcessor processor;
        private readonly ISiteModeService service;

        public MaintenanceModeContextDataProcessorTests()
        {
            service = Substitute.For<ISiteModeService>();
            processor = new MaintenanceModeContextDataProcessor(service, Substitute.For<IConfigurationResolver>());
            processor.AddWebsite("Holidays");
            siteContext = new FakeSiteContext(
                new StringDictionary
                {
                    { "name", "Holidays" },
                    { "database", "web" },
                    { "rootPath", "/sitecore/content/easyJet/Holidays" }
                });
        }

        [Theory]
        [AutoData]
        public void DoProcess_ShouldAddPropertiesToLayout_IfRenderedItemIsNotNull(Db db, bool isFullMode, bool isSoftMode)
        {
            // Arrange
            var renderedDbItem = new DbItem("Simple item");
            db.Add(renderedDbItem);

            service.IsFullMode().Returns(isFullMode);
            service.IsSoftMode().Returns(isSoftMode);

            var args = new GetLayoutServiceContextArgs();
            args.RenderedItem = db.GetItem(renderedDbItem.ID);

            using (new Sitecore.Sites.SiteContextSwitcher(siteContext))
            {
                // Act
                processor.GetType().GetMethod("DoProcess", BindingFlags.NonPublic | BindingFlags.Instance).Invoke(processor, new object[] { args, null });
                var actual = args.ContextData.Keys;

                // Assert
                actual.Should().Contain("isFullMode");
                actual.Should().Contain("isSoftMode");
            }
        }
    }
}
