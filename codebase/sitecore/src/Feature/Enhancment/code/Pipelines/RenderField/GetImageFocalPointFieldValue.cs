using System.Diagnostics.CodeAnalysis;
using easyJet.Feature.SitecoreEnhancment.FieldRenderer;
using Sitecore.Pipelines.RenderField;
using Sitecore.Xml.Xsl;

namespace easyJet.Feature.SitecoreEnhancment.Pipelines.RenderField
{
    [ExcludeFromCodeCoverage]
    public class GetImageFocalPointFieldValue : GetImageFieldValue
    {
        /// <summary>
        /// Checks if <see cref="T:Sitecore.Pipelines.RenderField.RenderFieldArgs" /> carries image details.
        /// </summary>
        /// <param name="args">The rendering details.</param>
        /// <returns><c>true</c> if an image to be rendered;<c>false</c> otherwise.</returns>
        protected override bool IsImage(RenderFieldArgs args) => args.FieldTypeKey == "image with focal point";

        /// <summary>
        /// Creates the new instance of the <see cref="ImageFocalPointRender" /> class that will do the rendering part.
        /// </summary>
        /// <returns>The renderer.</returns>
        protected override ImageRenderer CreateRenderer() => new ImageFocalPointRenderer();
    }
}