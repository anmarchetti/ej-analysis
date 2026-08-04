using System;
using easyJet.Foundation.Presentation.Models;
using FluentAssertions;
using Sitecore.Data;
using Xunit;

namespace easyJet.Foundation.Presentation.Tests.Models
{
    public class RenderingMappingTests
    {
        // ============================================================
        // Constructor
        // ============================================================
        [Fact]
        public void Constructor_WhenNullKeyId_ShouldDefaultToIdNull()
        {
            // ARRANGE / ACT
            var sut = new RenderingMapping(null, ID.NewID, "params");

            // ASSERT
            sut.KeyId.Should().Be(ID.Null);
        }

        [Fact]
        public void Constructor_WhenNullValueId_ShouldDefaultToIdNull()
        {
            // ARRANGE / ACT
            var sut = new RenderingMapping(ID.NewID, null, "params");

            // ASSERT
            sut.ValueId.Should().Be(ID.Null);
        }

        [Fact]
        public void Constructor_WhenNullParameters_ShouldDefaultToEmpty()
        {
            // ARRANGE / ACT
            var sut = new RenderingMapping(ID.NewID, ID.NewID, null);

            // ASSERT
            sut.Parameters.Should().BeEmpty();
        }

        [Fact]
        public void Constructor_WhenUidProvided_ShouldStoreIt()
        {
            // ARRANGE
            var uid = Guid.NewGuid();

            // ACT
            var sut = new RenderingMapping(ID.NewID, ID.NewID, "p", uid);

            // ASSERT
            sut.Uid.Should().Be(uid);
        }

        // ============================================================
        // IsValid
        // ============================================================
        [Fact]
        public void IsValid_WhenKeyIdIsNull_ShouldReturnFalse()
        {
            // ARRANGE
            var sut = new RenderingMapping(null, ID.NewID, "p");

            // ACT / ASSERT
            sut.IsValid.Should().BeFalse();
        }

        [Fact]
        public void IsValid_WhenKeyIdIsValid_ShouldReturnTrue()
        {
            // ARRANGE
            var sut = new RenderingMapping(ID.NewID, ID.NewID, "p");

            // ACT / ASSERT
            sut.IsValid.Should().BeTrue();
        }

        // ============================================================
        // ToString
        // ============================================================
        [Fact]
        public void ToString_WhenUidIsEmpty_ShouldReturnThreePartFormat()
        {
            // ARRANGE
            var keyId = ID.NewID;
            var valueId = ID.NewID;
            var sut = new RenderingMapping(keyId, valueId, "myparams");

            // ACT
            var result = sut.ToString();

            // ASSERT
            result.Should().Be($"{keyId}:{valueId}:myparams");
        }

        [Fact]
        public void ToString_WhenUidIsPresent_ShouldReturnFourPartFormat()
        {
            // ARRANGE
            var keyId = ID.NewID;
            var valueId = ID.NewID;
            var uid = Guid.NewGuid();
            var sut = new RenderingMapping(keyId, valueId, "params", uid);

            // ACT
            var result = sut.ToString();

            // ASSERT
            result.Should().Be($"{keyId}:{valueId}:params:{uid:B}");
        }

        // ============================================================
        // Equals
        // ============================================================
        [Fact]
        public void Equals_WhenSameValues_ShouldReturnTrue()
        {
            // ARRANGE
            var keyId = ID.NewID;
            var valueId = ID.NewID;
            var uid = Guid.NewGuid();
            var a = new RenderingMapping(keyId, valueId, "p", uid);
            var b = new RenderingMapping(keyId, valueId, "p", uid);

            // ACT / ASSERT
            a.Equals(b).Should().BeTrue();
        }

        [Fact]
        public void Equals_WhenDifferentKey_ShouldReturnFalse()
        {
            // ARRANGE
            var valueId = ID.NewID;
            var a = new RenderingMapping(ID.NewID, valueId, "p");
            var b = new RenderingMapping(ID.NewID, valueId, "p");

            // ACT / ASSERT
            a.Equals(b).Should().BeFalse();
        }

