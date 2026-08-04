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
    public class HotelOverviewDescriptionsUploadReportRepositoryTests
    {
        private readonly IDatasourceRepository datasourceRepository = Substitute.For<IDatasourceRepository>();
        private readonly IDatabaseProvider databaseProvider = Substitute.For<IDatabaseProvider>();
        private readonly BaseSettings baseSettings = Substitute.For<BaseSettings>();

        [Theory]
        [AutoData]
        public void Add_ShouldFillItemWithDataFromRecordModel_IfReportUploadFolderExists(HotelOverviewDescriptionUploadRecord record, string path, string folderItemName, string reportItemName)
        {
            // Arrange
            var reportUploadFolderFakeItem = new FakeItem().WithName(folderItemName).WithPath(path);
            var reportFakeItem = new FakeItem().WithName(reportItemName)
                .WithField(Constants.Fields.HotelOverviewDescriptionUploadReport.DateTime, string.Empty)
                .WithField(Constants.Fields.HotelOverviewDescriptionUploadReport.GiataCode, string.Empty)
                .WithField(Constants.Fields.HotelOverviewDescriptionUploadReport.HotelOverviewDescription, string.Empty)
                .WithField(Constants.Fields.HotelOverviewDescriptionUploadReport.Message, string.Empty)
                .WithParent(reportUploadFolderFakeItem)
                .WithItemEditing();

            var reportUploadFolderItem = reportUploadFolderFakeItem.ToSitecoreItem();
            var itemPath = reportUploadFolderItem.Paths.FullPath;

            baseSettings.GetSetting(HotelOverviewDescriptionsUploadReportRepository.ReportPathSetting).Returns(itemPath);
            databaseProvider.GetItem(itemPath, DatabaseType.Content).Returns(reportUploadFolderItem);

            var reportItem = reportFakeItem.ToSitecoreItem();
            datasourceRepository.CreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>(), Arg.Any<bool>()).ReturnsForAnyArgs(reportItem);
            var sut = new HotelOverviewDescriptionsUploadReportRepository(datasourceRepository, databaseProvider, baseSettings);

            // Act
            sut.Add(record);

            // Assert
            reportItem.Fields[Constants.Fields.HotelOverviewDescriptionUploadReport.GiataCode].Value.Should().Be(record.GiataCode);
            reportItem.Fields[Constants.Fields.HotelOverviewDescriptionUploadReport.HotelOverviewDescription].Value.Should().Be(record.HotelOverviewDescription);
            reportItem.Fields[Constants.Fields.HotelOverviewDescriptionUploadReport.Message].Value.Should().Be(record.Message);
            reportItem.Fields[Constants.Fields.HotelOverviewDescriptionUploadReport.DateTime].Value.Should().Be(DateUtil.ToIsoDate(record.DateTime));
        }
    }
}
