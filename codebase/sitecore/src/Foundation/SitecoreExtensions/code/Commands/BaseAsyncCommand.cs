using System;
using System.Linq;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore;
using Sitecore.Diagnostics;
using Sitecore.Jobs;
using Sitecore.Shell.Framework.Jobs;
using Sitecore.Web.UI.Sheer;

namespace easyJet.Foundation.SitecoreExtensions.Commands
{
    public abstract class BaseAsyncCommand : BaseCommand
    {
        private readonly IUserCreationService userCreationService;
        private string handleString;

        protected BaseAsyncCommand(IUserCreationService pUserCreationService)
        {
            userCreationService = pUserCreationService;
        }

        protected virtual string CommandTitle => "Data Synchronization";

        protected virtual string CommandCategory => "Content Synchronization";

        /// <summary>
        /// Execute command with ClientPipelineArgs arguments in background mode.
        /// </summary>
        /// <param name="args">ClientPipelineArgs.</param>
        protected override void ExecuteJob(ClientPipelineArgs args)
        {
            if (args.IsPostBack && !string.IsNullOrEmpty(handleString))
            {
                PostAction(args);
                handleString = null;
                return;
            }

            var jobOption = new DefaultJobOptions(CommandTitle, CommandCategory, Client.Site.Name, this, nameof(Action), new object[] { args })
            {
                ContextUser = userCreationService.GetOrCreateNonAnonymousUser(GetType().Name),
                ClientLanguage = Context.Language
            };

            var job = JobManager.Start(jobOption);

            var longRunningOption = new LongRunningOptions(job.Handle.ToString())
            {
                Title = CommandTitle,
                Icon = string.Empty
            };

            job.Finished += OnJob_FinishedFaildMessage;

            handleString = job.Handle.ToString();

            longRunningOption.ShowModal(true);
            args.WaitForPostBack();
        }

        /// <summary>
        /// Main Action to invoke in scope of command.
        /// </summary>
        /// <param name="args">ClientPipelineArgs.</param>
        protected abstract void Action(ClientPipelineArgs args);

        /// <summary>
        /// Post Action to invoke in scope of command.
        /// </summary>
        /// <param name="args">ClientPipelineArgs.</param>
        protected abstract void PostAction(ClientPipelineArgs args);

        private void OnJob_FinishedFaildMessage(object sender, JobFinishedEventArgs e)
        {
            Assert.ArgumentNotNull(e, nameof(e));

            if (e.Job.Status.Failed)
            {
                e.Job.Status.Messages.Clear();
                if (e.Job.Status.Exceptions.Any())
                {
                    var exception = e.Job.Status.Exceptions.First();
                    e.Job.Status.Messages.Add($"{exception.GetType().Name}<br>{exception.Message}");
                }
                else
                {
                    e.Job.Status.Messages.Add("Job has failed due to unexpected error. Please contact your Administrator");
                }
            }

            e.Job.Wait(Constants.DialogSettings.KeepDialogOpenForMilliSecondsOnError);
        }
    }
}