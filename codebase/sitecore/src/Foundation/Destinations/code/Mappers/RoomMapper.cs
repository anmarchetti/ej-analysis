using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.Integration;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Utilities;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Microsoft.Extensions.DependencyInjection;
using Newtonsoft.Json;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.DependencyInjection;

[assembly: InternalsVisibleTo("easyJet.Foundation.Destinations.Tests")]

namespace easyJet.Foundation.Destinations.Mappers
{
    public static class RoomMapper
    {
        public const string RoomFacilityGroupCode = "60";

        internal static IIntegrationService IntegrationService = ServiceLocator.ServiceProvider.GetService<IIntegrationService>();

        public static HotelRoom[] GetHotelRoomsFromIndex(HotelSearchResultItem document, string atcomCode)
        {
            var roomsBySource = document.Rooms == null ? null : JsonConvert.DeserializeObject<Dictionary<string, HotelRoom[]>>(document.Rooms);

            if (roomsBySource == null || !roomsBySource.Any())
            {
                return Enumerable.Empty<HotelRoom>().ToArray();
            }

            return roomsBySource.TryGetValue(atcomCode, out var rooms) ? rooms : Array.Empty<HotelRoom>();
        }

        public static IEnumerable<HotelRoom> GetHotelRooms(Item roomFolder)
        {
            return GetHotelRooms(roomFolder, useExpediaFacilities: false);
        }

        public static IEnumerable<HotelRoom> GetExpediaHotelRooms(Item roomFolder)
        {
            return GetHotelRooms(roomFolder, useExpediaFacilities: true);
        }

        private static IEnumerable<HotelRoom> GetHotelRooms(Item roomFolder, bool useExpediaFacilities)
        {
            var roomItems = roomFolder?.Children?.Where(x => x.TemplateID == Constants.TemplateIds.AccommodationRoom);
            if (roomItems == null)
            {
                yield break;
            }

            foreach (var item in roomItems)
            {
                LookupField typeField = item.Fields[Constants.Fields.AccommodationRoomItem.RoomType];
                var type = typeField?.TargetItem;
                if (type == null)
                {
                    var code = item.Fields[Constants.Fields.DatasourceItem.Code]?.Value;
                    if (string.IsNullOrWhiteSpace(code))
                    {
                        continue;
                    }

                    yield return MapRoom(item, useExpediaFacilities);
                    continue;
                }

                yield return MapReference(type, item, useExpediaFacilities);
            }
        }

        private static HotelRoom MapRoom(Item item, bool useExpediaFacilities)
        {
            return new HotelRoom
            {
                Name = item.Fields[Constants.Fields.DatasourceItem.Name].Value,
                ItemName = item.Name,
                Code = item.Fields[Constants.Fields.DatasourceItem.Code].Value,
                Content = item.Fields[Constants.Fields.AccommodationReferenceItem.Content].Value,
                Description = item.Fields[Constants.Fields.AccommodationReferenceItem.Description].Value,
                IconUrl = item.GetMediaUrl(Constants.Fields.AccommodationReferenceItem.Icon),
                Images = new ImageUtils().GetChildImages(item),
                Facilities = GetFacilities(item, useExpediaFacilities),
                Stays = GetStays(item),
                BedGroups = useExpediaFacilities ? GetBedGroups(item) : null
            };
        }

        private static HotelRoom MapReference(Item referenceTypeItem, Item referenceItem, bool useExpediaFacilities)
        {
            return new HotelRoom
            {
                Name = GetFieldValue(referenceTypeItem, referenceItem, Constants.Fields.DatasourceItem.Name),
                ItemName = referenceTypeItem.Name,
                Code = referenceTypeItem.Fields[Constants.Fields.DatasourceItem.Code].Value,
                Content = referenceItem.Fields[Constants.Fields.AccommodationReferenceItem.Content].Value,
                Description = referenceItem.Fields[Constants.Fields.AccommodationReferenceItem.Description].Value,
                IconUrl = GetImageUrl(referenceTypeItem, referenceItem, Constants.Fields.AccommodationReferenceItem.Icon),
                Images = new ImageUtils().GetChildImages(referenceItem),
                Facilities = GetFacilities(referenceItem, useExpediaFacilities),
                Stays = GetStays(referenceItem),
                BedGroups = useExpediaFacilities ? GetBedGroups(referenceItem) : null
            };
        }

        private static List<RoomFacility> GetFacilities(Item referenceItem, bool useExpediaFacilities)
        {
            return useExpediaFacilities
                ? GetExpediaRoomFacilities(referenceItem)
                : GetHotelRoomFacilities(referenceItem);
        }

        private static List<RoomFacility> GetHotelRoomFacilities(Item referenceItem)
        {
            // Get all room facilities. Room facilities can be located under the room facility folder and under the accommodation facilities.
            var facilitiesItems = GetRoomFacilities(referenceItem);
            facilitiesItems = facilitiesItems.Concat(GetAccommodationRoomFacilities(referenceItem));

            // Distinct duplicates
            facilitiesItems = facilitiesItems.GroupBy(x => x[Constants.Fields.BaseFacilityItem.FacilityType]).Select(x => x.First());

            var facilities = new List<RoomFacility>();
            foreach (Item item in facilitiesItems)
            {
                LookupField typeField = item.Fields[Constants.Fields.BaseFacilityItem.FacilityType];
                var type = typeField?.TargetItem;

                // Add only available facilities to document
                if (type != null && item[Constants.Fields.BaseAppearance.ShowOnSite] == Constants.Common.CheckboxTrueValue &&
                    type[Constants.Fields.BaseAppearance.ShowOnSite] == Constants.Common.CheckboxTrueValue)
                {
                    facilities.Add(new RoomFacility(type, item));
                }
            }

            facilities = HasHotelBedsVersion(referenceItem) ? facilities : facilities.OrderBy(x => x.SortOrder).ThenBy(x => x.Name).ToList();
            return facilities.Any() ? facilities : null;
        }

