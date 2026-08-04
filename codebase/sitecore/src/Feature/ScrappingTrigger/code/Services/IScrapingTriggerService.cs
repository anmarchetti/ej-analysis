using System;
using System.Collections.Generic;
using Amazon.SQS.Model;

namespace easyJet.Feature.ScrappingTrigger.Services
{
    public interface IScrapingTriggerService
    {
        SendMessageBatchResponse EnQueue(Dictionary<Guid, string> messages);
    }
}