using AutoFixture;
using AutoFixture.Xunit2;
using easyJet.Foundation.SiteModes.Models.Domain;
using FluentAssertions;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.SiteModes.Tests.Domain
{
    public class NoMarketingModeSettingsTests
    {
        private readonly Fixture fixture;
        private readonly Db db;

        public NoMarketingModeSettingsTests()
        {
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
        }

        [Fact]
        public void NoMarketingModeSettingsConstructor_ShouldNotSetValues_IfItemNull()
        {
            // Act
            var actual = new NoMarketingModeSettings(null);

            // Assert
            actual.Title.Should().BeNull();
        }

        [Theory]
        [AutoData]
        public void NoMarketingModeSettingsConstructor_ShouldSetValues_IfItemNotNull(
            string title,
            string selectingLanguageTitle,
            string selectingLanguageDescription,
            string stagingButtonText,
            string confirmChangesCheckBoxText,
            string publishToLiveButtonText,
            string stagingTitle,
            string stagingDescription,
            string liveTitle,
            string liveDescription,
            string selectedLanguagesStatusText)
        {
            // Arrange
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            item.Fields.Add(Constants.Fields.NoMarketingModeSettings.Title, title);
            item.Fields.Add(Constants.Fields.NoMarketingModeSettings.SelectingLanguageTitle, selectingLanguageTitle);
            item.Fields.Add(Constants.Fields.NoMarketingModeSettings.SelectingLanguageDescription, selectingLanguageDescription);
            item.Fields.Add(Constants.Fields.NoMarketingModeSettings.StagingButtonText, stagingButtonText);
            item.Fields.Add(Constants.Fields.NoMarketingModeSettings.ConfirmChangesCheckBoxText, confirmChangesCheckBoxText);
            item.Fields.Add(Constants.Fields.NoMarketingModeSettings.PublishToLiveButtonText, publishToLiveButtonText);
            item.Fields.Add(Constants.Fields.NoMarketingModeSettings.StagingTitle, stagingTitle);
            item.Fields.Add(Constants.Fields.NoMarketingModeSettings.StagingDescription, stagingDescription);
            item.Fields.Add(Constants.Fields.NoMarketingModeSettings.LiveTitle, liveTitle);
            item.Fields.Add(Constants.Fields.NoMarketingModeSettings.LiveDescription, liveDescription);
            item.Fields.Add(Constants.Fields.NoMarketingModeSettings.SelectedLanguagesStatusText, selectedLanguagesStatusText);

            db.Add(item);

            // Act
            var actual = new NoMarketingModeSettings(db.GetItem(item.ID));

            // Assert
            actual.Title.Should().BeEquivalentTo(title);
            actual.SelectingLanguageTitle.Should().BeEquivalentTo(selectingLanguageTitle);
            actual.SelectingLanguageDescription.Should().BeEquivalentTo(selectingLanguageDescription);
            actual.StagingButtonText.Should().BeEquivalentTo(stagingButtonText);
            actual.ConfirmChangesCheckBoxText.Should().BeEquivalentTo(confirmChangesCheckBoxText);
            actual.PublishToLiveButtonText.Should().BeEquivalentTo(publishToLiveButtonText);
            actual.StagingTitle.Should().BeEquivalentTo(stagingTitle);
            actual.StagingDescription.Should().BeEquivalentTo(stagingDescription);
            actual.LiveTitle.Should().BeEquivalentTo(liveTitle);
            actual.LiveDescription.Should().BeEquivalentTo(liveDescription);
            actual.SelectedLanguagesStatusText.Should().BeEquivalentTo(selectedLanguagesStatusText);
        }
    }
}
