using System;
using easyJet.Foundation.Analytics.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore;
using Sitecore.Analytics;
using Sitecore.Collections;
using Sitecore.Configuration;
using Sitecore.FakeDb.Sites;
using Xunit;

namespace easyJet.Foundation.Analytics.Tests.Services
{
    public class TrackerProviderTests
    {
        private readonly TrackerProvider sut = new TrackerProvider();

        [Fact]
        public void CurrentTracker_ShouldNotBeNull()
        {
            // Arrange
            var tracker = Substitute.For<ITracker>();
            using (new TrackerSwitcher(tracker))
            {
                // Act
                var t = sut.CurrentTracker;

                // Assert
                t.Should().NotBeNull();
            }
        }

        [Fact]
        public void CurrentTracker_ShouldThrowException_IfTrackerIsNull()
        {
            // Arrange
            Assert.Throws<ArgumentNullException>(() =>
            {
                using (new TrackerSwitcher(null))
                {
                    // Act
                    var t = sut.CurrentTracker;

                    // Assert
                    t.Should().BeNull();
                }
            });
        }

        [Theory]
        [InlineData("false", false)]
        [InlineData("true", false)]
        [InlineData("false", true)]
        public void Enabled_ShouldReturnFalse_IfXdbIsDisabled(string xdbSetting, bool analyticsInitialization)
        {
            // Arrange
            var fakeSiteContext = new FakeSiteContext(
                new StringDictionary
                {
                    { "name", "fake" },
                    { "contentDatabase", "master" }
                });

            using (new FakeSiteContextSwitcher(fakeSiteContext))
            {
                using (new SettingsSwitcher("Xdb.Tracking.Enabled", xdbSetting))
                {
                    Context.Items["ANALYTICS_DISABLE_INITIALIZATION"] = analyticsInitialization;

                    // Act/Assert
                    sut.Enabled.Should().BeFalse();
                }
            }
        }

        [Theory]
        [InlineData("true", true)]
        public void Enabled_ShouldReturnTrue_IfXdbIsEnabled(string xdbSetting, bool analyticsInitialization)
        {
            // Arrange
            var fakeSiteContext = new FakeSiteContext(
                new StringDictionary
                {
                    { "name", "fake" },
                    { "contentDatabase", "master" }
                });

            using (new FakeSiteContextSwitcher(fakeSiteContext))
            {
                using (new SettingsSwitcher("Xdb.Tracking.Enabled", xdbSetting))
                {
                    Context.Items["ANALYTICS_DISABLE_INITIALIZATION"] = analyticsInitialization;

                    // Act/Assert
                    sut.Enabled.Should().BeTrue();
                }
            }
        }

        [Theory]
        [InlineData("false", true, false)]
        [InlineData("true", false, false)]
        public void StartTracking_ShouldDoNothing_IfTrackerIsNotEnabled(string xdbSetting, bool analyticsInitialization, bool forceTracking)
        {
            // Arrange
            var fakeSiteContext = new FakeSiteContext(
                new StringDictionary
                {
                    { "name", "fake" },
                    { "contentDatabase", "master" }
                });

            // reset the force start flag
            Context.Items[Constants.Pipelines.StartAnalyticsForce] = null;

            using (new FakeSiteContextSwitcher(fakeSiteContext))
            {
                using (new SettingsSwitcher("Xdb.Tracking.Enabled", xdbSetting))
                {
                    Context.Items["ANALYTICS_DISABLE_INITIALIZATION"] = analyticsInitialization;

                    // Act
                    sut.StartTracking(forceTracking);

                    // Assert
                    Context.Items[Constants.Pipelines.StartAnalyticsForce].Should().BeNull();
                }
            }
        }

        [Fact]
        public void StartTracking_ShouldStartTracking()
        {
            // Arrange
            var fakeSiteContext = new FakeSiteContext(
                new StringDictionary
                {
                        { "name", "fake" },
                        { "contentDatabase", "master" }
                });
            using (new FakeSiteContextSwitcher(fakeSiteContext))
            {
                using (new SettingsSwitcher("Xdb.Tracking.Enabled", "true"))
                {
                    // Act
                    Assert.ThrowsAny<Exception>(() => sut.StartTracking(true));

                    // Assert
                    var expected = Context.Items[Constants.Pipelines.StartAnalyticsForce];
                    expected.Should().NotBeNull();
                    expected.Should().Be(true);
                }
            }
        }
    }
}