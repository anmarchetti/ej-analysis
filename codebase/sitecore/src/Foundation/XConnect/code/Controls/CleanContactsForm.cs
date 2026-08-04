using System;
using System.Diagnostics.CodeAnalysis;
using Sitecore;
using Sitecore.Diagnostics;
using Sitecore.Web.UI.HtmlControls;
using Sitecore.Web.UI.Pages;
using Sitecore.Web.UI.Sheer;

namespace easyJet.Foundation.XConnect.Common.Controls
{
    [ExcludeFromCodeCoverage]
    public class CleanContactsForm : DialogForm
    {
        protected DateCalendar StartDate { get; set; }

        protected Checkbox NotPerformDeletion { get; set; }

        private const string DateTimeFormat = "yyyy-MM-dd";

        protected override void OnLoad(EventArgs e)
        {
            Assert.ArgumentNotNull(e, "e");
            base.OnLoad(e);
            if (!Context.ClientPage.IsEvent)
            {
                StartDate.DateTime = DateTime.UtcNow.AddMonths(-1);
                NotPerformDeletion.Checked = true;
            }
        }

        /// <summary>
        /// Executing when button Ok was clicked.
        /// </summary>
        /// <param name="sender">Sender object.</param>
        /// <param name="args">Event args.</param>
        protected override void OnOK(object sender, EventArgs args)
        {
            if (StartDate.DateTime < DateTime.UtcNow)
            {
                SheerResponse.SetDialogValue($"{StartDate.DateTime.ToString(DateTimeFormat)}| {(!NotPerformDeletion.Checked).ToString()}");
                base.OnOK(sender, args);
            }
            else
            {
                Context.ClientPage?.ClientResponse?.Alert("Selected date should not be in the future!", string.Empty, "Configuration Invalid");
            }
        }
    }
}