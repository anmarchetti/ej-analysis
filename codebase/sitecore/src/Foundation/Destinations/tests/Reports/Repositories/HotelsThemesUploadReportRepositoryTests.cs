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
    public class HotelsThemesUploadReportRepositoryTests
    {
        private readonly IDatasourceRepository datasourceRepository = Substitute.For<IDatasourceRepository>();
        private readonly IDatabaseProvider databaseProvider = Substitute.For<IDatabaseProvider>();
        private readonly BaseSettings baseSettings = Substitute.For<BaseSettings>();

        [Theory]
        [AutoData]
        public void Add_ShouldFillItemWithDataFromRecordModel_IfReportUploadFolderExists(HotelThemesUploadRecord record, string path, string folderItemName, string reportItemName)
        {
            // Arrange
            var reportUploadFolderFakeItem = new FakeItem().WithName(folderItemName).WithPath(path);
            var reportFakeItem = new FakeItem().WithName(reportItemName)
                .WithField(Constants.Fields.HotelThemesUploadReport.HotelCode, string.Empty)
                .WithField(Constants.Fields.HotelThemesUploadReport.HotelName, string.Empty)
                .WithField(Constants.Fields.HotelThemesUploadReport.HotelTheme, string.Empty)
                .WithField(Constants.Fields.HotelThemesUploadReport.HotelThemeCode, string.Empty)
                .WithField(Constants.Fields.HotelThemesUploadReport.HotelType, string.Empty)
                .WithField(Constants.Fields.HotelThemesUploadReport.HotelTypeCode, string.Empty)
                .WithField(Constants.Fields.HotelThemesUploadReport.Message, string.Empty)
                .WithField(Constants.Fields.HotelThemesUploadReport.DateTime, string.Empty)
                .WithParent(reportUploadFolderFakeItem)
                .WithItemEditing();

            var reportUploadFolderItem = reportUploadFolderFakeItem.ToSitecoreItem();
            var itemPath = reportUploadFolderItem.Paths.FullPath;

            baseSettings.GetSetting(HotelsThemesUploadReportRepository.ReportPathSetting).Returns(itemPath);
            databaseProvider.GetItem(itemPath, DatabaseType.Content).Returns(reportUploadFolderItem);

            var reportItem = reportFakeItem.ToSitecoreItem();
            datasourceRepository.CreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>(), Arg.Any<bool>()).ReturnsForAnyArgs(reportItem);
            var sut = new HotelsThemesUploadReportRepository(datasourceRepository, databaseProvider, baseSettings);

            // Act
            sut.Add(record);

            // Assert
            reportItem.Fields[Constants.Fields.HotelThemesUploadReport.HotelCode].Value.Should().Be(record.HotelCode);
            reportItem.Fields[Constants.Fields.HotelThemesUploadReport.HotelName].Value.Should().Be(record.HotelName);
            reportItem.Fields[Constants.Fields.HotelThemesUploadReport.HotelTheme].Value.Should().Be(record.HotelTheme);
            reportItem.Fields[Constants.Fields.HotelThemesUploadReport.HotelThemeCode].Value.Should().Be(record.HotelThemeCode);
            reportItem.Fields[Constants.Fields.HotelThemesUploadReport.HotelType].Value.Should().Be(record.HotelType);
            reportItem.Fields[Constants.Fields.HotelThemesUploadReport.HotelTypeCode].Value.Should().Be(record.HotelTypeCode);
            reportItem.Fields[Constants.Fields.HotelThemesUploadReport.Message].Value.Should().Be(record.Message);
            reportItem.Fields[Constants.Fields.HotelThemesUploadReport.DateTime].Value.Should().Be(DateUtil.ToIsoDate(record.DateTime));
        }
    }
}
