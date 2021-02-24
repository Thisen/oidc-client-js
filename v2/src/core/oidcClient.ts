import { uuidv4 } from "./uuid";
import { addQueryParam } from "./utils";
import { MetadataService } from "./metaDataService";

interface OidcClientConfig {
  /**
   * Your client application's identifier as registered with the OIDC/OAuth2
   */
  clientId?: string;
  clientSecret?: string;
  /**
   * The scope being requested from the OIDC/OAuth2 provider (default: "openid")
   */
  scope?: string;
  /**
   *  The redirect URI of your client application to receive a response from the OIDC/OAuth2 provider
   */
  redirectUri?: string;
  /**
   * Web storage API. (default: "LocalStorage")
   */
  storage?: Storage;
  /**
   * The URL of the OIDC/OAuth2 provider
   */
  authority?: string;
  metadataUrl?: string;

  prompt?: string;
  display?: string;
  maxAge?: string;
  uiLocales?: string;
  idTokenHint?: string;
  loginHint?: string;
  acrValues?: string;
  resource?: string;
  // Should this be here?
  responseMode?: string;
  extraQueryParams?: string;
  extraTokenParams?: string;
}

interface CreateSigninRequest extends Omit<OidcClientConfig, "clientId"> {
  state?: any;
  request?: string;
  requestUri?: string;
  responseMode?: string;
  requestType?: string;
  skipUserInfo?: string;
}

export class OidcClient {
  private metaDataService: MetadataService;

  private clientId: OidcClientConfig["clientId"];
  private clientSecret: OidcClientConfig["clientSecret"];
  private authority: OidcClientConfig["authority"];
  private scope: OidcClientConfig["scope"];
  private redirectUri: OidcClientConfig["redirectUri"];
  private storage: NonNullable<OidcClientConfig["storage"]>;
  private prompt: OidcClientConfig["prompt"];
  private display: OidcClientConfig["display"];
  private maxAge: OidcClientConfig["maxAge"];
  private uiLocales: OidcClientConfig["uiLocales"];
  private idTokenHint: OidcClientConfig["idTokenHint"];
  private loginHint: OidcClientConfig["loginHint"];
  private acrValues: OidcClientConfig["acrValues"];
  private resource: OidcClientConfig["resource"];
  private responseMode: OidcClientConfig["responseMode"];

  private extraQueryParams: OidcClientConfig["extraQueryParams"];
  private extraTokenParams: OidcClientConfig["extraTokenParams"];

  constructor(config: OidcClientConfig = {}) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.scope = config.scope ?? "openid";
    this.redirectUri = config.redirectUri;
    this.storage = config.storage ?? localStorage;
    this.prompt = config.prompt;
    this.display = config.display;
    this.maxAge = config.maxAge;
    this.uiLocales = config.uiLocales;
    this.idTokenHint = config.idTokenHint;
    this.loginHint = config.loginHint;
    this.acrValues = config.acrValues;
    this.resource = config.resource;
    this.responseMode = config.responseMode;
    this.extraQueryParams = config.extraQueryParams;
    this.extraTokenParams = config.extraTokenParams;
    this.metaDataService = new MetadataService(config);
  }

  async signinRedirect(options: CreateSigninRequest) {
    // Flow:
    // Capture their custom state (unique id as key in storage + what we sent)
    // Store settings
    // Navigate
    const authorizationEndpoint = await this.metaDataService.getAuthorizationEndpoint();
    const signinStateProps = this.getSigninStateProperties(options);
    const id = uuidv4();
    this.storage.setItem(`oidc-client:${id}`, JSON.stringify({ id, ...signinStateProps }));
    const signinRequestProps = this.getSigninRequestProperties({ ...options, state: id });
    window.location.href = this.createSigninRedirectUrl(authorizationEndpoint!, signinRequestProps);
  }

  private getSigninRequestProperties(options: CreateSigninRequest) {
    return {
      client_id: this.clientId,
      redirect_uri: options.redirectUri ?? this.redirectUri,
      scope: options.scope ?? this.scope,
      response_type: "code",
      prompt: options.prompt ?? this.prompt,
      display: options.display ?? this.display,
      max_age: options.maxAge ?? this.maxAge,
      ui_locales: options.uiLocales ?? this.uiLocales,
      id_token_hint: options.idTokenHint ?? this.idTokenHint,
      login_hint: options.loginHint ?? this.loginHint,
      acr_values: options.acrValues ?? this.acrValues,
      resource: options.resource ?? this.resource,
      extraQueryParams: options.extraQueryParams ?? this.extraQueryParams,
      response_mode: options.responseMode ?? this.responseMode,
      state: options.state,
      request: options.request,
      request_uri: options.requestUri,
    };
  }

  private getSigninStateProperties(options: CreateSigninRequest) {
    return {
      client_id: this.clientId,
      client_secret: this.clientSecret,
      authority: this.authority,
      redirect_uri: options.redirectUri ?? this.redirectUri,
      scope: options.scope ?? this.scope,
      extraTokenParams: options.extraTokenParams ?? this.extraTokenParams,
      response_mode: options.responseMode ?? this.responseMode,
      state: options.state,
      request_type: options.requestType,
      skipUserInfo: options.skipUserInfo,
    };
  }

  private createSigninRedirectUrl(
    authorizationEndpoint: string,
    properties: Record<string, string | boolean | Record<string, string> | undefined>
  ) {
    return Object.entries(properties)
      .filter(([_, value]) => !!value)
      .reduce((endpoint, [key, value]) => addQueryParam(endpoint, key, value!), authorizationEndpoint);
  }
}
