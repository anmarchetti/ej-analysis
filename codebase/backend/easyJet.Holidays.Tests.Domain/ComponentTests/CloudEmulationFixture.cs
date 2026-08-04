using DotNet.Testcontainers.Builders;
using DotNet.Testcontainers.Configurations;
using DotNet.Testcontainers.Containers;
using DotNet.Testcontainers.Networks;
using Xunit;

namespace easyJet.Holidays.Tests.Domain.ComponentTests;

public class CloudEmulationFixture : IAsyncLifetime
{
    
    private IContainer _flociContainer;
    private INetwork _network;
    private IContainer _terraformContainer;
    //private IContainer _stackportContainer;

    public async ValueTask InitializeAsync()
    {
        await ConfigureAwsEmulation();
    }

    public async ValueTask DisposeAsync()
    {
        if (_flociContainer.Health != TestcontainersHealthStatus.Undefined)
        {
            await _flociContainer.DisposeAsync();
        }

        if (_terraformContainer.Health != TestcontainersHealthStatus.Undefined)
        {
            await _terraformContainer.DisposeAsync();
        }

        //if (_stackportContainer.Health != TestcontainersHealthStatus.Undefined)
        //{
        //    await _stackportContainer.DisposeAsync();
        //}

        await _network.DisposeAsync();
    }

    private async Task ConfigureAwsEmulation()
    {
        var networkName = Guid.NewGuid().ToString("D");
        _network = new NetworkBuilder()
            .WithName(networkName)
            .Build();

        var flociName = $"{Guid.NewGuid():D}-floci";
        var terraformName = $"{Guid.NewGuid():D}-terraform";

        // falling back to latest, not ideal, but this is for tests after all.
        var flociVersion = Environment.GetEnvironmentVariable("COMPONENT_TEST_FLOCI_VER") ?? "1.5.14";
        var terraformVersion = Environment.GetEnvironmentVariable("COMPONENT_TEST_TERRAFORM_VER") ?? "1.14";

        if (!int.TryParse(Environment.GetEnvironmentVariable("COMPONENT_TEST_TERRAFORM_PARALLELISM"), out var terraformParallelism))
            terraformParallelism = 24;

        Console.WriteLine($"Using versions: floci {flociVersion} | terraform {terraformVersion}");

        _flociContainer = new ContainerBuilder($"floci/floci:{flociVersion}")
            .WithName(flociName)
            .WithCleanUp(true)
            .WithNetwork(_network)
            .WithWaitStrategy(Wait.ForUnixContainer())
            .WithPortBinding(4566, 4566)
            .WithEnvironment("FLOCI_DEFAULT_REGION", "eu-west-1")
            .WithEnvironment("FLOCI_SERVICES_DOCKER_NETWORK", networkName)
            .Build();

        _terraformContainer = new ContainerBuilder($"hashicorp/terraform:{terraformVersion}")
            .WithName(terraformName)
            .WithEntrypoint("/bin/sh", "-c")
            .WithEnvironment("TF_LOG", "INFO")
            .WithCommand("rm ./terraform.tfstate;" +
                         "terraform init; " +
                         $"terraform apply -refresh=false -auto-approve -parallelism={terraformParallelism} -lock=false -var=\"name={flociName}\" -var=\"port={4566}\";")
            .WithNetwork(_network)
            .WithWorkingDirectory("/tfworkspace")
            .WithBindMount(Path.GetFullPath("./Terraform"), "/tfworkspace", AccessMode.ReadWrite)
            .WithCleanUp(true)
            .Build();

        //_stackportContainer = new ContainerBuilder("davireis/stackport")
        //    .WithNetwork(_network)
        //    .WithEnvironment("AWS_ENDPOINT_URL", $"http://{flociName}:{4566}")
        //    .WithEnvironment("AWS_REGION", "eu-west-1")
        //    .WithPortBinding("8787", "8080")
        //    .WithCleanUp(true)
        //    .Build();

        using var cts = new CancellationTokenSource(TimeSpan.FromMinutes(5));

        try
        {
            await _network.CreateAsync(cts.Token);
            await _flociContainer.StartAsync(cts.Token);
            //await _stackportContainer.StartAsync(cts.Token);
            await _terraformContainer.StartAsync(cts.Token);
            // waiting until container finishes it's execution. this means, that terraform ran it's apply command against floci to completion
            await _terraformContainer.GetExitCodeAsync(cts.Token);
        }
        catch (Exception e)
        {
            Console.WriteLine("floci_exception");
            Console.WriteLine(e);
            if (_flociContainer.Health != TestcontainersHealthStatus.Undefined)
            {
                var (flociStdOut, flociStdErr) = await _flociContainer.GetLogsAsync(ct: cts.Token);
                Console.WriteLine("floci_stdout");
                Console.WriteLine(flociStdOut);

                Console.WriteLine("floci_stderr");
                Console.WriteLine(flociStdErr);
            }

            if (_terraformContainer.Health != TestcontainersHealthStatus.Undefined)
            {
                var (terraformStdout, terraformStderr) = await _terraformContainer.GetLogsAsync(ct: cts.Token);
                Console.WriteLine("terraform_stdout");
                Console.WriteLine(terraformStdout);
                Console.WriteLine("terraform_stderr");
                Console.WriteLine(terraformStderr);
            }

            throw;
        }
    }
}