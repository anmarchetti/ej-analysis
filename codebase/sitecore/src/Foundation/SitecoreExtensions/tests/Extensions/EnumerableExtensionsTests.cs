using System;
using System.Linq;
using AutoFixture.Xunit2;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using FluentAssertions;
using Xunit;

namespace easyJet.Foundation.SitecoreExtensions.Tests.Extensions
{
    public class EnumerableExtensionsTests
    {
        [Theory]
        [AutoData]
        public void Chunk_ShouldThrowArgumentException_IfSizeIsNegative(int[] array)
        {
            // Act
            Action actual = () => array.Chunk(-1).ToArray();

            // Assert
            actual.Should().Throw<ArgumentException>();
        }

        [Theory]
        [InlineData(new int[] { 1, 2, 3, 4, 5, 6 }, 3, 2)]
        public void Chunk_ShouldSplitIntoChunks_IfSizeIsPositive(int[] array, int size, int expected)
        {
            // Act
            var actual = array.Chunk(size);

            // Assert
            actual.Count().Should().Be(expected);
        }
    }
}
