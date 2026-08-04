using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Xml.Serialization;
using easyJet.Foundation.Atcom.AtcomSoapServices;
using easyJet.Foundation.Atcom.Logging;
using easyJet.Foundation.Atcom.Models;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Cache.Providers;
using Newtonsoft.Json;
using Sitecore.Configuration;

[assembly: InternalsVisibleTo("easyJet.Foundation.Atcom.Tests")]

namespace easyJet.Foundation.Atcom.Services
{
    [Service(typeof(IMasterDataService), Lifetime = Lifetime.Singleton)]
    public class MasterDataService : DataHubSoapClient, IMasterDataService
    {
        private readonly IAtcomLogger logger;

        public MasterDataService(IAtcomLogger logger)
        {
            this.logger = logger;
        }

        public string DefaultLanguage => Settings.GetSetting("Atcom.DefaultLanguage");

        /// <inheritdoc/>
        public IEnumerable<DataObject> GetRoomCodes(string languageCode = null)
        {
            logger.Debug($@"Calling {nameof(GetRoomCodes)} with languageCode:{nameof(languageCode)}, Obj_TpType:{Obj_TpType.RM}", this);
            return GetMasterDataByType<DataObject>(Obj_TpType.RM, null, null, languageCode);
        }

        /// <inheritdoc/>
        public IEnumerable<DataObject> GetRoomFacilities()
        {
            logger.Info($@"Calling {nameof(GetRoomFacilities)} with Obj_TpType:{Obj_TpType.RMFC}", this);
            return GetMasterDataByType<DataObject>(Obj_TpType.RMFC);
        }

        /// <inheritdoc/>
        public IEnumerable<DataObject> GetStarRatingCodes()
        {
            logger.Info($@"Calling {nameof(GetStarRatingCodes)} with Obj_TpType:{Obj_TpType.SRC}", this);
            return GetMasterDataByType<DataObject>(Obj_TpType.SRC);
        }

        /// <inheritdoc/>
        public IEnumerable<DataObject> GetCountryCodes()
        {
            logger.Info($@"Calling {nameof(GetCountryCodes)} with Obj_TpType:{Obj_TpType.CTY1}", this);
            return GetMasterDataByType<DataObject>(Obj_TpType.CTY1);
        }

        /// <inheritdoc/>
        public IEnumerable<DataObject> GetAirports(string countryCode)
        {
            logger.Info($@"Calling {nameof(GetAirports)} with countryCode: {countryCode}, Obj_TpType:{Obj_TpType.AIR}", this);
            return GetMasterDataByType<DataObject>(Obj_TpType.AIR, countryCode);
        }

        /// <inheritdoc/>
        public IEnumerable<DataObject> GetLocationCodes(string countryCode)
        {
            logger.Info($@"Calling {nameof(GetLocationCodes)} with countryCode: {countryCode}, Obj_TpType:{Obj_TpType.CTY2}", this);
            return GetMasterDataByType<DataObject>(Obj_TpType.CTY2, countryCode);
        }

        /// <inheritdoc/>
        public IEnumerable<DataObject> GetResortCodes(string locationCode)
        {
            logger.Info($@"Calling {nameof(GetResortCodes)} with locationCode: {locationCode}, Obj_TpType:{Obj_TpType.CTY3}", this);
            return GetMasterDataByType<DataObject>(Obj_TpType.CTY3, locationCode);
        }

        /// <inheritdoc/>
        public IEnumerable<AtcomAccommodationMasterDataObject> GetAccommodations(string resortCode)
        {
            logger.Info($@"Calling {nameof(GetAccommodations)} with resortCode: {resortCode}, Obj_TpType:{Obj_TpType.SS}", this);
            return GetMasterDataByType(Obj_TpType.SS, resortCode, MapToAccommodationDataObject);
        }

        internal virtual Response2 MakeResponse2Call(Request2 request)
        {
            LogPayload(request);
            return MasterData(request);
        }

        internal virtual void LogPayload(Request2 request)
        {
            var payload = $@"<s:Envelope xmlns:s=""http://schemas.xmlsoap.org/soap/envelope/"">
            <s:Body xmlns:xsi=""http://www.w3.org/2001/XMLSchema-instance"" xmlns:xsd=""http://www.w3.org/2001/XMLSchema"">
                <Request xmlns=""http://www.anite.com/AniteTravelWS/DataHub/MasterDataRequest"">
                    <Control xmlns=""http://www.anite.com/AniteTravelWS/DataHub/Common"">
                        <Msg_Tp>Data_Hub</Msg_Tp>
                        <Msg_Sub_Tp>Master_Data</Msg_Sub_Tp>
                        <Xsd_Ver>1.0.0</Xsd_Ver>
                    </Control>
                    <Data_Hub>
                        <Obj_Tp xmlns=""http://www.anite.com/AniteTravelWS/DataHub/Common"">{request.Data_Hub.Obj_Tp}</Obj_Tp>
                        <Par_Cd xmlns=""http://www.anite.com/AniteTravelWS/DataHub/Common"">{request.Data_Hub.Par_Cd}</Par_Cd>
                        <Lang_Locale_Cd xmlns=""http://www.anite.com/AniteTravelWS/DataHub/Common"">{request.Data_Hub.Lang_Locale_Cd}</Lang_Locale_Cd>
                    </Data_Hub>
                </Request>
            </s:Body>
        </s:Envelope>";

            logger.Info(payload, this);
        }

