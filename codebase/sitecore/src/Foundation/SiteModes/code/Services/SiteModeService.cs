using System;
using System.Collections.Generic;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Multisite;
using easyJet.Foundation.Multisite.Services;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SiteModes.Models.Domain;
using Sitecore;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;

namespace easyJet.Foundation.SiteModes.Services
{
    [Service(typeof(ISiteModeService))]
    public class SiteModeService : ISiteModeService
    {
        private readonly IMarketSettingsService marketSettingService;
        private readonly IHtmlCacheRepository repository;
        private readonly ISitecoreContext context;

        public SiteModeService(IMarketSettingsService marketSettingService, IHtmlCacheRepository repository, ISitecoreContext context)
        {
            this.marketSettingService = marketSettingService;
            this.repository = repository;
            this.context = context;
        }

        /// <inheritdoc/>
        public bool IsFullMode()
        {
            return GetModes().IsFullMode;
        }

        /// <inheritdoc/>
        public bool IsSoftMode()
        {
            return GetModes().IsSoftMode;
        }

        /// <inheritdoc/>
        public Modes GetModes()
        {
            var maintenanceModeSettings = GetSettings();
            var globalMode = BuildMode(maintenanceModeSettings);

            if (globalMode.IsSoftMode || globalMode.IsFullMode)
            {
                return globalMode;
            }

            MaintenanceModePerMarkets mode = null;
            var currentMarket = marketSettingService.GetCurrentMarket();
            if (currentMarket != null)
            {
                maintenanceModeSettings.MaintenanceModePerMarkets.TryGetValue(currentMarket.Code, out mode);
            }

            return BuildMode(mode ?? new MaintenanceModePerMarkets());
        }

        /// <summary>
        /// Build maintenance modes model.
        /// </summary>
        /// <param name="mode">Mode settings.</param>
        /// <returns>Maintenance modes.</returns>
        private static Modes BuildMode(BaseMaintenanceMode mode)
        {
            var modes = new Modes()
            {
                IsFullMode = CheckRange(mode.FullFrom, mode.FullTo),
                IsSoftMode = CheckRange(mode.SoftFrom, mode.SoftTo)
            };

            return modes;

            bool CheckRange(DateTime from, DateTime to) => DateUtil.ToServerTime(from) <= DateTime.Now && DateUtil.ToServerTime(to) >= DateTime.Now;
        }

        /// <summary>
        /// Get maintenance mode settings.
        /// </summary>
        /// <returns>Maintenance mode settings.</returns>
        private MaintenanceModeSettings GetSettings()
        {
            return repository.GetOrAdd("easyJet.Foundation.MaintenanceModeSettings", () =>
            {
                var maintenanceModePerMarkets = new Dictionary<string, MaintenanceModePerMarkets>();

                var query = GetMaintenanceModeQuery();
                var globalMaintenanceMode = context.Database.SelectSingleItem(query);
                if (globalMaintenanceMode != null)
                {
                    foreach (Item item in globalMaintenanceMode?.Children)
                    {
                        var market = ((LookupField)item.Fields[Constants.Fields.MaintenanceModeSettings.Market])?.TargetItem;
                        if (market != null)
                        {
                            var marketCode = market[Constants.Fields.Market.Code];
                            if (!maintenanceModePerMarkets.ContainsKey(marketCode))
                            {
                                maintenanceModePerMarkets.Add(marketCode, new MaintenanceModePerMarkets(item, marketCode));
                            }
                        }
                    }
                }

                return new MaintenanceModeSettings(globalMaintenanceMode)
                {
                    MaintenanceModePerMarkets = maintenanceModePerMarkets
                };
            });
        }

        private string GetMaintenanceModeQuery()
        {
            return $"{context.Site.RootPath}/*[@@templateid ='{Templates.Settings.Id}']/*[@@templateid ='{Constants.TemplateIds.GlobalMaintenanceMode}']";
        }
    }
}