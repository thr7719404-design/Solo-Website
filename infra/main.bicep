targetScope = 'resourceGroup'

// ─── Parameters ───────────────────────────────────────────────────
@minLength(1)
@maxLength(64)
@description('Name of the environment')
param environmentName string

@description('Primary location for all resources')
param location string

@secure()
@description('PostgreSQL administrator password')
param postgresPassword string

@secure()
@description('JWT access token secret')
param jwtAccessSecret string

@secure()
@description('JWT refresh token secret')
param jwtRefreshSecret string

// ─── Variables ────────────────────────────────────────────────────
var resourceToken = toLower(uniqueString(subscription().id, environmentName, location))
var backendAppName = 'backend-${resourceToken}'

// ─── Log Analytics ────────────────────────────────────────────────
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: 'log-${resourceToken}'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// ─── Application Insights ─────────────────────────────────────────
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: 'appi-${resourceToken}'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
  }
}

// ─── Container Registry ───────────────────────────────────────────
resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: 'acr${resourceToken}'
  location: location
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: false
  }
}

// ─── User Managed Identity ────────────────────────────────────────
resource managedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: 'id-${resourceToken}'
  location: location
}

// ─── ACR Pull Role Assignment ─────────────────────────────────────
resource acrPullRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: acr
  name: guid(acr.id, managedIdentity.id, '7f951dda-4ed3-4680-a7ca-43fe172d538d')
  properties: {
    principalId: managedIdentity.properties.principalId
    roleDefinitionId: subscriptionResourceId(
      'Microsoft.Authorization/roleDefinitions',
      '7f951dda-4ed3-4680-a7ca-43fe172d538d'
    )
    principalType: 'ServicePrincipal'
  }
}

// ─── Container Apps Environment ───────────────────────────────────
resource containerAppsEnv 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: 'cae-${resourceToken}'
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

// ─── PostgreSQL Flexible Server ───────────────────────────────────
resource postgres 'Microsoft.DBforPostgreSQL/flexibleServers@2022-12-01' = {
  name: 'pg-${resourceToken}'
  location: location
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    version: '15'
    administratorLogin: 'soloadmin'
    administratorLoginPassword: postgresPassword
    storage: {
      storageSizeGB: 32
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
  }
}

resource postgresDb 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2022-12-01' = {
  parent: postgres
  name: 'solo_ecommerce'
}

resource postgresFirewall 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2022-12-01' = {
  parent: postgres
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// ─── Storage Account (Media / Uploads) ────────────────────────────
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: 'stsolowebsite'
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: true
    supportsHttpsTrafficOnly: true
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
}

resource mediaContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: 'media'
  properties: {
    publicAccess: 'Blob'
  }
}

// ─── Static Web App (Frontend) ────────────────────────────────────
resource staticWebApp 'Microsoft.Web/staticSites@2022-09-01' = {
  name: 'swa-${resourceToken}'
  location: location
  tags: {
    'azd-service-name': 'frontend'
  }
  properties: {}
  sku: {
    name: 'Free'
    tier: 'Free'
  }
}

// ─── Container App (Backend API) ──────────────────────────────────
resource containerApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: backendAppName
  location: location
  tags: {
    'azd-service-name': 'backend'
  }
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentity.id}': {}
    }
  }
  properties: {
    managedEnvironmentId: containerAppsEnv.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 3000
        transport: 'auto'
        allowInsecure: false
      }
      registries: [
        {
          server: acr.properties.loginServer
          identity: managedIdentity.id
        }
      ]
      secrets: [
        {
          name: 'database-url'
          value: 'postgresql://soloadmin:${postgresPassword}@${postgres.properties.fullyQualifiedDomainName}:5432/solo_ecommerce?schema=public&sslmode=require'
        }
        {
          name: 'jwt-access-secret'
          value: jwtAccessSecret
        }
        {
          name: 'jwt-refresh-secret'
          value: jwtRefreshSecret
        }
        {
          name: 'azure-storage-connection-string'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=core.windows.net'
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'solo-backend'
          image: 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            { name: 'DATABASE_URL', secretRef: 'database-url' }
            { name: 'JWT_ACCESS_SECRET', secretRef: 'jwt-access-secret' }
            { name: 'JWT_REFRESH_SECRET', secretRef: 'jwt-refresh-secret' }
            { name: 'NODE_ENV', value: 'production' }
            { name: 'PORT', value: '3000' }
            { name: 'FRONTEND_URL', value: 'https://${staticWebApp.properties.defaultHostname},https://www.solotestsite.site' }
            { name: 'STORAGE_TYPE', value: 'azure' }
            { name: 'AZURE_STORAGE_CONNECTION_STRING', secretRef: 'azure-storage-connection-string' }
            { name: 'AZURE_STORAGE_CONTAINER', value: 'media' }
            {
              name: 'UPLOAD_BASE_URL'
              value: 'https://${storageAccount.name}.blob.core.windows.net/media'
            }
            {
              name: 'APP_URL'
              value: 'https://${backendAppName}.${containerAppsEnv.properties.defaultDomain}'
            }
            {
              name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
              value: appInsights.properties.ConnectionString
            }
            { name: 'ADMIN_EMAIL', value: 'admin@solo-ecommerce.com' }
            { name: 'ADMIN_PASSWORD', value: 'AdminPassword123!' }
            { name: 'THROTTLE_TTL', value: '60' }
            { name: 'THROTTLE_LIMIT', value: '1000' }
          ]
        }
      ]
      scale: {
        minReplicas: 0
        maxReplicas: 2
      }
    }
  }
}

// ─── Outputs ──────────────────────────────────────────────────────
output AZURE_CONTAINER_REGISTRY_ENDPOINT string = acr.properties.loginServer
output AZURE_CONTAINER_REGISTRY_NAME string = acr.name
output BACKEND_URI string = 'https://${containerApp.properties.configuration.ingress.fqdn}'
output UPLOAD_BASE_URL string = 'https://${storageAccount.name}.blob.core.windows.net/media'
output POSTGRES_FQDN string = postgres.properties.fullyQualifiedDomainName
output STATIC_WEB_APP_URL string = 'https://${staticWebApp.properties.defaultHostname}'
