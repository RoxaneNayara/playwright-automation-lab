import appsettings from '../../../config/appsettings.json' with { type: 'json' };

type EnvironmentConfig = {
  BaseUrl?: string;
};

type AppSettings = {
  Environments: Record<string, EnvironmentConfig>;
};

const settings = appsettings as AppSettings;

export const config = {
  getBaseUrl(environmentName: string): string | undefined {
    return settings.Environments[environmentName]?.BaseUrl;
  },
};
