using System;
using AutoFixture.Xunit2;
using easyJet.Feature.Redirects.Models;
using easyJet.Feature.Redirects.Pipelines.GetLayoutServiceContext;
using easyJet.Feature.Redirects.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore;
using Sitecore.Data.Items;
using Sitecore.LayoutService.ItemRendering.Pipelines.GetLayoutServiceContext;
using Xunit;

namespace easyJet.Feature.Redirects.Tests.Pipelines.GetLayoutServiceContext
{
    [Collection("SitecoreSettings")]
    public class RedirectDataContextTests : IDisposable
    {
        private readonly RedirectDataContext redirectDataContext;
        private readonly IRedirectMapResolverService redirectMapResolverService;

        public RedirectDataContextTests()
        {
            redirectMapResolverService = Substitute.For<IRedirectMapResolverService>();
            redirectDataContext = new RedirectDataContext(redirectMapResolverService);
        }

        public void Dispose()
        {
            Context.Items.Remove("RedirectData");
        }

        [Theory]
        [AutoData]
        public void Process_ShouldAddRedirectData_IfContextDataHasNoRedirectData(RedirectData redirectData)
        {
            // Arrange
            Context.Items.Remove("RedirectData");
            var args = new GetLayoutServiceContextArgs();
            redirectMapResolverService.GetRedirectData(Arg.Any<Item>()).Returns(redirectData);

            // Act
            redirectDataContext.Process(args);

            // Assert
            args.ContextData.ContainsKey("redirect").Should().BeTrue();
            args.ContextData["redirect"].Should().Be(redirectData);
        }

        [Theory]
        [AutoData]
        public void Process_ShouldNotAddRedirectData_IfContextDataHasRedirectData(RedirectData redirectData)
        {
            // Arrange
            Context.Items.Remove("RedirectData");
            var args = new GetLayoutServiceContextArgs();
            args.ContextData.Add("redirect", redirectData);

            // Act
            redirectDataContext.Process(args);

            // Assert
            redirectMapResolverService.DidNotReceive().GetRedirectData(Arg.Any<Item>());
        }
    }
}
