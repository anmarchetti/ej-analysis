using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Amazon.DynamoDBv2.DataModel;
using Amazon.DynamoDBv2.DocumentModel;
using Amazon.DynamoDBv2.Model;
using easyJet.Foundation.DynamoDb.Factory;
using easyJet.Foundation.DynamoDb.Repositories.Base;
using FluentAssertions;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Xunit;

namespace easyJet.Foundation.DynamoDb.Tests.Repositories.Base
{
    public class AwsDynamoDbRepositoryTests
    {
        private const string TableName = "TestTable";

        private readonly IDynamoDBContext context;
        private readonly IAwsDynamoDbContextFactory<TestModel> factory;
        private readonly AwsDynamoDbRepository<TestModel> sut;

        public AwsDynamoDbRepositoryTests()
        {
            context = Substitute.For<IDynamoDBContext>();
            factory = Substitute.For<IAwsDynamoDbContextFactory<TestModel>>();
            factory.Create().Returns((context, TableName));
            sut = new AwsDynamoDbRepository<TestModel>(factory);
        }

        [Fact]
        public async Task Save_ShouldDelegateToContext_WithTableNameOverride()
        {
            var item = new TestModel();

            await sut.Save(item);

            await context.Received(1).SaveAsync(
                item,
                Arg.Is<SaveConfig>(c => c.OverrideTableName == TableName),
                Arg.Any<CancellationToken>());
        }

        [Fact]
        public async Task Save_ShouldRethrow_WhenContextThrows()
        {
            var item = new TestModel();
            context.SaveAsync(item, Arg.Any<SaveConfig>(), Arg.Any<CancellationToken>())
                .Returns(Task.FromException(new InvalidOperationException("boom")));

            Func<Task> act = () => sut.Save(item);

            await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("boom");
        }

        [Fact]
        public async Task SaveBatch_ShouldDoNothing_WhenItemsAreNull()
        {
            await sut.SaveBatch(null);

            context.DidNotReceiveWithAnyArgs().CreateBatchWrite<TestModel>(Arg.Any<BatchWriteConfig>());
        }

        [Fact]
        public async Task SaveBatch_ShouldDoNothing_WhenItemsAreEmpty()
        {
            await sut.SaveBatch(new List<TestModel>());

            context.DidNotReceiveWithAnyArgs().CreateBatchWrite<TestModel>(Arg.Any<BatchWriteConfig>());
        }

        [Fact]
        public async Task SaveBatch_ShouldCreateAndExecuteBatchWrite_WithTableNameOverride()
        {
            var items = new List<TestModel> { new TestModel(), new TestModel() };
            var batchWrite = Substitute.For<IBatchWrite<TestModel>>();
            context.CreateBatchWrite<TestModel>(Arg.Any<BatchWriteConfig>()).Returns(batchWrite);

            await sut.SaveBatch(items);

            context.Received(1).CreateBatchWrite<TestModel>(
                Arg.Is<BatchWriteConfig>(c => c.OverrideTableName == TableName));
            batchWrite.Received(1).AddPutItems(Arg.Is<IEnumerable<TestModel>>(x => x.Count() == 2));
            await batchWrite.Received(1).ExecuteAsync(Arg.Any<CancellationToken>());
        }

        [Fact]
        public async Task SaveBatch_ShouldSplitItemsIntoPortions()
        {
            var items = Enumerable.Range(0, 5).Select(_ => new TestModel()).ToList();
            var batchWrite = Substitute.For<IBatchWrite<TestModel>>();
            context.CreateBatchWrite<TestModel>(Arg.Any<BatchWriteConfig>()).Returns(batchWrite);

            await sut.SaveBatch(items, batchPortion: 2);

            await batchWrite.Received(3).ExecuteAsync(Arg.Any<CancellationToken>());
        }

        [Fact]
        public async Task SaveBatch_ShouldRethrow_WhenProvisionedThroughputExceeded()
        {
            var items = new List<TestModel> { new TestModel() };
            var batchWrite = Substitute.For<IBatchWrite<TestModel>>();
            context.CreateBatchWrite<TestModel>(Arg.Any<BatchWriteConfig>()).Returns(batchWrite);
            batchWrite.ExecuteAsync(Arg.Any<CancellationToken>())
                .Returns(Task.FromException(new ProvisionedThroughputExceededException("throttle")));

            Func<Task> act = () => sut.SaveBatch(items);

            await act.Should().ThrowAsync<ProvisionedThroughputExceededException>();
        }

        [Fact]
        public async Task SaveBatch_ShouldRethrow_WhenContextThrowsGenericException()
        {
            var items = new List<TestModel> { new TestModel() };
            var batchWrite = Substitute.For<IBatchWrite<TestModel>>();
            context.CreateBatchWrite<TestModel>(Arg.Any<BatchWriteConfig>()).Returns(batchWrite);
            batchWrite.ExecuteAsync(Arg.Any<CancellationToken>())
                .Returns(Task.FromException(new InvalidOperationException("boom")));

            Func<Task> act = () => sut.SaveBatch(items);

            await act.Should().ThrowAsync<InvalidOperationException>();
        }

        [Fact]
        public async Task SaveBatchAsync_ShouldDoNothing_WhenItemsAreNull()
        {
            await sut.SaveBatchAsync(null, concurrencyTasks: 2);

            context.DidNotReceiveWithAnyArgs().CreateBatchWrite<TestModel>(Arg.Any<BatchWriteConfig>());
        }

