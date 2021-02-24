interface MetadataServiceConfig {
  metadataUrl?: string;
  authority?: string;
  metadata?: any;
}

const oidcMetadataUrlPath = ".well-known/openid-configuration";

export class MetadataService {
  private _metadataUrl: MetadataServiceConfig["metadataUrl"];
  private authority: MetadataServiceConfig["authority"];
  private metadata: MetadataServiceConfig["metadata"];

  constructor(config: MetadataServiceConfig = {}) {
    this._metadataUrl = config.metadataUrl;
    this.authority = config.authority;
    this.metadata = config.metadata;
  }

  get metadataUrl() {
    if (!this._metadataUrl) {
      this._metadataUrl = this.authority;

      if (this._metadataUrl && this._metadataUrl?.indexOf(oidcMetadataUrlPath) < 0) {
        if (this._metadataUrl[this._metadataUrl.length - 1] !== "/") {
          this._metadataUrl += "/";
        }
        this._metadataUrl += oidcMetadataUrlPath;
      }
    }

    return this._metadataUrl;
  }

  async getMetadata() {
    if (this.metadata) {
      return this.metadata;
    }

    if (!this.metadataUrl) {
      return Promise.reject("No authority or metadataUrl configured on settings");
    }

    const response = await fetch(this.metadataUrl);

    if (!response.ok) {
      return Promise.reject(`Could not fetch metadata: ${response.status}`);
    }

    this.metadata = await response.json();

    return this.metadata;
  }

  getIssuer() {
    return this.getMetadataProperty("issuer");
  }

  getAuthorizationEndpoint() {
    return this.getMetadataProperty("authorization_endpoint");
  }

  getUserInfoEndpoint() {
    return this.getMetadataProperty("userinfo_endpoint");
  }

  getTokenEndpoint(optional = true) {
    return this.getMetadataProperty("token_endpoint", optional);
  }

  getCheckSessionIframe() {
    return this.getMetadataProperty("check_session_iframe", true);
  }

  getEndSessionEndpoint() {
    return this.getMetadataProperty("end_session_endpoint", true);
  }

  getRevocationEndpoint() {
    return this.getMetadataProperty("revocation_endpoint", true);
  }

  getKeysEndpoint() {
    return this.getMetadataProperty("jwks_uri", true);
  }

  private async getMetadataProperty(name: string, optional = false) {
    const metadata = await this.getMetadata();
    if (metadata[name] === undefined) {
      return optional === true ? undefined : Promise.reject("Metadata does not contain property " + name);
    }
    return metadata[name] as string;
  }
}
