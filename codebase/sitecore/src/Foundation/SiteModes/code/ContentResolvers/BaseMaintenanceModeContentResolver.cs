using System;
using easyJet.Foundation.SitecoreExtensions.Logger;
using easyJet.Foundation.SiteModes.Services;
using Sitecore;
using Sitecore.LayoutService.Configuration;
using Sitecore.LayoutService.ItemRendering.ContentsResolvers;
using Sitecore.Mvc.Presentation;
using RenderingContentsResolver = easyJet.Foundation.SitecoreExtensions.ContentResolvers.RenderingContentsResolver;

namespace easyJet.Foundation.SiteModes.ContentResolvers
{
    public class BaseMaintenanceModeContentResolver : RenderingContentsResolver, IRenderingContentsResolver
    {
        private readonly ISiteModeService service;

        /// <summary>
        /// Gets a value indicating whether that current state is in maintenance mode.
        /// </summary>
        public bool IsInMaintenanceMode
        {
            get
            {
                var modes = service.GetModes();
                return modes.IsFullMode || modes.IsSoftMode;
            }
        }

        protected ILogger Logger { get; }

        /// <summary>
        /// Gets or sets action for content resolving.
        /// </summary>
        protected virtual Func<Rendering, IRenderingConfiguration, object> ExecuteContentResolvingAction { get; set; }

        public BaseMaintenanceModeContentResolver(ISiteModeService service, ILogger logger)
        {
            this.service = service;
            Logger = logger;
        }

        /// <summary>
        /// Get content by mode.
        /// </summary>
        /// <param name="rendering">Sitecore rendering item.</param>
        /// <param name="renderingConfig">Sitecore rendering config.</param>
        /// <param name="isInMode">Is in mode parameter.</param>
        /// <returns>Resolved maintenance mode content.</returns>
        public object GetContentByMode(Rendering rendering, IRenderingConfiguration renderingConfig, bool isInMode)
        {
            try
            {
                return !Context.PageMode.IsNormal || isInMode ? GetContent(rendering, renderingConfig) : null;
            }
            catch (Exception exc)
            {
                Logger.Error($"{nameof(BaseMaintenanceModeContentResolver)} cannot resolve content", exc, this);
                return null;
            }
        }

        /// <summary>
        /// Get content for content resolving implementation.
        /// </summary>
        /// <param name="rendering">Sitecore rendering item.</param>
        /// <param name="renderingConfig">Sitecore rendering config.</param>
        /// <returns>Resolved content.</returns>
        protected object GetContent(Rendering rendering, IRenderingConfiguration renderingConfig)
        {
            return ExecuteContentResolvingAction == null ? base.ResolveContents(rendering, renderingConfig) : ExecuteContentResolvingAction(rendering, renderingConfig);
        }
    }
}