        [Fact]
        public async Task SaveBatchAsync_ShouldDoNothing_WhenItemsAreEmpty()
        {
            await sut.SaveBatchAsync(new List<TestModel>(), concurrencyTasks: 2);

            context.DidNotReceiveWithAnyArgs().CreateBatchWrite<TestModel>(Arg.Any<BatchWriteConfig>());
        }

        [Fact]
        public async Task SaveBatchAsync_ShouldExecuteOneBatchPerChunk()
        {
            var items = Enumerable.Range(0, 50).Select(_ => new TestModel()).ToList();
            var batchWrite = Substitute.For<IBatchWrite<TestModel>>();
            context.CreateBatchWrite<TestModel>(Arg.Any<BatchWriteConfig>()).Returns(batchWrite);

            await sut.SaveBatchAsync(items, concurrencyTasks: 2, batchPortion: 25);

            context.Received(2).CreateBatchWrite<TestModel>(
                Arg.Is<BatchWriteConfig>(c => c.OverrideTableName == TableName));
            await batchWrite.Received(2).ExecuteAsync(Arg.Any<CancellationToken>());
        }

        [Fact]
        public async Task SaveBatchAsync_ShouldRethrow_WhenProvisionedThroughputExceeded()
        {
            var items = new List<TestModel> { new TestModel() };
            var batchWrite = Substitute.For<IBatchWrite<TestModel>>();
            context.CreateBatchWrite<TestModel>(Arg.Any<BatchWriteConfig>()).Returns(batchWrite);
            batchWrite.ExecuteAsync(Arg.Any<CancellationToken>())
                .Returns(Task.FromException(new ProvisionedThroughputExceededException("throttle")));

            Func<Task> act = () => sut.SaveBatchAsync(items, concurrencyTasks: 2, batchPortion: 25);

            await act.Should().ThrowAsync<ProvisionedThroughputExceededException>();
        }

        [Fact]
        public async Task Get_ShouldDelegateToQueryAsync_WithTableNameOverride()
        {
            var expected = new List<TestModel> { new TestModel() };
            var search = Substitute.For<IAsyncSearch<TestModel>>();
            search.GetRemainingAsync(Arg.Any<CancellationToken>()).Returns(expected);
            context.QueryAsync<TestModel>("key", Arg.Any<QueryConfig>()).Returns(search);

            var result = await sut.Get("key");

            result.Should().BeEquivalentTo(expected);
            context.Received(1).QueryAsync<TestModel>(
                "key",
                Arg.Is<QueryConfig>(c => c.OverrideTableName == TableName));
        }

        [Fact]
        public async Task Get_ShouldReturnEmpty_WhenContextThrows()
        {
            context.QueryAsync<TestModel>(Arg.Any<string>(), Arg.Any<QueryConfig>())
                .Throws(new InvalidOperationException("boom"));

            var result = await sut.Get("key");

            result.Should().BeEmpty();
        }

        [Fact]
        public async Task GetAll_ShouldDelegateToScanAsync_WithTableNameOverride()
        {
            var expected = new List<TestModel> { new TestModel(), new TestModel() };
            var search = Substitute.For<IAsyncSearch<TestModel>>();
            search.GetRemainingAsync(Arg.Any<CancellationToken>()).Returns(expected);
            context.ScanAsync<TestModel>(Arg.Any<IEnumerable<ScanCondition>>(), Arg.Any<ScanConfig>()).Returns(search);

            var result = await sut.GetAll();

            result.Should().BeEquivalentTo(expected);
            context.Received(1).ScanAsync<TestModel>(
                Arg.Any<IEnumerable<ScanCondition>>(),
                Arg.Is<ScanConfig>(c => c.OverrideTableName == TableName));
        }

        [Fact]
        public async Task GetAll_ShouldReturnEmpty_WhenContextThrows()
        {
            context.ScanAsync<TestModel>(Arg.Any<IEnumerable<ScanCondition>>(), Arg.Any<ScanConfig>())
                .Throws(new InvalidOperationException("boom"));

            var result = await sut.GetAll();

            result.Should().BeEmpty();
        }

        [Fact]
        public void GetSearchBatchWorker_ShouldReturnScanAsyncResult_WithTableNameOverride()
        {
            var search = Substitute.For<IAsyncSearch<TestModel>>();
            context.ScanAsync<TestModel>(Arg.Any<IEnumerable<ScanCondition>>(), Arg.Any<ScanConfig>()).Returns(search);

            var result = sut.GetSearchBatchWorker();

            result.Should().BeSameAs(search);
            context.Received(1).ScanAsync<TestModel>(
                Arg.Any<IEnumerable<ScanCondition>>(),
                Arg.Is<ScanConfig>(c => c.OverrideTableName == TableName));
        }

        [Fact]
        public void GetSearchBatchWorkerFromScanConfig_ShouldReturnFromScanAsyncResult_WithTableNameOverride()
        {
            var search = Substitute.For<IAsyncSearch<TestModel>>();
            var scanConfig = new ScanOperationConfig();
            context.FromScanAsync<TestModel>(scanConfig, Arg.Any<FromScanConfig>()).Returns(search);

            var result = sut.GetSearchBatchWorkerFromScanConfig(scanConfig);

            result.Should().BeSameAs(search);
            context.Received(1).FromScanAsync<TestModel>(
                scanConfig,
                Arg.Is<FromScanConfig>(c => c.OverrideTableName == TableName));
        }

        public class TestModel
        {
        }
    }
}
