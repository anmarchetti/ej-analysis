using easyJet.Holidays.Api.Domain.Settings;

namespace easyJet.Holidays.Api
{
    public class AwsSecretsManagerConfigurationSource : IConfigurationSource
    {
        private readonly AwsSettingsSecretsManager _settings;

        public AwsSecretsManagerConfigurationSource(AwsSettingsSecretsManager settings)
        {
            _settings = settings;
        }

        public IConfigurationProvider Build(IConfigurationBuilder builder)
        {
            var provider = new AwsSecretsManagerConfigurationProvider(_settings);
            return provider;
        }
    }
}
