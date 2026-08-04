using System.Collections.Generic;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore;
using Sitecore.Abstractions;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Tasks;

namespace easyJet.Foundation.Multisite.Tasks
{
    /// <summary>
    /// Fetches <see cref="T:Sitecore.Tasks.ScheduleItem" />(s) from specific <see cref="P:Sitecore.Tasks.DatabaseAgent.Database" /> by given <see cref="P:Sitecore.Tasks.DatabaseAgent.ScheduleRoot" /> path and executes only due items.
    /// <para>Removes <see cref="P:Sitecore.Tasks.ScheduleItem.Expired" /> items that have <see cref="P:Sitecore.Tasks.ScheduleItem.AutoRemove" /> set.</para>
    /// <para>Logs execution flow (controlled by <see cref="P:Sitecore.Tasks.DatabaseAgent.LogActivity" />).</para>
    /// <remarks>Default schedule root is '/sitecore/system/tasks/schedules'.</remarks>
    /// </summary>
    public class DatabaseAgent : Sitecore.Tasks.DatabaseAgent
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="DatabaseAgent" /> class.
        /// </summary>
        /// <param name="databaseName">Name of the database.</param>
        /// <param name="scheduleRoot">The schedule root.</param>
        public DatabaseAgent(string databaseName, string scheduleRoot)
            : base(databaseName, scheduleRoot)
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="DatabaseAgent" /> class.
        /// </summary>
        /// <param name="scheduleRoot">The path to Sitecore 'schedule root' item.</param>
        /// <param name="database">The database to load schedule items from.</param>
        /// <param name="log">The log to output diagnostic messages.</param>
        protected DatabaseAgent(string scheduleRoot, Database database, BaseLog log)
            : base(scheduleRoot, database, log)
        {
        }

        /// <inheritdoc/>
        protected override IReadOnlyList<ScheduleItem> GetAllSchedulesUnderRoot()
        {
            Item obj = Database.GetItem(ScheduleRoot);
            List<ScheduleItem> scheduleItemList = new List<ScheduleItem>();

            if (obj == null)
            {
                return scheduleItemList;
            }

            foreach (Item descendant in obj.Axes.GetDescendants())
            {
                if (descendant.HasBaseTemplate(new TemplateID(TemplateIDs.Schedule)))
                {
                    ScheduleItem scheduleItem = BuildScheduleItem(descendant);
                    scheduleItemList.Add(scheduleItem);
                }
            }

            return scheduleItemList;
        }
    }
}