using Infoportal.Cms.Hosting;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Hosting;

namespace Infoportal.Cms.Tests.Hosting;

public class ConfigurationExtensionsTests : IDisposable
{
    // A key no other test or setting uses, since environment variables are shared by the whole test process.
    private const string Key = "InfoportalConfigurationTest:Value";
    private const string EnvironmentVariable = "InfoportalConfigurationTest__Value";

    private readonly string _contentRoot = Directory.CreateTempSubdirectory().FullName;

    public ConfigurationExtensionsTests()
    {
        File.WriteAllText(
            Path.Combine(_contentRoot, "appsettings.Local.json"),
            """{ "InfoportalConfigurationTest": { "Value": "from-file" } }""");
    }

    public void Dispose()
    {
        Environment.SetEnvironmentVariable(EnvironmentVariable, null);
        Directory.Delete(_contentRoot, recursive: true);
    }

    [Fact]
    public void Local_settings_file_is_read_in_Development()
    {
        WebApplicationBuilder builder = CreateBuilder();

        builder.AddInfoportalConfiguration();

        Assert.Equal("from-file", builder.Configuration[Key]);
    }

    [Fact]
    public void Environment_variables_win_over_the_local_settings_file()
    {
        Environment.SetEnvironmentVariable(EnvironmentVariable, "from-environment");
        WebApplicationBuilder builder = CreateBuilder();

        builder.AddInfoportalConfiguration();

        Assert.Equal("from-environment", builder.Configuration[Key]);
    }

    private WebApplicationBuilder CreateBuilder() =>
        WebApplication.CreateBuilder(new WebApplicationOptions
        {
            EnvironmentName = Environments.Development,
            ContentRootPath = _contentRoot,
        });
}