        private static List<RoomFacility> GetExpediaRoomFacilities(Item referenceItem)
        {
            var facilitiesItems = GetRoomFacilities(referenceItem);

            var facilities = new List<RoomFacility>();

            foreach (Item item in facilitiesItems)
            {
                LookupField typeField = item.Fields[Constants.Fields.BaseFacilityItem.FacilityType];
                var type = typeField?.TargetItem;

                if (type == null)
                {
                    continue;
                }

                facilities.Add(new RoomFacility(type, item));
            }

            facilities = facilities.OrderBy(x => x.SortOrder).ThenBy(x => x.Name).ToList();
            return facilities.Any() ? facilities : null;
        }

        private static List<HotelRoomStay> GetStays(Item referenceItem)
        {
            var roomStaysFolder = referenceItem.Children.FirstOrDefault(x => x.TemplateID == Constants.TemplateIds.RoomStaysFolder);

            if (roomStaysFolder == null)
            {
                return new List<HotelRoomStay>();
            }

            var roomStays = new List<HotelRoomStay>();
            foreach (Item item in roomStaysFolder.Children)
            {
                roomStays.Add(new HotelRoomStay(item)
                {
                    Facilities = GetFacilities(item, useExpediaFacilities: false)
                });
            }

            return roomStays;
        }

        private static IEnumerable<BedGroup> GetBedGroups(Item roomItem)
        {
            MultilistField bedGroupsField = roomItem?.Fields[Constants.FieldsIds.AccommodationRoomItem.BedGroupTypes];

            return (bedGroupsField?.GetItems() ?? Enumerable.Empty<Item>())
                .Where(item => item != null && item.TemplateID == Constants.TemplateIds.BedGroup)
                .Select(item => new BedGroup
                {
                    BedGroupId = item.Fields[Constants.FieldsIds.BedGroupItem.BedGroupId]?.Value,
                    Description = item.Fields[Constants.FieldsIds.BedGroupItem.Description]?.Value
                })
                .ToList();
        }

        /// <summary>
        /// Checks if the accommodation item has hotel beds version.
        /// </summary>
        /// <param name="roomItem">Room folder item.</param>
        /// <returns>True if the accommodation item has hotel beds version.</returns>
        private static bool HasHotelBedsVersion(Item roomItem)
        {
            var atcomCode = roomItem[Constants.Fields.DatasourceItem.Code];
            return IntegrationService.SetIntegrationStrategy(Integration.Models.ChanelTypes.HotelBeds).ValidateCode(atcomCode);
        }

        /// <summary>
        /// Get room facilities with group code '60' under Accommodation Facilities folder.
        /// </summary>
        /// <param name="roomItem">Room item.</param>
        /// <returns>Collections of Room Facility Items.</returns>
        private static IEnumerable<Item> GetAccommodationRoomFacilities(Item roomItem)
        {
            var accommodation = roomItem?.Parent?.Parent;

            // Get accommodation facilities with group code '60' only for HBG hotels.
            if (accommodation == null || !HasHotelBedsVersion(roomItem.Parent))
            {
                yield break;
            }

            var facilitiesFolder = accommodation?.Children?.FirstOrDefault(item => item.TemplateID == Constants.TemplateIds.AccommodationFacilitiesFolder);
            if (facilitiesFolder == null)
            {
                yield break;
            }

            foreach (Item item in facilitiesFolder.Children)
            {
                LookupField typeField = item.Fields[Constants.Fields.BaseFacilityItem.FacilityType];
                var groupType = typeField?.TargetItem?.Parent;

                if (groupType != null && groupType[Constants.Fields.DatasourceItem.Code] == RoomFacilityGroupCode)
                {
                    yield return item;
                }
            }
        }

        /// <summary>
        /// Get Room facilities.
        /// </summary>
        /// <param name="referenceItem">Room folder item.</param>
        /// <returns>Collections of room facility items.</returns>
        private static IEnumerable<Item> GetRoomFacilities(Item referenceItem)
        {
            var facilitiesFolder = referenceItem.Children.FirstOrDefault(x => x.TemplateID == Constants.TemplateIds.RoomFacilitiesFolder);
            return facilitiesFolder?.Children ?? Enumerable.Empty<Item>();
        }

        /// <summary>
        /// Return field value.
        /// </summary>
        /// <param name="referenceTypeItem">Reference item.</param>
        /// <param name="referenceItem">Item.</param>
        /// <param name="fieldName">Field to return.</param>
        /// <returns>Field value.</returns>
        private static string GetFieldValue(Item referenceTypeItem, Item referenceItem, string fieldName)
        {
            var itemFieldValue = referenceItem.Fields[fieldName]?.Value;

            // Get item's field value, if empty - get field value from type
            return !string.IsNullOrWhiteSpace(itemFieldValue) ? itemFieldValue :
                referenceTypeItem.Fields[fieldName]?.Value;
        }

        /// <summary>
        /// Get item's (<paramref name="referenceItem"/>) image url, if empty - get image from type (<paramref name="referenceTypeItem"/>).
        /// </summary>
        /// <param name="referenceTypeItem">Item's type.</param>
        /// <param name="referenceItem">Item.</param>
        /// <param name="fieldName">Item's field name.</param>
        /// <returns>Image Url.</returns>
        private static string GetImageUrl(Item referenceTypeItem, Item referenceItem, string fieldName)
        {
            return referenceItem.GetMediaUrl(fieldName) ??
                    referenceTypeItem.GetMediaUrl(fieldName);
        }
    }
}
