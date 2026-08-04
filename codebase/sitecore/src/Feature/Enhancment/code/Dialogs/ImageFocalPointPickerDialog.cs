using System;
using System.Diagnostics.CodeAnalysis;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.Configuration;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Web;
using Sitecore.Web.UI.HtmlControls;
using Sitecore.Web.UI.Pages;
using Sitecore.Web.UI.Sheer;
using ImageField = Sitecore.Data.Fields.ImageField;

namespace easyJet.Feature.SitecoreEnhancment.Dialogs
{
    [ExcludeFromCodeCoverage]
    public class ImageFocalPointPickerDialog : DialogForm
    {
        private readonly Database masterDb = Factory.GetDatabase("master");

        public Image ImageFrame { get; set; }

        public Edit DesktopViewCoordinates { get; set; }

        public Edit MobileViewCoordinates { get; set; }

        public Listbox Devices { get; set; }

        /// <summary>
        /// Executing when an image loading.
        /// </summary>
        /// <param name="e">Event args.</param>
        protected override void OnLoad(EventArgs e)
        {
            base.OnLoad(e);

            if (ImageFrame == null)
            {
                return;
            }

            // Options for selecting device.
            Devices.Controls.Add(new ListItem() { Value = nameof(DesktopViewCoordinates), Header = Constants.FocalPoint.Devices.Desktop });
            Devices.Controls.Add(new ListItem() { Value = nameof(MobileViewCoordinates), Header = Constants.FocalPoint.Devices.Mobile });

            // Spliting value by "|", because coordinates for devices splitted by this char.
            var coordinatesByDevice = WebUtil.GetQueryString(Constants.QueryStringParams.Value).Split('|');

            // By default first is coordinates for default.
            DesktopViewCoordinates.Value = coordinatesByDevice[0];

            // Coordinates for mobile device.
            MobileViewCoordinates.Value = coordinatesByDevice[1];

            var containerId = WebUtil.GetQueryString(Constants.QueryStringParams.ContainerId);
            var fieldId = WebUtil.GetQueryString(Constants.QueryStringParams.FieldId);
            var currentItem = masterDb.Items.GetItem(containerId);

            ImageField imageField = currentItem?.Fields[fieldId];

            if (string.IsNullOrWhiteSpace(imageField?.Value))
            {
                ImageFrame.Alt = "No image available";
                ImageFrame.Src = "#";
                return;
            }

            var mediaItem = (MediaItem)imageField.MediaItem;

            string imageSrc = mediaItem.GetMediaUrl();

            if (!string.IsNullOrWhiteSpace(imageSrc))
            {
                imageSrc += $"?{Constants.Dialog.Parameters.UseCustomFunctions}=1&{Constants.Dialog.Parameters.CenterCrop}=1";
            }

            ImageFrame.Src = imageSrc;
        }

        /// <summary>
        /// Executing when button Ok was clicked.
        /// </summary>
        /// <param name="sender">Sender object.</param>
        /// <param name="args">Event args.</param>
        protected override void OnOK(object sender, EventArgs args)
        {
            SheerResponse.SetDialogValue(
                $"{DesktopViewCoordinates.Value}|{MobileViewCoordinates.Value}");
            base.OnOK(sender, args);
        }
    }
}