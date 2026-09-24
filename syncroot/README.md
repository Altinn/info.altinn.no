# Info Portalen (Umbraco) Infrastructure

This directory contains the Kubernetes manifests for the Umbraco CMS implementation of the Info Portalen project.

## TODO
There are still things that needs to be done before this can be deployed.
In `syncroot/at22/kustomization.yaml` the team need to define the image name (container registry + repository) and a valid image tag. The current setup is just a dumme value that will not work.

There are still some questions regarding storage and backup. This setup should get you going once you have a public available docker image of umbraco that can be deployed.

I have disbaled the push trigger for the pipeline so it shouldn't publish an deployment before the docker image todos are done.

## Folder Structure

- **base/**: Contains the base Kubernetes resources for the Umbraco stack.
  - **umbraco/**:
    - `deployment.yaml`: Defines the Umbraco Deployment with 3 replicas, spread over nodes and zones, and a `RollingUpdate` strategy.
    - `pdb.yaml`: PodDisruptionBudget that evicts at most one pod at a time.
    - `service.yaml`: ClusterIP service for internal routing.
    - `httproute.yaml`: Gateway API routing for external access.
    - `network-policies.yaml`: Linkerd policy: Traefik may reach the pods, and the kubelet may reach the health probe paths.
    - `serviceaccount.yaml`: Dedicated service account for the Umbraco pod.
    - `kustomization.yaml`: Orchestrates the resources and applies common labels.
- **at22/**: Kustomize overlay for the AT22 environment.
  - `kustomization.yaml`: Applies environment-specific patches (e.g., hostnames, image tags).
- **tt02/**: Kustomize overlay for the TT02 environment.
- **prod/**: Kustomize overlay for the Production environment.

## Resources Created

### Deployment
- **Name**: `umbraco`
- **Namespace**: `product-infoportal` (inherited from base kustomization)
- **Replicas**: 3
- **Strategy**: `RollingUpdate` with `maxSurge: 1` and `maxUnavailable: 0`: a new pod must be ready before an old one is removed
- **Spread**: at most one pod per node for each ReplicaSet (`DoNotSchedule`), spread over zones when possible (`ScheduleAnyway`)
- **Probes**: startup and liveness on `/umbraco/api/health/live`, readiness on `/umbraco/api/health/ready`
- **Port**: 8080 (named `http`)

### PodDisruptionBudget
- `maxUnavailable: 1`: voluntary evictions (for example node drains) remove one pod at a time, so at least 2 of 3 keep running
- `unhealthyPodEvictionPolicy: AlwaysAllow`: pods that are not ready can always be evicted

### Storage
The pods keep no persistent data. Content is in Azure SQL (connection string set by the publish workflow when `database: AzureSQL` is chosen) and media is in Azure Blob Storage (`Umbraco__Storage__AzureBlob__Media__*` in each overlay).
1. **umbraco-data-cache**:
   - **Type**: `emptyDir` (local cache such as TEMP; rebuilt when a pod starts)
   - **Mount Path**: `/app/umbraco/Data`
2. **Logs**:
   - **Type**: `emptyDir`
   - **Mount Path**: `/app/umbraco/Logs`

Do not deploy with `database: Sqlite`: with an `emptyDir` and 3 replicas, each pod would get its own empty database that is lost when the pod restarts.

### Networking
- **Service**: ClusterIP on port 80 (targets container port 8080).
- **HTTPRoute**: Routes traffic via `traefik-gateway` in the `traefik` namespace.
  - **AT22 Hostname**: `infoportal.at22.dis-core.altinn.cloud`

### Identity
- **ServiceAccount**: `umbraco` (no additional permissions assigned).

## Labels
Resources are consistently labeled using Kustomize `commonLabels`:
- `app.kubernetes.io/name: umbraco`
- `app.kubernetes.io/part-of: infoportal`
