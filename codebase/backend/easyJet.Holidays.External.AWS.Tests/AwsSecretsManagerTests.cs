using Xunit;

namespace easyJet.Holidays.External.AWS.Tests
{
    public class AwsSecretsManagerTests
    {
        [Fact]
        public async Task GetSecretAsync_SecretNameNullOrEmpty_ThrowsArgumentNull()
        {
            // Arrange
            var secretName = string.Empty;
            var serviceUrl = string.Empty;

            // Act
            Func<Task> action = async () => await AwsSecretsManager.GetSecretAsync<object>(secretName, serviceUrl);

            // Assert
            var exc = await Assert.ThrowsAsync<ArgumentNullException>(action);
        }

        [Fact]
        public async Task GetSecretAsync_ServiceURLNullOrEmpty_ThrowsArgumentNull()
        {
            // Arrange
            var secretName = "testSecret123";
            var serviceUrl = string.Empty;

            // Act
            Func<Task> action = async () => await AwsSecretsManager.GetSecretAsync<object>(secretName, serviceUrl);

            // Assert
            var exc = await Assert.ThrowsAsync<ArgumentNullException>(action);
        }

        [Fact]
        public async Task GetSecretAsync_ClientNull_ThrowsArgumentNull()
        {
            // Arrange
            var secretName = "testSecret123";
            var serviceUrl = string.Empty;

            // Act
            Func<Task> action = async () => await AwsSecretsManager.GetSecretAsync<object>(secretName, serviceUrl);

            // Assert
            var exc = await Assert.ThrowsAsync<ArgumentNullException>(action);
        }
    }
}
