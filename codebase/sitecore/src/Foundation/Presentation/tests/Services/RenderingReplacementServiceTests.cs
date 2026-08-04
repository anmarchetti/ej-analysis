using System;
using System.Linq;
using System.Web;
using System.Xml.Linq;
using easyJet.Foundation.Presentation.Models;
using easyJet.Foundation.Presentation.Services;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Xunit;

namespace easyJet.Foundation.Presentation.Tests.Services
{
    public class RenderingReplacementServiceTests
    {
        private readonly IDatabaseProvider databaseProvider;
        private readonly IUrlDecodingService urlDecodingService;
        private readonly RenderingReplacementService sut;

        public RenderingReplacementServiceTests()
        {
            databaseProvider = Substitute.For<IDatabaseProvider>();
            urlDecodingService = Substitute.For<IUrlDecodingService>();
            urlDecodingService.UrlDecode(Arg.Any<string>()).Returns(x => HttpUtility.UrlDecode((string)x[0]));
            sut = new RenderingReplacementService(urlDecodingService, databaseProvider);
        }

        [Fact]
        public void ReplaceRendering_WhenCalled_ShouldRemoveAllOriginalAttributes()
        {
            // ARRANGE
            var rendering = new XElement("r");
            rendering.SetAttributeValue("id", Guid.NewGuid().ToString());
            rendering.SetAttributeValue("ds", "/sitecore/content");
            rendering.SetAttributeValue("ph", "main");
            rendering.SetAttributeValue("par", "foo=bar");
            rendering.SetAttributeValue("uid", Guid.NewGuid().ToString("B").ToUpper());
            rendering.SetAttributeValue("cac", "VaryByData");
            rendering.SetAttributeValue("ods", "original");
            rendering.SetAttributeValue("custom", "test");
            var mapping = new RenderingMapping(ID.NewID, ID.NewID, string.Empty);

            // ACT
            sut.ReplaceRendering(rendering, mapping);

            // ASSERT
            rendering.Attributes().Select(a => a.Name.LocalName).Should().BeEquivalentTo(new[] { "id", "uid" });
        }

        [Fact]
        public void ReplaceRendering_WhenCalled_ShouldSetIdFromMappingValueId()
        {
            // ARRANGE
            var valueId = ID.NewID;
            var mapping = new RenderingMapping(ID.NewID, valueId, string.Empty);
            var rendering = new XElement("r");
            rendering.SetAttributeValue("uid", Guid.NewGuid().ToString("B").ToUpper());

            // ACT
            sut.ReplaceRendering(rendering, mapping);

            // ASSERT
            rendering.Attribute("id").Value.Should().Be(valueId.ToString());
        }

        [Fact]
        public void ReplaceRendering_WhenCalled_ShouldPreserveSourceUid()
        {
            // Arrange
            var originalUid = Guid.NewGuid().ToString("B").ToUpper();
            var rendering = new XElement("r");
            rendering.SetAttributeValue("uid", originalUid);
            var mapping = new RenderingMapping(ID.NewID, ID.NewID, string.Empty);

            // Act
            sut.ReplaceRendering(rendering, mapping);

            // Assert
            rendering.Attribute("uid").Value.Should().Be(originalUid);
        }

        [Fact]
        public void ReplaceRendering_WhenRenderingIdsAreIdentical_ShouldPreserveSourceUid()
        {
            // Arrange
            var sourceUid = Guid.NewGuid();
            var rendering = new XElement("r");
            rendering.SetAttributeValue("uid", sourceUid.ToString("B").ToUpper());
            var sharedId = ID.NewID;
            var mapping = new RenderingMapping(sharedId, sharedId, string.Empty);

            // Act
            sut.ReplaceRendering(rendering, mapping);

            // Assert
            rendering.Attribute("uid").Value.Should().Be(sourceUid.ToString("B").ToUpper());
        }

        [Fact]
        public void ReplaceRendering_WhenRenderingIdsDiffer_ShouldPreserveSourceUid()
        {
            // Arrange
            var sourceUid = Guid.NewGuid();
            var rendering = new XElement("r");
            rendering.SetAttributeValue("uid", sourceUid.ToString("B").ToUpper());
            var mapping = new RenderingMapping(ID.NewID, ID.NewID, string.Empty);

            // Act
            sut.ReplaceRendering(rendering, mapping);

            // Assert
            rendering.Attribute("uid").Value.Should().Be(sourceUid.ToString("B").ToUpper());
        }

