using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Presentation.Models;
using FluentAssertions;
using Sitecore.Data;
using Xunit;

namespace easyJet.Foundation.Presentation.Tests.Models
{
    public class ExperienceContextProviderPageRuleTests
    {
        private static readonly ID TemplateId = ID.NewID;
        private static readonly ID RenderingA = ID.NewID;
        private static readonly ID RenderingB = ID.NewID;
        private static readonly ID RenderingC = ID.NewID;

        [Fact]
        public void Constructor_WithNullPageItemId_SetsPageItemIdToIDNull()
        {
            // ARRANGE / ACT
            var sut = new ExperienceContextProviderPageRule(null, Enumerable.Empty<ID>(), Enumerable.Empty<RenderingMapping>());

            // ASSERT
            sut.PageItemId.Should().Be(ID.Null);
        }

        [Fact]
        public void Constructor_WithNullAllowedRenderingIds_CreatesEmptyAllowedRenderings()
        {
            // ARRANGE / ACT
            var sut = new ExperienceContextProviderPageRule(TemplateId, null, Enumerable.Empty<RenderingMapping>());

            // ASSERT
            sut.AllowedRenderings.Should().BeEmpty();
        }

        [Fact]
        public void Constructor_WithNullRenderingReplacements_CreatesEmptyRenderingReplacements()
        {
            // ARRANGE / ACT
            var sut = new ExperienceContextProviderPageRule(TemplateId, Enumerable.Empty<ID>(), null);

            // ASSERT
            sut.RenderingReplacements.Should().BeEmpty();
        }

        [Fact]
        public void Constructor_FiltersOutNullMappingsFromRenderingReplacements()
        {
            // ARRANGE
            var validMapping = new RenderingMapping(RenderingA, RenderingB, string.Empty);

            // ACT
            var sut = new ExperienceContextProviderPageRule(
                TemplateId,
                Enumerable.Empty<ID>(),
                new RenderingMapping[] { null, validMapping, null });

            // ASSERT
            sut.RenderingReplacements.Should().HaveCount(1);
            sut.RenderingReplacements.Contains(RenderingA).Should().BeTrue();
        }

        [Fact]
        public void Constructor_FiltersOutNullAndEmptyIdsFromAllowedRenderings()
        {
            // ARRANGE
            var ids = new[] { RenderingA, ID.Null, RenderingB };

            // ACT
            var sut = new ExperienceContextProviderPageRule(TemplateId, ids, Enumerable.Empty<RenderingMapping>());

            // ASSERT
            sut.AllowedRenderings.Should().HaveCount(2);
            sut.AllowedRenderings.Should().Contain(new[] { RenderingA, RenderingB });
        }

        [Fact]
        public void Constructor_WithDuplicateKeyMappings_KeepsBothMappings()
        {
            // ARRANGE
            var firstMapping = new RenderingMapping(RenderingA, RenderingB, "first");
            var secondMapping = new RenderingMapping(RenderingA, RenderingC, "second");

            // ACT
            var sut = new ExperienceContextProviderPageRule(
                TemplateId,
                Enumerable.Empty<ID>(),
                new[] { firstMapping, secondMapping });

            // ASSERT
            sut.RenderingReplacements.Should().HaveCount(1);
            sut.RenderingReplacements[RenderingA].Should().HaveCount(2);
            sut.RenderingReplacements[RenderingA].Should().Contain(m => m.Parameters == "first");
            sut.RenderingReplacements[RenderingA].Should().Contain(m => m.Parameters == "second");
        }

        [Fact]
        public void HasRules_WhenNoAllowedRenderingsAndNoReplacements_ReturnsFalse()
        {
            // ARRANGE
            var sut = new ExperienceContextProviderPageRule(TemplateId, Enumerable.Empty<ID>(), Enumerable.Empty<RenderingMapping>());

            // ACT
            var result = sut.HasRules;

            // ASSERT
            result.Should().BeFalse();
        }

        [Fact]
        public void HasRules_WhenAllowedRenderingsPresent_ReturnsTrue()
        {
            // ARRANGE
            var sut = new ExperienceContextProviderPageRule(TemplateId, new[] { RenderingA }, Enumerable.Empty<RenderingMapping>());

            // ACT
            var result = sut.HasRules;

            // ASSERT
            result.Should().BeTrue();
        }

