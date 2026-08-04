using System.Diagnostics.CodeAnalysis;

namespace easyJet.Foundation.AmazonSecurityToken
{
    [ExcludeFromCodeCoverage]
    public struct Constants
    {
        /// <summary>
        /// Session duration in seconds (15 minutes is the minimum accepted value)
        /// </summary>
        public const int DefaultSessionDuration = 900;

        public const string VpcEndpoint = "AmazonSts.Vpc.Endpoint";
    }
}