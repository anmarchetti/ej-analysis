using System.Collections.Generic;
using easyJet.Feature.Tracker.Models.Dflo;

namespace easyJet.Feature.Tracker.Tests.Services
{
    public class DfloServiceTestsData
    {
        public static IEnumerable<object[]> InvalidDfloSettings()
        {
            yield return new object[]
            {
                new DfloSettings
                {
                    Endpoint = null,
                    Account = "someAccountName",
                    Password = "1234",
                    SkipSslVerification = true
                }
            };

            yield return new object[]
            {
                new DfloSettings
                {
                    Endpoint = string.Empty,
                    Account = "someAccountName",
                    Password = "1234",
                    SkipSslVerification = false
                }
            };

            yield return new object[]
            {
                new DfloSettings
                {
                    Endpoint = "anyEndpoint",
                    Account = null,
                    Password = "1234",
                    SkipSslVerification = false
                }
            };

            yield return new object[]
            {
                new DfloSettings
                {
                    Endpoint = "anyEndpoint",
                    Account = string.Empty,
                    Password = "1234",
                    SkipSslVerification = false
                }
            };

            yield return new object[]
            {
                new DfloSettings
                {
                    Endpoint = "anyEndpoint",
                    Account = "someAccountName",
                    Password = null,
                    SkipSslVerification = false
                }
            };

            yield return new object[]
            {
                new DfloSettings
                {
                    Endpoint = "anyEndpoint",
                    Account = "someAccountName",
                    Password = string.Empty,
                    SkipSslVerification = false
                }
            };
        }
    }
}