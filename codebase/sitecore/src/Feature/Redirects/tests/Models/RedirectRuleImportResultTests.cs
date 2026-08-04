using easyJet.Feature.Redirects.Models;
using FluentAssertions;
using Xunit;

namespace easyJet.Feature.Redirects.Tests.Models
{
    public class RedirectRuleImportResultTests
    {
        [Fact]
        public void Errors_ShouldBeInitialized()
        {
            var result = new RedirectRuleImportResult();

            result.Errors.Should().NotBeNull();
            result.Errors.Should().BeEmpty();
        }
    }
}
