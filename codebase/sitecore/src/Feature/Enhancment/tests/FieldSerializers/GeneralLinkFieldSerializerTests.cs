using System;
using System.IO;
using System.Text;
using easyJet.Feature.SitecoreEnhancment.Serialization.FieldSerializers;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using FluentAssertions;
using Newtonsoft.Json;
using NSubstitute;
using Sitecore;
using Sitecore.Abstractions;
using Sitecore.Collections;
using Sitecore.Data;
using Sitecore.Data.Fields;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Sites;
using Sitecore.LayoutService.Serialization;
using Xunit;

namespace easyJet.Feature.SitecoreEnhancment.Tests.FieldSerializers
{
    public class GeneralLinkFieldSerializerTests
    {
        private class TestSerializer : GeneralLinkFieldSerializer
        {
            public TestSerializer(IFieldRenderer fr)
                : base(fr)
            {
            }

            public string Call(LinkField f)
            {
                return GetLinkUrl(f);
            }
        }

        [Fact]
        public void GetLinkUrl_WhenTargetIsNull_ShouldReturnFriendlyUrl()
        {
            // Arrange
            var fieldRenderer = Substitute.For<IFieldRenderer>();
            var sut = new TestSerializer(fieldRenderer);

            using (var db = new Db())
            {
                var dbItem = new DbItem("ItemWithExternalLink");
                dbItem.Fields.Add(new DbField("Link")
                {
                    Value = "<link linktype=\"external\" url=\"http://example.com\" />"
                });
                db.Add(dbItem);

                var item = db.GetItem(dbItem.ID);
                var linkField = new LinkField(item.Fields["Link"]);

                // Act
                var url = sut.Call(linkField);

                // Assert
                url.Should().Be("http://example.com");
            }
        }

        [Fact]
        public void GetLinkUrl_WhenInternalTarget_ShouldReturnItemUrl()
        {
            // Arrange
            var fieldRenderer = Substitute.For<IFieldRenderer>();
            var sut = new TestSerializer(fieldRenderer);

            var fakeSiteContext = new FakeSiteContext(
                new StringDictionary
                {
                    { "name", "fake" },
                    { "contentDatabase", "master" },
                    { "rootPath", "/sitecore/content" }
                });

            using (new FakeSiteContextSwitcher(fakeSiteContext))
            using (var db = new Db())
            {
                var target = new DbItem("Target");
                target.Fields.Add(new DbField(FieldIDs.LayoutField) { Value = "FakeLayout" });
                db.Add(target);

                var container = new DbItem("Container");
                container.Fields.Add(new DbField("Link")
                {
                    Value = $"<link linktype=\"internal\" id=\"{target.ID.Guid}\" />"
                });
                db.Add(container);

                var item = db.GetItem(container.ID);
                var linkField = new LinkField(item.Fields["Link"]);

                var expected = db.GetItem(target.ID).GetItemUrl();

                // Act
                var url = sut.Call(linkField);

                // Assert
                url.Should().Be(expected);
            }
        }

        [Fact]
        public void GetLinkUrl_WhenIsMediaLink_ShouldReturnFriendlyUrl()
        {
            // Arrange
            var fieldRenderer = Substitute.For<IFieldRenderer>();
            var sut = new TestSerializer(fieldRenderer);

            using (var db = new Db())
            {
                var mediaId = ID.NewID;
                var mediaDbItem = new DbItem("test-image", mediaId)
                {
                    ParentID = ID.Parse("{3D6658D8-A0BF-4E75-B3E2-D050FABCF4E1}")
                };
                mediaDbItem.Fields.Add(new DbField("Extension") { Value = "jpg" });
                db.Add(mediaDbItem);

                var container = new DbItem("Container");
                container.Fields.Add(new DbField("Link")
                {
                    Value = $"<link linktype=\"media\" id=\"{mediaId.Guid}\" mediaid=\"{mediaId.Guid}\" />"
                });
                db.Add(container);

                var item = db.GetItem(container.ID);
                var linkField = new LinkField(item.Fields["Link"]);

                // Act
                Action act = () => sut.Call(linkField);

                // Assert
                act.Should().Throw<InvalidOperationException>();
            }
        }

        [Fact]
        public void GetLinkUrl_WhenAlwaysIncludeServerUrlAndTargetOutsideRoot_ShouldBuildUrl()
        {
            // Arrange
            var fieldRenderer = Substitute.For<IFieldRenderer>();
            var sut = new TestSerializer(fieldRenderer);

            var fakeSiteContext = new FakeSiteContext(
                new StringDictionary
                {
                    { "name", "fake" },
                    { "contentDatabase", "master" },
                    { "alwaysIncludeServerUrl", "true" },
                    { "rootPath", "/sitecore/content/nested" },
                    { "hostName", "www.fake-host.com" }
                });

            using (new FakeSiteContextSwitcher(fakeSiteContext))
            using (var db = new Db())
            {
                var target = new DbItem("Target");
                target.Fields.Add(new DbField(FieldIDs.LayoutField) { Value = "FakeLayout" });
                db.Add(target);

                var container = new DbItem("Container");
                container.Fields.Add(new DbField("Link")
                {
                    Value = $"<link linktype=\"internal\" id=\"{target.ID.Guid}\" />"
                });
                db.Add(container);

                var item = db.GetItem(container.ID);
                var linkField = new LinkField(item.Fields["Link"]);

                // Act
                Action act = () => sut.Call(linkField);

                // Assert
                act.Should().Throw<UriFormatException>();
            }
        }

        [Fact]
        public void GetLinkUrl_WhenAlwaysIncludeServerUrlAndTargetInsideRoot_ShouldBuildUrl()
        {
            // Arrange
            var fieldRenderer = Substitute.For<IFieldRenderer>();
            var sut = new TestSerializer(fieldRenderer);

            var fakeSiteContext = new FakeSiteContext(
                new StringDictionary
                {
                    { "name", "fake" },
                    { "contentDatabase", "master" },
                    { "alwaysIncludeServerUrl", "true" },
                    { "rootPath", "/sitecore/content" }
                });

            using (new FakeSiteContextSwitcher(fakeSiteContext))
            using (var db = new Db())
            {
                var target = new DbItem("Target");
                target.Fields.Add(new DbField(FieldIDs.LayoutField) { Value = "FakeLayout" });
                db.Add(target);

                var container = new DbItem("Container");
                container.Fields.Add(new DbField("Link")
                {
                    Value = $"<link linktype=\"internal\" id=\"{target.ID.Guid}\" />"
                });
                db.Add(container);

                var item = db.GetItem(container.ID);
                var linkField = new LinkField(item.Fields["Link"]);

                // Act
                var url = sut.Call(linkField);

                // Assert
                url.Should().NotBeNullOrEmpty();
            }
        }
    }
}
