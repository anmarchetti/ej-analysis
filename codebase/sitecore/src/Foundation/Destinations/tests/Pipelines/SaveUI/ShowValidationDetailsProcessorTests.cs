using System.Xml;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.Pipelines.SaveUI;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.FakeDb;
using Sitecore.Globalization;
using Sitecore.Pipelines.Save;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Pipelines.SaveUI
{
    public class ShowValidationDetailsProcessorTests
    {
        private const string ShowValidationDetailsKey = "showvalidationdetails";

        private static readonly ID SupportedTemplateId = ID.NewID;

        private readonly IDatabaseProvider databaseProvider;
        private readonly ShowValidationDetailsProcessor processor;

        public ShowValidationDetailsProcessorTests()
        {
            databaseProvider = Substitute.For<IDatabaseProvider>();
            processor = new ShowValidationDetailsProcessor(databaseProvider);
            processor.AddTemplate(SupportedTemplateId.ToString());
        }

        [Theory]
        [AutoData]
        public void Process_EnablesValidationDetails_IfTemplateIsSupported(Db db)
        {
            // Arrange
            var saveArgs = CreateSaveArgs(db, SupportedTemplateId);

            // Act
            processor.Process(saveArgs);

            // Assert
            saveArgs.CustomData[ShowValidationDetailsKey].Should().Be("1");
        }

        [Theory]
        [AutoData]
        public void Process_DoesNothing_IfTemplateIsNotSupported(Db db)
        {
            // Arrange
            var saveArgs = CreateSaveArgs(db, ID.NewID);

            // Act
            processor.Process(saveArgs);

            // Assert
            saveArgs.CustomData[ShowValidationDetailsKey].Should().BeNull();
        }

        [Theory]
        [AutoData]
        public void Process_DoesNothing_IfThereIsNoSheerUI(Db db)
        {
            // Arrange
            var saveArgs = CreateSaveArgs(db, SupportedTemplateId);
            saveArgs.HasSheerUI = false;

            // Act
            processor.Process(saveArgs);

            // Assert
            saveArgs.CustomData[ShowValidationDetailsKey].Should().BeNull();
        }

        private SaveArgs CreateSaveArgs(Db db, ID templateId)
        {
            var carouselDbItem = new DbItem("Carousel", ID.NewID, templateId);
            db.Add(carouselDbItem);

            databaseProvider.GetDatabase(DatabaseType.Content).Returns(db.Database);

            var saveArgs = new SaveArgs(Substitute.For<XmlDocument>())
            {
                Items = new[]
                {
                    new SaveArgs.SaveItem
                    {
                        ID = carouselDbItem.ID,
                        Language = Language.Current,
                    },
                },
            };

            return saveArgs;
        }
    }
}
