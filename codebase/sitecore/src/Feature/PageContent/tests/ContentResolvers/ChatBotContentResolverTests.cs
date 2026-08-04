using System;
using System.Text.Json;
using AutoFixture.Xunit2;
using easyJet.Feature.PageContent.ContentResolvers;
using easyJet.Foundation.Analytics.Services;
using FluentAssertions;
using Newtonsoft.Json.Linq;
using NSubstitute;
using Sitecore.Analytics;
using Sitecore.Analytics.Model;
using Sitecore.Analytics.Tracking;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.LayoutService.Configuration;
using Sitecore.Mvc.Presentation;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Feature.PageContent.Tests.ContentResolvers
{
    public class ChatBotContentResolverTests
    {
        private readonly ChatBotContentResolver resolver;
        private readonly IRenderingConfiguration renderingConfig;
        private readonly ITrackerProvider trackerProvider;

        public ChatBotContentResolverTests()
        {
            // Arrange
            trackerProvider = Substitute.For<ITrackerProvider>();
            renderingConfig = Substitute.For<IRenderingConfiguration>();
            resolver = new ChatBotContentResolver(trackerProvider);
        }

        [Fact]
        public void ResolveContents_ShouldNotAddEmptySCAnalyticsValue_IfHasNoDatasource()
        {
            // Arrange
            resolver.UseContextItem = false;

            var rendering = Substitute.For<Rendering>();

            // Act
            var actual = resolver.ResolveContents(rendering, renderingConfig);

            // Assert
            actual.Should().BeNull();
        }

        [Fact]
        public void ResolveContents_ShouldAddEmptySCAnalyticsValue_IfTrackerIsNull()
        {
            // Arrange
            resolver.UseContextItem = false;

            var database = Substitute.For<Database>();
            var item = new FakeItem();
            database.GetItem(Arg.Any<string>()).Returns(item);

            var renderingItem = Substitute.For<RenderingItem>(item.ToSitecoreItem());
            renderingItem.Database.Returns(database);

            var rendering = Substitute.For<Rendering>();
            rendering.RenderingItem.Returns(renderingItem);
            rendering.DataSource.Returns(item.ID.ToString());

            string serilizedText = JsonSerializer.Serialize(new
            {
                Name = "FakeItem"
            });

            renderingConfig.ItemSerializer.Serialize(Arg.Any<Item>()).Returns(serilizedText);

            ITracker tracker = null;

            trackerProvider.CurrentTracker.Returns(tracker);

            // Act
            var actual = resolver.ResolveContents(rendering, renderingConfig) as JObject;

            // Assert
            ((string)actual["SCAnalyticsGlobalValue"]).Should().BeEmpty();
        }

        [AutoData]
        [Theory]
        public void ResolveContents_ShouldAddSCAnalyticsValue_IfTrackerHasDeviceId(Guid id)
        {
            // Arrange
            resolver.UseContextItem = false;

            var database = Substitute.For<Database>();
            var item = new FakeItem();
            database.GetItem(Arg.Any<string>()).Returns(item);

            var renderingItem = Substitute.For<RenderingItem>(item.ToSitecoreItem());
            renderingItem.Database.Returns(database);

            var rendering = Substitute.For<Rendering>();
            rendering.RenderingItem.Returns(renderingItem);
            rendering.DataSource.Returns(item.ID.ToString());

            string serilizedText = JsonSerializer.Serialize(new
            {
                Name = "FakeItem"
            });

            renderingConfig.ItemSerializer.Serialize(Arg.Any<Item>()).Returns(serilizedText);

            var tracker = Substitute.For<ITracker>();
            var session = Substitute.For<Session>();
            var device = Substitute.For<DeviceData>(id);
            device.DeviceId = id;

            tracker.Session.Returns(session);
            session.Device.Returns(device);

            trackerProvider.CurrentTracker.Returns(tracker);
            string expected = id.ToString("N");

            // Act
            var actual = resolver.ResolveContents(rendering, renderingConfig) as JObject;

            // Assert
            ((string)actual["SCAnalyticsGlobalValue"]).Should().Be(expected);
        }
    }
}
