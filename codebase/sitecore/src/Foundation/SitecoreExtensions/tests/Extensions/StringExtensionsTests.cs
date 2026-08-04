using System.Collections.Generic;
using AutoFixture.Xunit2;
using EasyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Models;
using FluentAssertions;
using Newtonsoft.Json;
using Xunit;

namespace easyJet.Foundation.SitecoreExtensions.Tests.Extensions
{
    public class StringExtensionsTests
    {
        [Fact]
        public void TrimDoubleQuotes_ShouldReturnStringWithoutDoubleQuotes()
        {
            // Arrange
            var input = "a\"bc";
            var output = "abc";

            // Act
            var actual = input.TrimDoubleQuotes();
            // Assert
            actual.Should().BeEquivalentTo(output);
        }

        [Fact]
        public void TrimDoubleQuotes_ShouldReturnNull_IfStringIsNull()
        {
            // Act
            var actual = StringExtensions.TrimDoubleQuotes(null);

            // Assert
            actual.Should().BeNullOrEmpty();
        }

        [Fact]
        public void TryParseJson_ShouldReturnFalse_IfStringIsNull()
        {
            // Act
            var actual = StringExtensions.TryParseJson<object>(string.Empty, out var result);

            // Assert
            actual.Should().BeFalse();
            result.Should().BeNull();
        }

        [Fact]
        public void TryParseJson_ShouldReturnFalse_IfStringIsWhitespace()
        {
            // Act
            var actual = StringExtensions.TryParseJson<object>(" ", out var result);

            // Assert
            actual.Should().BeFalse();
            result.Should().BeNull();
        }

        [Fact]
        public void TryParseJson_ShouldReturnFalse_IfConvertingIsNotSuccessful()
        {
            var json = JsonConvert.SerializeObject(new { Data = "Test" });

            // Act
            var actual = json.TryParseJson<SortItems>(out var result);

            // Assert
            actual.Should().BeFalse();
            result.Should().BeNull();
        }

        [Fact]
        public void StripHtml_ShouldReturnStrippedHtml()
        {
            var json = "<ul>\n    <li>Buffet breakfast, lunch and dinner in the main restaurant</li>\n    <li>One&nbsp;<span style=\"background-color: #ffffff; color: #202124;\">à</span> la carte dinner per week in a choice of three restaurants (reservation required, 7 night minimum stay)</li>\n    <li>Snacks available at certain times</li>\n    <li>Selected alcoholic and non-alcoholic drinks (local brands only) for a minimum of 12 hours per day&nbsp;</li>\n    <li>Selected non-alcoholic drinks from the minibar</li>\n</ul>";

            // Act
            var actual = json.StripHtml("ul", "li");

            // Assert
            actual.Should().Equals("<ul>\n    <li>Buffet breakfast, lunch and dinner in the main restaurant</li>\n    <li>One&nbsp;à la carte dinner per week in a choice of three restaurants (reservation required, 7 night minimum stay)</li>\n    <li>Snacks available at certain times</li>\n    <li>Selected alcoholic and non-alcoholic drinks (local brands only) for a minimum of 12 hours per day&nbsp;</li>\n    <li>Selected non-alcoholic drinks from the minibar</li>\n</ul>");
        }

        [Fact]
        public void StripHtml_ShouldReturnTotallyStrippedHtml()
        {
            var json = "<ul>\n    <li>Buffet breakfast, lunch and dinner in the main restaurant</li>\n    <li>One&nbsp;<span style=\"background-color: #ffffff; color: #202124;\">à</span> la carte dinner per week in a choice of three restaurants (reservation required, 7 night minimum stay)</li>\n    <li>Snacks available at certain times</li>\n    <li>Selected alcoholic and non-alcoholic drinks (local brands only) for a minimum of 12 hours per day&nbsp;</li>\n    <li>Selected non-alcoholic drinks from the minibar</li>\n</ul>";

            // Act
            var actual = json.StripHtml();

            // Assert
            actual.Should().Equals("\n    Buffet breakfast, lunch and dinner in the main restaurant\n    One&nbsp;à la carte dinner per week in a choice of three restaurants (reservation required, 7 night minimum stay)\n    Snacks available at certain times\n    Selected alcoholic and non-alcoholic drinks (local brands only) for a minimum of 12 hours per day&nbsp;\n    Selected non-alcoholic drinks from the minibar\n");
        }

        [Fact]
        public void StripHtml_ShouldReturnTotallyStripped_IfNullIsPassed()
        {
            var json = "<ul>\n    <li>Buffet breakfast, lunch and dinner in the main restaurant</li>\n    <li>One&nbsp;<span style=\"background-color: #ffffff; color: #202124;\">à</span> la carte dinner per week in a choice of three restaurants (reservation required, 7 night minimum stay)</li>\n    <li>Snacks available at certain times</li>\n    <li>Selected alcoholic and non-alcoholic drinks (local brands only) for a minimum of 12 hours per day&nbsp;</li>\n    <li>Selected non-alcoholic drinks from the minibar</li>\n</ul>";

            // Act
            var actual = json.StripHtml(null);

            // Assert
            actual.Should().Equals("\n    Buffet breakfast, lunch and dinner in the main restaurant\n    One&nbsp;à la carte dinner per week in a choice of three restaurants (reservation required, 7 night minimum stay)\n    Snacks available at certain times\n    Selected alcoholic and non-alcoholic drinks (local brands only) for a minimum of 12 hours per day&nbsp;\n    Selected non-alcoholic drinks from the minibar\n");
        }

        [Fact]
        public void StripHtml_ShouldReturnEmptyStringIfEmptystringPassed()
        {
            var json = string.Empty;

            // Act
            var actual = json.StripHtml("ul", "li");

            // Assert
            actual.Should().Equals(string.Empty);
        }

        [Theory]
        [AutoData]
        public void TryParseJson_ShouldReturnTue_IfConvertingIsSuccessful(string[] itemIds, string[] sortOrders)
        {
            var json = JsonConvert.SerializeObject(new SortItems { ItemIds = itemIds, SortOrders = sortOrders });

            // Act
            var actual = json.TryParseJson<SortItems>(out var result);

            // Assert
            actual.Should().BeTrue();
            result.Should().NotBeNull();
            result.SortOrders.Should().HaveCount(sortOrders.Length);
            result.ItemIds.Should().HaveCount(itemIds.Length);
            result.SortOrders.Should().Contain(sortOrders);
            result.ItemIds.Should().Contain(itemIds);
        }

        [Theory]
        [InlineData("")]
        [InlineData(null)]
        [InlineData("  ")]
        public void ToWildcard_ShouldReturnNull_IfStringIsNullOrWhiteSpace(string input)
        {
            // Act
            var actual = input.ToWildcard();

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [InlineData("spa!", "*spa!*")]
        [InlineData("spain", "*spain*")]
        [InlineData("#spa#", "*#spa#*")]
        public void ToWildcard_ShouldReturnWildcarString_IfStringHasValue(string input, string expected)
        {
            // Act
            var actual = input.ToWildcard();

            // Assert
            actual.Should().BeEquivalentTo(expected);
        }
    }
}