using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.Reports.Models;
using easyJet.Foundation.Destinations.Reports.Repositories;
using easyJet.Foundation.Destinations.Repositories;
using easyJet.Foundation.HotelBeds.Reports.Models;
using easyJet.Foundation.HotelBeds.Reports.Repositories;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore;
using Sitecore.Abstractions;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.HotelBeds.Tests.Services
{
    public class ReSyncFacilitiesReportRepositoryTests
    {
        private readonly IDatasourceRepository datasourceRepository = Substitute.For<IDatasourceRepository>();
        private readonly IDatabaseProvider databaseProvider = Substitute.For<IDatabaseProvider>();
        private readonly BaseSettings baseSettings = Substitute.For<BaseSettings>();

        [Theory]
        [AutoData]
        public void Add_ShouldFillItemWithDataFromRecordModel_IfReportUploadFolderExists(ResyncFaciltitesRecord record, string path, string folderItemName, string reportItemName)
        {
            // Arrange
            var reportUploadFolderFakeItem = new FakeItem().WithName(folderItemName).WithPath(path);
            var reportFakeItem = new FakeItem().WithName(reportItemName)
                .WithField(Constants.Templates.ResyncFacilititesRecord.Fields.HotelCode, string.Empty)
                .WithField(Constants.Templates.ResyncFacilititesRecord.Fields.HotelName, string.Empty)
                .WithField(Constants.Templates.ResyncFacilititesRecord.Fields.Message, string.Empty)
                .WithField(Constants.Templates.ResyncFacilititesRecord.Fields.DateTime, string.Empty)
                .WithParent(reportUploadFolderFakeItem)
                .WithItemEditing();

            var reportUploadFolderItem = reportUploadFolderFakeItem.ToSitecoreItem();
            var itemPath = reportUploadFolderItem.Paths.FullPath;

            baseSettings.GetSetting(ReSyncFacilitiesReportRepository.ReportPathSetting).Returns(itemPath);
            databaseProvider.GetItem(itemPath, DatabaseType.Content).Returns(reportUploadFolderItem);

            var reportItem = reportFakeItem.ToSitecoreItem();
            datasourceRepository.CreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>(), Arg.Any<bool>()).ReturnsForAnyArgs(reportItem);
            var sut = new ReSyncFacilitiesReportRepository(datasourceRepository, databaseProvider, baseSettings);

            // Act
            sut.Add(record);

            // Assert
            reportItem.Fields[Constants.Templates.ResyncFacilititesRecord.Fields.HotelCode].Value.Should().Be(record.HotelCode);
            reportItem.Fields[Constants.Templates.ResyncFacilititesRecord.Fields.HotelName].Value.Should().Be(record.HotelName);
            reportItem.Fields[Constants.Templates.ResyncFacilititesRecord.Fields.Message].Value.Should().Be(record.Message);
            reportItem.Fields[Constants.Templates.ResyncFacilititesRecord.Fields.DateTime].Value.Should().Be(DateUtil.ToIsoDate(record.DateTime));
        }
    }
}