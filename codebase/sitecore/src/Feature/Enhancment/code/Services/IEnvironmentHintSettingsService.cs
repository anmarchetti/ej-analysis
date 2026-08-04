namespace easyJet.Feature.SitecoreEnhancment.Services
{
    public interface IEnvironmentHintSettingsService
    {
        string FontColor { get; }

        string BackgroundColor { get; }

        string Paths { get; }

        string EnvironmentName { get; }
    }
}