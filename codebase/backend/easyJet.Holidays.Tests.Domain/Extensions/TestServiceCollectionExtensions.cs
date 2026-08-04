using Microsoft.Extensions.DependencyInjection;

namespace easyJet.Holidays.Tests.Domain.Extensions;

internal static class TestServiceCollectionExtensions
{
    internal static bool RemoveByImplementingType(this IServiceCollection instance, Type toRemove)
    {
        var implementing = instance.Where(descriptor => descriptor.ImplementationType == toRemove).ToList();

        var success = true;

        if (implementing is null or [])
        {
            return false;
        }

        foreach (var descriptor in implementing)
        {
            success &= instance.Remove(descriptor);
        }

        return success;
    }
}