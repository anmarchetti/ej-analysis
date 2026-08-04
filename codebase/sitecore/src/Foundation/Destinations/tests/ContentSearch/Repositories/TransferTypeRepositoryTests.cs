using System.Collections.Generic;
using System.Linq;
using AutoFixture;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Multisite;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using FluentAssertions;
using NSubstitute;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentSearch.Repositories
{
    public class TransferTypeRepositoryTests
    {
        private readonly TransferTypesRepository transferTypesRepository;
        private readonly IHtmlCacheRepository cache;
        private readonly Fixture fixture;
        private readonly Db db;

        public TransferTypeRepositoryTests()
        {
            // Arrange
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
            cache = Substitute.For<IHtmlCacheRepository>();
            transferTypesRepository = new TransferTypesRepository(cache);
        }

        [Fact]
        public void GetAll_ShouldBeNotEmpty_IfCacheHasData()
        {
            // Arrange
            cache.GetItem<List<TransferType>>(Arg.Any<string>()).Returns(new List<TransferType>()
            {
                new TransferType()
            });

            // Act
            var actual = transferTypesRepository.GetAll();

            // Assert
            actual.Should().NotBeEmpty();
            actual.Should().BeOfType<List<TransferType>>();
        }

        [Fact]
        public void GetAll_ShouldBeEmpty_IfTransferFolderNotExist()
        {
            // Arrange
            var fakeSite = new Sitecore.FakeDb.Sites.FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                {
                         { "name", "website" }, { "database", "master" }, { "rootPath", "/sitecore/content/" }
                });

            using (new Sitecore.Sites.SiteContextSwitcher(fakeSite))
            {
                // Act
                var actual = transferTypesRepository.GetAll();

                // Assert
                actual.Should().BeEmpty();
                actual.Should().BeOfType<List<TransferType>>();
            }
        }

        [Theory]
        [AutoData]
        public void GetAll_ShouldBeNotEmpty_IfTransferFolderHasChildren(string code, string name, string content, string icon, ContentByDate contentByDate)
        {
            // Arrange
            var fakeSite = new Sitecore.FakeDb.Sites.FakeSiteContext(
                 new Sitecore.Collections.StringDictionary
                 {
                         { "name", "website" }, { "database", "master" }, { "rootPath", "/sitecore/content/" }
                 });

            var dataDbItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            var transferTypeFolder = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            var transferType = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            var contentByDateItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            dataDbItem.TemplateID = Templates.Data.Id;
            transferTypeFolder.TemplateID = Constants.TemplateIds.TransfersTypeFolder;
            transferType.TemplateID = Constants.TemplateIds.TransferType;

            transferType.Fields.Add(Constants.Fields.DatasourceItem.Code, code);
            transferType.Fields.Add(Constants.Fields.DatasourceItem.Name, name);
            transferType.Fields.Add(Constants.Fields.DatasourceItem.Content, content);
            transferType.Fields.Add(Constants.Fields.AccommodationReferenceItem.Icon, icon);

            contentByDateItem.Fields.Add(Constants.Fields.ContentByDateItem.StartDate, contentByDate.StartDate.ToString());
            contentByDateItem.Fields.Add(Constants.Fields.ContentByDateItem.EndDate, contentByDate.EndDate.ToString());
            contentByDateItem.Fields.Add(Constants.Fields.ContentByDateItem.Content, contentByDate.Content);

            transferType.Children.Add(contentByDateItem);

            dataDbItem.Children.Add(transferTypeFolder);
            transferTypeFolder.Children.Add(transferType);

            db.Add(dataDbItem);

            using (new Sitecore.Sites.SiteContextSwitcher(fakeSite))
            {
                // Act
                var actual = transferTypesRepository.GetAll();

                // Assert
                actual.Should().NotBeEmpty();
                actual.Should().BeOfType<List<TransferType>>();

                var actualTransferType = actual.FirstOrDefault();
                actualTransferType.Name = name;
                actualTransferType.Code = code;
                actualTransferType.Content = content;
                actualTransferType.IconUrl = content;
                actualTransferType.ContentByDate.Should().NotBeEmpty();
            }
        }
    }
}
