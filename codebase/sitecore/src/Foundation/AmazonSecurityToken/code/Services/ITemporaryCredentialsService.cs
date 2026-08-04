using Amazon;
using Amazon.SecurityToken.Model;

namespace easyJet.Foundation.AmazonSecurityToken.Services
{
    public interface ITemporaryCredentialsService
    {
        Credentials GetCredentials(string roleArn, RegionEndpoint region, int sessionDuration, string sessionName);
    }
}