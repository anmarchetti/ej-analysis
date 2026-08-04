using easyJet.Foundation.Analytics.Services;
using easyJet.Foundation.Destinations.Pipelines.GetLayoutServiceContext;
using FluentAssertions;
using NSubstitute;
using Sitecore.Analytics.Data;
using Sitecore.Data.Items;
using Sitecore.JavaScriptServices.Configuration;
using Sitecore.LayoutService.Configuration;
using Sitecore.LayoutService.ItemRendering.Pipelines.GetLayoutServiceContext;
using Sitecore.Marketing.Definitions.Profiles;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Pipelines.GetLayoutServiceContext
{
    public class PageProfileDataContextTests
    {
        private readonly PageProfileDataContext pipeline;
        private readonly IProfileService profileService;

        public PageProfileDataContextTests()
        {
            profileService = Substitute.For<IProfileService>();
            pipeline = new PageProfileDataContext(Substitute.For<IConfigurationResolver>(), profileService);
        }

        [Fact]
        public void DoProcess_ShouldNotSetPageProfile_IfContextDataHasNoPageProfileKey()
        {
            // Arrange
            var args = new GetLayoutServiceContextArgs
            {
                RenderedItem = new FakeItem(),
                RenderingConfiguration = Substitute.For<IRenderingConfiguration>()
            };
            args.ContextData.Add("pageProfile", null);

            // Act
            pipeline.Process(args);

            // Assert
            args.ContextData["pageProfile"].Should().BeNull();
            profileService.DidNotReceive().GetItemTrackingFieldAndContentProfile(Arg.Any<Item>(), Arg.Any<string>());
        }

        [Fact]
        public void DoProcess_ShouldNotSetPageProfile_IfProfileIsNotHotelTheme()
        {
            // Arrange
            var args = new GetLayoutServiceContextArgs
            {
                RenderedItem = new FakeItem(),
                RenderingConfiguration = Substitute.For<IRenderingConfiguration>()
            };

            var contentProfile = new ContentProfile(Substitute.For<IProfileDefinition>());
            contentProfile.IsSavedInField = false;
            var profileTracking = (new TrackingField(new FakeField()), contentProfile);
            profileService.GetItemTrackingFieldAndContentProfile(Arg.Any<Item>(), Arg.Any<string>()).Returns(profileTracking);

            // Act
            pipeline.Process(args);

            // Assert
            args.ContextData.Should().NotContainKey("pageProfile");
        }

        [Fact]
        public void DoProcess_ShouldSetPageProfile_IfProfileIsSavedInField()
        {
            // Arrange
            var args = new GetLayoutServiceContextArgs
            {
                RenderedItem = new FakeItem(),
                RenderingConfiguration = Substitute.For<IRenderingConfiguration>()
            };

            var contentProfile = new ContentProfile(Substitute.For<IProfileDefinition>());
            contentProfile.IsSavedInField = true;
            var profileTracking = (new TrackingField(new FakeField()), contentProfile);
            profileService.GetItemTrackingFieldAndContentProfile(Arg.Any<Item>(), Arg.Any<string>()).Returns(profileTracking);

            // Act
            pipeline.Process(args);

            // Assert
            args.ContextData["pageProfile"].Should().NotBeNull();
        }
    }
}
