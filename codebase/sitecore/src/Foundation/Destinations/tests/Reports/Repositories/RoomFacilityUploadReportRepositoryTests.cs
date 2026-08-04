using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.Reports.Models;
using easyJet.Foundation.Destinations.Reports.Repositories;
using easyJet.Foundation.Destinations.Repositories;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore;
using Sitecore.Abstractions;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Reports.Repositories
{
    public class RoomFacilityUploadReportRepositoryTests
    {
        private readonly IDatasourceRepository datasourceRepository = Substitute.For<IDatasourceRepository>();
        private readonly IDatabaseProvider databaseProvider = Substitute.For<IDatabaseProvider>();
        private readonly BaseSettings baseSettings = Substitute.For<BaseSettings>();

        [Theory]
        [AutoData]
        public void Add_ShouldFillItemWithDataFromRecordModel_IfReportUploadFolderExists(RoomFacilityUploadRecord record, string path, string folderItemName, string reportItemName)
        {
            // Arrange
            var reportUploadFolderFakeItem = new FakeItem().WithName(folderItemName).WithPath(path);
            var reportFakeItem = new FakeItem().WithName(reportItemName)
                .WithField(Constants.Fields.RoomFacilityUploadReport.AtcomCode, string.Empty)
                .WithField(Constants.Fields.RoomFacilityUploadReport.RoomCode, string.Empty)
                .WithField(Constants.Fields.RoomFacilityUploadReport.RoomName, string.Empty)
                .WithField(Constants.Fields.RoomFacilityUploadReport.Code, string.Empty)
                .WithField(Constants.Fields.RoomFacilityUploadReport.FacilityName, string.Empty)
                .WithField(Constants.Fields.RoomFacilityUploadReport.DateTime, string.Empty)
                .WithField(Constants.Fields.RoomFacilityUploadReport.Message, string.Empty)
                .WithParent(reportUploadFolderFakeItem)
                .WithItemEditing();
            var reportUploadFolderItem = reportUploadFolderFakeItem.ToSitecoreItem();
            var itemPath = reportUploadFolderItem.Paths.FullPath;

            baseSettings.GetSetting(RoomFacilityUploadReportRepository.ReportPathSetting).Returns(itemPath);
            databaseProvider.GetItem(itemPath, DatabaseType.Content).Returns(reportUploadFolderItem);

            var reportItem = reportFakeItem.ToSitecoreItem();
            datasourceRepository.GetOrCreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>(), Arg.Any<bool>()).ReturnsForAnyArgs(reportItem);
            var sut = new RoomFacilityUploadReportRepository(datasourceRepository, databaseProvider, baseSettings);

            // Act
            sut.Add(record);

            // Assert
            reportItem.Fields[Constants.Fields.RoomFacilityUploadReport.AtcomCode].Value.Should().Be(record.AtcomCode);
            reportItem.Fields[Constants.Fields.RoomFacilityUploadReport.RoomCode].Value.Should().Be(record.RoomCode);
            reportItem.Fields[Constants.Fields.RoomFacilityUploadReport.RoomName].Value.Should().Be(record.RoomName);
            reportItem.Fields[Constants.Fields.RoomFacilityUploadReport.Code].Value.Should().Be(record.Code);
            reportItem.Fields[Constants.Fields.RoomFacilityUploadReport.FacilityName].Value.Should().Be(record.FacilityName);
            reportItem.Fields[Constants.Fields.RoomFacilityUploadReport.Message].Value.Should().Be(record.Message);
            reportItem.Fields[Constants.Fields.RoomFacilityUploadReport.DateTime].Value.Should().Be(DateUtil.ToIsoDate(record.DateTime));
        }
    }
}
