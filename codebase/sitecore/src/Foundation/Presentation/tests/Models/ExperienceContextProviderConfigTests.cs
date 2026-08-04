using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Presentation.Models;
using FluentAssertions;
using Sitecore.Data;
using Xunit;

namespace easyJet.Foundation.Presentation.Tests.Models
{
    public class ExperienceContextProviderConfigTests
    {
        private static readonly ID ValidTemplateId = ID.NewID;

        [Fact]
        public void Constructor_WithNullIdentifier_SetsIdentifierToEmptyString()
        {
            // ARRANGE
            IEnumerable<ExperienceContextProviderPageRule> pages = Array.Empty<ExperienceContextProviderPageRule>();

            // ACT
            var sut = new ExperienceContextProviderConfig(null, pages);

            // ASSERT
            sut.Identifier.Should().Be(string.Empty);
        }

        [Fact]
        public void Constructor_WithNonNullIdentifier_SetsIdentifierToValue()
        {
            // ARRANGE
            const string identifier = "my-identifier";
            IEnumerable<ExperienceContextProviderPageRule> pages = Array.Empty<ExperienceContextProviderPageRule>();

            // ACT
            var sut = new ExperienceContextProviderConfig(identifier, pages);

            // ASSERT
            sut.Identifier.Should().Be(identifier);
        }

        [Fact]
        public void Constructor_WithEmptyIdentifier_SetsIdentifierToEmptyString()
        {
            // ARRANGE
            IEnumerable<ExperienceContextProviderPageRule> pages = Array.Empty<ExperienceContextProviderPageRule>();

            // ACT
            var sut = new ExperienceContextProviderConfig(string.Empty, pages);

            // ASSERT
            sut.Identifier.Should().Be(string.Empty);
        }

        [Fact]
        public void Constructor_WithNullPages_SetsPageesToEmptyArray()
        {
            // ARRANGE / ACT
            var sut = new ExperienceContextProviderConfig("id", null);

            // ASSERT
            sut.Pages.Should().BeEmpty();
        }

        [Fact]
        public void Constructor_WithEmptyPages_SetsPageesToEmptyArray()
        {
            // ARRANGE
            IEnumerable<ExperienceContextProviderPageRule> pages = Array.Empty<ExperienceContextProviderPageRule>();

            // ACT
            var sut = new ExperienceContextProviderConfig("id", pages);

            // ASSERT
            sut.Pages.Should().BeEmpty();
        }

        [Fact]
        public void Constructor_WithNullPageEntries_FiltersThemOut()
        {
            // ARRANGE
            var validPage = new ExperienceContextProviderPageRule(ValidTemplateId, Enumerable.Empty<ID>(), Enumerable.Empty<RenderingMapping>());
            IEnumerable<ExperienceContextProviderPageRule> pages = new[] { null, validPage, null };

            // ACT
            var sut = new ExperienceContextProviderConfig("id", pages);

            // ASSERT
            sut.Pages.Should().ContainSingle()
                .Which.PageItemId.Should().Be(ValidTemplateId);
        }

        [Fact]
        public void Constructor_WithAllNullPageEntries_SetsPageesToEmptyArray()
        {
            // ARRANGE
            IEnumerable<ExperienceContextProviderPageRule> pages = new ExperienceContextProviderPageRule[] { null, null };

            // ACT
            var sut = new ExperienceContextProviderConfig("id", pages);

            // ASSERT
            sut.Pages.Should().BeEmpty();
        }

        [Fact]
        public void Constructor_WithPageHavingNullTemplateId_FiltersItOut()
        {
            // ARRANGE
            var nullTemplatePage = new ExperienceContextProviderPageRule(null, Enumerable.Empty<ID>(), Enumerable.Empty<RenderingMapping>());
            IEnumerable<ExperienceContextProviderPageRule> pages = new[] { nullTemplatePage };

            // ACT
            var sut = new ExperienceContextProviderConfig("id", pages);

            // ASSERT
            sut.Pages.Should().BeEmpty();
        }

        [Fact]
        public void Constructor_WithPageHavingIDNullTemplateId_FiltersItOut()
        {
            // ARRANGE
            var idNullPage = new ExperienceContextProviderPageRule(ID.Null, Enumerable.Empty<ID>(), Enumerable.Empty<RenderingMapping>());
            IEnumerable<ExperienceContextProviderPageRule> pages = new[] { idNullPage };

            // ACT
            var sut = new ExperienceContextProviderConfig("id", pages);

            // ASSERT
            sut.Pages.Should().BeEmpty();
        }

        [Fact]
        public void Constructor_WithMixedValidAndInvalidPages_RetainsOnlyValidPages()
        {
            // ARRANGE
            var validPage1 = new ExperienceContextProviderPageRule(ValidTemplateId, Enumerable.Empty<ID>(), Enumerable.Empty<RenderingMapping>());
            var validPage2 = new ExperienceContextProviderPageRule(ID.NewID, Enumerable.Empty<ID>(), Enumerable.Empty<RenderingMapping>());
            var nullTemplatePage = new ExperienceContextProviderPageRule(null, Enumerable.Empty<ID>(), Enumerable.Empty<RenderingMapping>());
            IEnumerable<ExperienceContextProviderPageRule> pages = new[] { validPage1, null, nullTemplatePage, validPage2 };

            // ACT
            var sut = new ExperienceContextProviderConfig("id", pages);

            // ASSERT
            sut.Pages.Should().HaveCount(2);
            sut.Pages.Should().Contain(validPage1);
            sut.Pages.Should().Contain(validPage2);
        }

        [Fact]
        public void Constructor_WithAllValidPages_RetainsAll()
        {
            // ARRANGE
            var page1 = new ExperienceContextProviderPageRule(ValidTemplateId, Enumerable.Empty<ID>(), Enumerable.Empty<RenderingMapping>());
            var page2 = new ExperienceContextProviderPageRule(ID.NewID, Enumerable.Empty<ID>(), Enumerable.Empty<RenderingMapping>());
            var page3 = new ExperienceContextProviderPageRule(ID.NewID, Enumerable.Empty<ID>(), Enumerable.Empty<RenderingMapping>());
            IEnumerable<ExperienceContextProviderPageRule> pages = new[] { page1, page2, page3 };

            // ACT
            var sut = new ExperienceContextProviderConfig("id", pages);

            // ASSERT
            sut.Pages.Should().HaveCount(3);
        }

        [Fact]
        public void Pages_IsReadOnlyCollection()
        {
            // ARRANGE / ACT
            var sut = new ExperienceContextProviderConfig("id", null);

            // ASSERT
            sut.Pages.Should().BeAssignableTo<IReadOnlyCollection<ExperienceContextProviderPageRule>>();
        }
    }
}
