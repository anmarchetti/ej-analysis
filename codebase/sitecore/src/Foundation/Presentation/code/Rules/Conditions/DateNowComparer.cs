using System;
using Sitecore;
using Sitecore.Diagnostics;
using Sitecore.Layouts;
using Sitecore.Rules;
using Sitecore.Rules.Conditions;

namespace easyJet.Foundation.Presentation.Rules.Conditions
{
    public class DateNowComparer<T> : OperatorCondition<T>
        where T : RuleContext
    {
        public string DateFieldName { get; set; }

        /// <summary>
        ///  Executes the specified rule context.
        /// </summary>
        /// <param name="ruleContext">Rule Context.</param>
        /// <returns>True, if the condition succeeds, otherwise false.</returns>
        protected override bool Execute(T ruleContext)
        {
            Assert.ArgumentNotNull(ruleContext, nameof(ruleContext));

            if (string.IsNullOrWhiteSpace(DateFieldName))
            {
                return false;
            }

            var conditionOperator = GetOperator();

            var dateTime = DateUtil.ParseDateTime(ruleContext.Item.Fields[DateFieldName]?.Value, DateTime.MaxValue);

            // If date field on context item not exist or field is empty - try to take value from datasource item
            if (dateTime == DateTime.MaxValue)
            {
                var renderings = ruleContext.Item.Visualization.GetRenderings(Context.Device, true);
                var dataSource = string.Empty;
                foreach (RenderingReference reference in renderings)
                {
                    if (!string.IsNullOrEmpty(dataSource))
                    {
                        break;
                    }

                    if (reference != null && reference.Settings.Rules != null && reference.Settings.Rules.Count > 0)
                    {
                        foreach (var rule in reference.Settings.Rules.Rules)
                        {
                            if (rule.Condition.UniqueId == UniqueId)
                            {
                                dataSource = reference.Settings.DataSource;
                                break;
                            }
                        }
                    }
                }

                if (!string.IsNullOrEmpty(dataSource))
                {
                    var dataSourceItem = ruleContext.Item.Database.GetItem(new Sitecore.Data.ID(dataSource));
                    dateTime = DateUtil.ParseDateTime(dataSourceItem?.Fields[DateFieldName]?.Value, DateTime.MaxValue);
                }
            }

            return DateComparer(DateTime.Now, dateTime, conditionOperator);
        }

        /// <summary>
        /// Compare 2 dates by condition.
        /// </summary>
        /// <param name="date1">First date.</param>
        /// <param name="date2">Second date.</param>
        /// <param name="conditionOperator">Condition Operator.</param>
        /// <returns>True, if the condition succeeds, otherwise false.</returns>
        private bool DateComparer(DateTime date1, DateTime date2, ConditionOperator conditionOperator)
        {
            switch (conditionOperator)
            {
                case ConditionOperator.Equal:
                    return date1.Equals(date2);
                case ConditionOperator.LessThan:
                    return date1 < date2;
                case ConditionOperator.LessThanOrEqual:
                    return date1 <= date2;
                case ConditionOperator.GreaterThan:
                    return date1 > date2;
                case ConditionOperator.GreaterThanOrEqual:
                    return date1 >= date2;
                case ConditionOperator.NotEqual:
                    return !date1.Equals(date2);
                default:
                    return false;
            }
        }
    }
}