using System.Xml;
using easyJet.Foundation.Destinations.Pipelines.SaveUI;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.Globalization;
using Sitecore.NSubstituteUtils;
using Sitecore.Pipelines.Save;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Pipelines.SaveUI
{
    public class RequestedSearchesProcessorTests
    {
        private readonly RequestedSearchesProcessor processor;
        private readonly IDatabaseProvider databaseProvider;

        public RequestedSearchesProcessorTests()
        {
            databaseProvider = Substitute.For<IDatabaseProvider>();
            processor = Substitute.ForPartsOf<RequestedSearchesProcessor>(databaseProvider);
        }

        [Fact]
        public void Process_ShouldAbortPipeline_IfPromoPageFieldHasManyItems()
        {
            // Arrange
            var fakeItem = new FakeItem()
                .WithTemplate(Constants.TemplateIds.RequestedSearch)
                .ToSitecoreItem();

            fakeItem.Database.GetItem(Arg.Any<ID>(), Arg.Any<Language>()).Returns(fakeItem);
            databaseProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns(fakeItem.Database);

            var xmlDocument = Substitute.For<XmlDocument>();
            var saveArgs = new SaveArgs(xmlDocument);
            saveArgs.Items = new SaveArgs.SaveItem[]
            {
                new SaveArgs.SaveItem()
                {
                    ID = fakeItem.ID,
                    Fields = new SaveArgs.SaveField[]
                    {
                        new SaveArgs.SaveField()
                        {
                            ID = Constants.FieldsIds.RequestedSearch.PromoPageId,
                            Value = $"{ID.NewID}|${ID.NewID}"
                        }
                    }
                }
            };

            processor.When(x => x.Alert(Arg.Any<string>())).DoNotCallBase();

            // Act
            processor.Process(saveArgs);

            // Assert
            saveArgs.Aborted.Should().BeTrue();
        }

        [Fact]
        public void Process_ShouldThrowAlert_IfPromoPageFieldIsEmpty()
        {
            // Arrange
            var fakeItem = new FakeItem()
                .WithTemplate(Constants.TemplateIds.RequestedSearch)
                .WithField(Constants.Fields.RequestedSearch.PromoPage, string.Empty)
                .ToSitecoreItem();

            fakeItem.Database.GetItem(Arg.Any<ID>(), Arg.Any<Language>()).Returns(fakeItem);
            fakeItem.Database.GetItem(Arg.Any<string>(), Arg.Any<Language>()).Returns(fakeItem);
            databaseProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns(fakeItem.Database);

            var xmlDocument = Substitute.For<XmlDocument>();
            var saveArgs = new SaveArgs(xmlDocument);
            saveArgs.Items = new SaveArgs.SaveItem[]
            {
                new SaveArgs.SaveItem()
                {
                    ID = fakeItem.ID,
                    Fields = new SaveArgs.SaveField[]
                    {
                        new SaveArgs.SaveField()
                        {
                            ID = Constants.FieldsIds.RequestedSearch.PromoPageId,
                            Value = string.Empty
                        }
                    }
                }
            };

            processor.When(x => x.Alert(Arg.Any<string>())).DoNotCallBase();

            // Act
            processor.Process(saveArgs);

            // Assert
            processor.Received().Alert(Arg.Any<string>());
            saveArgs.Aborted.Should().BeFalse();
        }

        [Fact]
        public void Process_ShouldNotThrowAlert_IfPromoPageFieldIsNotEmpty()
        {
            // Arrange
            var fakeItem = new FakeItem()
                .WithTemplate(Constants.TemplateIds.RequestedSearch)
                .WithField(Constants.Fields.RequestedSearch.PromoPage, ID.NewID.ToString())
                .ToSitecoreItem();

            fakeItem.Database.GetItem(Arg.Any<ID>(), Arg.Any<Language>()).Returns(fakeItem);
            databaseProvider.GetDatabase(Arg.Any<DatabaseType>()).Returns(fakeItem.Database);

            var xmlDocument = Substitute.For<XmlDocument>();
            var saveArgs = new SaveArgs(xmlDocument);
            saveArgs.Items = new SaveArgs.SaveItem[]
            {
                new SaveArgs.SaveItem()
                {
                    ID = fakeItem.ID,
                    Fields = new SaveArgs.SaveField[]
                    {
                        new SaveArgs.SaveField()
                        {
                            ID = Constants.FieldsIds.RequestedSearch.PromoPageId,
                            Value = string.Empty
                        }
                    }
                }
            };

            processor.When(x => x.Alert(Arg.Any<string>())).DoNotCallBase();

            // Act
            processor.Process(saveArgs);

            // Assert
            processor.DidNotReceive().Alert(Arg.Any<string>());
            saveArgs.Aborted.Should().BeFalse();
        }
    }
}
