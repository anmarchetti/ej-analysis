using Sitecore;
using Sitecore.Data.Items;

namespace easyJet.Foundation.SiteModes.Models.Domain
{
    public class NoMarketingModeSettings
    {
        public NoMarketingModeSettings(Item item)
        {
            if (item != null)
            {
                Title = item.Fields[Constants.Fields.NoMarketingModeSettings.Title].Value;
                SelectingLanguageTitle = item.Fields[Constants.Fields.NoMarketingModeSettings.SelectingLanguageTitle].Value;
                SelectingLanguageDescription = item.Fields[Constants.Fields.NoMarketingModeSettings.SelectingLanguageDescription].Value;
                StagingButtonText = item.Fields[Constants.Fields.NoMarketingModeSettings.StagingButtonText].Value;
                ConfirmChangesCheckBoxText = item.Fields[Constants.Fields.NoMarketingModeSettings.ConfirmChangesCheckBoxText].Value;
                PublishToLiveButtonText = item.Fields[Constants.Fields.NoMarketingModeSettings.PublishToLiveButtonText].Value;
                StagingTitle = item.Fields[Constants.Fields.NoMarketingModeSettings.StagingTitle].Value;
                StagingDescription = item.Fields[Constants.Fields.NoMarketingModeSettings.StagingDescription].Value;
                LiveTitle = item.Fields[Constants.Fields.NoMarketingModeSettings.LiveTitle].Value;
                LiveDescription = item.Fields[Constants.Fields.NoMarketingModeSettings.LiveDescription].Value;
                SelectedLanguagesStatusText = item.Fields[Constants.Fields.NoMarketingModeSettings.SelectedLanguagesStatusText].Value;
            }
        }

        public string Title { get; set; }

        public string SelectingLanguageTitle { get; set; }

        public string SelectingLanguageDescription { get; set; }

        public string StagingButtonText { get; set; }

        public string ConfirmChangesCheckBoxText { get; set; }

        public string PublishToLiveButtonText { get; set; }

        public string StagingTitle { get; set; }

        public string StagingDescription { get; set; }

        public string LiveTitle { get; set; }

        public string LiveDescription { get; set; }

        public string SelectedLanguagesStatusText { get; set; }
    }
}