using System.Collections.Specialized;
using easyJet.Foundation.Analytics.Pipelines.Geolocation;
using easyJet.Foundation.Analytics.Services;
using NSubstitute;
using Sitecore.CES.Client;
using Sitecore.CES.Discovery;
using Sitecore.CES.GeoIp;
using Sitecore.CES.GeoIp.Core.Model;
using Sitecore.CES.GeoIp.IpFiltering;
using Xunit;
using WebClient = Sitecore.CES.Client.WebClient;

namespace easyJet.Foundation.Analytics.Tests.Pipelines.Geolocation
{
    public class GoogleLookupProviderTests
    {
        private readonly IGeoCodingApiClient geoCodingApiClient;
        private readonly IIpFilter ipFilter;
        private readonly GoogleLookupProvider provider;

        public GoogleLookupProviderTests()
        {
            geoCodingApiClient = Substitute.For<IGeoCodingApiClient>();
            ipFilter = Substitute.For<IIpFilter>();
            provider = new GoogleLookupProviderMock(geoCodingApiClient, new ResourceConnectorMock(), ipFilter, new EndpointSourceMock());
        }

        [Fact]
        public void IsInKnownRange_MakeCallToGoogleApiCall_Success()
        {
            provider.GetWhoIsInformationByIp("185.157.230.85");
            geoCodingApiClient.Received(1).GetPostalTown(Arg.Any<string>(), Arg.Any<string>());
        }

        private static WebClient GetWebClient() => new WebClient(new WebRequestFactory());

        private class GoogleLookupProviderMock : GoogleLookupProvider
        {
            private readonly IGeoCodingApiClient geoCodingApiClient;

            public GoogleLookupProviderMock(IGeoCodingApiClient geoCodingApiClient, ResourceConnector<WhoIsInformation> geoIpConnector, IIpFilter ipFilter)
                : base(geoCodingApiClient, geoIpConnector, ipFilter)
            {
            }

            public GoogleLookupProviderMock(IGeoCodingApiClient geoCodingApiClient, ResourceConnector<WhoIsInformation> geoIpConnector, IIpFilter ipFilter, EndpointSource endpointSource)
                : base(geoCodingApiClient, geoIpConnector, ipFilter, endpointSource)
            {
                this.geoCodingApiClient = geoCodingApiClient;
            }

            public override WhoIsInformation GetWhoIsInformationByIp(string ip)
            {
                var whoIsFormation = geoCodingApiClient.GetPostalTown(ip, ip);
                return new WhoIsInformation();
            }
        }

        private class ResourceConnectorMock : ResourceConnector<WhoIsInformation>
        {
            public ResourceConnectorMock()
                : base(GetWebClient(), new GeoIpResponseParser(), "test")
            {
            }

            public override WhoIsInformation Request(string endpoint, params object[] parameters) => new WhoIsInformation
            {
                Region = "test",
                City = "test",
            };
        }

        private class EndpointSourceMock : EndpointSource
        {
            public EndpointSourceMock()
                : base("test", new ResourceConnector<StringDictionary>(GetWebClient(), new DiscoveryResponseParser(), "test"))
            {
            }

            public override string GetEndpoint(string serviceName) => "test";
        }
    }
}
