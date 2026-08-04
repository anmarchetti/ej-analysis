using System.Security.Principal;
using easyJet.Foundation.SitecoreExtensions.Services;
using NSubstitute;
using NSubstitute.Extensions;
using Sitecore.Security.Accounts;
using Xunit;

namespace easyJet.Foundation.SitecoreExtensions.Tests.Services
{
    public class AdminServiceTests
    {
        private readonly AdminService sut;

        public AdminServiceTests()
        {
            sut = new AdminService();
        }

        [Fact]
        public void IsAdmin_ShouldBeFalse()
        {
            // Arrange
            var principal = Substitute.For<IPrincipal>();
            principal.Identity.Name.Returns("Name");

            var user = Substitute.ForPartsOf<User>(principal);

            user.ReturnsForAll(false);

            using (new UserSwitcher(user))
            {
                // Act
                var result = sut.IsAdmin();

                // Assert
                Assert.False(result);
            }
        }

        [Fact]
        public void IsAdmin_ShouldBeTrue()
        {
            // Arrange
            var principal = Substitute.For<IPrincipal>();
            principal.Identity.Name.Returns("Name");

            var user = Substitute.ForPartsOf<User>(principal);

            user.ReturnsForAll(true);

            using (new UserSwitcher(user))
            {
                // Act
                var result = sut.IsAdmin();

                // Assert
                Assert.True(result);
            }
        }
    }
}