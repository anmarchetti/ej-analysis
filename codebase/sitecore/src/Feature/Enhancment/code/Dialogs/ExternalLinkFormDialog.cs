using System;
using System.Collections.Specialized;
using System.Diagnostics.CodeAnalysis;
using easyJet.Feature.SitecoreEnhancment.Logging;
using Sitecore;
using Sitecore.DependencyInjection;
using Sitecore.Diagnostics;
using Sitecore.Shell.Applications.Dialogs.ExternalLink;
using Sitecore.Web.UI.HtmlControls;
using Sitecore.Web.UI.Sheer;
using Sitecore.Xml;

namespace easyJet.Feature.SitecoreEnhancment.Dialogs
{
    [ExcludeFromCodeCoverage]
    public class ExternalLinkFormDialog : ExternalLinkForm
    {
        private readonly ISitecoreEnhancmentLogger logger;

        private NameValueCollection customLinkAttributes;

        protected Checkbox NoFollow { get; set; }

        protected NameValueCollection CustomLinkAttributes
        {
            get
            {
                if (customLinkAttributes != null)
                {
                    return customLinkAttributes;
                }

                ParseCustomLink(GetLink());
                return customLinkAttributes;
            }
        }

        public ExternalLinkFormDialog()
        {
            logger = (ISitecoreEnhancmentLogger)ServiceLocator.ServiceProvider.GetService(typeof(ISitecoreEnhancmentLogger));
        }

        /// <summary>Raises the load event.</summary>
        /// <param name="e">
        /// The <see cref="T:System.EventArgs" /> instance containing the event data.
        /// </param>
        protected override void OnLoad(EventArgs e)
        {
            try
            {
                Assert.ArgumentNotNull(e, nameof(e));
                base.OnLoad(e);

                if (Context.ClientPage.IsEvent)
                {
                    return;
                }

                var rel = CustomLinkAttributes[Constants.Link.Attributes.Rel];
                NoFollow.Checked = rel == Constants.Link.RelValues.NoFollow;
            }
            catch (Exception ex)
            {
                logger.Error("Error occurred while loading External Link Form Dialog", ex, this);
            }
        }

        /// <summary>Handles a click on the OK button.</summary>
        /// <param name="sender">Sender object.</param>
        /// <param name="args">Event args.</param>
        protected override void OnOK(object sender, EventArgs args)
        {
            Assert.ArgumentNotNull(sender, nameof(sender));
            Assert.ArgumentNotNull(args, nameof(args));
            string path = GetPath();
            string attributeFromValue = GetLinkTargetAttributeFromValue(Target.Value, CustomTarget.Value);
            Packet packet = new Packet("link", Array.Empty<string>());
            SetAttribute(packet, Constants.Link.Attributes.Text, Text);
            SetAttribute(packet, Constants.Link.Attributes.LinkType, "external");
            SetAttribute(packet, Constants.Link.Attributes.Url, path);
            SetAttribute(packet, Constants.Link.Attributes.Anchor, string.Empty);
            SetAttribute(packet, Constants.Link.Attributes.Title, Title);
            SetAttribute(packet, Constants.Link.Attributes.Class, Class);
            SetAttribute(packet, Constants.Link.Attributes.Target, attributeFromValue);
            SetAttribute(packet, Constants.Link.Attributes.Rel, NoFollow.Checked ? Constants.Link.RelValues.NoFollow : string.Empty);
            Context.ClientPage.ClientResponse.SetDialogValue(packet.OuterXml);
            SheerResponse.CloseWindow();
        }

        /// <summary>The parse link.</summary>
        /// <param name="innerXml">The link.</param>
        private void ParseCustomLink(string innerXml)
        {
            try
            {
                Assert.ArgumentNotNull(innerXml, nameof(innerXml));
                customLinkAttributes = new NameValueCollection();
                if (!innerXml.StartsWith("<link"))
                {
                    return;
                }

                var xmlDocument = XmlUtil.LoadXml(innerXml);
                if (xmlDocument == null)
                {
                    return;
                }

                var node = xmlDocument.SelectSingleNode("/link");
                if (node == null)
                {
                    return;
                }

                customLinkAttributes[Constants.Link.Attributes.Rel] = XmlUtil.GetAttribute(Constants.Link.Attributes.Rel, node);
            }
            catch (Exception ex)
            {
                logger.Error($"Error occurred while parse xml link. Inner xml: {innerXml}", ex, this);
            }
        }

        /// <summary>Gets the path.</summary>
        /// <returns>The path.</returns>
        /// <contract>
        ///   <ensures condition="not null" />
        /// </contract>
        private string GetPath()
        {
            string url = Url.Value;
            if (url.Length > 0 && url.IndexOf("://", StringComparison.InvariantCulture) < 0 && !url.StartsWith("/", StringComparison.InvariantCulture))
            {
                url = "http://" + url;
            }

            return url;
        }
    }
}