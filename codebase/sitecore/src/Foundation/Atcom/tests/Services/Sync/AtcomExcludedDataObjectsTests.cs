using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Atcom.Logging;
using easyJet.Foundation.Atcom.Models;
using easyJet.Foundation.Atcom.Services.Sync;
using easyJet.Foundation.Destinations;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyjet.Foundation.Testing.Attributes;
using FluentAssertions;
using NSubstitute;
using NSubstitute.Extensions;
using Sitecore.Abstractions;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Atcom.Tests.Services.Sync
{
    public class AtcomExcludedDataObjectsTests
    {
        private readonly ICsvUtilsService csvUtilsService;
        private readonly IAtcomLogger atcomLogger;
        private readonly BaseSettings settings;
        private readonly BaseMediaManager mediaManager;
        private readonly IExcludeDataObjectsSettingsService atcomExcludeDataObjectsSettingsService;
        private IExcludeDataObjectsService sut;

        public AtcomExcludedDataObjectsTests()
        {
            csvUtilsService = Substitute.For<ICsvUtilsService>();
            atcomLogger = Substitute.For<IAtcomLogger>();
            settings = Substitute.For<BaseSettings>();
            mediaManager = Substitute.For<BaseMediaManager>();
            atcomExcludeDataObjectsSettingsService = Substitute.For<IExcludeDataObjectsSettingsService>();
        }

        [Theory]
        [AutoDbData]
        public void AtcomExcludedDataObjects_IfCSVFileContainsCode_ThenCodeReturnIsExcluded(Db db, FilledSettingsDbItem settingsDbItem, string blockedCode)
        {
            // Arrange
            var settingsPath = @"/sitecore/content/EasyJet/Holidays/Settings/Atcom Synchronization";
            settings.Configure().GetSetting(Constants.Atcom.SettingsPathSettingName).Returns(settingsPath);

            atcomExcludeDataObjectsSettingsService.GetCodes().Returns(new HashSet<string>() { blockedCode.ToLower() });

            sut = new AtcomExcludeDataObjectsService(atcomExcludeDataObjectsSettingsService, atcomLogger);

            // Act
            var actual = sut.IsExcluded(blockedCode);

            // Assert
            actual.Should().BeTrue();
        }

        [Theory]
        [AutoDbData]
        public void AtcomExcludedDataObjects_IfCSVNotConfigured_ThenCodeReturnIsNotExcluded(Db db, FilledSettingsDbItem settingsDbItem, string blockedCode)
        {
            // Arrange
            settings.Configure().GetSetting(Constants.Atcom.SettingsPathSettingName).Returns(string.Empty);

            atcomExcludeDataObjectsSettingsService.GetCodes().Returns(new HashSet<string>() { blockedCode });

            sut = new AtcomExcludeDataObjectsService(atcomExcludeDataObjectsSettingsService, atcomLogger);

            // Act
            var actual = sut.IsExcluded(blockedCode);

            // Assert
            actual.Should().BeFalse();
        }

        [Theory]
        [AutoDbData]
        public void AtcomExcludedDataObjects_IfCSVFileContainsCode_ThenExceptExcludedWorks(Db db, List<DataObject> objects, FilledSettingsDbItem settingsDbItem, string blockedCode)
        {
            // Arrange
            var settingsPath = @"/sitecore/content/EasyJet/Holidays/Settings/Atcom Synchronization";
            settings.Configure().GetSetting(Constants.Atcom.SettingsPathSettingName).Returns(settingsPath);

            atcomExcludeDataObjectsSettingsService.GetCodes().Returns(new HashSet<string>() { blockedCode.ToLower() });

            objects.Add(new DataObject(blockedCode, "blocked"));

            sut = new AtcomExcludeDataObjectsService(atcomExcludeDataObjectsSettingsService, atcomLogger);

            // Act
            var actual = sut.ExceptExcluded(objects).Count();

            // Assert
            actual.Should().Be(objects.Count - 1);
        }

        [Theory]
        [AutoDbData]
        public void AtcomExcludedDataObjects_IfCSVFileContainsResortCode_ThenExceptExcludedWorksOnAccommodation(Db db, DestinationDbItem parent, DbItem accomodationItem, List<DataObject> objects, FilledSettingsDbItem settingsDbItem)
        {
            parent.Children.Add(accomodationItem);
            var resortcode = "EN";

            // Arrange
            var settingsPath = @"/sitecore/content/EasyJet/Holidays/Settings/Atcom Synchronization";
            settings.Configure().GetSetting(Constants.Atcom.SettingsPathSettingName).Returns(settingsPath);

            atcomExcludeDataObjectsSettingsService.GetCodes().Returns(new HashSet<string>() { resortcode.ToLower() });

            sut = new AtcomExcludeDataObjectsService(atcomExcludeDataObjectsSettingsService, atcomLogger);

            // Act
            var actual = sut.IsExcluded(db.GetItem(accomodationItem.ID));

            // Assert
            actual.Should().Be(true);
        }
    }
}