using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.HotelBeds.Logging;
using easyJet.Foundation.HotelBeds.Models.Domain;
using easyJet.Foundation.HotelBeds.Models.Requests;
using easyJet.Foundation.HotelBeds.Models.Responses;
using easyJet.Foundation.SitecoreExtensions.Extensions;

namespace easyJet.Foundation.HotelBeds.Services
{
    [Service(typeof(IMasterDataService), Lifetime = Lifetime.Singleton)]
    public class MasterDataService : BaseService, IMasterDataService
    {
        private const int ChunkSize = 200;

        public MasterDataService(IHotelBedsLogger logger)
            : base(logger)
        {
        }

        public IEnumerable<Accommodation> GetAccommodations(string[] hotelCodes, string language = null, DateTime? lastUpdateTime = null)
        {
            if (hotelCodes.Length == 1)
            {
                var accommodation = GetAccommodation(hotelCodes.First(), language, lastUpdateTime);
                var list = new List<Accommodation> { accommodation };
                return list;
            }

            var results = new List<Accommodation>();
            while (hotelCodes.Any())
            {
                var codeChunk = hotelCodes.Take(ChunkSize);
                hotelCodes = hotelCodes.Skip(ChunkSize).ToArray();
                results.AddRange(GetDataCollection<AccommodationsResponse, HotelsRequest, Accommodation>(new HotelsRequest { HotelCodes = string.Join(",", codeChunk), Language = language, LastUpdateTime = lastUpdateTime }));
            }

            return results.DistinctBy(i => i.Code);
        }

        public Accommodation GetAccommodation(string hotelCode, string language = null, DateTime? lastUpdateTime = null)
        {
            return GetData<AccommodationResponse, HotelRequest, Accommodation>(new HotelRequest { HotelCode = hotelCode, Language = language, LastUpdateTime = lastUpdateTime });
        }

        public IEnumerable<FacilityTypology> GetFacilityTypologies(DateTime? lastUpdateTime = null)
        {
            return GetDataCollection<FacilityTypologiesResponse, FacilityTypologiesRequest, FacilityTypology>(new FacilityTypologiesRequest { LastUpdateTime = lastUpdateTime });
        }

        public IEnumerable<FacilityGroup> GetFacilityGroups(string[] facilityGroupsCodes = null, DateTime? lastUpdateTime = null)
        {
            return GetDataCollection<FacilityGroupsResponse, FacilityGroupsRequest, FacilityGroup>(new FacilityGroupsRequest { FacilityGroupsCodes = facilityGroupsCodes, LastUpdateTime = lastUpdateTime });
        }

        public IEnumerable<Facility> GetFacilities(DateTime? lastUpdateTime = null)
        {
            return GetDataCollection<FacilitiesResponse, FacilitiesRequest, Facility>(new FacilitiesRequest { LastUpdateTime = lastUpdateTime });
        }

        /// <summary>
        /// Get all room types from HotelBeds.
        /// </summary>
        /// <param name="lastUpdateTime">Last time when sync was run.</param>
        /// <returns>Collection of room types.</returns>
        public List<RoomType> GetRoomTypes(DateTime? lastUpdateTime = null)
        {
            int itemCount = 0;
            List<RoomType> roomTypes = new List<RoomType>();

            // gets room types until response items count will be 0
            // and adds results to roomTypes collection
            for (int i = 0; i == 0 || itemCount > 0; i++)
            {
                var response = GetDataCollection<RoomTypesResponse, RoomTypesRequest, RoomType>(new RoomTypesRequest { Step = i, LastUpdateTime = lastUpdateTime });
                itemCount = (response as ICollection<RoomType>)?.Count ?? 0;
                roomTypes.AddRange(response);
            }

            return roomTypes;
        }
    }
}