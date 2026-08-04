using System;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;

namespace easyJet.Foundation.SiteModes.Models.Domain
{
    public abstract class BaseMaintenanceMode
    {
        protected BaseMaintenanceMode(Item item)
        {
            if (item == null)
            {
                return;
            }

            SoftFrom = GetDate(item, Constants.Fields.MaintenanceModeSettings.SoftFrom);
            SoftTo = GetDate(item, Constants.Fields.MaintenanceModeSettings.SoftTo);
            FullFrom = GetDate(item, Constants.Fields.MaintenanceModeSettings.FullFrom);
            FullTo = GetDate(item, Constants.Fields.MaintenanceModeSettings.FullTo);
        }

        public DateTime SoftFrom { get; set; }

        public DateTime SoftTo { get; set; }

        public DateTime FullFrom { get; set; }

        public DateTime FullTo { get; set; }

        private DateTime GetDate(Item item, string fieldName)
        {
            return ((DateField)item.Fields[fieldName])?.DateTime ?? DateTime.MinValue;
        }
    }
}