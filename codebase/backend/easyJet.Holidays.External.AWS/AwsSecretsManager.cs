using Amazon.SecretsManager;
using Amazon.SecretsManager.Model;

using Newtonsoft.Json;
using System.Text.Json.Nodes;

namespace easyJet.Holidays.External.AWS
{
    public class AwsSecretsManager
    {
        /// <summary>
        /// Get aws secret deserialized to concrete T class
        /// </summary>
        /// <param name="secretName"></param>
        /// <param name="serviceUrl">VPC Endpoint</param>
        /// <returns></returns>
        // We don't handle any exception on purpose, because we will use it inside aws lambda functions
        // Lambda functions can't work without secret values and if an exception occurs, Devops guys will get an email and be able to fix it.
        public static async Task<T> GetSecretAsync<T>(string secretName, string serviceUrl) where T : class
        {
            if (string.IsNullOrWhiteSpace(secretName))
                throw new ArgumentNullException($"{nameof(secretName)} cannot be null or empty", nameof(secretName));
            if (string.IsNullOrWhiteSpace(serviceUrl))
                throw new ArgumentNullException($"{nameof(serviceUrl)} cannot be null or empty", nameof(serviceUrl));

            using (var client = new AmazonSecretsManagerClient(new AmazonSecretsManagerConfig()
            {
                ServiceURL = serviceUrl
            }))
            {
                return await GetSecretValue<T>(secretName, client);
            }
        }

        /// <summary>
        /// Gets the secret value by secret key asynchronous.
        /// </summary>
        /// <param name="secretName">Name of the secret.</param>
        /// <param name="secretKey">The secret key.</param>
        /// <param name="serviceUrl">The service URL.</param>
        /// <returns>Secret value.</returns>
        public static async Task<string> GetSecretAsync(string secretName, string secretKey, string serviceUrl)
        {
            var client = new AmazonSecretsManagerClient(new AmazonSecretsManagerConfig()
            {
                ServiceURL = serviceUrl
            });

            var secret = await GetSecret(secretName, client);

            var secrets = JsonObject.Parse(secret);

            var secretValue = secrets[secretKey].ToString();

            return secretValue;
        }

        private static async Task<T> GetSecretValue<T>(string secretName, AmazonSecretsManagerClient client) where T : class
        {
            string secret = await RequestSecret(secretName, client);

            var deserializeObject = JsonConvert.DeserializeObject<T>(secret);

            return deserializeObject;
        }

        private static async Task<string> GetSecret(string secretName, AmazonSecretsManagerClient client)
        {
            string secret = await RequestSecret(secretName, client);

            return secret;
        }

        private static async Task<string> RequestSecret(string secretName, AmazonSecretsManagerClient client)
        {
            var getSecretValueRequest = new GetSecretValueRequest() { SecretId = secretName };

            var getSecretValueResponse = await client.GetSecretValueAsync(getSecretValueRequest);

            string secret;

            // Decrypts secret using the associated KMS CMK.
            // Depending on whether the secret is a string or binary, one of these fields will be populated.
            if (getSecretValueResponse.SecretString != null)
            {
                secret = getSecretValueResponse.SecretString;
            }
            else
            {
                var binarySecret = getSecretValueResponse.SecretBinary.ToString();
                secret = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(binarySecret));
            }

            if (string.IsNullOrEmpty(secret))
            {
                throw new ArgumentException($"Failed to get secret: {secretName}");
            }

            return secret;
        }
    }
}