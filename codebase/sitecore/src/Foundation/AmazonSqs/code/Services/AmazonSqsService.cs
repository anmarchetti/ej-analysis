using System;
using Amazon.SQS;
using Amazon.SQS.Model;
using easyJet.Foundation.AmazonSqs.Logging;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using Arn = Amazon.Arn;

namespace easyJet.Foundation.AmazonSqs.Services
{
    [Service(typeof(IAmazonSqsService), Lifetime = Lifetime.Transient)]
    public class AmazonSqsService : IAmazonSqsService
    {
        private readonly IAmazonSQS client;
        private readonly IAmazonSqsLogger logger;

        public AmazonSqsService(IAmazonSQS client, IAmazonSqsLogger logger)
        {
            this.client = client;
            this.logger = logger;
        }

        public SendMessageBatchResponse SendMessageBatch(SendMessageBatchRequest request)
        {
            if (request == null)
            {
                throw new ArgumentNullException(nameof(request));
            }

            try
            {
                return client.SendMessageBatch(request);
            }
            catch (Exception exception)
            {
                logger.Error($"{nameof(SendMessageBatch)}", exception, this);
                return null;
            }
        }

        public SendMessageResponse SendMessage(SendMessageRequest request)
        {
            if (request == null)
            {
                throw new ArgumentNullException(nameof(request));
            }

            try
            {
                return client.SendMessage(request);
            }
            catch (Exception exception)
            {
                logger.Error($"{nameof(SendMessage)}", exception, this);
                return null;
            }
        }

        public ReceiveMessageResponse ReceiveMessage(ReceiveMessageRequest request)
        {
            if (request == null)
            {
                throw new ArgumentNullException(nameof(request));
            }

            try
            {
                return client.ReceiveMessage(request);
            }
            catch (Exception exception)
            {
                logger.Error($"{nameof(ReceiveMessage)}", exception, this);
                return null;
            }
        }

        public string GetQueueUrl(string arn)
        {
            if (string.IsNullOrEmpty(arn))
            {
                throw new ArgumentNullException(nameof(arn));
            }

            if (!Arn.IsArn(arn))
            {
                throw new ArgumentException("ARN is in incorrect format. ARN format is: arn:<partition>:<service>:<region>:<account-id>:<resource>");
            }

            return GetQueueUrl(Arn.Parse(arn));
        }

        public string GetQueueUrl(Arn arn)
        {
            if (arn == null)
            {
                throw new ArgumentNullException(nameof(arn));
            }

            return GetQueueUrl(arn.Region, arn.AccountId, arn.Resource);
        }

        public string GetQueueUrl(string region, string accountId, string queueName)
        {
            if (string.IsNullOrEmpty(region))
            {
                throw new ArgumentNullException(nameof(region));
            }

            if (string.IsNullOrEmpty(accountId))
            {
                throw new ArgumentNullException(nameof(accountId));
            }

            if (string.IsNullOrEmpty(queueName))
            {
                throw new ArgumentNullException(nameof(queueName));
            }

            return $"https://sqs.{region}.amazonaws.com/{accountId}/{queueName}";
        }
    }
}