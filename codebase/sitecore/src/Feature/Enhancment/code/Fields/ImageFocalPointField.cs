using System.Diagnostics.CodeAnalysis;
using Sitecore.Data.Fields;

namespace easyJet.Feature.SitecoreEnhancment.Fields
{
    /// <summary>
    /// Represents an Image Focal Point field.
    /// </summary>
    [ExcludeFromCodeCoverage]
    public class ImageFocalPointField : ImageField
    {
        public ImageFocalPointField(Field innerField)
          : base(innerField)
        {
        }

        public ImageFocalPointField(Field innerField, string runtimeValue)
            : base(innerField, runtimeValue)
        {
        }

        /// <summary>
        /// Gets or sets focal point X coordinate.
        /// </summary>
        public string DesktopFocalX
        {
            get => GetAttribute("dfx");
            set => SetAttribute("dfx", value);
        }

        /// <summary>
        /// Gets or sets focal point Y coordinate.
        /// </summary>
        public string DesktopFocalY
        {
            get => GetAttribute("dfy");
            set => SetAttribute("dfy", value);
        }

        /// <summary>
        /// Gets or sets mobile focal point X coordinate.
        /// </summary>
        public string MobileFocalX
        {
            get => GetAttribute("mfx");
            set => SetAttribute("mfx", value);
        }

        /// <summary>
        /// Gets or sets mobile focal point Y coordinate.
        /// </summary>
        public string MobileFocalY
        {
            get => GetAttribute("mfy");
            set => SetAttribute("mfy", value);
        }
    }
}