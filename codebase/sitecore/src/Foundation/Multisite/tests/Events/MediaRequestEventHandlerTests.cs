using AutoFixture.Xunit2;
using easyJet.Foundation.Multisite.Events;
using FluentAssertions;
using NSubstitute;
using Sitecore.Events;
using Sitecore.FakeDb;
using Sitecore.Resources.Media;
using Xunit;

namespace easyJet.Foundation.Multisite.Tests.Events
{
    public class MediaRequestEventHandlerTests
    {
        [Fact]
        public void BuildRobotsHeaderValue_ShouldReturnNull_IfItemIsNull()
        {
            var actual = MediaRequestEventHandler.BuildRobotsHeaderValue(null);

            actual.Should().BeNull();
        }

        [Theory]
        [AutoData]
        public void BuildRobotsHeaderValue_ShouldReturnNull_IfNoIndexFieldDoesNotExist(Db db)
        {
            var itemDb = new DbItem("Pdf");
            db.Add(itemDb);

            var actual = MediaRequestEventHandler.BuildRobotsHeaderValue(db.GetItem(itemDb.ID));

            actual.Should().BeNull();
        }

        [Theory]
        [AutoData]
        public void BuildRobotsHeaderValue_ShouldReturnNull_IfNoIndexFieldIsEmpty(Db db)
        {
            var itemDb = new DbItem("Pdf");
            itemDb.Fields.Add(Constants.Fields.BasePdf.NoIndex, string.Empty);
            db.Add(itemDb);

            var actual = MediaRequestEventHandler.BuildRobotsHeaderValue(db.GetItem(itemDb.ID));

            actual.Should().BeNull();
        }

        [Theory]
        [AutoData]
        public void BuildRobotsHeaderValue_ShouldReturnNoIndex_IfNoIndexIsSelected(Db db)
        {
            var itemDb = new DbItem("Pdf");
            itemDb.Fields.Add(Constants.Fields.BasePdf.NoIndex, "1");

            db.Add(itemDb);

            var actual = MediaRequestEventHandler.BuildRobotsHeaderValue(db.GetItem(itemDb.ID));

            actual.Should().Be("noindex");
        }

        [Fact]
        public void IsSupportedMediaExtension_ShouldReturnTrue_ForPdf()
        {
            MediaRequestEventHandler.IsSupportedMediaExtension("pdf").Should().BeTrue();
            MediaRequestEventHandler.IsSupportedMediaExtension("PDF").Should().BeTrue();
        }

        [Fact]
        public void IsSupportedMediaExtension_ShouldReturnFalse_ForNonPdf()
        {
            MediaRequestEventHandler.IsSupportedMediaExtension("jpg").Should().BeFalse();
            MediaRequestEventHandler.IsSupportedMediaExtension(string.Empty).Should().BeFalse();
            MediaRequestEventHandler.IsSupportedMediaExtension(null).Should().BeFalse();
        }

        [Fact]
        public void GetHeaderValueToApply_ShouldSetHeader_IfMissing()
        {
            var actual = MediaRequestEventHandler.GetHeaderValueToApply(null, "noindex");

            actual.Should().Be("noindex");
        }

        [Fact]
        public void GetHeaderValueToApply_ShouldOverwriteHeader_IfAlreadyPresent()
        {
            var actual = MediaRequestEventHandler.GetHeaderValueToApply("noindex, nofollow", "noindex");

            actual.Should().Be("noindex");
        }

        [Fact]
        public void IsShellSite_ShouldReturnTrue_ForShellSite()
        {
            MediaRequestEventHandler.IsShellSite("shell").Should().BeTrue();
            MediaRequestEventHandler.IsShellSite("SHELL").Should().BeTrue();
        }

        [Fact]
        public void IsShellSite_ShouldReturnFalse_ForNonShellSite()
        {
            MediaRequestEventHandler.IsShellSite("website").Should().BeFalse();
            MediaRequestEventHandler.IsShellSite(null).Should().BeFalse();
        }

        [Fact]
        public void TryGetMediaRequest_ShouldReturnFalse_IfArgsIsNull()
        {
            var actual = MediaRequestEventHandler.TryGetMediaRequest(null, out var request);

            actual.Should().BeFalse();
            request.Should().BeNull();
        }

        [Fact]
        public void TryGetMediaRequest_ShouldReturnFalse_IfArgsDoNotContainMediaRequest()
        {
            var args = new SitecoreEventArgs("OnMediaRequest", new object[] { new object() }, new EventResult());

            var actual = MediaRequestEventHandler.TryGetMediaRequest(args, out var request);

            actual.Should().BeFalse();
            request.Should().BeNull();
        }

        [Fact]
        public void TryGetMediaRequest_ShouldReturnFalse_IfArgsContainNoParameters()
        {
            var args = new SitecoreEventArgs("OnMediaRequest", new object[] { }, new EventResult());

            var actual = MediaRequestEventHandler.TryGetMediaRequest(args, out var request);

            actual.Should().BeFalse();
            request.Should().BeNull();
        }

