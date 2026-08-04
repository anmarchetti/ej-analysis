using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using Amazon.SecretsManager;
using Amazon.SecretsManager.Model;
using Newtonsoft.Json;
using Sitecore.Configuration;
using Sitecore.Diagnostics;

namespace easyJet.Foundation.SitecoreExtensions.Utils
{
    [ExcludeFromCodeCoverage]
    public static class SecretsManager
    {
        private static readonly SecretsManagerCustomCache Cache;
        private static readonly string AwsSecretId;
        private static readonly string AwsServiceUrl;

        private static readonly AmazonSecretsManagerClient Client;

        static SecretsManager()
        {
            if (SecretsManagerDisabler.IsActive || SecretsManagerSwitcher.IsActive)
            {
                return;
            }

            try
            {
                AwsSecretId = Settings.GetSetting("AwsSecretsManager.SecretId");
                AwsServiceUrl = Settings.GetSetting("AwsSecretsManager.ServiceURL");
                var clientConfig = new AmazonSecretsManagerConfig
                {
                    ServiceURL = AwsServiceUrl
                };
                Client = new AmazonSecretsManagerClient(clientConfig);
                Cache = new SecretsManagerCustomCache();
            }
            catch (Exception e)
            {
                Log.Error($"Error while initializing {nameof(SecretsManager)} did you forget to configure the AWS credentials?", e, nameof(SecretsManager));
                throw;
            }
        }

        public static string GetSecret(string secretKey)
        {
            if (SecretsManagerSwitcher.IsActive)
            {
                if (SecretsManagerSwitcher.OverrideValues.TryGetValue(secretKey, out var secret))
                {
                    return secret;
                }
            }

            if (Cache == null)
            {
                return string.Empty;
            }

            var errorMessage = $"key '{secretKey}' not found at AWSSecretsManager at '{AwsServiceUrl}' with SecretId '{AwsSecretId}'";
            try
            {
                var dictionary = Cache.GetCachedSecret(AwsSecretId, () =>
                {
                    var cacheSecret = Client.GetSecretValue(new GetSecretValueRequest() { SecretId = AwsSecretId });
                    return JsonConvert.DeserializeObject<Dictionary<string, string>>(cacheSecret.SecretString);
                });

                if (dictionary.TryGetValue(secretKey, out var val))
                {
                    return val;
                }

                Log.Error(errorMessage, nameof(SecretsManager));
                throw new Exception(errorMessage);
            }
            catch (Exception ex)
            {
                Log.Error("An unexpected Error occurred. " + errorMessage, ex, nameof(SecretsManager));
                throw;
            }
        }
    }
}