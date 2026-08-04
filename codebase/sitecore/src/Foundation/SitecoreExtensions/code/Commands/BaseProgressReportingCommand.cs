using System;
using System.Collections.Generic;
using System.Diagnostics;
using easyJet.Foundation.SitecoreExtensions.Logger;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore;
using Sitecore.Data.Items;
using Sitecore.Globalization;
using Sitecore.Web.UI.Sheer;

namespace easyJet.Foundation.SitecoreExtensions.Commands
{
    public abstract class BaseProgressReportingCommand<T> : BaseAsyncCommand
        where T : class
    {
        protected ILogger Logger
        {
            get;
        }

        protected IDatabaseProvider DatabaseProvider
        {
            get;
        }

        protected TimeSpan TotalExecutionDuration
        {
            get; set;
        }

        protected ISitecoreUIService SitecoreUiService
        {
            get;
        }

        private const int StartThrottleAfterMessagesCount = 10;

        private const int MessagingDebounceInterval = 1000;

        protected BaseProgressReportingCommand(
            IDatabaseProvider databaseProvider,
            ILogger logger,
            IUserCreationService userCreationService,
            ISitecoreUIService sitecoreUiService)
            : base(userCreationService)
        {
            SitecoreUiService = sitecoreUiService;
            Logger = logger;
            DatabaseProvider = databaseProvider;
        }

        /// <summary>
        /// Process Items.
        /// </summary>
        /// <param name="contextItem">Context.</param>
        /// <param name="args">Arguments.</param>
        /// <returns>List of processed items.</returns>
        protected internal abstract IEnumerable<T> ProcessItems(Item contextItem, ClientPipelineArgs args);

        /// <inheritdoc />
        protected override void Action(ClientPipelineArgs args)
        {
            var contextItemId = args.Parameters[SourceId];
            var contextItemLanguage = args.Parameters[SourceLanguage];
            var contextItem = DatabaseProvider.GetItem(contextItemId, Language.Parse(contextItemLanguage), DatabaseType.Master);
            var stopWatch = new Stopwatch();
            stopWatch.Start();
            try
            {
                var lastTimeStamp = DateTime.Now;
                var processedItems = new List<T>();
                foreach (var item in ProcessItems(contextItem, args))
                {
                    Context.Job.Status.Processed++;
                    if (item is null)
                    {
                        continue;
                    }

                    var status = GetStatusMessage(item);
                    if (Context.Job.Status.Messages.Count <= StartThrottleAfterMessagesCount || (DateTime.Now - lastTimeStamp).TotalMilliseconds > MessagingDebounceInterval)
                    {
                        if (!string.IsNullOrWhiteSpace(status))
                        {
                            Context.Job.Status.Messages.Add(status);
                        }

                        lastTimeStamp = DateTime.Now;
                    }

                    processedItems.Add(item);
                }

                var finalStatus = GetFinalStatusMessage(processedItems);
                if (!string.IsNullOrEmpty(finalStatus))
                {
                    Context.Job.Status.Messages.Add(finalStatus);
                }

                Context.Job.Status.Processed = Context.Job.Status.Total;
                Context.Job.Wait(Constants.DialogSettings.KeepDialogOpenForMilliSeconds);
            }
            catch (Exception ex)
            {
                Logger.Error(ex.Message, ex, this);
                Context.Job.Status.Failed = true;
                Context.Job.Status?.Exceptions.Add(ex);
                args.Parameters[Constants.JobFailedIdentifier] = bool.TrueString;
            }
            finally
            {
                stopWatch.Stop();
                TotalExecutionDuration = stopWatch.Elapsed;
                Logger.Info($"Command: {GetType().Name} execution took: {TotalExecutionDuration:c}", this);
            }
        }

        protected abstract string GetFinalStatusMessage(List<T> processedItems);

        protected abstract string GetStatusMessage(T item);

        /// <inheritdoc />
        protected override void PostAction(ClientPipelineArgs args)
        {
            SitecoreUiService.ClientPage_SendMessage(this, $"item:refreshchildren(id={args.Parameters[SourceId]})");
        }
    }
}