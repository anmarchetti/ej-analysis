using System.Collections.Generic;
using AutoFixture.Xunit2;
using easyJet.Foundation.SitecoreExtensions.Helper;
using FluentAssertions;
using Sitecore.Data;
using Xunit;

namespace easyJet.Foundation.SitecoreExtensions.Tests.Helper
{
    public class ItemIdParserTests
    {
        [Theory]
        [AutoData]
        public void Parse_ShouldReturnListOfIds_IfStringSeparatedByPipe(ID id1, ID id2, ID id3, ID id4)
        {
            // Arrange
            string value = $"{id2}|{id1}|{id3}|{id4}";

            // Act
            var actual = ItemIdParser.Parse(value);

            // Assert
            actual.Count.Should().Be(4);
            actual[0].Should().Be(id2);
            actual[1].Should().Be(id1);
            actual[2].Should().Be(id3);
            actual[3].Should().Be(id4);
        }

        [Theory]
        [AutoData]
        public void Parse_ShouldReturnBeCountTree_IfStringHasNonIdFormat(ID id1, ID id2, ID id3, ID id4)
        {
            // Arrange
            string value = $"{id2}|{id1}|{id3}|invalidId";

            // Act
            var actual = ItemIdParser.Parse(value);

            // Assert
            actual.Count.Should().Be(3);
            actual[0].Should().Be(id2);
            actual[1].Should().Be(id1);
            actual[2].Should().Be(id3);
        }

        [Theory]
        [AutoData]
        public void Compose_ShouldReturnStringWithIdsSeparatedWithPipe_IfListHasIds(ID id1, ID id2, ID id3)
        {
            // Arrange
            var list = new List<ID>() { id1, id2, id3 };
            string expectedValue = $"{id1}|{id2}|{id3}";

            // Act
            var actual = ItemIdParser.Compose(list);

            // Assert
            actual.Should().BeEquivalentTo(expectedValue);
        }

        [Theory]
        [AutoData]
        public void Compose_ShouldReturnStringWithIdsSeparatedWithPipe_IfListHasStringIds(string id1, string id2, string id3)
        {
            // Arrange
            var list = new List<string>() { id1, id2, id3 };
            string expectedValue = $"{id1}|{id2}|{id3}";

            // Act
            var actual = ItemIdParser.Compose(list);

            // Assert
            actual.Should().BeEquivalentTo(expectedValue);
        }
    }
}
