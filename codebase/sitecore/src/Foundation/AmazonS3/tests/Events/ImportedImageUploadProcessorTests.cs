using System.Collections.Generic;
using System.IO;
using System.Web;
using easyJet.Foundation.AmazonS3.Logging;
using easyJet.Foundation.AmazonS3.Pipelines.uiUpload;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyJet.Foundation.Testing.Extensions;
using FluentAssertions;
using NSubstitute;
using Sitecore.Configuration;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Sitecore.Pipelines.Upload;
using Xunit;

namespace easyJet.Foundation.AmazonS3.Tests.Events
{
    public class ImportedImageUploadProcessorTests
    {
        private const string ImageUploadItemPath = "/sitecore/media library/Bulk Image Import";
        private readonly IAmazonS3Logger logger;
        private readonly IHttpContextAccessor httpContextAccessor;
        private readonly ImportedImageUploadProcessor sut;

        public ImportedImageUploadProcessorTests()
        {
            logger = Substitute.For<IAmazonS3Logger>();
            httpContextAccessor = Substitute.For<IHttpContextAccessor>();
            var httpContext = new HttpContext(new HttpRequest(string.Empty, "http://tempuri.org", string.Empty), new HttpResponse(new StringWriter()));
            httpContextAccessor.GetCurrent().Returns(httpContext);
            using (new SettingsSwitcher("AmazonS3.SitecoreImagesPath", ImageUploadItemPath))
            {
                sut = new ImportedImageUploadProcessor(logger, httpContextAccessor);
            }
        }

        [Fact]
        public void LogEntryWritten_IfImageNull()
        {
            // Arrange
            var args = Substitute.For<UploadArgs>(Substitute.For<ResponseHandler>(Substitute.For<HttpContextBase>()));

            // Act
            sut.Process(args);

            // Assert
            logger.Received().Debug(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]
        public void LogEntryWritten_IfNoImageUploaded()
        {
            var root = new FakeItem().WithPathsPath(ImageUploadItemPath);
            var savedItem = new FakeItem()
                .WithTemplate(Constants.TemplateIds.HotelImageReport)
                .WithField(Constants.FieldsIds.Media, "Image")
                .WithParent(root).WithPathsParentPath($"{ImageUploadItemPath}");

            // Arrange
            var args = Substitute.For<UploadArgs>(Substitute.For<ResponseHandler>(Substitute.For<HttpContextBase>()));
            args.ForceSetFieldValue("_uploadedItems", new List<Item>() { savedItem });
            // Act
            sut.Process(args);

            // Assert
            logger.Received().Debug(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]

        public void LogsError_IfImageExistsInRoot()
        {
            // Arrange
            var root = new FakeItem().WithPathsPath(ImageUploadItemPath);
            var savedItem = new FakeItem()
                .WithTemplate(Constants.TemplateIds.SystemImage)
                .WithField(Constants.FieldsIds.Media, "Image")
                .WithParent(root).WithPathsParentPath($"{ImageUploadItemPath}");

            var args = Substitute.For<UploadArgs>(Substitute.For<ResponseHandler>(Substitute.For<HttpContextBase>()));

            args.ForceSetFieldValue("_uploadedItems", new List<Item>() { savedItem });

            using (new SettingsSwitcher("AmazonS3.SitecoreImagesPath", ImageUploadItemPath))
            {
                // Act
                sut.Process(args);
            }

            // Assert
            logger.Received().Error(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]
        public void LogsError_IfImageExistsInRoot2()
        {
            // Arrange
            var root = new FakeItem()
                .WithPathsPath(ImageUploadItemPath);

            var hotelFolder = new FakeItem()
                .WithParent(root)
                .WithPathsPath($"{ImageUploadItemPath}/45125412");

            var savedItem = new FakeItem()
                .WithTemplate(Constants.TemplateIds.SystemImage)
                .WithField(Constants.FieldsIds.Media, "Image")
                .WithPathsParentPath($"{ImageUploadItemPath}/45125412")
                .WithParent(hotelFolder);

            var args = Substitute.For<UploadArgs>(Substitute.For<ResponseHandler>(Substitute.For<HttpContextBase>()));

            args.ForceSetFieldValue("_uploadedItems", new List<Item>() { savedItem });

            // Act
            sut.Process(args);

            // Assert
            logger.DidNotReceive().Error(Arg.Any<string>(), Arg.Any<object>());
        }
    }
}
