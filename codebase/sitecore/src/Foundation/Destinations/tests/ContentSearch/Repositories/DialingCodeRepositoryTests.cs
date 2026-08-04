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
    public class DialingCodeRepositoryTests
    {
        [Theory]
        [AutoData]
        public void GetAllDialingCodes_ShouldGetAllDialingCodes_IfDialingCodesExist(Db db, string name)
        {
            // Arrange
            var dataFolderItem = new DbItem("Data");
            dataFolderItem.TemplateID = Templates.Data.Id;

            var dialingCodesFolderItem = new DbItem("DialingCodesFolderItem");
            dialingCodesFolderItem.TemplateID = Constants.TemplateIds.DialingCodesFolder;

            dataFolderItem.Children.Add(dialingCodesFolderItem);

            var dialingCodeItem = new DbItem("DialingCode");
            dialingCodeItem.Name = name;
            dialingCodeItem.TemplateID = Constants.TemplateIds.DialingCode;

            dialingCodesFolderItem.Children.Add(dialingCodeItem);

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
                var result = new DialingCodeRepository().GetAllDialingCodeItems();

                // Assert
                result.Should().HaveCount(1);
                result.FirstOrDefault().TemplateID.Should().Be(Constants.TemplateIds.DialingCode);
                result.FirstOrDefault().Name.Should().Be(name);
            }
        }
    }
}
