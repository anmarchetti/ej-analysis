using AutoFixture.Xunit2;
using easyJet.Feature.ChangeTracking.Pipelines.getFieldValue;
using easyJet.Feature.ChangeTracking.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Sitecore.Pipelines.GetFieldValue;
using Xunit;

namespace easyJet.Feature.ChangeTracking.Tests.Services
{
    public class AddChangeTrackingEditorTabProcessorTests
    {
        private readonly AddChangeTrackingEditorTabProcessor sut;
        private readonly IChangeTrackingTrackerService changeTrackingTrackerService;
        private readonly GetFieldValueArgs fieldValueArgs;

        public AddChangeTrackingEditorTabProcessorTests()
        {
            changeTrackingTrackerService = Substitute.For<IChangeTrackingTrackerService>();
            fieldValueArgs = Substitute.For<GetFieldValueArgs>();
            sut = Substitute.ForPartsOf<AddChangeTrackingEditorTabProcessor>(changeTrackingTrackerService);
        }

        [Theory]
        [AutoData]
        public void Process_Adds_HistoryEditorTab_IF_ItemIsTracked(string fieldName)
        {
            // Arrange
            var item = new FakeItem(ID.NewID, FakeUtil.FakeDatabase("master"))
                .WithRuntimeSettings()
                .WithUri()
                .WithField(Constants.Ids.EditorsField, fieldName)
                .WithTemplate(ID.NewID);

            fieldValueArgs.Field = new Field(Constants.Ids.EditorsField, item);
            changeTrackingTrackerService.IsTracked(Arg.Any<Item>()).Returns(true);

            // Act
            sut.Process(fieldValueArgs);

            // Assert
            fieldValueArgs.Value.Should().Be(Constants.Ids.ChangeTrackingEditorTab.ToString());
        }

        [Theory]
        [AutoData]
        public void Process_Adds_HistoryEditorTab_IF_ItemIsNotTracked(string fieldName)
        {
            // Arrange
            var item = new FakeItem(ID.NewID, FakeUtil.FakeDatabase("master"))
                .WithRuntimeSettings()
                .WithUri()
                .WithField(Constants.Ids.EditorsField, fieldName)
                .WithTemplate(ID.NewID);

            fieldValueArgs.Field = new Field(Constants.Ids.EditorsField, item);
            changeTrackingTrackerService.IsTracked(Arg.Any<Item>()).Returns(false);

            // Act
            sut.Process(fieldValueArgs);

            // Assert
            fieldValueArgs.Value.Should().NotBe(Feature.ChangeTracking.Constants.Ids.ChangeTrackingEditorTab.ToString());
        }
    }
}