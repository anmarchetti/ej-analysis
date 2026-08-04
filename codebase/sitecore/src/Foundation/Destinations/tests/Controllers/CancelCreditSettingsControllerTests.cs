using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using easyJet.Foundation.Destinations.Controllers;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Models.Domain.CancelAndCredit;
using easyJet.Foundation.Destinations.Services;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Controllers
{
    public class CancelCreditSettingsControllerTests
    {
        private readonly ICancelCreditSettingsService service;
        private readonly CancelCreditSettingsController controller;

        public CancelCreditSettingsControllerTests()
        {
            service = Substitute.For<ICancelCreditSettingsService>();
            controller = new CancelCreditSettingsController(service);
        }

        [Fact]
        public void Get_ShouldReturnAllCancelCreditSettings_IfRulesExists()
        {
            // Arrange
            var expectedEligibleForCancelAndCredit = new CreditAndCashRefundSettings()
            {
                CancelAndCreditRules = new List<CancelCreditRule>()
                {
                    new CancelCreditRule(null)
                    {
                        Active = new DateRange()
                        {
                            Start = DateTime.Now.ToString(),
                            End = DateTime.Now.ToString()
                        },
                        DaysBeforeDeparture = 10,
                        DestinationAirports = new List<string>()
                        {
                            "code1"
                        },
                        BookingDepartureDateFrom = DateTime.Now.ToString(),
                        BookingDepartureDateTo = DateTime.Now.ToString(),
                        DateOfChangeFrom = DateTime.Now.ToString(),
                        DateOfChangeTo = DateTime.Now.ToString(),
                    }
                }
            };

            service.GetCancelCreditSetting().Returns(expectedEligibleForCancelAndCredit);

            // Act
            var act = (controller.Get() as JsonResult).Data as CreditAndCashRefundSettings;

            // Assert
            act.CancelAndCreditRules.ElementAt(0).Active.Start.Should().Be(expectedEligibleForCancelAndCredit.CancelAndCreditRules.ElementAt(0).Active.Start);
            act.CancelAndCreditRules.ElementAt(0).Active.End.Should().Be(expectedEligibleForCancelAndCredit.CancelAndCreditRules.ElementAt(0).Active.End);
            act.CancelAndCreditRules.ElementAt(0).DaysBeforeDeparture.Should().Be(expectedEligibleForCancelAndCredit.CancelAndCreditRules.ElementAt(0).DaysBeforeDeparture);
            act.CancelAndCreditRules.ElementAt(0).DestinationAirports.ElementAt(0).Should().Be(expectedEligibleForCancelAndCredit.CancelAndCreditRules.ElementAt(0).DestinationAirports.ElementAt(0));
            act.CancelAndCreditRules.ElementAt(0).BookingDepartureDateFrom.Should().Be(expectedEligibleForCancelAndCredit.CancelAndCreditRules.ElementAt(0).BookingDepartureDateFrom);
            act.CancelAndCreditRules.ElementAt(0).BookingDepartureDateTo.Should().Be(expectedEligibleForCancelAndCredit.CancelAndCreditRules.ElementAt(0).BookingDepartureDateTo);
            act.CancelAndCreditRules.ElementAt(0).DateOfChangeFrom.Should().Be(expectedEligibleForCancelAndCredit.CancelAndCreditRules.ElementAt(0).DateOfChangeFrom);
            act.CancelAndCreditRules.ElementAt(0).DateOfChangeTo.Should().Be(expectedEligibleForCancelAndCredit.CancelAndCreditRules.ElementAt(0).DateOfChangeTo);
        }
    }
}
