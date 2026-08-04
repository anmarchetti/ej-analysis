using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Models.Domain.CancelAndCredit;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore;
using Sitecore.Data;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Services
{
    [Service(typeof(ICancelCreditSettingsService), Lifetime = Lifetime.Singleton)]
    public class CancelCreditSettingsService : ICancelCreditSettingsService
    {
        private readonly IHtmlCacheRepository cacheRepository;

        public CancelCreditSettingsService(IHtmlCacheRepository cacheRepository)
        {
            this.cacheRepository = cacheRepository;
        }

        /// <inheritdoc/>
        public CreditAndCashRefundSettings GetCancelCreditSetting()
        {
            return cacheRepository.GetOrAdd($"Destinations.Cache.CancelAndCreditSetting", () =>
            {
                var cancelAndCreditSettingsFolder = Context.Database.SelectSingleItem($"{Context.Site.RootPath}/Settings/*[@@templateId='{Constants.TemplateIds.CancelCreditSettingsFolder}']");

                return new CreditAndCashRefundSettings()
                {
                    AllowedAmountOfFailures = MainUtil.GetInt(cancelAndCreditSettingsFolder.Fields[Constants.Fields.CancelCreditSetting.AllowedAmountOfFailures].Value, 1),
                    EnableOneTimeUseCredit = MainUtil.GetBool(cancelAndCreditSettingsFolder.Fields[Constants.Fields.CancelCreditSetting.EnableOneTimeUseCredit].Value, false),
                    EnableAmendmentFee = MainUtil.GetBool(cancelAndCreditSettingsFolder.Fields[Constants.Fields.CancelCreditSetting.EnableAmendmentFee].Value, false),
                    ApplyOneTimeUseCreditForXOrMoreDaysBeforeDeparture = MainUtil.GetInt(cancelAndCreditSettingsFolder.Fields[Constants.Fields.CancelCreditSetting.ApplyOneTimeUseCreditForXOrMoreDaysBeforeDeparture].Value, 0),
                    ShowOnlyOriginalPaymentMethodForXOrMoreDaysBeforeDeparture = MainUtil.GetInt(cancelAndCreditSettingsFolder.Fields[Constants.Fields.CancelCreditSetting.ShowOnlyOriginalPaymentMethodForXOrMoreDaysBeforeDeparture].Value, 0),
                    CurrentRulesApplyForHolidaysBookedFrom = ((DateField)cancelAndCreditSettingsFolder.Fields[Constants.Fields.CancelCreditSetting.CurrentRulesApplyForHolidaysBookedFrom]).GetIsoDate(),
                    CurrentRulesAllowRefundsForXOrMoreDaysBeforeDeparture = MainUtil.GetInt(cancelAndCreditSettingsFolder.Fields[Constants.Fields.CancelCreditSetting.CurrentRulesAllowRefundsForXOrMoreDaysBeforeDeparture].Value, 0),
                    PreviousRulesAllowRefundsForXOrMoreDaysBeforeDeparture = MainUtil.GetInt(cancelAndCreditSettingsFolder.Fields[Constants.Fields.CancelCreditSetting.PreviousRulesAllowRefundsForXOrMoreDaysBeforeDeparture].Value, 0),
                    CancelAndCreditRules = GetSettings(cancelAndCreditSettingsFolder, Constants.TemplateIds.CancelCreditRulesFolder, x => new CancelCreditRule(x)),
                    CreditOnlyRules = GetSettings(cancelAndCreditSettingsFolder, Constants.TemplateIds.CreditOnlyRulesFolder, x => new CreditOnlyRule(x)),
                    ExemptionList = GetSettings(cancelAndCreditSettingsFolder, Constants.TemplateIds.ExemptionListsFolder, x => new ExemptionList(x))?.SelectMany(x => x.BookingReferences),
                };
            });
        }

        private IEnumerable<T> GetSettings<T>(Item cancelAndCreditSettingsFolder, ID settingTemplateId, Func<Item, T> creator)
        {
            var childFolder = cancelAndCreditSettingsFolder?.Children.FirstOrDefault(x => x.TemplateID == settingTemplateId);

            var result = childFolder?.Children.Select(x => creator(x)).ToList();

            return result;
        }
    }
}