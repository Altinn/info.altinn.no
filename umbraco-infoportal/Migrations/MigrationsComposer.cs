using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.Notifications;

namespace umbraco_infoportal.Migrations;

public class MigrationsComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder) =>
        builder.AddNotificationAsyncHandler<UmbracoApplicationStartingNotification, RunInfoportalMigrations>();
}
