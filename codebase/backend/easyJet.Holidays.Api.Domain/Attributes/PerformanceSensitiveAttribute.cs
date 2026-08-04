namespace easyJet.Holidays.Api.Domain.Attributes;

/// <summary>
/// Silences Sonar on hot paths
/// </summary>
[AttributeUsage(AttributeTargets.Constructor | AttributeTargets.Method | AttributeTargets.Property | AttributeTargets.Field, AllowMultiple = true, Inherited = false)]
public sealed class PerformanceSensitiveAttribute : Attribute;