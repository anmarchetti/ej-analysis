using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Models.Domain.CancelAndCredit
{
    /// <summary>
    /// Base Credit setting rule.
    /// </summary>
    public class BaseCreditRule
    {
        public BaseCreditRule(Item item)
        {
            if (item != null)
            {
                Active = new DateRange()
                {
                    Start = ((DateField)item.Fields[Constants.Fields.BaseCreditSetting.ActivationDateFrom]).GetIsoDate(),
                    End = ((DateField)item.Fields[Constants.Fields.BaseCreditSetting.ActivationDateTo]).GetIsoDate()
                };

                DaysBeforeDeparture = MainUtil.GetInt(item.Fields[Constants.Fields.BaseCreditSetting.NumberOfDays].Value, 0);
                DestinationAirports = ((MultilistField)item.Fields[Constants.Fields.BaseCreditSetting.DestinationAirports]).GetItems().Select(x => x.Fields[Constants.Fields.DatasourceItem.Code].Value);

                BookingDepartureDateFrom = ((DateField)item.Fields[Constants.Fields.BaseCreditSetting.BookingDepartureDateFrom]).GetIsoDate();
                BookingDepartureDateTo = ((DateField)item.Fields[Constants.Fields.BaseCreditSetting.BookingDepartureDateTo]).GetIsoDate();

                DateOfChangeFrom = ((DateField)item.Fields[Constants.Fields.BaseCreditSetting.DateOfChangeFrom]).GetIsoDate();
                DateOfChangeTo = ((DateField)item.Fields[Constants.Fields.BaseCreditSetting.DateOfChangeTo]).GetIsoDate();

                BookedWithinDateFrom = ((DateField)item.Fields[Constants.Fields.BaseCreditSetting.BookedWithinDateFrom]).GetIsoDate();
                BookedWithinDateTo = ((DateField)item.Fields[Constants.Fields.BaseCreditSetting.BookedWithinDateTo]).GetIsoDate();
            }
        }

        /// <summary>
        /// Gets or sets activation start and end dates.
        /// </summary>
        public DateRange Active { get; set; }

        /// <summary>
        /// Gets or sets Number of days before departure date.
        /// </summary>
        public int DaysBeforeDeparture { get; set; }

        /// <summary>
        /// Gets or sets airport codes.
        /// </summary>
        public IEnumerable<string> DestinationAirports { get; set; }

        /// <summary>
        /// Gets or sets booking departure date from.
        /// </summary>
        public string BookingDepartureDateFrom { get; set; }

        /// <summary>
        /// Gets or sets booking departure date to.
        /// </summary>
        public string BookingDepartureDateTo { get; set; }

        /// <summary>
        /// Gets or sets date of change from.
        /// </summary>
        public string DateOfChangeFrom { get; set; }

        /// <summary>
        /// Gets or sets date of change to.
        /// </summary>
        public string DateOfChangeTo { get; set; }

        /// <summary>
        /// Gets or sets booked within date from.
        /// </summary>
        public string BookedWithinDateFrom { get; set; }

        /// <summary>
        /// Gets or sets booked within date to.
        /// </summary>
        public string BookedWithinDateTo { get; set; }
    }
}