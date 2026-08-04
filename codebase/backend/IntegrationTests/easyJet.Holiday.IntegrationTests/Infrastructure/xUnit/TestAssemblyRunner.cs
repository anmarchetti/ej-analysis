using easyJet.Holiday.IntegrationTests.Infrastructure.TestApi;

using Xunit.Abstractions;
using Xunit.Sdk;

namespace easyJet.Holiday.IntegrationTests.Infrastructure.xUnit;

public class TestAssemblyRunner : XunitTestAssemblyRunner
{
    private readonly Dictionary<Type, object?> assemblyFixtureMapping = new Dictionary<Type, object?>();
    private Startup startup;

    public TestAssemblyRunner(
        ITestAssembly testAssembly,
        IEnumerable<IXunitTestCase> testCases,
        IMessageSink diagnosticMessageSink,
        IMessageSink executionMessageSink,
        ITestFrameworkExecutionOptions executionOptions)
        : base(testAssembly, testCases, diagnosticMessageSink, executionMessageSink, executionOptions)
    {
    }

    protected override async Task AfterTestAssemblyStartingAsync()
    {
        await base.AfterTestAssemblyStartingAsync();

        Aggregator.Run(() =>
        {
            startup = new Startup();

            assemblyFixtureMapping[typeof(IHttpClientFactory)] = startup.GetHttpClientFactoryInstance();
            assemblyFixtureMapping[typeof(TestApiHttpClient)] = new TestApiHttpClient();
        });
    }

    protected override Task BeforeTestAssemblyFinishedAsync()
    {
        foreach (var disposable in assemblyFixtureMapping.Values.OfType<IDisposable>())
        {
            Aggregator.Run(disposable.Dispose);
        }

        Aggregator.Run(startup.Dispose);

        return base.BeforeTestAssemblyFinishedAsync();
    }

    protected override Task<RunSummary> RunTestCollectionAsync(
        IMessageBus messageBus,
        ITestCollection testCollection,
        IEnumerable<IXunitTestCase> testCases,
        CancellationTokenSource cancellationTokenSource)
    {
        return new TestCollectionRunner(
            assemblyFixtureMapping,
            testCollection,
            testCases,
            DiagnosticMessageSink,
            messageBus,
            TestCaseOrderer,
            new ExceptionAggregator(Aggregator),
            cancellationTokenSource).RunAsync();
    }
}