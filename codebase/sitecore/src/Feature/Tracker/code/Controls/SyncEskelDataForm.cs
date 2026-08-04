using System;
using Sitecore;
using Sitecore.Diagnostics;
using Sitecore.Web.UI.HtmlControls;
using Sitecore.Web.UI.Pages;
using Sitecore.Web.UI.Sheer;

namespace easyJet.Feature.Tracker.Controls
{
    public class SyncEskelDataForm : DialogForm
    {
        protected DateCalendar StartDate { get; set; }

        protected DateCalendar EndDate { get; set; }

        private const string DateTimeFormat = "yyyy-MM-dd";

        protected override void OnLoad(EventArgs e)
        {
            Assert.ArgumentNotNull(e, "e");
            base.OnLoad(e);
            if (!Context.ClientPage.IsEvent)
            {
                StartDate.DateTime = new DateTime(2019, 9, 19);
                EndDate.DateTime = DateTime.Now;
            }
        }

        /// <summary>
        /// Executing when button Ok was clicked.
        /// </summary>
        /// <param name="sender">Sender object.</param>
        /// <param name="args">Event args.</param>
        protected override void OnOK(object sender, EventArgs args)
        {
            SheerResponse.SetDialogValue(
                $"{StartDate.DateTime.ToString(DateTimeFormat)}|{EndDate.DateTime.ToString(DateTimeFormat)}");
            base.OnOK(sender, args);
        }
    }
}