using AutoFixture.Xunit2;
using easyJet.Foundation.AmazonS3.Reports.Models;
using easyJet.Foundation.AmazonS3.Reports.Repositories;
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

namespace easyJet.Foundation.AmazonS3.Tests.Reports.Repositories
{
    public class HotelImageReportRepositoryTests
    {
        private readonly IDatasourceRepository datasourceRepository = Substitute.For<IDatasourceRepository>();
        private readonly IDatabaseProvider databaseProvider = Substitute.For<IDatabaseProvider>();
        private readonly BaseSettings baseSettings = Substitute.For<BaseSettings>();

        [Theory]
        [AutoData]
        public void HotelImageRepository_CreateNewItem_IfHotelImageStatusRecordNotNull(HotelImageStatusRecord record, TemplateID templateId, string path, string folderItemName, string reportItemName)
        {
            // Arrange
            var reportUploadFolderFakeItem = new FakeItem().WithName(folderItemName).WithPath(path).WithItemAxes();
            var reportFakeItem = new FakeItem().WithName(reportItemName)
                .WithItemAxes()
                .WithItemEditing()
                .WithTemplate(templateId)
                .WithParent(reportUploadFolderFakeItem)
                .WithField(Constants.FieldsName.AtcomCode, string.Empty)
                .WithField(Constants.FieldsName.ImageName, string.Empty)
                .WithField(Constants.FieldsName.Message, string.Empty)
                .WithField(Constants.FieldsName.DateTime, string.Empty)
                .WithField(Constants.FieldsName.Status, string.Empty);

            var reportUploadFolderItem = reportUploadFolderFakeItem.ToSitecoreItem();
            var itemPath = reportUploadFolderItem.Paths.FullPath;

            baseSettings.GetSetting(Constants.Settings.ReportPathSettingsName).Returns(itemPath);
            databaseProvider.GetItem(itemPath, DatabaseType.Master).Returns(reportUploadFolderItem);

            var reportItem = reportFakeItem.ToSitecoreItem();
            datasourceRepository.GetOrCreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>(), Arg.Any<bool>()).ReturnsForAnyArgs(reportItem);
            var sut = new HotelImageReportRepository(datasourceRepository, databaseProvider, baseSettings);

            // Act
            sut.Add(record);

            // Assert
            datasourceRepository.ReceivedWithAnyArgs().GetOrCreateItem(reportItemName, Constants.TemplateIds.HotelImageReport, Arg.Any<Item>());
            reportItem.Fields[Constants.FieldsName.AtcomCode].Value.Should().Be(record.HotelCode);
            reportItem.Fields[Constants.FieldsName.ImageName].Value.Should().Be(record.ImageName);
            reportItem.Fields[Constants.FieldsName.Message].Value.Should().Be(record.Message);
            reportItem.Fields[Constants.FieldsName.Status].Value.Should().Be(record.Status.ToString());
            reportItem.Fields[Constants.FieldsName.DateTime].Value.Should().Be(DateUtil.ToIsoDate(record.DateTime));
        }
    }
}