        [Theory]
        [AutoData]
        public void TryApplyRobotsHeader_ShouldReturnFalse_ForNonPdf(Db db)
        {
            var itemDb = new DbItem("Asset");
            itemDb.Fields.Add(Constants.Fields.BasePdf.NoIndex, "1");
            db.Add(itemDb);
            var item = db.GetItem(itemDb.ID);

            var headers = new System.Collections.Specialized.NameValueCollection();
            var actual = MediaRequestEventHandler.TryApplyRobotsHeader("jpg", item, headers);

            actual.Should().BeFalse();
            headers["X-Robots-Tag"].Should().BeNull();
        }

        [Theory]
        [AutoData]
        public void TryApplyRobotsHeader_ShouldSetHeader_ForPdfWithNoIndex(Db db)
        {
            var itemDb = new DbItem("Asset");
            itemDb.Fields.Add(Constants.Fields.BasePdf.NoIndex, "1");
            db.Add(itemDb);
            var item = db.GetItem(itemDb.ID);

            var headers = new System.Collections.Specialized.NameValueCollection();
            var actual = MediaRequestEventHandler.TryApplyRobotsHeader("pdf", item, headers);

            actual.Should().BeTrue();
            headers["X-Robots-Tag"].Should().Be("noindex");
        }

        [Theory]
        [AutoData]
        public void TryApplyRobotsHeader_ShouldOverwriteHeader_IfAlreadyPresent(Db db)
        {
            var itemDb = new DbItem("Asset");
            itemDb.Fields.Add(Constants.Fields.BasePdf.NoIndex, "1");
            db.Add(itemDb);
            var item = db.GetItem(itemDb.ID);

            var headers = new System.Collections.Specialized.NameValueCollection
            {
                ["X-Robots-Tag"] = "noindex, nofollow"
            };

            var actual = MediaRequestEventHandler.TryApplyRobotsHeader("pdf", item, headers);

            actual.Should().BeTrue();
            headers["X-Robots-Tag"].Should().Be("noindex");
        }

        [Fact]
        public void TryApplyFromEvent_ShouldReturnFalse_ForShellSite()
        {
            var args = new SitecoreEventArgs("OnMediaRequest", new object[] { new object() }, new EventResult());

            var actual = MediaRequestEventHandler.TryApplyFromEvent("shell", args, new System.Collections.Specialized.NameValueCollection(), _ => null);

            actual.Should().BeFalse();
        }

        [Fact]
        public void TryApplyFromEvent_ShouldReturnFalse_IfArgsAreInvalid()
        {
            var actual = MediaRequestEventHandler.TryApplyFromEvent("website", null, new System.Collections.Specialized.NameValueCollection(), _ => null);

            actual.Should().BeFalse();
        }

        [Fact]
        public void TryApplyFromEvent_ShouldReturnFalse_IfResolverIsNull()
        {
            var args = new SitecoreEventArgs("OnMediaRequest", new object[] { new object() }, new EventResult());

            var actual = MediaRequestEventHandler.TryApplyFromEvent("website", args, new System.Collections.Specialized.NameValueCollection(), null);

            actual.Should().BeFalse();
        }

        [Fact]
        public void TryApplyFromEvent_ShouldReturnFalse_IfMediaResolverReturnsNull()
        {
            var mediaRequest = Substitute.For<MediaRequest>();
            var args = new SitecoreEventArgs("OnMediaRequest", new object[] { mediaRequest }, new EventResult());

            var actual = MediaRequestEventHandler.TryApplyFromEvent("website", args, new System.Collections.Specialized.NameValueCollection(), _ => null);

            actual.Should().BeFalse();
        }

        [Theory]
        [AutoData]
        public void TryApplyRobotsHeader_ShouldReturnFalse_IfHeadersAreNull(Db db)
        {
            var itemDb = new DbItem("Asset");
            itemDb.Fields.Add(Constants.Fields.BasePdf.NoIndex, "1");
            db.Add(itemDb);
            var item = db.GetItem(itemDb.ID);

            var actual = MediaRequestEventHandler.TryApplyRobotsHeader("pdf", item, null);

            actual.Should().BeFalse();
        }

        [Theory]
        [AutoData]
        public void TryApplyRobotsHeader_ShouldReturnFalse_IfNoIndexIsNotChecked(Db db)
        {
            var itemDb = new DbItem("Asset");
            itemDb.Fields.Add(Constants.Fields.BasePdf.NoIndex, string.Empty);
            db.Add(itemDb);
            var item = db.GetItem(itemDb.ID);

            var headers = new System.Collections.Specialized.NameValueCollection();
            var actual = MediaRequestEventHandler.TryApplyRobotsHeader("pdf", item, headers);

            actual.Should().BeFalse();
            headers["X-Robots-Tag"].Should().BeNull();
        }
    }
}
