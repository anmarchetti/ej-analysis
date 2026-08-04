using System.Collections.Specialized;
using System.Diagnostics.CodeAnalysis;
using System.Text.RegularExpressions;
using Sitecore;
using Sitecore.Shell.Applications.ContentEditor;
using Sitecore.Web.UI.Sheer;

namespace easyJet.Feature.SitecoreEnhancment.Fields
{
    [ExcludeFromCodeCoverage]
    public class ImageFocalPointPickerField : Image
    {
        /// <summary>
        /// Gets or sets focal point X coordinate.
        /// </summary>
        public string DesktopFocalX
        {
            get
            {
                return XmlValue.GetAttribute(Constants.FocalPoint.Attributes.DesktopFocalX);
            }

            set
            {
                XmlValue.SetAttribute(Constants.FocalPoint.Attributes.DesktopFocalX, value);
            }
        }

        /// <summary>
        /// Gets or sets focal point Y coordinate.
        /// </summary>
        public string DesktopFocalY
        {
            get
            {
                return XmlValue.GetAttribute(Constants.FocalPoint.Attributes.DesktopFocalY);
            }

            set
            {
                XmlValue.SetAttribute(Constants.FocalPoint.Attributes.DesktopFocalY, value);
            }
        }

        /// <summary>
        /// Gets or sets mobile focal point X coordinate.
        /// </summary>
        public string MobileFocalX
        {
            get
            {
                return XmlValue.GetAttribute(Constants.FocalPoint.Attributes.MoblieFocalX);
            }

            set
            {
                XmlValue.SetAttribute(Constants.FocalPoint.Attributes.MoblieFocalX, value);
            }
        }

        /// <summary>
        /// Gets or sets mobile focal point Y coordinate.
        /// </summary>
        public string MobileFocalY
        {
            get
            {
                return XmlValue.GetAttribute(Constants.FocalPoint.Attributes.MobileFocalY);
            }

            set
            {
                XmlValue.SetAttribute(Constants.FocalPoint.Attributes.MobileFocalY, value);
            }
        }

        /// <summary>
        /// Handling action message from core database field.
        /// </summary>
        /// <param name="message">Action message from core database.</param>
        public override void HandleMessage(Message message)
        {
            base.HandleMessage(message);

            if (message[Constants.QueryStringParams.ItemId] != ID || string.IsNullOrWhiteSpace(message.Name))
            {
                return;
            }

            if (message.Name == Constants.FocalPoint.Actions.PickFocalPointAction)
            {
                string onFocus = Attributes[Constants.FocalPoint.Attributes.OnFocus];

                var regex = new Regex(Constants.Patterns.GuidPattern);
                var ids = regex.Matches(onFocus);

                // Necessary for opening client dialog.
                if (ids.Count > 1)
                {
                    // Getting container id from onFocus parameter.
                    var containerId = RemoveBrackets(ids[0].Value);
                    // Getting field id from onFocus parameter.
                    var fieldId = RemoveBrackets(ids[1].Value);

                    Sitecore.Context.ClientPage.Start(
                        this,
                        nameof(PickFocalPoint),
                        new NameValueCollection
                        {
                            { Constants.QueryStringParams.ContainerId, containerId },
                            { Constants.QueryStringParams.FieldId, fieldId }
                        });

                    return;
                }
            }

            if (message.Name == Constants.FocalPoint.Actions.ClearFocalPointAction)
            {
                Sitecore.Context.ClientPage.Start(this, nameof(ClearFocalPoint));
            }
        }

        /// <summary>
        /// Executing when was PickFocalPoint clicked.
        /// </summary>
        /// <param name="args">Client pipeline args.</param>
        protected void PickFocalPoint(ClientPipelineArgs args)
        {
            if (args.IsPostBack)
            {
                if (args.HasResult && args.Result != Value)
                {
                    SetModified();
                    string mediaid = XmlValue.GetAttribute(Constants.FocalPoint.Attributes.MediaId);
                    if (string.IsNullOrEmpty(mediaid))
                    {
                        SheerResponse.Alert("Select an image from the Media Library first.");
                    }

                    // Getting values by device from string. Coordinates in string separated by "|".
                    var pointsByDevice = args.Result.Split('|');

                    // Getting focal points from string, for desktop view is first element.
                    var pointsForDestopDevice = GetPoints(pointsByDevice, 0);

                    // Focal point is valid, if x and y points are exist, so points array should has lenght more than 1.
                    if (pointsForDestopDevice.Length > 1)
                    {
                        DesktopFocalX = pointsForDestopDevice[0];
                        DesktopFocalY = pointsForDestopDevice[1];
                    }

                    // Getting focal points from string, for mobile view is second element.
                    var pointsForMobileDevice = GetPoints(pointsByDevice, 1);

                    // Focal point is valid, if x and y points are exist, so points array should has lenght more than 1.
                    if (pointsForMobileDevice.Length > 1)
                    {
                        MobileFocalX = pointsForMobileDevice[0];
                        MobileFocalY = pointsForMobileDevice[1];
                    }
                }
            }
            else
            {
                string mediaid = XmlValue.GetAttribute(Constants.FocalPoint.Attributes.MediaId);
                if (string.IsNullOrEmpty(mediaid))
                {
                    SheerResponse.Alert("Select an image from the Media Library first.");
                }
                else
                {
                    var mediaItem = Client.ContentDatabase.GetItem(mediaid);
                    if (mediaItem == null)
                    {
                        return;
                    }

                    string uri = $"{UIUtil.GetUri("control:ImageFocalPointPickerDialog")}&" +
                        $"{Constants.QueryStringParams.Value}={DesktopFocalX}, {DesktopFocalY}|{MobileFocalX}, {MobileFocalY}&" +
                        $"{Constants.QueryStringParams.ContainerId}={args.Parameters[Constants.QueryStringParams.ContainerId]}&" +
                        $"{Constants.QueryStringParams.FieldId}={args.Parameters[Constants.QueryStringParams.FieldId]}";

                    SheerResponse.ShowModalDialog(uri, "500", "500", string.Empty, true);
                    args.WaitForPostBack();
                }
            }
        }

        /// <summary>
        /// Executing when was ClearFocalPoint clicked.
        /// </summary>
        /// <param name="args">Client pipeline args.</param>
        protected void ClearFocalPoint(ClientPipelineArgs args)
        {
            MobileFocalX = string.Empty;
            MobileFocalY = string.Empty;
            DesktopFocalX = string.Empty;
            DesktopFocalY = string.Empty;

            SetModified();
        }

        /// <summary>
        /// Remove brackets from guid.
        /// Necessary for providing dialog parameters.
        /// </summary>
        /// <param name="guid">Guid value.</param>
        /// <returns>Guid without brackets.</returns>
        private string RemoveBrackets(string guid)
        {
            return guid.Replace("{", string.Empty).Replace("}", string.Empty);
        }

        /// <summary>
        /// Getting coordinate points by device index.
        /// </summary>
        /// <param name="pointsByDevice">Points by device.</param>
        /// <param name="index">Device index.</param>
        /// <returns>Collection of points.</returns>
        private string[] GetPoints(string[] pointsByDevice, int index)
        {
            return pointsByDevice[index].Replace(" ", string.Empty).Split(',');
        }
    }
}