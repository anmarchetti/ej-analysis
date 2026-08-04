using System;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class ContentByDate
    {
        public ContentByDate()
        {
        }

        public ContentByDate(Item item)
        {
            if (item == null)
            {
                return;
            }

            StartDate = ((DateField)item.Fields[Constants.Fields.ContentByDateItem.StartDate]).GetIsoDate();
            EndDate = ((DateField)item.Fields[Constants.Fields.ContentByDateItem.EndDate]).GetIsoDate();
            Content = item.Fields[Constants.Fields.ContentByDateItem.Content]?.Value;
        }

        public string StartDate { get; set; }

        public string EndDate { get; set; }

        public string Content { get; set; }
    }
}