using System.Xml;
using easyJet.Feature.PageContent.Pipelines.SaveUI;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.FakeDb;
using Sitecore.Globalization;
using Sitecore.Pipelines.Save;
using Xunit;

namespace easyJet.Feature.PageContent.Tests.Pipelines.SaveUI
{
    public class HolidaysUnderPillsValidationProcessTests
    {
        private readonly HolidaysUnderPillsValidationProcess processor;

        public HolidaysUnderPillsValidationProcessTests()
        {
            processor = new HolidaysUnderPillsValidationProcess();
        }

        [Fact]
        public void Process_ShouldProcessProcessSaveItem_IfSaveItemIsValid()
        {
            // Arrange
            var id = ID.NewID;

            using (Db db = new Db
            {
                new DbItem("Holiday Under Folder", id, Constants.TemplateIds.HolidaysUnderFolder)
            })
            {
                var xmlDocument = Substitute.For<XmlDocument>();
                var saveArgs = new SaveArgs(xmlDocument)
                {
                    Items = new SaveArgs.SaveItem[]
                    {
                        new SaveArgs.SaveItem()
                        {
                            ID = id,
                            Fields = new SaveArgs.SaveField[]
                            {
                                new SaveArgs.SaveField()
                                {
                                    ID = Constants.FieldIds.HolidaysUnderFolder.Pills,
                                    OriginalValue = string.Empty,
                                    Value = ID.NewID.ToString()
                                }
                            },
                            Language = Language.Current
                        }
                    }
                };

                // Act
                processor.Process(saveArgs);

                // Assert
                saveArgs.Aborted.Should().BeFalse();
            }
        }
    }
}
