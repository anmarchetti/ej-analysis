using System;
using System.Collections.Generic;
using System.Linq;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Models.Domain.CancelAndCredit;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyjet.Foundation.Testing.Attributes;
using FluentAssertions;
using NSubstitute;
using Sitecore;
using Sitecore.Data;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Sites;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Services
{
    public class CancelCreditSettingsServiceTests
    {
        private readonly CancelCreditSettingsService service;
        private readonly IHtmlCacheRepository cacheRepository;

        public CancelCreditSettingsServiceTests()
        {
            cacheRepository = Substitute.ForPartsOf<HtmlCacheRepository>();
            service = new CancelCreditSettingsService(cacheRepository);
        }

        [Theory]
        [AutoDbData]
        public void GetCancelAndCreditRules_ShouldReturnAllCancelCreditSettings_IfCancelCreditSettingsExists(Db db, List<string> destinationAirportsCodes)
        {
            // Arrange
            var startDate = new DateTime(2020, 10, 10);
            var endDate = new DateTime(2021, 10, 10);
            var rulesDate = new DateTime(2022, 11, 01);

            var expectedRules = new List<CancelCreditRule>()
            {
                new CancelCreditRule(null)
                {
                    Active = new DateRange()
                    {
                        Start = DateUtil.ToIsoDate(startDate),
                        End = DateUtil.ToIsoDate(endDate)
                    },
                    DaysBeforeDeparture = 5,
                    DestinationAirports = destinationAirportsCodes,
                    BookingDepartureDateFrom = DateUtil.ToIsoDate(startDate),
                    BookingDepartureDateTo = DateUtil.ToIsoDate(endDate),
                    DateOfChangeFrom = DateUtil.ToIsoDate(startDate),
                    DateOfChangeTo = DateUtil.ToIsoDate(endDate),
                    AllowCancelPartialRefundLess28Days = true
                }
            };

            var expectedResult = new CreditAndCashRefundSettings()
            {
                CancelAndCreditRules = expectedRules,
                CurrentRulesAllowRefundsForXOrMoreDaysBeforeDeparture = 60,
                CurrentRulesApplyForHolidaysBookedFrom = DateUtil.ToIsoDate(rulesDate),
                PreviousRulesAllowRefundsForXOrMoreDaysBeforeDeparture = 28,
                ApplyOneTimeUseCreditForXOrMoreDaysBeforeDeparture = 60,
                ShowOnlyOriginalPaymentMethodForXOrMoreDaysBeforeDeparture = 27,
                EnableOneTimeUseCredit = true,
                EnableAmendmentFee = true,
                AllowedAmountOfFailures = 1
            };

            List<DbItem> airports = new List<DbItem>();

            foreach (var code in destinationAirportsCodes)
            {
                var airportDbItem = new DbItem($"Fake airport {code}");
                airportDbItem.Fields.Add(new DbField(Constants.Fields.DatasourceItem.Code) { Value = code });
                airports.Add(airportDbItem);
                db.Add(airportDbItem);
            }

            var settingsFolderDbItem = new DbItem("Settings");
            var eligibleForCancelAndCreditFolderDbItem = new DbItem("Eligible for cancel and credit rules fake folder", ID.NewID, Constants.TemplateIds.CancelCreditSettingsFolder);
            eligibleForCancelAndCreditFolderDbItem.Fields.Add(new DbField(Constants.Fields.CancelCreditSetting.CurrentRulesApplyForHolidaysBookedFrom) { Value = expectedResult.CurrentRulesApplyForHolidaysBookedFrom });
            eligibleForCancelAndCreditFolderDbItem.Fields.Add(new DbField(Constants.Fields.CancelCreditSetting.CurrentRulesAllowRefundsForXOrMoreDaysBeforeDeparture) { Value = expectedResult.CurrentRulesAllowRefundsForXOrMoreDaysBeforeDeparture.ToString() });
            eligibleForCancelAndCreditFolderDbItem.Fields.Add(new DbField(Constants.Fields.CancelCreditSetting.PreviousRulesAllowRefundsForXOrMoreDaysBeforeDeparture) { Value = expectedResult.PreviousRulesAllowRefundsForXOrMoreDaysBeforeDeparture.ToString() });
            eligibleForCancelAndCreditFolderDbItem.Fields.Add(new DbField(Constants.Fields.CancelCreditSetting.ApplyOneTimeUseCreditForXOrMoreDaysBeforeDeparture) { Value = expectedResult.ApplyOneTimeUseCreditForXOrMoreDaysBeforeDeparture.ToString() });
            eligibleForCancelAndCreditFolderDbItem.Fields.Add(new DbField(Constants.Fields.CancelCreditSetting.ShowOnlyOriginalPaymentMethodForXOrMoreDaysBeforeDeparture) { Value = expectedResult.ShowOnlyOriginalPaymentMethodForXOrMoreDaysBeforeDeparture.ToString() });
            eligibleForCancelAndCreditFolderDbItem.Fields.Add(new DbField(Constants.Fields.CancelCreditSetting.EnableOneTimeUseCredit) { Value = expectedResult.EnableOneTimeUseCredit.ToString() });
            eligibleForCancelAndCreditFolderDbItem.Fields.Add(new DbField(Constants.Fields.CancelCreditSetting.EnableAmendmentFee) { Value = expectedResult.EnableAmendmentFee.ToString() });
            eligibleForCancelAndCreditFolderDbItem.Fields.Add(new DbField(Constants.Fields.CancelCreditSetting.AllowedAmountOfFailures) { Value = expectedResult.AllowedAmountOfFailures.ToString() });

            var cancelAndCreditRulesFolderDbItem = new DbItem("Cancel and credit Rules", ID.NewID, Constants.TemplateIds.CancelCreditRulesFolder);

            var eligibleForCancelAndCreditRuleDbItem = new DbItem("Fake eligible for cancel and credit rule", ID.NewID);
            eligibleForCancelAndCreditRuleDbItem.Fields.Add(new DbField(Constants.Fields.BaseCreditSetting.ActivationDateFrom) { Value = expectedRules[0].Active.Start });
            eligibleForCancelAndCreditRuleDbItem.Fields.Add(new DbField(Constants.Fields.BaseCreditSetting.ActivationDateTo) { Value = expectedRules[0].Active.End });
            eligibleForCancelAndCreditRuleDbItem.Fields.Add(new DbField(Constants.Fields.BaseCreditSetting.NumberOfDays) { Value = expectedRules[0].DaysBeforeDeparture.ToString() });
            eligibleForCancelAndCreditRuleDbItem.Fields.Add(new DbField(Constants.Fields.BaseCreditSetting.DestinationAirports) { Value = string.Join("|", airports.Select(x => x.ID)) });
            eligibleForCancelAndCreditRuleDbItem.Fields.Add(new DbField(Constants.Fields.BaseCreditSetting.BookingDepartureDateFrom) { Value = expectedRules[0].BookingDepartureDateFrom });
            eligibleForCancelAndCreditRuleDbItem.Fields.Add(new DbField(Constants.Fields.BaseCreditSetting.BookingDepartureDateTo) { Value = expectedRules[0].BookingDepartureDateTo });
            eligibleForCancelAndCreditRuleDbItem.Fields.Add(new DbField(Constants.Fields.BaseCreditSetting.DateOfChangeFrom) { Value = expectedRules[0].DateOfChangeFrom });
            eligibleForCancelAndCreditRuleDbItem.Fields.Add(new DbField(Constants.Fields.BaseCreditSetting.DateOfChangeTo) { Value = expectedRules[0].DateOfChangeTo });
            eligibleForCancelAndCreditRuleDbItem.Fields.Add(new DbField(Constants.Fields.CancelCreditSetting.AllowCancelPartialRefundLess28Days) { Value = expectedRules[0].AllowCancelPartialRefundLess28Days.ToString() });

            cancelAndCreditRulesFolderDbItem.Add(eligibleForCancelAndCreditRuleDbItem);
            eligibleForCancelAndCreditFolderDbItem.Add(cancelAndCreditRulesFolderDbItem);
            settingsFolderDbItem.Add(eligibleForCancelAndCreditFolderDbItem);
            db.Add(settingsFolderDbItem);

            CreditAndCashRefundSettings settings = null;
            cacheRepository.GetItem<CreditAndCashRefundSettings>(Arg.Any<string>()).Returns(settings);
            cacheRepository.StoreItem(Arg.Any<string>(), Arg.Any<CreditAndCashRefundSettings>()).Returns(settings);

            var fakeSiteContext = new FakeSiteContext(
               new Sitecore.Collections.StringDictionary
               {
                    { "name", "fake" },
                    { "database", "master" },
                    { "rootPath", "/sitecore/content" }
               });
            using (new FakeSiteContextSwitcher(fakeSiteContext))
            {
                // Act
                var result = service.GetCancelCreditSetting();
                var rules = result.CancelAndCreditRules.ToArray();

                result.CurrentRulesApplyForHolidaysBookedFrom.Should().Be(DateUtil.ToServerTime(rulesDate).ToString("o"));
                result.CurrentRulesAllowRefundsForXOrMoreDaysBeforeDeparture.Should().Be(expectedResult.CurrentRulesAllowRefundsForXOrMoreDaysBeforeDeparture);
                result.PreviousRulesAllowRefundsForXOrMoreDaysBeforeDeparture.Should().Be(expectedResult.PreviousRulesAllowRefundsForXOrMoreDaysBeforeDeparture);

                // Assert
                rules[0].Active.Start.Should().Be(DateUtil.ToServerTime(startDate).ToString("o"));
                rules[0].Active.End.Should().Be(DateUtil.ToServerTime(endDate).ToString("o"));
                rules[0].DaysBeforeDeparture.Should().Be(expectedRules[0].DaysBeforeDeparture);
                rules[0].DestinationAirports.Should().HaveCount(destinationAirportsCodes.Count);
                for (int i = 0; i < destinationAirportsCodes.Count; i++)
                {
                    rules[0].DestinationAirports.ElementAt(i).Should().Be(expectedRules[0].DestinationAirports.ElementAt(i));
                }

                rules[0].BookingDepartureDateFrom.Should().Be(DateUtil.ToServerTime(startDate).ToString("o"));
                rules[0].BookingDepartureDateTo.Should().Be(DateUtil.ToServerTime(endDate).ToString("o"));
                rules[0].DateOfChangeFrom.Should().Be(DateUtil.ToServerTime(startDate).ToString("o"));
                rules[0].DateOfChangeTo.Should().Be(DateUtil.ToServerTime(endDate).ToString("o"));
                rules[0].AllowCancelPartialRefundLess28Days.Should().Be(expectedRules[0].AllowCancelPartialRefundLess28Days);
            }
        }

        [Theory]
        [AutoData]
        public void GetCancelAndCreditRules_ShouldReturnAllCancelCreditSettigns_IfCancelCreditSettingsDataInCache(List<string> destinationAirportsCodes)
        {
            // Arrange
            var startDate = new DateTime(2020, 10, 10);
            var endDate = new DateTime(2021, 10, 10);

            var expectedResult = new List<CancelCreditRule>()
            {
                new CancelCreditRule(null)
                {
                    Active = new DateRange()
                    {
                        Start = startDate.ToString(),
                        End = endDate.ToString()
                    },
                    DaysBeforeDeparture = 5,
                    DestinationAirports = destinationAirportsCodes,
                    BookingDepartureDateFrom = startDate.ToString(),
                    BookingDepartureDateTo = endDate.ToString(),
                    DateOfChangeFrom = startDate.ToString(),
                    DateOfChangeTo = endDate.ToString(),
                }
            };

            var settings = new CreditAndCashRefundSettings()
            {
                CancelAndCreditRules = expectedResult
            };

            cacheRepository.GetItem<CreditAndCashRefundSettings>(Arg.Any<string>()).Returns(settings);

            // Act
            var act = service.GetCancelCreditSetting().CancelAndCreditRules.ToArray();

            // Assert
            act[0].Active.Start.Should().Be(expectedResult[0].Active.Start);
            act[0].Active.End.Should().Be(expectedResult[0].Active.End);
            act[0].DaysBeforeDeparture.Should().Be(expectedResult[0].DaysBeforeDeparture);
            act[0].DestinationAirports.Should().HaveCount(destinationAirportsCodes.Count);
            for (int i = 0; i < destinationAirportsCodes.Count; i++)
            {
                act[0].DestinationAirports.ElementAt(i).Should().Be(expectedResult[0].DestinationAirports.ElementAt(i));
            }

            act[0].BookingDepartureDateFrom.Should().Be(expectedResult[0].BookingDepartureDateFrom);
            act[0].BookingDepartureDateTo.Should().Be(expectedResult[0].BookingDepartureDateTo);

            act[0].DateOfChangeFrom.Should().Be(expectedResult[0].DateOfChangeFrom);
            act[0].DateOfChangeTo.Should().Be(expectedResult[0].DateOfChangeTo);
        }

        [Theory]
        [AutoDbData]
        public void GetExemptionLists_ShouldReturnAllBookingReferences_IfExemptionListsExist(Db db, string[] bookingReferences)
        {
            // Arrange
            CreditAndCashRefundSettings settings = null;
            cacheRepository.GetItem<CreditAndCashRefundSettings>(Arg.Any<string>()).Returns(settings);
            cacheRepository.StoreItem(Arg.Any<string>(), Arg.Any<CreditAndCashRefundSettings>()).Returns(settings);

            var expectedResult = new ExemptionList(null) { BookingReferences = bookingReferences };

            var settingsFolderDbItem = new DbItem("Settings");
            var cancelAndCreditSettingsFolder = new DbItem("Cancel And credit Settigns", ID.NewID, Constants.TemplateIds.CancelCreditSettingsFolder);
            cancelAndCreditSettingsFolder.Fields.Add(new DbField(Constants.Fields.CancelCreditSetting.CurrentRulesApplyForHolidaysBookedFrom) { Value = DateUtil.ToIsoDate(new DateTime(2022, 11, 01)) });
            cancelAndCreditSettingsFolder.Fields.Add(new DbField(Constants.Fields.CancelCreditSetting.CurrentRulesAllowRefundsForXOrMoreDaysBeforeDeparture) { Value = 60.ToString() });
            cancelAndCreditSettingsFolder.Fields.Add(new DbField(Constants.Fields.CancelCreditSetting.PreviousRulesAllowRefundsForXOrMoreDaysBeforeDeparture) { Value = 28.ToString() });
            cancelAndCreditSettingsFolder.Fields.Add(new DbField(Constants.Fields.CancelCreditSetting.ApplyOneTimeUseCreditForXOrMoreDaysBeforeDeparture) { Value = 60.ToString() });
            cancelAndCreditSettingsFolder.Fields.Add(new DbField(Constants.Fields.CancelCreditSetting.ShowOnlyOriginalPaymentMethodForXOrMoreDaysBeforeDeparture) { Value = 27.ToString() });
            cancelAndCreditSettingsFolder.Fields.Add(new DbField(Constants.Fields.CancelCreditSetting.EnableOneTimeUseCredit) { Value = true.ToString() });
            cancelAndCreditSettingsFolder.Fields.Add(new DbField(Constants.Fields.CancelCreditSetting.EnableAmendmentFee) { Value = true.ToString() });
            cancelAndCreditSettingsFolder.Fields.Add(new DbField(Constants.Fields.CancelCreditSetting.AllowedAmountOfFailures) { Value = 1.ToString() });

            var exemptionListsFolderDbItem = new DbItem("Exemption Lists", ID.NewID, Constants.TemplateIds.ExemptionListsFolder);

            var exemptionListDbItem = new DbItem("Exemption List", ID.NewID);
            exemptionListDbItem.Fields.Add(new DbField(Constants.Fields.ExemptionList.BookingReferences) { Value = string.Join(",", expectedResult.BookingReferences) });

            exemptionListsFolderDbItem.Add(exemptionListDbItem);
            cancelAndCreditSettingsFolder.Add(exemptionListsFolderDbItem);
            settingsFolderDbItem.Add(cancelAndCreditSettingsFolder);
            db.Add(settingsFolderDbItem);

            List<ExemptionList> cache = null;
            cacheRepository.GetItem<List<ExemptionList>>(Arg.Any<string>()).Returns(cache);

            var fakeSiteContext = new FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                {
                    { "name", "fake" },
                    { "database", "master" },
                    { "rootPath", "/sitecore/content" }
                });

            using (new FakeSiteContextSwitcher(fakeSiteContext))
            {
                // Act
                var act = service.GetCancelCreditSetting().ExemptionList.ToArray();

                // Assert
                for (int i = 0; i < bookingReferences.Length; i++)
                {
                    act[i].Should().Be(bookingReferences[i]);
                }
            }
        }

        [Theory]
        [AutoData]
        public void GetExemptionLists_ShouldReturnAllBookingReferences_IfExemptionListsDataInCache(string[] bookingReferences)
        {
            // Arrange
            var settings = new CreditAndCashRefundSettings()
            {
                ExemptionList = bookingReferences
            };

            cacheRepository.GetItem<CreditAndCashRefundSettings>(Arg.Any<string>()).Returns(settings);

            // Act
            var act = service.GetCancelCreditSetting().ExemptionList.ToArray();

            // Assert
            for (int i = 0; i < bookingReferences.Length; i++)
            {
                act[i].Should().Be(bookingReferences[i]);
            }
        }

        [Theory]
        [AutoDbData]
        public void GetCreditOnlyRules_ShouldReturnAllCreditSettings_IfCreditSettingsExists(Db db, List<string> destinationAirportsCodes)
        {
            // Arrange
            var startDate = new DateTime(2020, 10, 10);
            var endDate = new DateTime(2021, 10, 10);
            var rulesDate = new DateTime(2022, 11, 01);

            var expectedRules = new List<CreditOnlyRule>()
            {
                new CreditOnlyRule(null)
                {
                    Active = new DateRange()
                    {
                        Start = DateUtil.ToIsoDate(startDate),
                        End = DateUtil.ToIsoDate(endDate)
                    },
                    DaysBeforeDeparture = 5,
                    DestinationAirports = destinationAirportsCodes,
                    BookingDepartureDateFrom = DateUtil.ToIsoDate(startDate),
                    BookingDepartureDateTo = DateUtil.ToIsoDate(endDate),
                    DateOfChangeFrom = DateUtil.ToIsoDate(startDate),
                    DateOfChangeTo = DateUtil.ToIsoDate(endDate),
                }
            };
            var expectedResult = new CreditAndCashRefundSettings()
            {
                CreditOnlyRules = expectedRules,
                CurrentRulesAllowRefundsForXOrMoreDaysBeforeDeparture = 60,
                CurrentRulesApplyForHolidaysBookedFrom = DateUtil.ToIsoDate(rulesDate),
                PreviousRulesAllowRefundsForXOrMoreDaysBeforeDeparture = 28,
                ApplyOneTimeUseCreditForXOrMoreDaysBeforeDeparture = 60,
                ShowOnlyOriginalPaymentMethodForXOrMoreDaysBeforeDeparture = 27,
                EnableOneTimeUseCredit = true,
                EnableAmendmentFee = true,
                AllowedAmountOfFailures = 1
            };

            List<DbItem> airports = new List<DbItem>();

            foreach (var code in destinationAirportsCodes)
            {
                var airportDbItem = new DbItem($"Fake airport {code}");
                airportDbItem.Fields.Add(new DbField(Constants.Fields.DatasourceItem.Code) { Value = code });
                airports.Add(airportDbItem);
                db.Add(airportDbItem);
            }

            var settingsFolderDbItem = new DbItem("Settings");
            var eligibleForCancelAndCreditFolderDbItem = new DbItem("Eligible for cancel and credit rules fake folder", ID.NewID, Constants.TemplateIds.CancelCreditSettingsFolder);
            eligibleForCancelAndCreditFolderDbItem.Fields.Add(new DbField(Constants.Fields.CancelCreditSetting.CurrentRulesApplyForHolidaysBookedFrom) { Value = expectedResult.CurrentRulesApplyForHolidaysBookedFrom });
            eligibleForCancelAndCreditFolderDbItem.Fields.Add(new DbField(Constants.Fields.CancelCreditSetting.CurrentRulesAllowRefundsForXOrMoreDaysBeforeDeparture) { Value = expectedResult.CurrentRulesAllowRefundsForXOrMoreDaysBeforeDeparture.ToString() });
            eligibleForCancelAndCreditFolderDbItem.Fields.Add(new DbField(Constants.Fields.CancelCreditSetting.PreviousRulesAllowRefundsForXOrMoreDaysBeforeDeparture) { Value = expectedResult.PreviousRulesAllowRefundsForXOrMoreDaysBeforeDeparture.ToString() });
            eligibleForCancelAndCreditFolderDbItem.Fields.Add(new DbField(Constants.Fields.CancelCreditSetting.ApplyOneTimeUseCreditForXOrMoreDaysBeforeDeparture) { Value = expectedResult.ApplyOneTimeUseCreditForXOrMoreDaysBeforeDeparture.ToString() });
            eligibleForCancelAndCreditFolderDbItem.Fields.Add(new DbField(Constants.Fields.CancelCreditSetting.ShowOnlyOriginalPaymentMethodForXOrMoreDaysBeforeDeparture) { Value = expectedResult.ShowOnlyOriginalPaymentMethodForXOrMoreDaysBeforeDeparture.ToString() });
            eligibleForCancelAndCreditFolderDbItem.Fields.Add(new DbField(Constants.Fields.CancelCreditSetting.EnableOneTimeUseCredit) { Value = expectedResult.EnableOneTimeUseCredit.ToString() });
            eligibleForCancelAndCreditFolderDbItem.Fields.Add(new DbField(Constants.Fields.CancelCreditSetting.EnableAmendmentFee) { Value = expectedResult.EnableAmendmentFee.ToString() });
            eligibleForCancelAndCreditFolderDbItem.Fields.Add(new DbField(Constants.Fields.CancelCreditSetting.AllowedAmountOfFailures) { Value = expectedResult.AllowedAmountOfFailures.ToString() });

            var cancelAndCreditRulesFolderDbItem = new DbItem("Cancel and credit Rules", ID.NewID, Constants.TemplateIds.CreditOnlyRulesFolder);

            var eligibleForCancelAndCreditRuleDbItem = new DbItem("Fake eligible for cancel and credit rule", ID.NewID);
            eligibleForCancelAndCreditRuleDbItem.Fields.Add(new DbField(Constants.Fields.BaseCreditSetting.ActivationDateFrom) { Value = expectedRules[0].Active.Start });
            eligibleForCancelAndCreditRuleDbItem.Fields.Add(new DbField(Constants.Fields.BaseCreditSetting.ActivationDateTo) { Value = expectedRules[0].Active.End });
            eligibleForCancelAndCreditRuleDbItem.Fields.Add(new DbField(Constants.Fields.BaseCreditSetting.NumberOfDays) { Value = expectedRules[0].DaysBeforeDeparture.ToString() });
            eligibleForCancelAndCreditRuleDbItem.Fields.Add(new DbField(Constants.Fields.BaseCreditSetting.DestinationAirports) { Value = string.Join("|", airports.Select(x => x.ID)) });
            eligibleForCancelAndCreditRuleDbItem.Fields.Add(new DbField(Constants.Fields.BaseCreditSetting.BookingDepartureDateFrom) { Value = expectedRules[0].BookingDepartureDateFrom });
            eligibleForCancelAndCreditRuleDbItem.Fields.Add(new DbField(Constants.Fields.BaseCreditSetting.BookingDepartureDateTo) { Value = expectedRules[0].BookingDepartureDateTo });
            eligibleForCancelAndCreditRuleDbItem.Fields.Add(new DbField(Constants.Fields.BaseCreditSetting.DateOfChangeFrom) { Value = expectedRules[0].DateOfChangeFrom });
            eligibleForCancelAndCreditRuleDbItem.Fields.Add(new DbField(Constants.Fields.BaseCreditSetting.DateOfChangeTo) { Value = expectedRules[0].DateOfChangeTo });

            cancelAndCreditRulesFolderDbItem.Add(eligibleForCancelAndCreditRuleDbItem);
            eligibleForCancelAndCreditFolderDbItem.Add(cancelAndCreditRulesFolderDbItem);
            settingsFolderDbItem.Add(eligibleForCancelAndCreditFolderDbItem);
            db.Add(settingsFolderDbItem);

            CreditAndCashRefundSettings settings = null;
            cacheRepository.GetItem<CreditAndCashRefundSettings>(Arg.Any<string>()).Returns(settings);
            cacheRepository.StoreItem(Arg.Any<string>(), Arg.Any<CreditAndCashRefundSettings>()).Returns(settings);

            var fakeSiteContext = new FakeSiteContext(
               new Sitecore.Collections.StringDictionary
               {
                    { "name", "fake" },
                    { "database", "master" },
                    { "rootPath", "/sitecore/content" }
               });

            using (new FakeSiteContextSwitcher(fakeSiteContext))
            {
                // Act
                var result = service.GetCancelCreditSetting();
                var rules = result.CreditOnlyRules.ToArray();

                // Assert
                rules[0].Active.Start.Should().Be(DateUtil.ToServerTime(startDate).ToString("o"));
                rules[0].Active.End.Should().Be(DateUtil.ToServerTime(endDate).ToString("o"));
                rules[0].DaysBeforeDeparture.Should().Be(expectedRules[0].DaysBeforeDeparture);
                rules[0].DestinationAirports.Should().HaveCount(destinationAirportsCodes.Count);
                for (int i = 0; i < destinationAirportsCodes.Count; i++)
                {
                    rules[0].DestinationAirports.ElementAt(i).Should().Be(expectedRules[0].DestinationAirports.ElementAt(i));
                }

                rules[0].BookingDepartureDateFrom.Should().Be(DateUtil.ToServerTime(startDate).ToString("o"));
                rules[0].BookingDepartureDateTo.Should().Be(DateUtil.ToServerTime(endDate).ToString("o"));
                rules[0].DateOfChangeFrom.Should().Be(DateUtil.ToServerTime(startDate).ToString("o"));
                rules[0].DateOfChangeTo.Should().Be(DateUtil.ToServerTime(endDate).ToString("o"));
            }
        }

        [Theory]
        [AutoData]
        public void GetCreditOnlyRules_ShouldReturnAllCreditSettigns_IfCreditSettingsDataInCache(List<string> destinationAirportsCodes)
        {
            // Arrange
            var startDate = new DateTime(2020, 10, 10);
            var endDate = new DateTime(2021, 10, 10);

            var expectedResult = new List<CreditOnlyRule>()
            {
                new CreditOnlyRule(null)
                {
                    Active = new DateRange()
                    {
                        Start = startDate.ToString(),
                        End = endDate.ToString()
                    },
                    DaysBeforeDeparture = 5,
                    DestinationAirports = destinationAirportsCodes,
                    BookingDepartureDateFrom = startDate.ToString(),
                    BookingDepartureDateTo = endDate.ToString(),
                    DateOfChangeFrom = startDate.ToString(),
                    DateOfChangeTo = endDate.ToString(),
                }
            };

            var settings = new CreditAndCashRefundSettings()
            {
                CreditOnlyRules = expectedResult
            };

            cacheRepository.GetItem<CreditAndCashRefundSettings>(Arg.Any<string>()).Returns(settings);

            // Act
            var act = service.GetCancelCreditSetting().CreditOnlyRules.ToArray();

            // Assert
            act[0].Active.Start.Should().Be(expectedResult[0].Active.Start);
            act[0].Active.End.Should().Be(expectedResult[0].Active.End);
            act[0].DaysBeforeDeparture.Should().Be(expectedResult[0].DaysBeforeDeparture);
            act[0].DestinationAirports.Should().HaveCount(destinationAirportsCodes.Count);
            for (int i = 0; i < destinationAirportsCodes.Count; i++)
            {
                act[0].DestinationAirports.ElementAt(i).Should().Be(expectedResult[0].DestinationAirports.ElementAt(i));
            }

            act[0].BookingDepartureDateFrom.Should().Be(expectedResult[0].BookingDepartureDateFrom);
            act[0].BookingDepartureDateTo.Should().Be(expectedResult[0].BookingDepartureDateTo);

            act[0].DateOfChangeFrom.Should().Be(expectedResult[0].DateOfChangeFrom);
            act[0].DateOfChangeTo.Should().Be(expectedResult[0].DateOfChangeTo);
        }
    }
}
