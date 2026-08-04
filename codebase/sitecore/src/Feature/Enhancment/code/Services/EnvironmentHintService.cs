using System;
using System.Web.UI;
using System.Web.UI.HtmlControls;
using easyJet.Feature.SitecoreEnhancment.Logging;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Web.UI.HtmlControls;

namespace easyJet.Feature.SitecoreEnhancment.Services
{
    [Service(typeof(IEnvironmentHintService), Lifetime = Lifetime.Transient)]
    public class EnvironmentHintService : IEnvironmentHintService
    {
        private readonly ISitecoreEnhancmentLogger logger;
        private readonly IEnvironmentHintSettingsService settings;
        private readonly IPageScriptManagerProvider pageScriptManagerProvider;
        private readonly ISitecoreContextProvider sitecoreContextProvider;

        public EnvironmentHintService(
            ISitecoreEnhancmentLogger logger,
            IEnvironmentHintSettingsService settings,
            IPageScriptManagerProvider pageScriptManagerProvider,
            ISitecoreContextProvider sitecoreContextProvider)
        {
            this.logger = logger;
            this.settings = settings;
            this.pageScriptManagerProvider = pageScriptManagerProvider;
            this.sitecoreContextProvider = sitecoreContextProvider;
        }

        public void AddEnvironmentStyle()
        {
            if (string.IsNullOrEmpty(settings.EnvironmentName)
                  || string.IsNullOrEmpty(settings.FontColor)
                  || string.IsNullOrEmpty(settings.BackgroundColor)
                  || string.IsNullOrEmpty(settings.Paths))
            {
                return;
            }

            if (settings.Paths.IndexOf(sitecoreContextProvider.Page.Page.AppRelativeVirtualPath, StringComparison.InvariantCultureIgnoreCase) < 0)
            {
                return;
            }

            try
            {
                if (sitecoreContextProvider.Items["sc_pagescriptmanager"] != null)
                {
                    pageScriptManagerProvider.Current.StylesheetFiles.Add(new StylesheetFile { Block = EnvironmentStyle(false) });
                    return;
                }

                if (sitecoreContextProvider.Page.Page.Controls.Count > 0)
                {
                    var control = new LiteralControl(EnvironmentStyle(true));

                    foreach (System.Web.UI.Control pageControl in sitecoreContextProvider.Page.Page.Controls)
                    {
                        if (!(pageControl is HtmlHead))
                        {
                            continue;
                        }

                        pageControl.Controls.Add(control);
                        break;
                    }
                }
            }
            catch (Exception exception)
            {
                logger.Error($"{nameof(AddEnvironmentStyle)}", exception, this);
            }
        }

        private string EnvironmentCss =>
            $@".logo-wrap::after,
 .sc-globalHeader::before {{
                 color: {settings.FontColor};
                 font-weight: bold;
                 font-size: 1.5em;
                 content: ""{settings.EnvironmentName}"";
                 text-transform: uppercase;
                 position: absolute;                 
             }}
            .sc-globalHeader::before {{
                left: 45%;
                margin-top: -4px;
            }}
            .logo-wrap::after {{
                margin-top: 50px;
                margin-left: -215px;
            }}
            .sc-globalHeader {{
                background-color: {settings.BackgroundColor} !important;
            }}
            .sc-globalHeader .sc-ext-dbName {{
                width: auto !important;
                margin-top: 10px !important;
                position: absolute !important;
                left: 45% !important;
                font-size: 0.9em !important;
            }}";

        private string EnvironmentStyle(bool includeScriptTag = false)
        {
            return includeScriptTag
                ? $"<style>{EnvironmentCss}</style>"
                : EnvironmentCss;
        }
    }
}