        [Fact]
        public void HasRules_WhenRenderingReplacementsPresent_ReturnsTrue()
        {
            // ARRANGE
            var mapping = new RenderingMapping(RenderingA, RenderingB, string.Empty);
            var sut = new ExperienceContextProviderPageRule(TemplateId, Enumerable.Empty<ID>(), new[] { mapping });

            // ACT
            var result = sut.HasRules;

            // ASSERT
            result.Should().BeTrue();
        }

        [Fact]
        public void AllowsRendering_WithNullId_ReturnsFalse()
        {
            // ARRANGE
            var sut = new ExperienceContextProviderPageRule(TemplateId, new[] { RenderingA }, Enumerable.Empty<RenderingMapping>());

            // ACT
            var result = sut.AllowsRendering(null);

            // ASSERT
            result.Should().BeFalse();
        }

        [Fact]
        public void AllowsRendering_WithEmptyId_ReturnsFalse()
        {
            // ARRANGE
            var sut = new ExperienceContextProviderPageRule(TemplateId, new[] { RenderingA }, Enumerable.Empty<RenderingMapping>());

            // ACT
            var result = sut.AllowsRendering(ID.Null);

            // ASSERT
            result.Should().BeFalse();
        }

        [Fact]
        public void AllowsRendering_WithUnknownId_ReturnsFalse()
        {
            // ARRANGE
            var sut = new ExperienceContextProviderPageRule(TemplateId, new[] { RenderingA }, Enumerable.Empty<RenderingMapping>());

            // ACT
            var result = sut.AllowsRendering(RenderingB);

            // ASSERT
            result.Should().BeFalse();
        }

        [Fact]
        public void AllowsRendering_WithAllowedId_ReturnsTrue()
        {
            // ARRANGE
            var sut = new ExperienceContextProviderPageRule(TemplateId, new[] { RenderingA }, Enumerable.Empty<RenderingMapping>());

            // ACT
            var result = sut.AllowsRendering(RenderingA);

            // ASSERT
            result.Should().BeTrue();
        }

        [Fact]
        public void TryGetReplacement_WithNullId_ReturnsFalseAndNullMapping()
        {
            // ARRANGE
            var mapping = new RenderingMapping(RenderingA, RenderingB, string.Empty);
            var sut = new ExperienceContextProviderPageRule(TemplateId, Enumerable.Empty<ID>(), new[] { mapping });

            // ACT
            var result = sut.TryGetReplacement(null, out var outMapping);

            // ASSERT
            result.Should().BeFalse();
            outMapping.Should().BeNull();
        }

        [Fact]
        public void TryGetReplacement_WhenNoReplacements_ReturnsFalse()
        {
            // ARRANGE
            var sut = new ExperienceContextProviderPageRule(TemplateId, Enumerable.Empty<ID>(), Enumerable.Empty<RenderingMapping>());

            // ACT
            var result = sut.TryGetReplacement(RenderingA, out var outMapping);

            // ASSERT
            result.Should().BeFalse();
            outMapping.Should().BeNull();
        }

        [Fact]
        public void TryGetReplacement_WithUnknownId_ReturnsFalse()
        {
            // ARRANGE
            var mapping = new RenderingMapping(RenderingA, RenderingB, string.Empty);
            var sut = new ExperienceContextProviderPageRule(TemplateId, Enumerable.Empty<ID>(), new[] { mapping });

            // ACT
            var result = sut.TryGetReplacement(RenderingC, out var outMapping);

            // ASSERT
            result.Should().BeFalse();
            outMapping.Should().BeNull();
        }

        [Fact]
        public void TryGetReplacement_WithMappingHavingNullValueId_ReturnsFalse()
        {
            // ARRANGE
            var mapping = new RenderingMapping(RenderingA, null, string.Empty);
            var sut = new ExperienceContextProviderPageRule(TemplateId, Enumerable.Empty<ID>(), new[] { mapping });

            // ACT
            var result = sut.TryGetReplacement(RenderingA, out var outMapping);

            // ASSERT
            result.Should().BeFalse();
        }

        [Fact]
        public void TryGetReplacement_WithValidReplacement_ReturnsTrueAndSetsMapping()
        {
            // ARRANGE
            var mapping = new RenderingMapping(RenderingA, RenderingB, "params");
            var sut = new ExperienceContextProviderPageRule(TemplateId, Enumerable.Empty<ID>(), new[] { mapping });

            // ACT
            var result = sut.TryGetReplacement(RenderingA, out var outMapping);

            // ASSERT
            result.Should().BeTrue();
            outMapping.Should().NotBeNull();
            outMapping.ValueId.Should().Be(RenderingB);
            outMapping.Parameters.Should().Be("params");
        }

