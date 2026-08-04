using System.Xml;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Models;
using Newtonsoft.Json;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using ExtensionsConstants = easyJet.Foundation.SitecoreExtensions.Constants;

namespace easyJet.Feature.PageContent.Models
{
    public class Image
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="Image"/> class.
        /// This ctor needs for deserialization.
        /// </summary>
        public Image()
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="Image"/> class.
        /// </summary>
        /// <param name="image">Sitecore image field.</param>
        /// <param name="imageSize">Size of image.</param>
        public Image(ImageField image, ImageSize imageSize)
        {
            if (string.IsNullOrWhiteSpace(image?.Value) || !image.Value.StartsWith("<"))
            {
                return;
            }

            var xmlDocument = new XmlDocument();
            xmlDocument.LoadXml(image.Value);

            if (xmlDocument.FirstChild == null)
            {
                return;
            }

            var node = xmlDocument.DocumentElement;

            Alt = image.Alt;
            Class = image.Class;

            MediaItem mediaItem = image.MediaItem;
            Src = mediaItem?.GetImageUrl(imageSize);

            DesktopFocalX = node.GetAttribute(ExtensionsConstants.FocalPoint.Attributes.DesktopFocalX);
            DesktopFocalY = node.GetAttribute(ExtensionsConstants.FocalPoint.Attributes.DesktopFocalY);
            MobileFocalX = node.GetAttribute(ExtensionsConstants.FocalPoint.Attributes.MoblieFocalX);
            MobileFocalY = node.GetAttribute(ExtensionsConstants.FocalPoint.Attributes.MobileFocalY);
        }

        /// <summary>
        /// Gets or sets alt text for image.
        /// </summary>
        [JsonProperty(PropertyName = "alt")]
        public string Alt { get; set; }

        /// <summary>
        /// Gets or sets classfor image.
        /// </summary>
        [JsonProperty(PropertyName = "class")]
        public string Class { get; set; }

        /// <summary>
        /// Gets or sets image path.
        /// </summary>
        [JsonProperty(PropertyName = "src")]
        public string Src { get; set; }

        /// <summary>
        /// Gets or sets desktop focal point X for image.
        /// </summary>
        [JsonProperty(PropertyName = "dfx")]
        public string DesktopFocalX { get; set; }

        /// <summary>
        /// Gets or sets desktop focal point Y for image.
        /// </summary>
        [JsonProperty(PropertyName = "dfy")]
        public string DesktopFocalY { get; set; }

        /// <summary>
        /// Gets or sets mobile focal point X for image.
        /// </summary>
        [JsonProperty(PropertyName = "mfx")]
        public string MobileFocalX { get; set; }

        /// <summary>
        /// Gets or sets mobile focal point Y for image.
        /// </summary>
        [JsonProperty(PropertyName = "mfy")]
        public string MobileFocalY { get; set; }
    }
}