using easyJet.Feature.Redirects.Models;
using FluentAssertions;
using Xunit;

namespace easyJet.Feature.Redirects.Tests.Models
{
    public class RedirectRuleCsvRowTests
    {
        [Theory]
        [InlineData("Y", true)]
        [InlineData("y", true)]
        [InlineData(" Y ", true)]
        [InlineData("", false)]
        [InlineData(null, false)]
        [InlineData("N", false)]
        public void ShouldDelete_ShouldReflectFlag(string value, bool expected)
        {
            var row = new RedirectRuleCsvRow
            {
                MarkRecordToDelete = value
            };

            row.ShouldDelete.Should().Be(expected);
        }
    }
}
