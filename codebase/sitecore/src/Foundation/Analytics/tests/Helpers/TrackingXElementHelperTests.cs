using easyJet.Foundation.Analytics.Helpers;
using FluentAssertions;
using Sitecore.Analytics.Data;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Analytics.Tests.Helpers
{
    public class TrackingXElementHelperTests
    {
        [Fact]
        public void GetOrCreateTrackingXDocumentWithTracking_ShouldCreateTrackingElement_IfFieldIsEmpty()
        {
            // Arrange
            var field = new FakeField().WithValue(string.Empty);
            var trackingField = new TrackingField(field);

            var expectedValue = "tracking";

            // Act
            var (fieldValue, tracking) = TrackingXElementHelper.GetOrCreateTrackingXDocumentWithTracking(trackingField);

            // Assert
            fieldValue.Should().HaveRoot(expectedValue);
            tracking.Name.LocalName.Should().Be(expectedValue);
        }

        [Fact]
        public void GetOrCreateTrackingXDocumentWithTracking_ShouldGetTrackingElement_IfFieldHasValue()
        {
            // Arrange
            var trackingValue = "<tracking>  <event id=\"{6832464E-097C-4BC2-A5A7-101F545936D0}\" name=\"Guest Details\" />  <profile id=\"c707f3dc-54cc-4e7d-8e3e-6c151deeafc8\" name=\"Hotel Themes\" presets=\"beach|0||\">    <key name=\"Beach\" value=\"0\" />    <key name=\"City\" value=\"0\" />    <key name=\"Lakes\" value=\"0\" />  </profile></tracking>";
            var field = new FakeField().WithValue(trackingValue);
            var trackingField = new TrackingField(field);

            var expectedValue = "tracking";

            // Act
            var (fieldValue, tracking) = TrackingXElementHelper.GetOrCreateTrackingXDocumentWithTracking(trackingField);

            // Assert
            fieldValue.Should().HaveRoot(expectedValue);
            tracking.Name.LocalName.Should().Be(expectedValue);
        }
    }
}
