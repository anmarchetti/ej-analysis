using System.Collections.Generic;
using System.Linq;
using System.Net;
using easyJet.Foundation.Atcom.Logging;
using easyJet.Foundation.Atcom.Models.Domain;
using easyJet.Foundation.Atcom.Models.External;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using Newtonsoft.Json;
using Sitecore.Abstractions;

namespace easyJet.Foundation.Atcom.Services
{
    [Service(typeof(IVrpWebService), Lifetime = Lifetime.Singleton)]
    public class VrpWebService : AtcomService, IVrpWebService
    {
        private const string AccommodationHeaderCacheKey = "Atcom.Cache.VRPWebservice.Response";
        private const string SpecialRequestsCacheKey = "Atcom.Cache.VRPWebservice.GetSpecialRequests.Response";

        private const string RequestBody = @"<p1:AccommodationHeaderDataExportRequest 
                                                xmlns:p1=""AtComRes/MasterData/AccommodationHeaderDataExportRequest"" xmlns:p2=""AtComRes/Common""
                                                xmlns:xsi=""http://www.w3.org/2001/XMLSchema-instance"" 
                                                xsi:schemaLocation=""AtComRes/MasterData/AccommodationHeaderDataExportRequest 
                                                ../api/MasterData/AccommodationHeaderDataExport/AccommodationHeaderDataExportRequest.xsd""/>";

        private const string SpecialRequestBody = @"<p1:SpecialRequestDataExportRequest 
                                    xmlns:p1=""AtComRes/MasterData/SpecialRequestDataExportRequest"" 
                                    xmlns:xsi=""http://www.w3.org/2001/XMLSchema-instance""
                                    xsi:schemaLocation=""AtComRes/MasterData/SpecialRequestDataExportRequest ../api/MasterData/SpecialRequestDataExport/SpecialRequestDataExportRequest.xsd"" />";

        protected string Endpoint { get; set; }

        private int CacheTime { get; }

        public VrpWebService(IAtcomLogger logger, ICustomCacheRepository cache, BaseSettings settings)
            : base(logger, cache)
        {
            CacheTime = settings.GetIntSetting("Atcom.CacheExpiredInMinutes", 60);
            Endpoint = settings.GetSetting("Atcom.VRPWebserviceEndpoint");
        }

        /// <inheritdoc/>
        public Dictionary<string, AccommodationHeaderDataEntry> GetDataCollection()
        {
            var result = GetData<AccommodationHeaderDataExportResponse, Dictionary<string, AccommodationHeaderDataEntry>>(Endpoint, RequestBody, AccommodationHeaderCacheKey, CacheTime, response =>
            {
                if (response?.AccommodationHeaderDataEntry == null || !response.AccommodationHeaderDataEntry.Any())
                {
                    return null;
                }

                Logger.Debug($"Response: {response.AccommodationHeaderDataEntry.Length} items was retrieved", this);

                var vrpDataByCode = response.AccommodationHeaderDataEntry.Where(x => !string.IsNullOrWhiteSpace(x.Acc_Cd))
                    .GroupBy(x => x.Acc_Cd)
                    .ToDictionary(x => x.Key, y => y.FirstOrDefault());

                return vrpDataByCode;
            });

            return result;
        }

        /// <inheritdoc/>
        public List<SpecialRequestType> GetSpecialRequests()
        {
            var result = GetData<SpecialRequestDataExportResponse, List<SpecialRequestType>>(Endpoint, SpecialRequestBody, SpecialRequestsCacheKey, CacheTime, response =>
            {
                if (response?.SpecialRequestType == null || !response.SpecialRequestType.Any())
                {
                   return null;
                }

                Logger.Debug($"Response: {JsonConvert.SerializeObject(response.SpecialRequestType)}", this);

                var specialRequests = response.SpecialRequestType.Select(type => new SpecialRequestType(type.TypeCode, type.Desc)
                {
                    SpecialRequests = type.SpecialRequest.Select(request => new Models.DataObject(request.Code, request.Desc))
                });

                return specialRequests.ToList();
            });

            return result;
        }

        /// <inheritdoc/>
        protected override WebClient GetWebClient()
        {
            var client = base.GetWebClient();
            client.Headers.Add(HttpRequestHeader.ContentType, "text/xml;charset=utf-8");
            return client;
        }
    }
}