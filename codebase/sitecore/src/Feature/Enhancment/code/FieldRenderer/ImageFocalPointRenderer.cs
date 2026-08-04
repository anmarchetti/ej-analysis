using easyJet.Feature.SitecoreEnhancment.Fields;
using HtmlAgilityPack;
using Sitecore;
using Sitecore.Data.Fields;
using Sitecore.Diagnostics;
using Sitecore.Xml.Xsl;

namespace easyJet.Feature.SitecoreEnhancment.FieldRenderer
{
    public class ImageFocalPointRenderer : ImageRenderer
    {
        /// <summary>
        /// Desktop focal point X coordinate.
        /// </summary>
        private string dfx;

        /// <summary>
        /// Desktop focal point Y coordinate.
        /// </summary>
        private string dfy;

        /// <summary>
        /// Mobile focal point X coordinate.
        /// </summary>
        private string mfx;

        /// <summary>
        /// Mobile focal point Y coordinate.
        /// </summary>
        private string mfy;

        /// <summary>Renders this instance.</summary>
        /// <returns>The render.</returns>
        public override RenderFieldResult Render()
        {
            var imageRendering = base.Render();

            if (imageRendering.IsEmpty || Item == null)
            {
                return RenderFieldResult.Empty;
            }

            Field field = Item.Fields[FieldName];
            if (field != null)
            {
                var imageFocalPointField = new ImageFocalPointField(field, FieldValue);
                ParseField(imageFocalPointField);
            }

            var htmlDoc = new HtmlDocument();
            htmlDoc.LoadHtml(imageRendering.FirstPart);

            var imageNode = htmlDoc.DocumentNode.SelectSingleNode("//img");
            imageNode.Attributes.Add("mfx", mfx);
            imageNode.Attributes.Add("mfy", mfy);
            imageNode.Attributes.Add("dfx", dfx);
            imageNode.Attributes.Add("dfy", dfy);

            return new RenderFieldResult(imageNode.OuterHtml);
        }

        protected void ParseField(ImageFocalPointField imageFieldParse)
        {
            Assert.ArgumentNotNull(imageFieldParse, nameof(imageFieldParse));

            mfx = StringUtil.GetString(new string[2] { mfx, imageFieldParse.MobileFocalX });
            mfy = StringUtil.GetString(new string[2] { mfy, imageFieldParse.MobileFocalY });
            dfx = StringUtil.GetString(new string[2] { dfx, imageFieldParse.DesktopFocalX });
            dfy = StringUtil.GetString(new string[2] { dfy, imageFieldParse.DesktopFocalY });
        }
    }
}