using System.Collections.Generic;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Models;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore;
using Sitecore.Abstractions;
using Sitecore.Data;
using Sitecore.Data.Fields;
using Constants = easyJet.Foundation.Destinations.Constants;

namespace easyJet.Foundation.Atcom.Services.Sync
{
    [Service(typeof(IExcludeDataObjectsSettingsService), Lifetime = Lifetime.Singleton)]
    public class AtcomExcludeDataObjectsSettingsService : IExcludeDataObjectsSettingsService
    {
        private readonly ICsvUtilsService csvUtilsService;
        private readonly BaseSettings settingsService;

        public AtcomExcludeDataObjectsSettingsService(ICsvUtilsService csvUtilsService, BaseSettings settings)
        {
            this.csvUtilsService = csvUtilsService;
            settingsService = settings;
        }

        public HashSet<string> GetCodes()
        {
            if (Context.Items[nameof(AtcomExcludeDataObjectsService)] != null)
            {
                return (HashSet<string>)Context.Items[nameof(AtcomExcludeDataObjectsService)];
            }

            var settingsPath = settingsService.GetSetting(Constants.Atcom.SettingsPathSettingName);
            var settingsItem = Database.GetDatabase("master").GetItem(settingsPath);
            var codes = new HashSet<string>();
            var fileItem = new FileField(settingsItem.Fields[Constants.Atcom.Fields.CodesToIgnore])?.MediaItem;
            if (fileItem == null)
            {
                return codes;
            }

            using (var mediaStream = new CsvFile(fileItem))
            {
                var entries = csvUtilsService.ReadFromCsv<ExcludeDataObjectsCsvModel>(mediaStream.Stream);
                foreach (var entry in entries)
                {
                    codes.Add(entry.Code.ToLower());
                }
            }

            Context.Items[nameof(AtcomExcludeDataObjectsService)] = codes;

            return codes;
        }
    }
}