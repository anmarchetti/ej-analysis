using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;

namespace easyJet.Holidays.External.AWS.Services.Booking
{
    /// <summary>
    /// Booking transactions service implementation
    /// </summary>
    public class BookingTransactionsService : IBookingTransactionsService
    {
        private const string AttributeId = "Id";
        private const string AttributeState = "State";
        private const string AttributeTimestamp = "Timestamp";
        private const string AttributeCorrelationId = "CorrelationId";
        private const string AttributeBookingReference = "BookingReference";
        private const string AttributeException = "Exception";
        private const string AttributeInnerErrors = "InnerErrors";

        private readonly AwsSettings _awsSettings;
        private readonly AwsClient _awsClient;
        private readonly ILogger<BookingTransactionsService> _logger;

        /// <summary>
        /// Constructore
        /// </summary>
        /// <param name="awsClient"></param>
        /// <param name="awsSettings"></param>
        /// <param name="logger"></param>
        public BookingTransactionsService(AwsClient awsClient, IOptions<AwsSettings> awsSettings, ILogger<BookingTransactionsService> logger)
        {
            _awsSettings = awsSettings.Value ?? throw new ArgumentNullException(nameof(awsSettings));
            _awsClient = awsClient;
            _logger = logger;
        }

        /// <inheritdoc />
        public async Task<BookingTransaction> Get(string transactionId)
        {
            try
            {
                var request = new GetItemRequest
                {
                    TableName = _awsSettings.Storage.Tables.BookingTransactions,
                    Key = new Dictionary<string, AttributeValue>() {
                    {
                        AttributeId, new AttributeValue {
                            S = transactionId
                        }
                    }
                }
                };

                using (var client = _awsClient.GetClient())
                {
                    var response = await client.GetItemAsync(request);

                    return Convert(response.Item);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError("Was not able to connect to Dynamo DB", ex);

                return null;
            }
        }

        /// <inheritdoc />
        public async Task<BookingTransaction> Create(string transactionId)
        {
            var attributes = new Dictionary<string, AttributeValue>()
            {
                {
                    AttributeId, new AttributeValue {
                        S = transactionId
                    }
                },
                {
                    AttributeState, new AttributeValue {
                        S = BookingTransactionState.NEW.ToString()
                    }
                },
                {
                    AttributeTimestamp, new AttributeValue {
                        N = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString()
                    }
                }
            };

            var request = new PutItemRequest
            {
                TableName = _awsSettings.Storage.Tables.BookingTransactions,
                Item = attributes,
                ConditionExpression = $"attribute_not_exists({AttributeId})"// prevent duplicates
            };

            using (var client = _awsClient.GetClient())
            {
                var response = await client.PutItemAsync(request);
                return Convert(attributes); // PutItem doesn't return item
            }
        }

        /// <inheritdoc />
        public Task Start(string idempotencyKey)
        {
            return Update(new BookingTransaction
            {
                Id = idempotencyKey,
                State = BookingTransactionState.IN_PROGRESS.ToString()
            });
        }

        /// <inheritdoc />
        public Task Complete(string idempotencyKey, string bookingReference)
        {
            return Update(new BookingTransaction
            {
                Id = idempotencyKey,
                State = BookingTransactionState.COMPLETED.ToString(),
                BookingReference = bookingReference
            });
        }

        /// <inheritdoc />
        public Task PaymentAuthRequired(string idempotencyKey)
        {
            return Update(new BookingTransaction
            {
                Id = idempotencyKey,
                State = BookingTransactionState.PAYMENT_AUTH_REQUIRED.ToString(),
            });
        }

        /// <inheritdoc />
        public Task Fail(string idempotencyKey, Exception ex, string traceIdentifier)
        {
            return Update(new BookingTransaction
            {
                Id = idempotencyKey,
                State = BookingTransactionState.FAILED.ToString(),
                CorrelationId = traceIdentifier,
                Exception = ex.Message,
                InnerErrors = (ex as ApiException)?.InnerErrors
            });
        }

        /// <inheritdoc />
        private async Task Update(BookingTransaction transaction)
        {
            var updates = new Dictionary<string, AttributeValueUpdate>();

            string innerErrorsJson = null;
            try
            {
                if (transaction.InnerErrors != null)
                {
                    innerErrorsJson = JsonConvert.SerializeObject(transaction.InnerErrors);
                }
            }
            catch (Exception serEx)
            {
                _logger.LogError(serEx, $"Cannot serialize innerErrors: ${transaction.InnerErrors}");
            }

            Action<string, string> addStringUpdate = (fieldName, fieldValue) =>
            {
                if (!string.IsNullOrEmpty(fieldValue))
                {
                    updates[fieldName] = new AttributeValueUpdate
                    {
                        Action = AttributeAction.PUT,
                        Value = new AttributeValue
                        {
                            S = fieldValue
                        }
                    };
                }
            };

            // Always update timestamp with current date
            updates[AttributeTimestamp] = new AttributeValueUpdate
            {
                Action = AttributeAction.PUT,
                Value = new AttributeValue
                {
                    N = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString() // Don't use addStringUpdate action because data type is "N"
                }
            };

            addStringUpdate(AttributeState, transaction.State);
            addStringUpdate(AttributeBookingReference, transaction.BookingReference);
            addStringUpdate(AttributeException, transaction.Exception);
            addStringUpdate(AttributeCorrelationId, transaction.CorrelationId);
            addStringUpdate(AttributeInnerErrors, innerErrorsJson);

            var request = new UpdateItemRequest
            {
                TableName = _awsSettings.Storage.Tables.BookingTransactions,
                Key = new Dictionary<string, AttributeValue>() { { AttributeId, new AttributeValue { S = transaction.Id } } },
                AttributeUpdates = updates
            };

            using (var client = _awsClient.GetClient())
            {
                await client.UpdateItemAsync(request);
            }
        }

        /// <summary>
        /// COvert attributes map to model
        /// </summary>
        /// <param name="attributes">Dictionary with attributes</param>
        /// <returns>Model</returns>
        public BookingTransaction Convert(Dictionary<string, AttributeValue> attributes)
        {
            if (attributes.Count == 0)
            {
                // at least one attribute should be if item was returned.
                return null;
            }

            attributes.TryGetValue(AttributeId, out var itemId);
            attributes.TryGetValue(AttributeState, out var state);
            attributes.TryGetValue(AttributeTimestamp, out var timestamp);
            attributes.TryGetValue(AttributeCorrelationId, out var correlationId);
            attributes.TryGetValue(AttributeException, out var exception);
            attributes.TryGetValue(AttributeBookingReference, out var bookingRef);
            attributes.TryGetValue(AttributeInnerErrors, out var innerErrorsJson);

            long timestampId = 0;
            if (timestamp != null)
            {
                long.TryParse(timestamp.N, out timestampId);
            }

            ApiError[] innerErrors = null;
            if (!string.IsNullOrWhiteSpace(innerErrorsJson?.S))
            {
                try
                {
                    innerErrors = JsonConvert.DeserializeObject<ApiError[]>(innerErrorsJson.S);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Cannot deserialize innerErrors: ${innerErrorsJson.S}");
                }
            }

            return new BookingTransaction
            {
                Id = itemId?.S,
                State = state?.S,
                Timestamp = timestampId,
                CorrelationId = correlationId?.S,
                BookingReference = bookingRef?.S,
                Exception = exception?.S,
                InnerErrors = innerErrors
            };
        }
    }
}
