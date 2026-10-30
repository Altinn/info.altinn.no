using Azure.Identity;
using Azure.Storage.Blobs;
using Umbraco.Cms.Core.Composing;
using Umbraco.StorageProviders.AzureBlob.IO;

namespace Infoportal.Cms.MediaStorage;

// Stores media files and the ImageSharp cache in Azure Blob Storage, authenticating
// with the managed identity (DefaultAzureCredential) when the connection uses a container URI.
public class MediaStorageComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
        => builder.AddAzureBlobMediaFileSystem(options =>
        {
            options.TryCreateBlobContainerClientUsingUri(uri =>
                new BlobContainerClient(uri, new DefaultAzureCredential()));
        })
        .AddAzureBlobImageSharpCache();
}
