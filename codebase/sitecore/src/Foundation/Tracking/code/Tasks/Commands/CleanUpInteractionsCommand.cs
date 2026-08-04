using System;
using System.Web.Mvc;
using easyJet.Foundation.Tracking.Services;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.Tasks;

namespace easyJet.Foundation.Tracking.Tasks.Commands
{
    public class CleanUpInteractionsCommand
    {
        private readonly IUserSearchInteractionService userSearchInteractionService;

        public CleanUpInteractionsCommand()
        {
            userSearchInteractionService = DependencyResolver.Current.GetService<IUserSearchInteractionService>();
        }

        /// <summary>
        /// Run clear user search interactions by date.
        /// </summary>
        /// <param name="items">Root Items.</param>
        /// <param name="commandItem">Command Item.</param>
        /// <param name="scheduleItem">Schedule Item.</param>
        public void Execute(Item[] items, CommandItem commandItem, ScheduleItem scheduleItem)
        {
            var targetDateTime = ((DateField)scheduleItem.InnerItem.Fields[Constants.Fields.CleanUpInteractionsSchedule.TargetDate]).DateTime;
            userSearchInteractionService.ClearInteractionsAsync(targetDateTime == DateTime.MinValue ? DateTime.Now : targetDateTime).Wait();
        }
    }
}