        [Fact]
        public void TryGetReplacement_WithIDNullRenderingId_ReturnsFalse()
        {
            // ARRANGE
            var mapping = new RenderingMapping(RenderingA, RenderingB, string.Empty);
            var sut = new ExperienceContextProviderPageRule(TemplateId, Enumerable.Empty<ID>(), new[] { mapping });

            // ACT
            var result = sut.TryGetReplacement(ID.Null, out var outMapping);

            // ASSERT
            result.Should().BeFalse();
            outMapping.Should().BeNull();
        }

        [Fact]
        public void TryGetReplacement_WhenMappingHasExplicitIDNullValueId_ReturnsFalse()
        {
            // ARRANGE
            var mapping = new RenderingMapping(RenderingA, ID.Null, string.Empty);
            var sut = new ExperienceContextProviderPageRule(TemplateId, Enumerable.Empty<ID>(), new[] { mapping });

            // ACT
            var result = sut.TryGetReplacement(RenderingA, out _);

            // ASSERT
            result.Should().BeFalse();
        }

        [Fact]
        public void Constructor_WithMappingHavingNullKeyId_FiltersItOut()
        {
            // ARRANGE
            var invalidMapping = new RenderingMapping(null, RenderingB, string.Empty);

            // ACT
            var sut = new ExperienceContextProviderPageRule(TemplateId, Enumerable.Empty<ID>(), new[] { invalidMapping });

            // ASSERT
            sut.RenderingReplacements.Should().BeEmpty();
        }

        [Fact]
        public void Constructor_WithMixOfInvalidAndValidMappings_KeepsOnlyValidOnes()
        {
            // ARRANGE
            var invalidMapping = new RenderingMapping(null, RenderingB, string.Empty);
            var validMapping = new RenderingMapping(RenderingA, RenderingB, string.Empty);

            // ACT
            var sut = new ExperienceContextProviderPageRule(
                TemplateId,
                Enumerable.Empty<ID>(),
                new[] { invalidMapping, validMapping });

            // ASSERT
            sut.RenderingReplacements.Should().HaveCount(1);
            sut.RenderingReplacements.Contains(RenderingA).Should().BeTrue();
        }

        [Fact]
        public void HasRules_WhenAllAllowedRenderingsAreNullAndAllMappingsHaveNullKeyId_ReturnsFalse()
        {
            // ARRANGE
            var invalidMapping = new RenderingMapping(null, RenderingB, string.Empty);

            // ACT
            var sut = new ExperienceContextProviderPageRule(
                TemplateId,
                new[] { ID.Null },
                new[] { invalidMapping });

            // ASSERT
            sut.HasRules.Should().BeFalse();
        }

        [Fact]
        public void Constructor_WithDuplicateKeyMappings_NullValueIdFirstThenValid_KeepsBothEntries()
        {
            // ARRANGE
            var firstMapping = new RenderingMapping(RenderingA, null, "aaa");
            var secondMapping = new RenderingMapping(RenderingA, RenderingB, "bbb");

            // ACT
            var sut = new ExperienceContextProviderPageRule(
                TemplateId,
                Enumerable.Empty<ID>(),
                new[] { firstMapping, secondMapping });

            // ASSERT
            sut.RenderingReplacements.Should().HaveCount(1);
            sut.RenderingReplacements[RenderingA].Should().HaveCount(2);
            sut.TryGetReplacement(RenderingA, out var found).Should().BeTrue();
            found.ValueId.Should().Be(RenderingB);
        }

        [Fact]
        public void TryGetJustRemoveMapping_ReturnsFalse_WhenRenderingIdIsNull()
        {
            // ARRANGE
            var mapping = new RenderingMapping(RenderingA, ID.Null, null, Guid.Empty, isJustRemove: true);
            var sut = new ExperienceContextProviderPageRule(TemplateId, Enumerable.Empty<ID>(), new[] { mapping });

            // ACT
            var result = sut.TryGetJustRemoveMapping(null, Guid.Empty, out var outMapping);

            // ASSERT
            result.Should().BeFalse();
            outMapping.Should().BeNull();
        }

        [Fact]
        public void TryGetJustRemoveMapping_ReturnsFalse_WhenNoReplacementsForRenderingId()
        {
            // ARRANGE
            var sut = new ExperienceContextProviderPageRule(TemplateId, Enumerable.Empty<ID>(), Enumerable.Empty<RenderingMapping>());

            // ACT
            var result = sut.TryGetJustRemoveMapping(RenderingA, Guid.Empty, out var outMapping);

            // ASSERT
            result.Should().BeFalse();
            outMapping.Should().BeNull();
        }