        [Fact]
        public void ReplaceRendering_WhenNoSourceUid_ShouldThrow()
        {
            // Arrange
            var rendering = new XElement("r");
            var mapping = new RenderingMapping(ID.NewID, ID.NewID, string.Empty);

            // Act
            Action act = () => sut.ReplaceRendering(rendering, mapping);

            // Assert
            act.Should().Throw<InvalidOperationException>();
        }

        [Fact]
        public void ReplaceRendering_WhenParametersContainPlaceholder_ShouldSetPhAttribute()
        {
            // ARRANGE
            var mapping = new RenderingMapping(ID.NewID, ID.NewID, "Placeholder=header");
            var rendering = new XElement("r");
            rendering.SetAttributeValue("uid", Guid.NewGuid().ToString("B").ToUpper());

            // ACT
            sut.ReplaceRendering(rendering, mapping);

            // ASSERT
            rendering.Attribute("ph").Value.Should().Be("header");
            rendering.Attribute("par").Should().BeNull();
        }

        [Fact]
        public void ReplaceRendering_WhenParametersContainDataSource_ShouldSetDsAttribute()
        {
            // ARRANGE
            var mapping = new RenderingMapping(ID.NewID, ID.NewID, "Data+Source=%7bF24FEA24-0B77-4844-AAF8-A9C3EFC317CB%7d");
            var rendering = new XElement("r");
            rendering.SetAttributeValue("uid", Guid.NewGuid().ToString("B").ToUpper());

            // ACT
            sut.ReplaceRendering(rendering, mapping);

            // ASSERT
            rendering.Attribute("ds").Value.Should().Be("{F24FEA24-0B77-4844-AAF8-A9C3EFC317CB}");
        }

        [Fact]
        public void ReplaceRendering_WhenParametersContainCaching_ShouldSetCacAttribute()
        {
            // ARRANGE
            var mapping = new RenderingMapping(ID.NewID, ID.NewID, "Caching=VaryByData");
            var rendering = new XElement("r");
            rendering.SetAttributeValue("uid", Guid.NewGuid().ToString("B").ToUpper());

            // ACT
            sut.ReplaceRendering(rendering, mapping);

            // ASSERT
            rendering.Attribute("cac").Value.Should().Be("VaryByData");
        }

        [Fact]
        public void ReplaceRendering_WhenWellKnownKeyHasEmptyValue_ShouldNotSetAttribute()
        {
            // ARRANGE
            var mapping = new RenderingMapping(ID.NewID, ID.NewID, "Placeholder=&Data+Source=");
            var rendering = new XElement("r");
            rendering.SetAttributeValue("uid", Guid.NewGuid().ToString("B").ToUpper());

            // ACT
            sut.ReplaceRendering(rendering, mapping);

            // ASSERT
            rendering.Attribute("ph").Should().BeNull();
            rendering.Attribute("ds").Should().BeNull();
        }

        [Fact]
        public void ReplaceRendering_WhenParametersContainCustomParams_ShouldSetParWithRemainingOnly()
        {
            // ARRANGE
            var mapping = new RenderingMapping(
                ID.NewID,
                ID.NewID,
                "Placeholder=header&Data+Source=%7bF24FEA24-0B77-4844-AAF8-A9C3EFC317CB%7d&CustomParam=value&AnotherParam=123");
            var rendering = new XElement("r");
            rendering.SetAttributeValue("uid", Guid.NewGuid().ToString("B").ToUpper());

            // ACT
            sut.ReplaceRendering(rendering, mapping);

            // ASSERT
            rendering.Attribute("par").Value.Should().Be("CustomParam=value&AnotherParam=123");
            rendering.Attribute("ph").Value.Should().Be("header");
            rendering.Attribute("ds").Value.Should().Be("{F24FEA24-0B77-4844-AAF8-A9C3EFC317CB}");
        }

