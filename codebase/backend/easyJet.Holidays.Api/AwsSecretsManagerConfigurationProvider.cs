using Amazon.SecretsManager;
using easyJet.Holidays.Api.Domain.Settings;
using NLog.Web;

namespace easyJet.Holidays.Api
{
    public class AwsSecretsManagerConfigurationProvider : ConfigurationProvider
    {
        private readonly AwsSettingsSecretsManager _settings;
        private const string awsSectionSeparator = "__";
        private const string appConfigSectionSeparator = ":";

        public AwsSecretsManagerConfigurationProvider(AwsSettingsSecretsManager settings)
        {
            _settings = settings;
        }

        public override void Load()
        {
            try
            {
                // credentials are picked up from env variables or IAM roles: https://docs.aws.amazon.com/sdk-for-net/v3/developer-guide/creds-assign.html
                var config = new AmazonSecretsManagerConfig { ServiceURL = _settings.ServiceUrl };

                using (var client = new AmazonSecretsManagerClient(config))
                {
                    foreach (var secret in _settings.Secrets)
                    {
                        var request = new Amazon.SecretsManager.Model.GetSecretValueRequest { SecretId = secret };
                        var res = client.GetSecretValueAsync(request).Result;
                        var json = Newtonsoft.Json.JsonConvert.DeserializeObject<Dictionary<string, string>>(res.SecretString);

                        foreach (var keyValuePair in json)
                        {
                            var destination = keyValuePair.Key.Replace(awsSectionSeparator, appConfigSectionSeparator);
                            Data[destination] = keyValuePair.Value;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                var logger = NLogBuilder.ConfigureNLog("NLog.config").GetCurrentClassLogger();
                logger.Error(ex, "Error loading configuration from AWS secrets manager");
                throw;
            }
        }
    }
}