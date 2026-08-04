using System.Linq;
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
    public class FacilityUploadReportRepositoryTests
    {
        private readonly IDatasourceRepository datasourceRepository = Substitute.For<IDatasourceRepository>();
        private readonly IDatabaseProvider databaseProvider = Substitute.For<IDatabaseProvider>();
        private readonly BaseSettings baseSettings = Substitute.For<BaseSettings>();

        [Theory]
        [AutoData]
        public void Add_ShouldFillItemWithDataFromRecordModel_IfReportUploadFolderExists(FacilityUploadRecord record, string path, string folderItemName, string reportItemName)
        {
            // Arrange
            var reportUploadFolderFakeItem = new FakeItem().WithName(folderItemName).WithPath(path);
            var reportFakeItem = new FakeItem().WithName(reportItemName)
                .WithField(Constants.Fields.FacilityUploadReport.HotelCode, string.Empty)
                .WithField(Constants.Fields.FacilityUploadReport.HotelName, string.Empty)
                .WithField(Constants.Fields.FacilityUploadReport.FacilityCode, string.Empty)
                .WithField(Constants.Fields.FacilityUploadReport.FacilityName, string.Empty)
                .WithField(Constants.Fields.FacilityUploadReport.DateTime, string.Empty)
                .WithField(Constants.Fields.FacilityUploadReport.Message, string.Empty)
                .WithParent(reportUploadFolderFakeItem)
                .WithItemEditing();

            var reportUploadFolderItem = reportUploadFolderFakeItem.ToSitecoreItem();
            var itemPath = reportUploadFolderItem.Paths.FullPath;

            baseSettings.GetSetting(FacilityUploadReportRepository.FacilitiesUploadReportPath).Returns(itemPath);
            databaseProvider.GetItem(itemPath, DatabaseType.Content).Returns(reportUploadFolderItem);

            var reportItem = reportFakeItem.ToSitecoreItem();
            datasourceRepository.CreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>(), Arg.Any<bool>()).ReturnsForAnyArgs(reportItem);
            var sut = new FacilityUploadReportRepository(datasourceRepository, databaseProvider, baseSettings);

            // Act
            sut.Add(record);

            // Assert
            reportItem.Fields[Constants.Fields.FacilityUploadReport.HotelCode].Value.Should().Be(record.HotelCode);
            reportItem.Fields[Constants.Fields.FacilityUploadReport.HotelName].Value.Should().Be(record.HotelName);
            reportItem.Fields[Constants.Fields.FacilityUploadReport.FacilityCode].Value.Should().Be(record.FacilityCode);
            reportItem.Fields[Constants.Fields.FacilityUploadReport.FacilityName].Value.Should().Be(record.FacilityName);
            reportItem.Fields[Constants.Fields.FacilityUploadReport.Message].Value.Should().Be(record.Message);
            reportItem.Fields[Constants.Fields.FacilityUploadReport.DateTime].Value.Should().Be(DateUtil.ToIsoDate(record.DateTime));
        }
    }
}