        [Fact]
        public void ReplaceRendering_WhenOnlyWellKnownParams_ShouldNotSetParAttribute()
        {
            // ARRANGE
            var mapping = new RenderingMapping(
                ID.NewID,
                ID.NewID,
                "Placeholder=header&Data+Source=%7bF24FEA24-0B77-4844-AAF8-A9C3EFC317CB%7d");
            var rendering = new XElement("r");
            rendering.SetAttributeValue("uid", Guid.NewGuid().ToString("B").ToUpper());

            // ACT
            sut.ReplaceRendering(rendering, mapping);

            // ASSERT
            rendering.Attribute("par").Should().BeNull();
        }

        [Fact]
        public void ReplaceRendering_WhenParametersIsEmpty_ShouldOnlySetIdAndUid()
        {
            // ARRANGE
            var mapping = new RenderingMapping(ID.NewID, ID.NewID, string.Empty);
            var rendering = new XElement("r");
            rendering.SetAttributeValue("uid", Guid.NewGuid().ToString("B").ToUpper());

            // ACT
            sut.ReplaceRendering(rendering, mapping);

            // ASSERT
            rendering.Attributes().Select(a => a.Name.LocalName).Should().BeEquivalentTo(new[] { "id", "uid" });
        }

        [Fact]
        public void ReplaceRendering_WhenParametersIsNull_ShouldOnlySetIdAndUid()
        {
            // ARRANGE
            var mapping = new RenderingMapping(ID.NewID, ID.NewID, null);
            var rendering = new XElement("r");
            rendering.SetAttributeValue("uid", Guid.NewGuid().ToString("B").ToUpper());

            // ACT
            sut.ReplaceRendering(rendering, mapping);

            // ASSERT
            rendering.Attributes().Select(a => a.Name.LocalName).Should().BeEquivalentTo(new[] { "id", "uid" });
        }

        [Fact]
        public void ReplaceRendering_WhenFullParameterString_ShouldCorrectlyDistributeAllAttributes()
        {
            // ARRANGE
            var mapping = new RenderingMapping(
                ID.NewID,
                ID.NewID,
                "Placeholder=content&Data+Source=%7bAABBCCDD-1122-3344-5566-778899AABBCC%7d&Caching=VaryByData&CustomHeight=300&CustomWidth=auto");
            var rendering = new XElement("r");
            rendering.SetAttributeValue("uid", Guid.NewGuid().ToString("B").ToUpper());

            // ACT
            sut.ReplaceRendering(rendering, mapping);

            // ASSERT
            rendering.Attribute("ph").Value.Should().Be("content");
            rendering.Attribute("ds").Value.Should().Be("{AABBCCDD-1122-3344-5566-778899AABBCC}");
            rendering.Attribute("cac").Value.Should().Be("VaryByData");
            rendering.Attribute("par").Value.Should().Be("CustomHeight=300&CustomWidth=auto");
            rendering.Attributes().Select(a => a.Name.LocalName).Should().BeEquivalentTo(new[] { "id", "uid", "ph", "ds", "cac", "par" });
        }

        [Fact]
        public void TryApplyReplacement_ReturnsFalse_WhenReplacementsIsNull()
        {
            // ARRANGE
            var rendering = new XElement("r");
            rendering.SetAttributeValue("id", ID.NewID.ToString());
            rendering.SetAttributeValue("uid", Guid.NewGuid().ToString("B").ToUpper());

            // ACT
            var result = sut.TryApplyReplacement(rendering, ID.NewID, null);

            // ASSERT
            result.Should().BeFalse();
        }

        [Fact]
        public void TryApplyReplacement_ReturnsFalse_WhenRenderingIdNotInReplacements()
        {
            // ARRANGE
            var renderingId = ID.NewID;
            var otherId = ID.NewID;
            var mapping = new RenderingMapping(otherId, ID.NewID, null);
            var replacements = new[] { mapping }.ToLookup(m => m.KeyId);
            var rendering = new XElement("r");
            rendering.SetAttributeValue("uid", Guid.NewGuid().ToString("B").ToUpper());

            // ACT
            var result = sut.TryApplyReplacement(rendering, renderingId, replacements);

            // ASSERT
            result.Should().BeFalse();
        }

