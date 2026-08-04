using System;
using System.Runtime.CompilerServices;
using Sitecore.Pipelines;

[assembly: InternalsVisibleTo("easyJet.Feature.PageContent.Tests")]

namespace easyJet.Feature.PageContent.Pipelines.ItemResolving
{
    public class CreateResolveItemResult
    {
        public virtual ResolveItemResult RunPipeline(CreateResolveItemResultArgs args)
        {
            var pipeline = GetPipelineWrapper();
            if (pipeline == null)
            {
                throw new Exception($"Could not find pipeline {Constants.Pipelines.ResolvePathToItem.CreateResolveItemResult}. Please check easyJet.Feature.PageContent.config.");
            }

            pipeline.Run(args);
            return args.Result;
        }

        internal virtual CorePipeline GetPipelineWrapper()
        {
            return CorePipelineFactory.GetPipeline(Constants.Pipelines.ResolvePathToItem.CreateResolveItemResult, string.Empty);
        }
    }
}