        [Fact]
        public void TryGetJustRemoveMapping_ReturnsFalse_WhenOnlyNonJustRemoveMappingsExist()
        {
            // ARRANGE
            var mapping = new RenderingMapping(RenderingA, RenderingB, null, Guid.Empty, isJustRemove: false);
            var sut = new ExperienceContextProviderPageRule(TemplateId, Enumerable.Empty<ID>(), new[] { mapping });

            // ACT
            var result = sut.TryGetJustRemoveMapping(RenderingA, Guid.Empty, out var outMapping);

            // ASSERT
            result.Should().BeFalse();
            outMapping.Should().BeNull();
        }

        [Fact]
        public void TryGetJustRemoveMapping_ReturnsWildcard_WhenInstanceUidIsEmpty()
        {
            // ARRANGE
            var wildcard = new RenderingMapping(RenderingA, ID.Null, null, Guid.Empty, isJustRemove: true);
            var sut = new ExperienceContextProviderPageRule(TemplateId, Enumerable.Empty<ID>(), new[] { wildcard });

            // ACT
            var result = sut.TryGetJustRemoveMapping(RenderingA, Guid.Empty, out var outMapping);

            // ASSERT
            result.Should().BeTrue();
            outMapping.Should().BeSameAs(wildcard);
        }

        [Fact]
        public void TryGetJustRemoveMapping_ReturnsUidSpecificFirst_WhenBothExist()
        {
            // ARRANGE
            var uid = Guid.NewGuid();
            var uidMapping = new RenderingMapping(RenderingA, ID.Null, null, uid, isJustRemove: true);
            var wildcard = new RenderingMapping(RenderingA, ID.Null, null, Guid.Empty, isJustRemove: true);
            var sut = new ExperienceContextProviderPageRule(TemplateId, Enumerable.Empty<ID>(), new[] { uidMapping, wildcard });

            // ACT
            var result = sut.TryGetJustRemoveMapping(RenderingA, uid, out var outMapping);

            // ASSERT
            result.Should().BeTrue();
            outMapping.Should().BeSameAs(uidMapping);
        }

        [Fact]
        public void TryGetJustRemoveMapping_FallsBackToWildcard_WhenNoUidSpecificMatch()
        {
            // ARRANGE
            var uid = Guid.NewGuid();
            var otherUid = Guid.NewGuid();
            var otherUidMapping = new RenderingMapping(RenderingA, ID.Null, null, otherUid, isJustRemove: true);
            var wildcard = new RenderingMapping(RenderingA, ID.Null, null, Guid.Empty, isJustRemove: true);
            var sut = new ExperienceContextProviderPageRule(TemplateId, Enumerable.Empty<ID>(), new[] { otherUidMapping, wildcard });

            // ACT
            var result = sut.TryGetJustRemoveMapping(RenderingA, uid, out var outMapping);

            // ASSERT
            result.Should().BeTrue();
            outMapping.Should().BeSameAs(wildcard);
        }

        [Fact]
        public void ShouldRemoveByAllowedList_ReturnsFalse_WhenAllowedListIsEmpty()
        {
            // ARRANGE
            var sut = new ExperienceContextProviderPageRule(TemplateId, Enumerable.Empty<ID>(), Enumerable.Empty<RenderingMapping>());

            // ACT
            var result = sut.ShouldRemoveByAllowedList(RenderingA);

            // ASSERT
            result.Should().BeFalse();
        }

        [Fact]
        public void ShouldRemoveByAllowedList_ReturnsFalse_WhenRenderingIsInAllowedList()
        {
            // ARRANGE
            var sut = new ExperienceContextProviderPageRule(TemplateId, new[] { RenderingA }, Enumerable.Empty<RenderingMapping>());

            // ACT
            var result = sut.ShouldRemoveByAllowedList(RenderingA);

            // ASSERT
            result.Should().BeFalse();
        }

        [Fact]
        public void ShouldRemoveByAllowedList_ReturnsTrue_WhenRenderingNotInNonEmptyAllowedList()
        {
            // ARRANGE
            var sut = new ExperienceContextProviderPageRule(TemplateId, new[] { RenderingA }, Enumerable.Empty<RenderingMapping>());

            // ACT
            var result = sut.ShouldRemoveByAllowedList(RenderingB);

            // ASSERT
            result.Should().BeTrue();
        }
    }
}