using System.Linq;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Multisite;
using FluentAssertions;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Sites;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentSearch.Repositories
{
    public class UserCountryRepositoryTests
    {
        [Theory]
        [AutoData]
        public void GetAllCountries_ShouldGetAllCountries_IfUserCountriesExist(Db db, string name)
        {
            // Arrange
            var dataFolderItem = new DbItem("Data");
            dataFolderItem.TemplateID = Templates.Data.Id;

            var userCountriesFolderItem = new DbItem("UserCountriesFolder");
            userCountriesFolderItem.TemplateID = Constants.TemplateIds.UserCountriesFolder;

            dataFolderItem.Children.Add(userCountriesFolderItem);

            var userCountryItem = new DbItem("UserCountryItem");
            userCountryItem.Name = name;
            userCountryItem.TemplateID = Constants.TemplateIds.UserCountry;

            userCountriesFolderItem.Children.Add(userCountryItem);

            db.Add(dataFolderItem);

            var fakeSiteContext = new FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                {
                    { "name", "fake" },
                    { "database", "master" },
                    { "language", "en" },
                    { "rootPath", "/sitecore/content" }
                });

            using (new FakeSiteContextSwitcher(fakeSiteContext))
            {
                // Act
                var result = new UserCountryRepository().GetAllUserCountryItems();

                // Assert
                result.Should().HaveCount(1);
                result.FirstOrDefault().TemplateID.Should().Be(Constants.TemplateIds.UserCountry);
                result.FirstOrDefault().Name.Should().Be(name);
            }
        }
    }
}
