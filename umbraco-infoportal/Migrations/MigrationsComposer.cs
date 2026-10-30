using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.Notifications;
using Infoportal.Cms.Migrations.NotificationHandlers;

namespace Infoportal.Cms.Migrations;

public class MigrationsComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder) =>
        builder.AddNotificationAsyncHandler<UmbracoApplicationStartingNotification, RunInfoportalMigrations>();
}
