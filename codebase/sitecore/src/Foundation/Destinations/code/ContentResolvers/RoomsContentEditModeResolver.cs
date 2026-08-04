using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.Extensions;
using easyJet.Foundation.SitecoreExtensions.Disablers;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Newtonsoft.Json.Linq;
using Sitecore;
using Sitecore.Data.Items;
using Sitecore.Diagnostics;
using Sitecore.LayoutService.Configuration;
using Sitecore.LayoutService.ItemRendering.ContentsResolvers;
using Sitecore.Mvc.Presentation;
using RenderingContentsResolver = easyJet.Foundation.SitecoreExtensions.ContentResolvers.RenderingContentsResolver;

namespace easyJet.Foundation.Destinations.ContentResolvers
{
    public class RoomsContentEditModeResolver : RenderingContentsResolver, IRenderingContentsResolver
    {
        /// <summary>
        /// Return room item data with images and facilities children data in json format.
        /// </summary>
        /// <param name="rendering">Rendering.</param>
        /// <param name="renderingConfig">Rendering config.</param>
        /// <returns>Data from items in json format.</returns>
        public override object ResolveContents(Rendering rendering, IRenderingConfiguration renderingConfig)
        {
            // Should NOT return any data in Normal mode
            if (Context.PageMode.IsNormal)
            {
                return null;
            }

            Assert.ArgumentNotNull(rendering, nameof(rendering));
            Assert.ArgumentNotNull(renderingConfig, nameof(renderingConfig));

            var contextItem = GetContextItem(rendering, renderingConfig);
            if (contextItem == null)
            {
                return null;
            }

            using (new WebEditDisabler())
            {
                if (string.IsNullOrWhiteSpace(ItemSelectorQuery))
                {
                    return ProcessItem(contextItem, rendering, renderingConfig);
                }

                var items = GetItems(contextItem)?.ToList();
                if (items == null || items.Count <= 0)
                {
                    return new JArray();
                }

                JArray rooms = new JArray();
                JArray roomFolders = new JArray();

                foreach (var item in items)
                {
                    var roomFolder = item.ParentID.Guid.ToString();
                    var roomImagesFolder = item.Children.FirstOrDefault(x => x.TemplateID.Equals(Constants.TemplateIds.ImagesFolder));
                    var roomImagesContent = roomImagesFolder?.Children.ToArray();

                    var roomFacilitiesFolder = item.Children.FirstOrDefault(x => x.TemplateID.Equals(Constants.TemplateIds.RoomFacilitiesFolder));
                    var roomFacilities = roomFacilitiesFolder?.Children.ToArray();
                    var roomFacilitiesContent = GetReorderedRoomFacilities(roomFacilities);

                    JObject roomTypeFields = ProcessItem(item, rendering, renderingConfig);

                    // ProcessItems is rendering facilitytypes multiple times,
                    // TODO introduce new structure which renders each facility typoe only once.
                    // parallelization is difficult because  ProcessItems is not threadsave.
                    // it uses the serializer from IRenderingConfiguration
                    JObject roomType = new JObject()
                    {
                        ["id"] = item.ID.Guid.ToString(),
                        ["name"] = item.Name,
                        ["displayName"] = item.DisplayName,
                        ["fields"] = roomTypeFields,
                        ["roomImages"] = new JObject()
                        {
                            ["roomImagesFolderId"] = roomImagesFolder?.ID.Guid.ToString(),
                            ["roomImagesContent"] = roomImagesContent != null ? ProcessItems(roomImagesContent, rendering, renderingConfig) : null
                        },
                        ["roomFacilities"] = new JObject()
                        {
                            ["roomFacilitiesFolderId"] = roomFacilitiesFolder?.ID.Guid.ToString(),
                            ["roomFacilitiesContent"] = roomFacilitiesContent != null ? ProcessItems(roomFacilitiesContent, rendering, renderingConfig) : null
                        },
                        ["roomsFolder"] = roomFolder
                    };

                    rooms.Add(roomType);

                    if (roomFolders.All(x => !x.HasValues || x.Value<string>("roomsFolder") != roomFolder))
                    {
                        roomFolders.Add(new JObject()
                        {
                            ["roomsFolder"] = roomFolder,
                            ["roomsFolderName"] = item.Parent.Name
                        });
                    }
                }

                return new
                {
                    RoomsFolders = roomFolders,
                    RoomsFolderId = contextItem.Children.FirstOrDefault(x => x.TemplateID.Equals(Constants.TemplateIds.AccommodationRoomsFolder))?.ID.Guid.ToString(),
                    Items = rooms
                };
            }
        }

        /// <summary>
        /// Get reordered room facilities items.
        /// </summary>
        /// <param name="roomFacilities">Sitecore room facility items.</param>
        /// <returns>Reordered room facilities item.</returns>
        private Item[] GetReorderedRoomFacilities(IEnumerable<Item> roomFacilities)
        {
            return roomFacilities?.Select(x =>
            {
                var roomFacilityType = x.GetTargetItem(Constants.Fields.BaseFacilityItem.FacilityType);
                return new
                {
                    SortOrder = (roomFacilityType != null && roomFacilityType.Parent.TemplateID == Constants.TemplateIds.RoomTypeFacilityGroup) ?
                    roomFacilityType.GetSortOrder() : x.GetSortOrder(),
                    Item = x
                };
            }).OrderBy(x => x.SortOrder).ThenBy(x => x.Item[Constants.Fields.DatasourceItem.Name]).Select(x => x.Item).ToArray();
        }
    }
}