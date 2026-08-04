using System.Collections.Generic;
using NSubstitute;
using Sitecore.NSubstituteUtils;
using Sitecore.NSubstituteUtils.Extensions;
using Sitecore.Sites;

namespace easyJet.Foundation.Translation.Tests.Pipelines.GetItem
{
    public class DisabledFallbackAwareGetLanguageFallbackItemData
    {
        public static IEnumerable<object[]> InvalidItems()
        {
            yield return new object[] { null };

            yield return new object[] { new FakeItem().WithName("__Standard Values") };

            yield return new object[] { new FakeItem().WithIsFallback(false) };
        }

        public static IEnumerable<object[]> UnProcessableContexts()
        {
            // Is in experience editor
            var eeContext = Substitute.ForPartsOf<SiteContext>(
                new SiteInfoPropertiesBuilder().WithSiteName("fakeSiteForTests").WithEnableWebEdit(true).ToSiteInfo());
            eeContext.DisplayMode.Returns(DisplayMode.Edit);
            yield return new object[] { eeContext, false };

            var galleryRequestContext = Substitute.ForPartsOf<SiteContext>(new SiteInfoPropertiesBuilder().WithSiteName("shell").ToSiteInfo());

            var galleryRequestSiteRequestSubstitute = Substitute.ForPartsOf<SiteRequest>(galleryRequestContext);
            galleryRequestSiteRequestSubstitute
                .GetQueryString(Arg.Is<string>(param => param == "xmlcontrol"), Arg.Any<string>())
                .Returns("Gallery.Languages");
            galleryRequestContext.Request.Returns(galleryRequestSiteRequestSubstitute);

            yield return new object[] { galleryRequestContext, false };

            var shellSiteContext = Substitute.ForPartsOf<SiteContext>(new SiteInfoPropertiesBuilder().WithSiteName("shell").ToSiteInfo());

            yield return new object[] { shellSiteContext, true };
        }
    }
}