        [Fact]
        public void Equals_WhenDifferentParameters_ShouldReturnFalse()
        {
            // ARRANGE
            var keyId = ID.NewID;
            var valueId = ID.NewID;
            var a = new RenderingMapping(keyId, valueId, "p1");
            var b = new RenderingMapping(keyId, valueId, "p2");

            // ACT / ASSERT
            a.Equals(b).Should().BeFalse();
        }

        [Fact]
        public void Equals_WhenDifferentUid_ShouldReturnFalse()
        {
            // ARRANGE
            var keyId = ID.NewID;
            var valueId = ID.NewID;
            var a = new RenderingMapping(keyId, valueId, "p", Guid.NewGuid());
            var b = new RenderingMapping(keyId, valueId, "p", Guid.NewGuid());

            // ACT / ASSERT
            a.Equals(b).Should().BeFalse();
        }

        [Fact]
        public void Equals_WhenComparedToNull_ShouldReturnFalse()
        {
            // ARRANGE
            var sut = new RenderingMapping(ID.NewID, ID.NewID, "p");

            // ACT / ASSERT
            sut.Equals(null).Should().BeFalse();
        }

        [Fact]
        public void Equals_WhenComparedToDifferentType_ShouldReturnFalse()
        {
            // ARRANGE
            var sut = new RenderingMapping(ID.NewID, ID.NewID, "p");

            // ACT / ASSERT
            sut.Equals("string").Should().BeFalse();
        }

        // ============================================================
        // GetHashCode
        // ============================================================
        [Fact]
        public void GetHashCode_WhenSameValues_ShouldReturnSameHash()
        {
            // ARRANGE
            var keyId = ID.NewID;
            var valueId = ID.NewID;
            var uid = Guid.NewGuid();
            var a = new RenderingMapping(keyId, valueId, "p", uid);
            var b = new RenderingMapping(keyId, valueId, "p", uid);

            // ACT / ASSERT
            a.GetHashCode().Should().Be(b.GetHashCode());
        }

        [Fact]
        public void GetHashCode_WhenDifferentValues_ShouldReturnDifferentHash()
        {
            // ARRANGE
            var a = new RenderingMapping(ID.NewID, ID.NewID, "p1");
            var b = new RenderingMapping(ID.NewID, ID.NewID, "p2");

            // ACT / ASSERT
            a.GetHashCode().Should().NotBe(b.GetHashCode());
        }

        // ============================================================
        // IsJustRemove
        // ============================================================
        [Fact]
        public void IsJustRemove_WhenNotSet_ShouldReturnFalse()
        {
            // ARRANGE / ACT
            var sut = new RenderingMapping(ID.NewID, ID.NewID, "p");

            // ASSERT
            sut.IsJustRemove.Should().BeFalse();
        }

        [Fact]
        public void IsJustRemove_WhenSetToTrue_ShouldReturnTrue()
        {
            // ARRANGE / ACT
            var sut = new RenderingMapping(ID.NewID, ID.Null, string.Empty, default, isJustRemove: true);

            // ASSERT
            sut.IsJustRemove.Should().BeTrue();
        }

        [Fact]
        public void IsValid_WhenIsJustRemoveAndKeyIdIsValid_ShouldReturnTrue()
        {
            // ARRANGE / ACT
            var sut = new RenderingMapping(ID.NewID, ID.Null, string.Empty, default, isJustRemove: true);

            // ASSERT
            sut.IsValid.Should().BeTrue();
        }

        [Fact]
        public void Equals_WhenIsJustRemoveDiffers_ShouldReturnFalse()
        {
            // ARRANGE
            var keyId = ID.NewID;
            var a = new RenderingMapping(keyId, ID.Null, string.Empty, default, isJustRemove: true);
            var b = new RenderingMapping(keyId, ID.Null, string.Empty, default, isJustRemove: false);

            // ASSERT
            a.Equals(b).Should().BeFalse();
        }

        [Fact]
        public void GetHashCode_WhenIsJustRemoveDiffers_ShouldReturnDifferentHash()
        {
            // ARRANGE
            var keyId = ID.NewID;
            var a = new RenderingMapping(keyId, ID.Null, string.Empty, default, isJustRemove: true);
            var b = new RenderingMapping(keyId, ID.Null, string.Empty, default, isJustRemove: false);

            // ASSERT
            a.GetHashCode().Should().NotBe(b.GetHashCode());
        }
    }
}
