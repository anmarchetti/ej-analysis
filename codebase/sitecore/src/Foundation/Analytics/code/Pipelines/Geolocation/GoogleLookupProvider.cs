using easyJet.Foundation.Analytics.Services;
using Sitecore.CES.Client;
using Sitecore.CES.Discovery;
using Sitecore.CES.GeoIp;
using Sitecore.CES.GeoIp.Core.Model;
using Sitecore.CES.GeoIp.IpFiltering;

namespace easyJet.Foundation.Analytics.Pipelines.Geolocation
{
    public class GoogleLookupProvider : SitecoreProvider
    {
        private readonly IGeoCodingApiClient geoCodingApiClient;

        public GoogleLookupProvider(IGeoCodingApiClient geoCodingApiClient, ResourceConnector<WhoIsInformation> geoIpConnector, IIpFilter ipFilter)
            : this(geoCodingApiClient, geoIpConnector, ipFilter, DiscoveryDefaults.Instance.GetEndpointSource())
        {
        }

        public GoogleLookupProvider(IGeoCodingApiClient geoCodingApiClient, ResourceConnector<WhoIsInformation> geoIpConnector, IIpFilter ipFilter, EndpointSource endpointSource)
            : base(geoIpConnector, ipFilter, endpointSource)
        {
            this.geoCodingApiClient = geoCodingApiClient;
        }

        public override WhoIsInformation GetWhoIsInformationByIp(string ip)
        {
            var whoIsInfo = base.GetWhoIsInformationByIp(ip);

            if (whoIsInfo.GetType() != typeof(FilteredWhoIsInformation))
            {
                whoIsInfo.City = geoCodingApiClient.GetPostalTown(whoIsInfo.Latitude.ToString(), whoIsInfo.Longitude.ToString());
            }

            return whoIsInfo;
        }
    }
}