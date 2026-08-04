using System;
using Amazon;
using Amazon.SecurityToken;
using Amazon.SecurityToken.Model;
using easyJet.Foundation.AmazonSecurityToken.Logging;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using Sitecore.Abstractions;

namespace easyJet.Foundation.AmazonSecurityToken.Services
{
    [Service(typeof(ITemporaryCredentialsService), Lifetime = Lifetime.Transient)]
    public class TemporaryTemporaryCredentialsService : ITemporaryCredentialsService
    {
        private readonly IAmazonSecurityTokenLogger logger;
        private readonly BaseSettings settings;

        public TemporaryTemporaryCredentialsService(IAmazonSecurityTokenLogger logger, BaseSettings settings)
        {
            this.logger = logger;
            this.settings = settings;
        }

        public Credentials GetCredentials(string roleArn, RegionEndpoint region, int sessionDuration, string sessionName)
        {
            if (string.IsNullOrEmpty(roleArn))
            {
                throw new ArgumentNullException(nameof(roleArn));
            }

            if (!Arn.IsArn(roleArn))
            {
                throw new ArgumentException("Arn is not valid", nameof(roleArn));
            }

            if (region == null)
            {
                throw new ArgumentNullException(nameof(region));
            }

            if (sessionDuration < Constants.DefaultSessionDuration)
            {
                throw new ArgumentOutOfRangeException(nameof(sessionDuration));
            }

            if (string.IsNullOrEmpty(sessionName))
            {
                throw new ArgumentNullException(nameof(sessionName));
            }

            var serviceUrl = settings.GetSetting(Constants.VpcEndpoint);

            try
            {
                var config = string.IsNullOrEmpty(serviceUrl)
                    ? new AmazonSecurityTokenServiceConfig { RegionEndpoint = region }
                    : new AmazonSecurityTokenServiceConfig { ServiceURL = serviceUrl };

                using (var client = new AmazonSecurityTokenServiceClient(config))
                {
                    var request = new AssumeRoleRequest
                    {
                        DurationSeconds = sessionDuration,
                        RoleSessionName = sessionName,
                        RoleArn = roleArn
                    };

                    var result = client.AssumeRole(request);
                    return result?.Credentials;
                }
            }
            catch (Exception ex)
            {
                logger.Error($"{nameof(GetCredentials)}", ex, this);
                return null;
            }
        }
    }
}
