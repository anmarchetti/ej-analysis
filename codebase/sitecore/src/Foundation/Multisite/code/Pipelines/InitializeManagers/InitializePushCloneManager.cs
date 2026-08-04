using easyJet.Foundation.Multisite.Extensions;
using easyJet.Foundation.Multisite.Services;
using Sitecore.Configuration;
using Sitecore.Data;
using Sitecore.Pipelines;

namespace easyJet.Foundation.Multisite.Pipelines.InitializeManagers
{
    public class InitializePushCloneManager
    {
        private readonly IPushCloneHandlerService handlerService;

        public InitializePushCloneManager(IPushCloneHandlerService pushCloneHandlerService) => handlerService = pushCloneHandlerService;

        /// <summary>
        /// Initialize push clone handlers to Data Engine.
        /// </summary>
        /// <param name="args">PipelineArgs args.</param>
        public void Process(PipelineArgs args)
        {
            foreach (Database database in Factory.GetDatabases())
            {
                database.Engines.DataEngine.UsePushClone(handlerService);
            }
        }
    }
}