        [Fact]
        public void TryApplyReplacement_ReturnsFalse_WhenMappingValueIdIsNullOrEmpty()
        {
            // ARRANGE
            var renderingId = ID.NewID;
            var mapping = new RenderingMapping(renderingId, ID.Null, null, Guid.Empty, isJustRemove: false);
            var replacements = new[] { mapping }.ToLookup(m => m.KeyId);
            var rendering = new XElement("r");
            rendering.SetAttributeValue("uid", Guid.NewGuid().ToString("B").ToUpper());

            // ACT
            var result = sut.TryApplyReplacement(rendering, renderingId, replacements);

            // ASSERT
            result.Should().BeFalse();
        }

        [Fact]
        public void TryApplyReplacement_ReturnsFalse_WhenReplacementItemMissingFromDatabase()
        {
            // ARRANGE
            var renderingId = ID.NewID;
            var valueId = ID.NewID;
            var mapping = new RenderingMapping(renderingId, valueId, null, Guid.Empty, isJustRemove: false);
            var replacements = new[] { mapping }.ToLookup(m => m.KeyId);
            var rendering = new XElement("r");
            rendering.SetAttributeValue("uid", Guid.NewGuid().ToString("B").ToUpper());
            var db = Substitute.For<Sitecore.Data.Database>();
            db.GetItem(valueId).Returns((Sitecore.Data.Items.Item)null);
            databaseProvider.GetDatabase(DatabaseType.Context).Returns(db);

            // ACT
            var result = sut.TryApplyReplacement(rendering, renderingId, replacements);

            // ASSERT
            result.Should().BeFalse();
        }

        [Fact]
        public void TryApplyReplacement_ReturnsTrue_WhenValidMappingAndItemExists()
        {
            // ARRANGE
            var renderingId = ID.NewID;
            var valueId = ID.NewID;
            var uid = Guid.NewGuid();
            var mapping = new RenderingMapping(renderingId, valueId, null, Guid.Empty, isJustRemove: false);
            var replacements = new[] { mapping }.ToLookup(m => m.KeyId);
            var rendering = new XElement("r");
            rendering.SetAttributeValue("uid", uid.ToString("B").ToUpper());
            var db = Substitute.For<Sitecore.Data.Database>();
            var dbItem = new Sitecore.NSubstituteUtils.FakeItem(valueId).ToSitecoreItem();
            db.GetItem(valueId).Returns(dbItem);
            databaseProvider.GetDatabase(DatabaseType.Context).Returns(db);

            // ACT
            var result = sut.TryApplyReplacement(rendering, renderingId, replacements);

            // ASSERT
            result.Should().BeTrue();
            rendering.Attribute("id").Value.Should().Be(valueId.ToString());
        }

        [Fact]
        public void TryApplyReplacement_PrefersUidSpecificMapping_OverWildcard()
        {
            // ARRANGE
            var renderingId = ID.NewID;
            var wildcardValue = ID.NewID;
            var uidValue = ID.NewID;
            var uid = Guid.NewGuid();
            var wildcardMapping = new RenderingMapping(renderingId, wildcardValue, null, Guid.Empty, isJustRemove: false);
            var uidMapping = new RenderingMapping(renderingId, uidValue, null, uid, isJustRemove: false);
            var replacements = new[] { wildcardMapping, uidMapping }.ToLookup(m => m.KeyId);
            var rendering = new XElement("r");
            rendering.SetAttributeValue("uid", uid.ToString("B").ToUpper());
            var db = Substitute.For<Sitecore.Data.Database>();
            var dbItemUid = new Sitecore.NSubstituteUtils.FakeItem(uidValue).ToSitecoreItem();
            db.GetItem(uidValue).Returns(dbItemUid);
            databaseProvider.GetDatabase(DatabaseType.Context).Returns(db);

            // ACT
            var result = sut.TryApplyReplacement(rendering, renderingId, replacements);

            // ASSERT
            result.Should().BeTrue();
            rendering.Attribute("id").Value.Should().Be(uidValue.ToString());
        }

