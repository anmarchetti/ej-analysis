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
    public class HotelBoardDescriptionsUploadReportRepositoryTests
    {
        private readonly IDatasourceRepository datasourceRepository = Substitute.For<IDatasourceRepository>();
        private readonly IDatabaseProvider databaseProvider = Substitute.For<IDatabaseProvider>();
        private readonly BaseSettings baseSettings = Substitute.For<BaseSettings>();

        [Theory]
        [AutoData]
        public void Add_ShouldFillItemWithDataFromRecordModel_IfReportUploadFolderExists(HotelBoardDescriptionUploadRecord record, string path, string folderItemName, string reportItemName)
        {
            // Arrange
            var reportUploadFolderFakeItem = new FakeItem().WithName(folderItemName).WithPath(path);
            var reportFakeItem = new FakeItem().WithName(reportItemName)
                .WithField(Constants.Fields.HotelBoardDescriptionUploadReport.HotelCode, string.Empty)
                .WithField(Constants.Fields.HotelBoardDescriptionUploadReport.HotelName, string.Empty)
                .WithField(Constants.Fields.HotelBoardDescriptionUploadReport.BoardCode, string.Empty)
                .WithField(Constants.Fields.HotelBoardDescriptionUploadReport.BoardName, string.Empty)
                .WithField(Constants.Fields.HotelBoardDescriptionUploadReport.DateTime, string.Empty)
                .WithField(Constants.Fields.HotelBoardDescriptionUploadReport.Message, string.Empty)
                .WithParent(reportUploadFolderFakeItem)
                .WithItemEditing();

            var reportUploadFolderItem = reportUploadFolderFakeItem.ToSitecoreItem();
            var itemPath = reportUploadFolderItem.Paths.FullPath;

            baseSettings.GetSetting(HotelBoardDescriptionsUploadReportRepository.ReportPathSetting).Returns(itemPath);
            databaseProvider.GetItem(itemPath, DatabaseType.Content).Returns(reportUploadFolderItem);

            var reportItem = reportFakeItem.ToSitecoreItem();
            datasourceRepository.CreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>(), Arg.Any<bool>()).ReturnsForAnyArgs(reportItem);
            var sut = new HotelBoardDescriptionsUploadReportRepository(datasourceRepository, databaseProvider, baseSettings);

            // Act
            sut.Add(record);

            // Assert
            reportItem.Fields[Constants.Fields.HotelBoardDescriptionUploadReport.HotelCode].Value.Should().Be(record.HotelCode);
            reportItem.Fields[Constants.Fields.HotelBoardDescriptionUploadReport.HotelName].Value.Should().Be(record.HotelName);
            reportItem.Fields[Constants.Fields.HotelBoardDescriptionUploadReport.BoardCode].Value.Should().Be(record.BoardCode);
            reportItem.Fields[Constants.Fields.HotelBoardDescriptionUploadReport.BoardName].Value.Should().Be(record.BoardName);
            reportItem.Fields[Constants.Fields.HotelBoardDescriptionUploadReport.Message].Value.Should().Be(record.Message);
            reportItem.Fields[Constants.Fields.HotelBoardDescriptionUploadReport.DateTime].Value.Should().Be(DateUtil.ToIsoDate(record.DateTime));
        }
    }
}