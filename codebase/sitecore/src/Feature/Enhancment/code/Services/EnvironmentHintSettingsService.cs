using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using Sitecore.Abstractions;

namespace easyJet.Feature.SitecoreEnhancment.Services
{
    [Service(typeof(IEnvironmentHintSettingsService), Lifetime = Lifetime.Singleton)]
    public class EnvironmentHintSettingsService : IEnvironmentHintSettingsService
    {
        private readonly BaseSettings baseSettings;
        private string fontColor;
        private string backgroundColor;
        private string paths;
        private string environmentName;

        public EnvironmentHintSettingsService(BaseSettings baseSettings)
        {
            this.baseSettings = baseSettings;
        }

        public string FontColor => fontColor ?? (fontColor = baseSettings.GetSetting(Constants.EnvironmentHint.EnvironmentHintFontColorSettingsName));

        public string BackgroundColor => backgroundColor ?? (backgroundColor = baseSettings.GetSetting(Constants.EnvironmentHint.EnvironmentHintBackgroundColorSettingsName));

        public string Paths => paths ?? (paths = baseSettings.GetSetting(Constants.EnvironmentHint.EnvironmentHintPathsSettingsName));

        public string EnvironmentName => environmentName ?? (environmentName = baseSettings.GetSetting(Constants.EnvironmentHint.EnvironmentHintEnvironmentNameSettingsName));
    }
}
