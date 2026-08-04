using System;
using easyJet.Foundation.Presentation.Rules.Conditions;
using easyjet.Foundation.Testing.Attributes;
using FluentAssertions;
using Sitecore.FakeDb;
using Sitecore.Rules;
using Xunit;

namespace easyJet.Foundation.Presentation.Tests.Rules
{
    public class DateNowComparerTests : DateNowComparer<RuleContext>
    {
        [Fact]
        public void Execute_ShouldReturnFalse_IfDateFieldNameIsNullOrWhiteSpace()
        {
            // Arrange
            var ruleContext = new RuleContext();

            // Act
            var actual = Execute(ruleContext);

            // Assert
            actual.Should().BeFalse();
        }

        [Theory]
        [AutoDbData]
        public void Execute_ShouldReturnFalse_IfConditionOperatorIsDefault(Db db, DateTime dateTime)
        {
            // Arrange
            DateFieldName = "dateField";
            var ruleContext = new RuleContext();

            var ruleContextItem = new DbItem("ruleContextItem");
            var dateField = new DbField(DateFieldName);
            dateField.Value = dateTime.ToString();
            ruleContextItem.Fields.Add(dateField);

            db.Add(ruleContextItem);

            ruleContext.Item = db.GetItem(ruleContextItem.ID);

            // Act
            var actual = Execute(ruleContext);

            // Assert
            actual.Should().BeFalse();
        }
    }
}
