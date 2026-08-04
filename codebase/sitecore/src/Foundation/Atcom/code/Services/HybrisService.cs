using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Atcom.Models;
using easyJet.Foundation.Atcom.Models.Domain;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Models;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Configuration;

namespace easyJet.Foundation.Atcom.Services
{
    [Service(typeof(IHybrisService), Lifetime = Lifetime.Transient)]
    public class HybrisService : IHybrisService
    {
        private readonly ISftpService sftpService;
        private readonly string hybrisDataDelimiter = "\t";
        private readonly string fileLocation = Settings.GetSetting("Atcom.Hybris.FileLocation");
        private readonly string roomAttributesFileName = Settings.GetSetting("Atcom.Hybris.RoomAttributes.Filename");
        private readonly string roomTypesFileName = Settings.GetSetting("Atcom.Hybris.RoomTypes.Filename");

        public HybrisService(ISftpService sftpService)
        {
            this.sftpService = sftpService;
        }

        /// <inheritdoc />
        public List<DataObject> GetRoomTypeFacilities()
        {
            var fileParams = new FileParameters()
            {
                Directory = fileLocation,
                FileDataDelimiter = hybrisDataDelimiter,
                Filename = roomAttributesFileName,
                HasHeaderRecord = false
            };

            var roomTypeFacilities = sftpService.GetLastUpdatedFileData<RoomAttributesFileModel>(fileParams)
                ?.Select(x => new DataObject(x.FacilityCode, x.FacilityName))
                .ToList() ?? new List<DataObject>();

            return roomTypeFacilities;
        }

        /// <inheritdoc />
        public Dictionary<string, List<RoomTypeFacilities>> GetAccommodationRoomTypes()
        {
            var fileParams = new FileParameters()
            {
                Directory = fileLocation,
                FileDataDelimiter = hybrisDataDelimiter,
                Filename = roomTypesFileName,
                HasHeaderRecord = false
            };

            var roomTypeFacilitiesFileModels = sftpService.GetLastUpdatedFileData<RoomTypeFacilitiesFileModel>(fileParams);

            var roomTypeFacilities = roomTypeFacilitiesFileModels?.GroupBy(x => x.AccomCode)
                .ToDictionary(
                    group => group.Key,
                    group => group
                        .Select(x => new RoomTypeFacilities(x.RoomTypeCode, x.RoomTypeName)
                        {
                            SesonalFacilities = x.SeasonalFacilities?
                            .GroupBy(facility => facility.FacilityCode)
                            .Select(facility => new SeasonalFacilities()
                            {
                                FacilityCode = facility.Key,
                                DateRanges = facility.Select(range => new DateRange()
                                {
                                    Start = DateTime.TryParse(range.StartDate, out DateTime startDate) ? startDate : (DateTime?)null,
                                    End = DateTime.TryParse(range.EndDate, out DateTime endDate) ? endDate : (DateTime?)null,
                                }).ToList()
                            }).ToList()
                        })
                        .ToList()) ?? new Dictionary<string, List<RoomTypeFacilities>>();

            return roomTypeFacilities;
        }
    }
}