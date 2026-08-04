using System;
using Amazon.SecurityToken.Model;

namespace easyJet.Foundation.AmazonSecurityToken.Extensions
{
    public static class CredentialsExtensions
    {
        public static bool Expired(this Credentials credentials)
        {
            if (credentials == null)
            {
                return true;
            }

            if (credentials.Expiration == DateTime.MinValue)
            {
                return true;
            }

            var diff = credentials.Expiration - DateTime.UtcNow;
            return diff <= TimeSpan.FromMinutes(1);
        }
    }
}
