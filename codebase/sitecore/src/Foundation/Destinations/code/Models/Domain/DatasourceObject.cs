using System;
using System.Linq;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class DatasourceObject
    {
        // Requires for deserialization
        public DatasourceObject()
        {
        }

        public DatasourceObject(BaseDatasourceSearchResultItem item)
        {
            Code = item.Code;
            Name = item.ItemName;
            ItemName = item.Name;
            Type = item.TemplateName;
            Url = item.Url;
            SourceCodes = item.SourceCodes;
        }

        public DatasourceObject(Item item, bool buildUrl = false)
        {
            Code = item != null && item.TemplateID == Constants.TemplateIds.Accommodation ?
                item.Fields[Constants.Fields.AccommodationItem.GiataCode]?.Value :
                item?.Fields[Constants.Fields.DatasourceItem.Code]?.Value;
            Name = item?.Fields[Constants.Fields.DatasourceItem.Name]?.Value;
            ItemName = item?.Name;
            SourceCodes = item != null && item.TemplateID == Constants.TemplateIds.Accommodation
                ? item.Children
                    .Where(c => c.TemplateID == Constants.TemplateIds.AccommodationRoomsFolder)
                    .Select(roomsFolder => roomsFolder.Fields[Constants.Fields.DatasourceItem.Code]?.Value)
                    .Where(code => !string.IsNullOrWhiteSpace(code))
                    .ToArray()
                : Array.Empty<string>();

            if (buildUrl && item?.GetSiteInfo() != null)
            {
                Url = item?.GetItemUrl(item?.GetSiteContext()?.Name).Replace("/destinations", string.Empty);
            }
        }

        public string Code { get; set; }

        public string[] SourceCodes { get; set; } = Array.Empty<string>();

        public string Name { get; set; }

        public string ItemName { get; set; }

        public string Type { get; set; }

        public string Url { get; set; }

        public override string ToString()
        {
            return Name;
        }
    }
}