        internal virtual string GetCacheKey(Obj_TpType type, string parentCode, string languageCode = null)
        {
            var key = !string.IsNullOrEmpty(parentCode)
                ? $"Atcom.Cache.{type}.ParentCode+{parentCode}"
                : $"Atcom.Cache.{type}";

            key = !string.IsNullOrEmpty(languageCode)
                ? $"{key}+{languageCode}"
                : key;

            return key;
        }

        /// <summary>
        /// Map atcom response to DataObject.
        /// </summary>
        /// <param name="obj">Atcom response object.</param>
        /// <returns>Atcom mapped response.</returns>
        internal DataObject MapToDataObject(ObjectsObject obj)
        {
            var name = obj.Name.First().Value;
            return new DataObject(obj.Obj_Cd, name);
        }

        /// <summary>
        /// Get response by type from atcom.
        /// </summary>
        /// <typeparam name="T">T - response type.</typeparam>
        /// <param name="type">Response type.</param>
        /// <param name="parentCode">Parent code.</param>
        /// <param name="mapToResponse">Map action for response.</param>
        /// <param name="languageCode">the iso language code to get the localized objects for.</param>
        /// <returns>Collection of mapped response.</returns>
        internal IEnumerable<T> GetMasterDataByType<T>(Obj_TpType type, string parentCode = null, Func<ObjectsObject, T> mapToResponse = null, string languageCode = null)
            where T : DataObject
        {
            try
            {
                var atcomLanguageCode = languageCode == null
                                      ? DefaultLanguage
                                      : MapSitecoreLanguageCodeToAtcomLanguageCode(languageCode);

                var cacheKey = GetCacheKey(type, parentCode, atcomLanguageCode);

                var data = CustomCacheProvider.GetCacheObject<List<T>>(cacheKey);
                if (data != null)
                {
                    return data;
                }

                var request = new Request2
                {
                    Control = new BaseTypeControl
                    {
                        Msg_Tp = BaseTypeControlMsg_Tp.Data_Hub,
                        Msg_Sub_Tp = BaseTypeControlMsg_Sub_Tp.Master_Data,
                        Xsd_Ver = "1.0.0"
                    },
                    Data_Hub = new RequestData_Hub
                    {
                        Obj_Tp = type,
                        Par_Cd = parentCode,
                        Lang_Locale_Cd = atcomLanguageCode
                    }
                };

                logger.Info($"Request: {JsonConvert.SerializeObject(request)}", this);

                var response = MakeResponse2Call(request);
                if (response?.Data_Hub?.Objects?.Object == null)
                {
                    logger.Info($"Empty response: {JsonConvert.SerializeObject(response)}", this);
                    return new List<T>();
                }

                logger.Info($"Response: {JsonConvert.SerializeObject(response)}", this);

                data = response.Data_Hub.Objects.Object.Select(x => mapToResponse == null ? (T)MapToDataObject(x) : mapToResponse(x)).ToList();
                return CustomCacheProvider.SetCacheObject(cacheKey, data, CustomCacheProvider.CacheExpiredInMinutes);
            }
            catch (Exception exc)
            {
                logger.Error($"Error occurred in GetMasterDataByType. Type: {type}, Parent Code: {parentCode}. {exc.Message}", exc, this);
                return new List<T>();
            }
        }

        private string MapSitecoreLanguageCodeToAtcomLanguageCode(string sitecoreLanguageCode)
        {
            switch (sitecoreLanguageCode)
            {
                case "de-DE":
                case "de-CH":
                    return "de_DE";
                case "fr-FR":
                case "fr-CH":
                    return "fr_FR";
                case "en": // en is the default
                default:
                    return DefaultLanguage;
            }
        }

        /// <summary>
        /// Map atcom response to AccommodationDataObject.
        /// </summary>
        /// <param name="obj">Atcom response object.</param>
        /// <returns>Atcom mapped response.</returns>
        private AtcomAccommodationMasterDataObject MapToAccommodationDataObject(ObjectsObject obj)
        {
            var name = obj.Name.FirstOrDefault(l => l.Lang_Locale_Cd.Equals(DefaultLanguage, StringComparison.InvariantCultureIgnoreCase))?.Value;
            return new AtcomAccommodationMasterDataObject(
                    obj.Obj_Cd,
                    obj.Giata_Cd,
                    name,
                    obj.Address?.Tel,
                    obj.Address?.Email,
                    obj.Address?.Add3,
                    string.Join(",", obj.Address?.Add1, obj.Address?.Add2).Trim(','),
                    obj.Address?.Add_Code);
        }
    }
}