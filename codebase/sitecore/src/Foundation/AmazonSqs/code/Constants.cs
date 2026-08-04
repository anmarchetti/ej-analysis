using System.Diagnostics.CodeAnalysis;

namespace easyJet.Foundation.AmazonSqs
{
    [ExcludeFromCodeCoverage]
    public struct Constants
    {
        public const string VpcEndpoint = "AmazonSqs.Vpc.Endpoint";
        public const int MaxNumberOfMessagesPerBatch = 10;
    }
}