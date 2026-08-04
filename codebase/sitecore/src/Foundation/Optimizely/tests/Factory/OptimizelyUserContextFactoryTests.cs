using easyJet.Foundation.Optimizely.Factory;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using OptimizelySDK;
using OptimizelySDK.Entity;
using Sitecore;
using Sitecore.Collections;
using Sitecore.FakeDb.Sites;
using Sitecore.Sites;
using Xunit;

namespace easyJet.Foundation.Optimizely.Tests.Factory
{
    public class OptimizelyUserContextFactoryTests
    {
        [Fact]
        public void GetUserId_ShouldReturnCookieValue_WhenCookieExists()
        {
            var httpContextAccessor = Substitute.For<IHttpContextAccessor>();
            httpContextAccessor.GetRequestCookieValue(Arg.Any<string>()).Returns("cookie-user");
            var sut = new OptimizelyUserContextFactory(httpContextAccessor);

            var userId = sut.GetUserId();

            userId.Should().Be("cookie-user");
        }

        [Fact]
        public void GetUserId_ShouldReturnNull_WhenNoCookieExistsAndNoContactIsAvailable()
        {
            var httpContextAccessor = Substitute.For<IHttpContextAccessor>();
            httpContextAccessor.GetRequestCookieValue(Arg.Any<string>()).Returns((string)null);
            var sut = new OptimizelyUserContextFactory(httpContextAccessor);

            var userId = sut.GetUserId();

            userId.Should().BeNull();
        }

        [Fact]
        public void GetAttributes_ShouldReturnSiteAndLanguageDefaults()
        {
            var httpContextAccessor = Substitute.For<IHttpContextAccessor>();
            var sut = new OptimizelyUserContextFactory(httpContextAccessor);

            var attributes = ExecuteInSiteContext(
                enableWebEdit: false,
                displayMode: DisplayMode.Normal,
                action: () => sut.GetAttributes());

            attributes["site"].Should().Be("Holidays");
            attributes["language"].Should().Be("en");
        }

        [Fact]
        public void TryCreateUserContext_ShouldReturnFalse_WhenUserIdIsMissing()
        {
            var httpContextAccessor = Substitute.For<IHttpContextAccessor>();
            httpContextAccessor.GetRequestCookieValue(Arg.Any<string>()).Returns((string)null);
            var client = Substitute.For<IOptimizely>();
            var sut = new OptimizelyUserContextFactory(httpContextAccessor);

            var result = ExecuteInSiteContext(
                enableWebEdit: false,
                displayMode: DisplayMode.Normal,
                action: () =>
                {
                    var canCreate = sut.TryCreateUserContext(client, out var context, out var userId);
                    return (canCreate, context, userId);
                });

            result.canCreate.Should().BeFalse();
            result.context.Should().BeNull();
            result.userId.Should().BeNull();
            client.DidNotReceive().CreateUserContext(Arg.Any<string>(), Arg.Any<UserAttributes>());
        }

        [Fact]
        public void TryCreateUserContext_ShouldCreateContext_WhenUserIdExistsAndNotExperienceEditor()
        {
            var httpContextAccessor = Substitute.For<IHttpContextAccessor>();
            httpContextAccessor.GetRequestCookieValue(Arg.Any<string>()).Returns("cookie-user");
            var client = Substitute.For<IOptimizely>();
            client.CreateUserContext(Arg.Any<string>(), Arg.Any<UserAttributes>()).Returns((OptimizelyUserContext)null);
            var sut = new OptimizelyUserContextFactory(httpContextAccessor);

            var result = ExecuteInSiteContext(
                enableWebEdit: false,
                displayMode: DisplayMode.Normal,
                action: () =>
                {
                    var canCreate = sut.TryCreateUserContext(client, out var context, out var userId);
                    return (canCreate, context, userId);
                });

            result.canCreate.Should().BeTrue();
            result.userId.Should().Be("cookie-user");
            client.Received(1).CreateUserContext(
                "cookie-user",
                Arg.Is<UserAttributes>(attributes =>
                    (string)attributes["site"] == "Holidays"
                    && (string)attributes["language"] == "en"));
        }

        private static T ExecuteInSiteContext<T>(bool enableWebEdit, DisplayMode displayMode, System.Func<T> action)
        {
            var fakeSiteContext = new FakeSiteContext(new StringDictionary
            {
                { "name", "Holidays" },
                { "enableWebEdit", enableWebEdit ? "true" : "false" },
                { "masterDatabase", "master" }
            });

            using (new SiteContextSwitcher(fakeSiteContext))
            {
                Context.Site.SetDisplayMode(displayMode, DisplayModeDuration.Remember);
                return action();
            }
        }
    }
}
