using System.Reflection;
using Xunit.Abstractions;
using Xunit.Sdk;

namespace easyJet.Holiday.IntegrationTests.Infrastructure.xUnit;

public class TestFrameworkExecutor : XunitTestFrameworkExecutor
{
    public TestFrameworkExecutor(
        AssemblyName assemblyName,
        ISourceInformationProvider sourceInformationProvider,
        IMessageSink diagnosticMessageSink)
        : base(assemblyName, sourceInformationProvider, diagnosticMessageSink)
    {
    }

    protected override async void RunTestCases(IEnumerable<IXunitTestCase> testCases, IMessageSink executionMessageSink, ITestFrameworkExecutionOptions executionOptions)
    {
        using var assemblyRunner = new TestAssemblyRunner(TestAssembly, testCases, DiagnosticMessageSink, executionMessageSink, executionOptions);

        await assemblyRunner.RunAsync();
    }
}