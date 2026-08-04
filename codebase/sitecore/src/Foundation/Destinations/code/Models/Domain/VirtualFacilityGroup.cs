using System.Collections.Generic;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.Data;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class VirtualFacilityGroup : DatasourceObject
    {
        public VirtualFacilityGroup()
        {
            Facilities = new List<Facility>();
        }

        public VirtualFacilityGroup(Item item)
        {
            Code = item?.Fields[Constants.Fields.DatasourceItem.Code]?.Value;
            Name = item?.Fields[Constants.Fields.DatasourceItem.Name]?.Value;
            IconUrl = item?.GetMediaUrl(Constants.Fields.AccommodationReferenceItem.Icon);
            Id = item?.ID.ToString();
            TemplateId = item?.TemplateID;
        }

        public string Title { get; set; }

        public string IconUrl { get; set; }

        public string Id { get; set; }

        public List<ID> FacilityGroupsIds { get; set; } = new List<ID>();

        public List<Facility> Facilities { get; set; } = new List<Facility>();

        public ID TemplateId { get; set; }
    }
}