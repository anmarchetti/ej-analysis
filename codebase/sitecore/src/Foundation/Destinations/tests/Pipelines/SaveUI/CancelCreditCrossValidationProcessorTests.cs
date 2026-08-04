using System.Linq;
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
    public class CancelCreditCrossValidationProcessorTests
    {
        private readonly CancelCreditCrossValidationProcessor processor;
        private readonly IDatabaseProvider databaseProvider;

        public CancelCreditCrossValidationProcessorTests()
        {
            databaseProvider = Substitute.For<IDatabaseProvider>();
            processor = Substitute.ForPartsOf<CancelCreditCrossValidationProcessor>(databaseProvider);
        }

        [Theory]
        [AutoData]
        public void Process_ShouldProcessSaveItem_IfSaveItemDataIsValid(Db db)
        {
            // Arrange
            var airportsFolderDbItem = new DbItem("Airports");
            var aiportOneDbItem = new DbItem("Airport 1");
            var aiportTwoDbItem = new DbItem("Airport 2");
            airportsFolderDbItem.Children.Add(aiportOneDbItem);
            airportsFolderDbItem.Children.Add(aiportTwoDbItem);
            db.Add(airportsFolderDbItem);

            var cancelAndCreditRulesFolderDbItem = new DbItem("Cancel And Credit Rules");

            var cancelAndCreditRuleOneDbItem = new DbItem("Cancel And Credit Rule 1", ID.NewID, Constants.TemplateIds.CancelCreditRule);
            cancelAndCreditRuleOneDbItem.Fields.Add(new DbField(Constants.Fields.BaseCreditSetting.DestinationAirports, Constants.FieldsIds.CancelCreditSetting.DestinationAirportsId) { Value = aiportOneDbItem.ID.ToString() });

            var cancelAndCreditRuleTwoDbItem = new DbItem("Cancel And Credit Rule 2", ID.NewID, Constants.TemplateIds.CancelCreditRule);
            cancelAndCreditRuleTwoDbItem.Fields.Add(new DbField(Constants.Fields.BaseCreditSetting.DestinationAirports, Constants.FieldsIds.CancelCreditSetting.DestinationAirportsId) { Value = aiportOneDbItem.ID.ToString() });

            cancelAndCreditRulesFolderDbItem.Children.Add(cancelAndCreditRuleOneDbItem);
            cancelAndCreditRulesFolderDbItem.Children.Add(cancelAndCreditRuleTwoDbItem);
            db.Add(cancelAndCreditRulesFolderDbItem);

            var xmlDocument = Substitute.For<XmlDocument>();
            var saveArgs = new SaveArgs(xmlDocument);
            saveArgs.Items = new SaveArgs.SaveItem[]
            {
                new SaveArgs.SaveItem()
                {
                    ID = cancelAndCreditRuleTwoDbItem.ID,
                    Fields = db.GetItem(cancelAndCreditRuleTwoDbItem.ID)
                    .Fields
                    .Select(x => new SaveArgs.SaveField()
                    {
                        ID = x.ID,
                        OriginalValue = x.Value,
                        Value = aiportTwoDbItem.ID.ToString()
                    }).ToArray(),
                    Language = Language.Current
                }
            };

            databaseProvider.GetDatabase(DatabaseType.Content).Returns(db.Database);

            // Act
            processor.Process(saveArgs);

            // Assert
            saveArgs.Aborted.Should().BeFalse();
        }

        [Theory]
        [AutoData]
        public void Process_ShouldBeAborted_IfAirportIsCurrentlyAdded(Db db)
        {
            // Arrange
            var airportsFolderDbItem = new DbItem("Airports");
            var aiportOneDbItem = new DbItem("Airport 1");
            var aiportTwoDbItem = new DbItem("Airport 2");
            airportsFolderDbItem.Children.Add(aiportOneDbItem);
            airportsFolderDbItem.Children.Add(aiportTwoDbItem);
            db.Add(airportsFolderDbItem);

            var cancelAndCreditRulesFolderDbItem = new DbItem("Cancel And Credit Rules");

            var cancelAndCreditRuleOneDbItem = new DbItem("Cancel And Credit Rule 1", ID.NewID, Constants.TemplateIds.CancelCreditRule);
            cancelAndCreditRuleOneDbItem.Fields.Add(new DbField(Constants.Fields.BaseCreditSetting.DestinationAirports, Constants.FieldsIds.CancelCreditSetting.DestinationAirportsId) { Value = aiportOneDbItem.ID.ToString() });

            var cancelAndCreditRuleTwoDbItem = new DbItem("Cancel And Credit Rule 2", ID.NewID, Constants.TemplateIds.CancelCreditRule);
            cancelAndCreditRuleTwoDbItem.Fields.Add(new DbField(Constants.Fields.BaseCreditSetting.DestinationAirports, Constants.FieldsIds.CancelCreditSetting.DestinationAirportsId) { Value = aiportOneDbItem.ID.ToString() });

            var cancelAndCreditRuleTreeDbItem = new DbItem("Cancel And Credit Rule 3", ID.NewID, Constants.TemplateIds.CancelCreditRule);
            cancelAndCreditRuleTreeDbItem.Fields.Add(new DbField(Constants.Fields.BaseCreditSetting.DestinationAirports, Constants.FieldsIds.CancelCreditSetting.DestinationAirportsId) { Value = aiportOneDbItem.ID.ToString() });

            cancelAndCreditRulesFolderDbItem.Children.Add(cancelAndCreditRuleOneDbItem);
            cancelAndCreditRulesFolderDbItem.Children.Add(cancelAndCreditRuleTwoDbItem);
            cancelAndCreditRulesFolderDbItem.Children.Add(cancelAndCreditRuleTreeDbItem);
            db.Add(cancelAndCreditRulesFolderDbItem);

            var xmlDocument = Substitute.For<XmlDocument>();
            var saveArgs = new SaveArgs(xmlDocument);
            saveArgs.Items = new SaveArgs.SaveItem[]
            {
                new SaveArgs.SaveItem()
                {
                    ID = cancelAndCreditRuleTwoDbItem.ID,
                    Fields = db.GetItem(cancelAndCreditRuleTwoDbItem.ID)
                    .Fields
                    .Select(x => new SaveArgs.SaveField()
                    {
                        ID = x.ID,
                        OriginalValue = x.Value,
                        Value = aiportOneDbItem.ID.ToString()
                    }).ToArray(),
                    Language = Language.Current
                }
            };

            databaseProvider.GetDatabase(DatabaseType.Content).Returns(db.Database);

            processor.When(x => x.Alert(Arg.Any<string>())).DoNotCallBase();

            // Act
            processor.Process(saveArgs);

            // Assert
            saveArgs.Aborted.Should().BeTrue();
        }
    }
}