        [Fact]
        public void TryApplyReplacement_FallsBackToWildcard_WhenNoUidSpecificMapping()
        {
            // ARRANGE
            var renderingId = ID.NewID;
            var wildcardValue = ID.NewID;
            var uid = Guid.NewGuid();
            var wildcardMapping = new RenderingMapping(renderingId, wildcardValue, null, Guid.Empty, isJustRemove: false);
            var replacements = new[] { wildcardMapping }.ToLookup(m => m.KeyId);
            var rendering = new XElement("r");
            rendering.SetAttributeValue("uid", uid.ToString("B").ToUpper());
            var db = Substitute.For<Sitecore.Data.Database>();
            var dbItemWildcard = new Sitecore.NSubstituteUtils.FakeItem(wildcardValue).ToSitecoreItem();
            db.GetItem(wildcardValue).Returns(dbItemWildcard);
            databaseProvider.GetDatabase(DatabaseType.Context).Returns(db);

            // ACT
            var result = sut.TryApplyReplacement(rendering, renderingId, replacements);

            // ASSERT
            result.Should().BeTrue();
            rendering.Attribute("id").Value.Should().Be(wildcardValue.ToString());
        }

        [Fact]
        public void TryApplyReplacement_ReturnsFalse_WhenOnlyJustRemoveMappingsExist()
        {
            // ARRANGE
            var renderingId = ID.NewID;
            var mapping = new RenderingMapping(renderingId, ID.Null, null, Guid.Empty, isJustRemove: true);
            var replacements = new[] { mapping }.ToLookup(m => m.KeyId);
            var rendering = new XElement("r");
            rendering.SetAttributeValue("uid", Guid.NewGuid().ToString("B").ToUpper());

            // ACT
            var result = sut.TryApplyReplacement(rendering, renderingId, replacements);

            // ASSERT
            result.Should().BeFalse();
        }

        [Fact]
        public void TryApplyReplacement_ReturnsFalse_OnException()
        {
            // ARRANGE
            var renderingId = ID.NewID;
            var valueId = ID.NewID;
            var mapping = new RenderingMapping(renderingId, valueId, null, Guid.Empty, isJustRemove: false);
            var replacements = new[] { mapping }.ToLookup(m => m.KeyId);
            var rendering = new XElement("r");
            rendering.SetAttributeValue("uid", Guid.NewGuid().ToString("B").ToUpper());
            databaseProvider.GetDatabase(DatabaseType.Context).Returns(_ => throw new InvalidOperationException("db error"));

            // ACT
            var result = sut.TryApplyReplacement(rendering, renderingId, replacements);

            // ASSERT
            result.Should().BeFalse();
        }

        [Fact]
        public void TryApplyReplacement_WithTwoMappingsForSameSource_EachInstanceReplacedByItsUid()
        {
            // ARRANGE
            var renderingId = ID.NewID;
            var uid1 = Guid.NewGuid();
            var uid2 = Guid.NewGuid();
            var value1 = ID.NewID;
            var value2 = ID.NewID;
            var mapping1 = new RenderingMapping(renderingId, value1, null, uid1, isJustRemove: false);
            var mapping2 = new RenderingMapping(renderingId, value2, null, uid2, isJustRemove: false);
            var replacements = new[] { mapping1, mapping2 }.ToLookup(m => m.KeyId);
            var db = Substitute.For<Sitecore.Data.Database>();
            var dbItem1 = new Sitecore.NSubstituteUtils.FakeItem(value1).ToSitecoreItem();
            var dbItem2 = new Sitecore.NSubstituteUtils.FakeItem(value2).ToSitecoreItem();
            db.GetItem(value1).Returns(dbItem1);
            db.GetItem(value2).Returns(dbItem2);
            databaseProvider.GetDatabase(DatabaseType.Context).Returns(db);

            var rendering1 = new XElement("r");
            rendering1.SetAttributeValue("uid", uid1.ToString("B").ToUpper());
            var rendering2 = new XElement("r");
            rendering2.SetAttributeValue("uid", uid2.ToString("B").ToUpper());

            // ACT
            var result1 = sut.TryApplyReplacement(rendering1, renderingId, replacements);
            var result2 = sut.TryApplyReplacement(rendering2, renderingId, replacements);

            // ASSERT
            result1.Should().BeTrue();
            result2.Should().BeTrue();
            rendering1.Attribute("id").Value.Should().Be(value1.ToString());
            rendering2.Attribute("id").Value.Should().Be(value2.ToString());
        }
    }
}
