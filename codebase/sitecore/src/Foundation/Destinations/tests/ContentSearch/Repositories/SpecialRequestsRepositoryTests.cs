using System.Collections.Generic;
using System.Linq;
using System.Text;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Multisite;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Sites;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentSearch.Repositories
{
    public class SpecialRequestsRepositoryTests
    {
        private readonly IHtmlCacheRepository cacheRepository;
        private readonly SpecialRequestsRepository repository;

        public SpecialRequestsRepositoryTests()
        {
            cacheRepository = Substitute.For<IHtmlCacheRepository>();
            repository = new SpecialRequestsRepository(cacheRepository);
        }

        [Theory]
        [AutoData]
        public void GetAll_ShouldReturnAllSpecialRequests_IfTheyExistInCache(SpecialRequests specialRequests)
        {
            // Arrange
            cacheRepository.GetItem<SpecialRequests>(Arg.Any<string>()).Returns(specialRequests);

            // Act
            var result = repository.GetAll().SpecialRequestType;

            // Assert
            result.Count().Should().Be(specialRequests.SpecialRequestType.Count);
            for (int i = 0; i < specialRequests.SpecialRequestType.Count; i++)
            {
                result.ElementAt(i).Code.Should().Be(specialRequests.SpecialRequestType[i].Code);
                result.ElementAt(i).Name.Should().Be(specialRequests.SpecialRequestType[i].Name);
                result.ElementAt(i).Type.Should().Be(specialRequests.SpecialRequestType[i].Type);
                result.ElementAt(i).SpecialRequests.Count().Should().Be(specialRequests.SpecialRequestType[i].SpecialRequests.Count());
                for (int j = 0; j < specialRequests.SpecialRequestType[i].SpecialRequests.Count(); j++)
                {
                    result.ElementAt(i).SpecialRequests.ElementAt(j).Code.Should().Be(specialRequests.SpecialRequestType[i].SpecialRequests.ElementAt(j).Code);
                    result.ElementAt(i).SpecialRequests.ElementAt(j).DisplayName.Should().Be(specialRequests.SpecialRequestType[i].SpecialRequests.ElementAt(j).DisplayName);
                    result.ElementAt(i).SpecialRequests.ElementAt(j).Name.Should().Be(specialRequests.SpecialRequestType[i].SpecialRequests.ElementAt(j).Name);
                    result.ElementAt(i).SpecialRequests.ElementAt(j).PreSelectedForAlert.Should().Be(specialRequests.SpecialRequestType[i].SpecialRequests.ElementAt(j).PreSelectedForAlert);
                    result.ElementAt(i).SpecialRequests.ElementAt(j).PreSelectedForInfant.Should().Be(specialRequests.SpecialRequestType[i].SpecialRequests.ElementAt(j).PreSelectedForInfant);
                    result.ElementAt(i).SpecialRequests.ElementAt(j).Type.Should().Be(specialRequests.SpecialRequestType[i].SpecialRequests.ElementAt(j).Type);
                }
            }
        }

        [Theory]
        [AutoData]
        public void GetAll_ShouldReturnAllSpecialRequests_IfTheyExistInSitecoreContentTree(Db db, List<SpecialRequestType> specialRequestsTypes)
        {
            // Arrange
            var dataDbItem = new DbItem("Data", ID.NewID, Templates.Data.Id);
            var specialRequestsTypesFolderDbItem = new DbItem("Special requests types folder", ID.NewID, Constants.TemplateIds.SpecialRequestsFolder);
            var srtIds = new StringBuilder();
            foreach (var specialRequestType in specialRequestsTypes)
            {
                var specialRequestTypeDbItem = new DbItem("Special request type", ID.NewID, Constants.TemplateIds.SpecialRequestType);
                specialRequestTypeDbItem.Fields.Add(new DbField(Constants.Fields.DatasourceItem.Code) { Value = specialRequestType.Code });
                specialRequestTypeDbItem.Fields.Add(new DbField(Constants.Fields.DatasourceItem.Name) { Value = specialRequestType.Name });
                var ids = new StringBuilder();
                foreach (var specialRequest in specialRequestType.SpecialRequests)
                {
                    var specialRequestDbItem = new DbItem("Special request", ID.NewID, Constants.TemplateIds.SpecialRequest);
                    specialRequestDbItem.Fields.Add(new DbField(Constants.Fields.SpecialRequest.DisplayName) { Value = specialRequest.DisplayName });
                    specialRequestDbItem.Fields.Add(new DbField(Constants.Fields.SpecialRequest.PreSelectedForInfant) { Value = specialRequest.PreSelectedForInfant.ToString() });
                    specialRequestDbItem.Fields.Add(new DbField(Constants.Fields.SpecialRequest.PreSelectedForInfantAlert) { Value = specialRequest.PreSelectedForAlert });
                    specialRequestDbItem.Fields.Add(new DbField(Constants.Fields.DatasourceItem.Code) { Value = specialRequest.Code });
                    specialRequestDbItem.Fields.Add(new DbField(Constants.Fields.DatasourceItem.Name) { Value = specialRequest.Name });
                    dataDbItem.Children.Add(specialRequestDbItem);
                    ids.Append($"{specialRequestDbItem.ID}|");
                }

                specialRequestTypeDbItem.Fields.Add(new DbField(Constants.Fields.SpecialRequestType.SpecialRequests) { Value = ids.ToString().Trim('|') });
                specialRequestsTypesFolderDbItem.Children.Add(specialRequestTypeDbItem);
                srtIds.Append($"{specialRequestTypeDbItem.ID}|");
            }

            specialRequestsTypesFolderDbItem.Fields.Add(new DbField(Constants.Fields.SpecialRequestsFolder.SpecialRequestsTypes) { Value = srtIds.ToString().Trim('|') });

            dataDbItem.Children.Add(specialRequestsTypesFolderDbItem);
            db.Add(dataDbItem);

            var fakeSiteContext = new FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                {
                    { "name", "fake" },
                    { "database", "master" },
                    { "rootPath", "/sitecore/content" }
                });

            // Act
            using (new FakeSiteContextSwitcher(fakeSiteContext))
            {
                var result = repository.GetAll().SpecialRequestType;

                // Assert
                result.Count().Should().Be(specialRequestsTypes.Count);
                for (int i = 0; i < specialRequestsTypes.Count; i++)
                {
                    result.ElementAt(i).Code.Should().Be(specialRequestsTypes[i].Code);
                    result.ElementAt(i).Name.Should().Be(specialRequestsTypes[i].Name);
                    result.ElementAt(i).SpecialRequests.Count().Should().Be(specialRequestsTypes[i].SpecialRequests.Count());
                    for (int j = 0; j < specialRequestsTypes[i].SpecialRequests.Count(); j++)
                    {
                        result.ElementAt(i).SpecialRequests.ElementAt(j).Code.Should().Be(specialRequestsTypes[i].SpecialRequests.ElementAt(j).Code);
                        result.ElementAt(i).SpecialRequests.ElementAt(j).DisplayName.Should().Be(specialRequestsTypes[i].SpecialRequests.ElementAt(j).DisplayName);
                        result.ElementAt(i).SpecialRequests.ElementAt(j).Name.Should().Be(specialRequestsTypes[i].SpecialRequests.ElementAt(j).Name);
                        result.ElementAt(i).SpecialRequests.ElementAt(j).PreSelectedForAlert.Should().Be(specialRequestsTypes[i].SpecialRequests.ElementAt(j).PreSelectedForAlert);
                        result.ElementAt(i).SpecialRequests.ElementAt(j).PreSelectedForInfant.Should().Be(specialRequestsTypes[i].SpecialRequests.ElementAt(j).PreSelectedForInfant);
                    }
                }
            }
        }
    }
}
