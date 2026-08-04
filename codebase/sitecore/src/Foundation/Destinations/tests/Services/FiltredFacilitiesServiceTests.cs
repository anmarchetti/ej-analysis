using System;
using System.Collections.Generic;
using System.Linq;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Abstractions;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Services
{
    public class FiltredFacilitiesServiceTests
    {
        private const string FacilityTypesPath = "FacilityTypesPath";
        private readonly IHtmlCacheRepository htmlCacheRepository;
        private readonly FiltredFacilitiesService filtredFacilitiesService;
        private readonly IDatabaseProvider databaseProvider;
        private readonly BaseSettings settings;

        public FiltredFacilitiesServiceTests()
        {
            settings = Substitute.For<BaseSettings>();
            htmlCacheRepository = Substitute.For<IHtmlCacheRepository>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            settings.GetSetting("Destinations.FacilityTypes.Path", Arg.Any<string>()).Returns(FacilityTypesPath);
            filtredFacilitiesService = new FiltredFacilitiesService(htmlCacheRepository, settings, databaseProvider);
        }

        [Theory]
        [AutoData]
        public void GetFiltredFacilities_ShouldReturnItemId_IfFacilityExistsInCache(Guid itemId)
        {
            // Arrange
            htmlCacheRepository.GetItem<List<FacilityExtended>>(Arg.Any<string>()).ReturnsForAnyArgs(new List<FacilityExtended> { new FacilityExtended { ItemID = itemId } });

            // Act
            var actual = filtredFacilitiesService.GetFiltredFacilities().FirstOrDefault().ItemID;

            // Assert
            actual.Should().Be(itemId);
        }

        [Fact]
        public void GetFiltredFacilities_ShouldReturnEmptyList_IfFacilityTypesFolderNotExist()
        {
            // Arrange
            Item item = null;
            htmlCacheRepository.GetItem<List<FacilityExtended>>(Arg.Any<string>()).ReturnsForAnyArgs(l => null);

            databaseProvider.GetDatabase(DatabaseType.Context).SelectSingleItem(FacilityTypesPath).Returns(item);

            // Act
            var actual = filtredFacilitiesService.GetFiltredFacilities();

            // Assert
            actual.Should().BeEmpty();
        }

        [Fact]
        public void GetFiltredFacilities_ShouldReturnFacilityExtended_IffacilityTypeExist()
        {
            // Arrange
            htmlCacheRepository.GetItem<List<FacilityExtended>>(Arg.Any<string>()).ReturnsForAnyArgs(l => null);
            htmlCacheRepository.StoreItem(Arg.Any<string>(), Arg.Any<List<FacilityExtended>>());

            var facilityTypesFolderItem = new FakeItem().WithTemplate(Constants.TemplateIds.FacilityTypesFolder);
            var facilityTypesGroupItem = new FakeItem().WithTemplate(Constants.TemplateIds.FacilityTypesGroup);
            var facilityTypeItem = new FakeItem()
                .WithTemplate(Constants.TemplateIds.FacilityType)
                .WithField(Constants.Fields.FacilityTypeItem.ShowInFilter, Constants.Common.CheckboxTrueValue);

            facilityTypesGroupItem.Add(facilityTypeItem);
            facilityTypesFolderItem.Add(facilityTypesGroupItem);

            databaseProvider.GetDatabase(DatabaseType.Context).SelectSingleItem(FacilityTypesPath).Returns(facilityTypesFolderItem);

            // Act
            var actual = filtredFacilitiesService.GetFiltredFacilities().FirstOrDefault().ItemID;

            // Assert
            actual.Should().Be(facilityTypeItem.ID.Guid);
        }
    }
}
