export interface IMegafonSettings {
  mobileNumber: string;
}

export interface ICryptoProSettings {
  authURL: string;
  restURL: string;
}

export interface ICryptoProSVSSettings {
  hostName: string;
  applicationName: string;
}

export interface ICAServiceSettings {
  url: string;
  template_file: string;
}

export interface IService {
  id: string;
  type: "CA_SERVICE";
  settings: ICAServiceSettings;
  name: string;
}

export interface ICertificateRequestCA {
  subject: any;
  certificate: string;
  certRequestId: string;
  certificateReq: string;
  id: string;
  status: string;
  serviceId: string;
}

export interface IRegRequest {
  Comment: string;
  Description: string;
  Email: string;
  KeyPhrase: string;
  Password: string;
  RDN: any;
  RegRequestId: string;
  Status: string;
  Token: string;
  id: string;
  serviceId: string;
  certThumbprint: string;
}
