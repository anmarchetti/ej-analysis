using System.Xml;
using AutoFixture.Xunit2;
using easyJet.Feature.PageContent.Pipelines.SaveUI;
using easyJet.Feature.PageContent.Tests.Models;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.FakeDb;
using Sitecore.Globalization;
using Sitecore.Pipelines.Save;
using Xunit;

namespace easyJet.Feature.PageContent.Tests.Pipelines.SaveUI
{
    public class HealthEntryRequirementValidationProccessTests
    {
        private readonly HealthEntryRequirementValidationProccess processor;

        public HealthEntryRequirementValidationProccessTests()
        {
            processor = new HealthEntryRequirementValidationProccess();
        }

        [Theory]
        [AutoData]
        public void Process_ShouldProcessProccessSaveItem_IfSaveItemIsValid(
            string airportCode,
            ID airportItemId,
            ID blockId,
            ID requirementTile1,
            ID requirementTile7)
        {
            // Arrange
            string healthRequirements = $"{requirementTile1}|{requirementTile7}";
            using (Db db = new Db
            {
                new DbItem("Data")
                {
                    new DbItem("Health Entry Requirement", ID.NewID, Constants.TemplateIds.HealthEntryRequirementFolder)
                    {
                        new HealthRequirementBlockDbItem("Health Entry Requirement Block 1", blockId)
                        {
                            new HealthRequirementTileDbItem("Health Entry Requirement Tile 1", requirementTile1),
                            new HealthRequirementTileDbItem("Health Entry Requirement Tile 2")
                        },
                        new HealthRequirementBlockDbItem("Health Entry Requirement Block 2")
                        {
                            new HealthRequirementTileDbItem("Health Entry Requirement Tile 4"),
                        },
                        new HealthRequirementBlockDbItem(airportItemId.ToString(), healthRequirements, "Health Entry Requirement Block Defualt")
                        {
                            new HealthRequirementTileDbItem("Health Entry Requirement Tile 7", requirementTile7),
                        }
                    }
                },
                new DbItem("Airport", airportItemId)
                {
                    new DbField("Code")
                    {
                        Value = airportCode
                    }
                }
            })
            {
                var xmlDocument = Substitute.For<XmlDocument>();
                var saveArgs = new SaveArgs(xmlDocument)
                {
                    Items = new SaveArgs.SaveItem[]
                    {
                        new SaveArgs.SaveItem()
                        {
                            ID = blockId,
                            Fields = new SaveArgs.SaveField[]
                            {
                                new SaveArgs.SaveField()
                                {
                                    ID = Constants.FieldIds.HealthEntryRequirementsBlock.Airports,
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
