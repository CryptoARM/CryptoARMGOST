import fs from "fs";
import { Map } from "immutable";
import * as os from "os";
import * as path from "path";
import PropTypes, { any } from "prop-types";
import React from "react";
import ReactDOM from "react-dom";
import { connect } from "react-redux";
import { addCertificateRequestCA, loadAllCertificates, removeAllCertificates } from "../../AC";
import { postCertRequest, postCertRequestAuthCert } from "../../AC/caActions";
import {
  ALG_GOST12_256, ALG_GOST12_512, CA_SERVICE, DEFAULT_CSR_PATH,
  HOME_DIR, KEY_USAGE_ENCIPHERMENT, KEY_USAGE_SIGN, KEY_USAGE_SIGN_AND_ENCIPHERMENT,
  MODAL_ADD_SERVICE_CA, MY, PROVIDER_CRYPTOPRO, PROVIDER_SYSTEM,
  REQUEST, REQUEST_TEMPLATE_ADDITIONAL, REQUEST_TEMPLATE_DEFAULT, REQUEST_TEMPLATE_KEP_FIZ, REQUEST_TEMPLATE_KEP_IP, ROOT, USER_NAME,
} from "../../constants";
import { filteredServicesByType } from "../../selectors/servicesSelectors";
import * as jwt from "../../trusted/jwt";
import { arrayToMap, fileCoding, formatDate, mapToArr, uuid, validateInn, validateOgrn, validateOgrnip, validateSnils } from "../../utils";
import logger from "../../winstonLogger";
import ServiceInfo from "../Services/ServiceInfo";
import ServiceListItem from "../Services/ServiceListItem";
import { ICertificateRequestCA, IRegRequest } from "../Services/types";
import DynamicSubjectName from "./DynamicSubjectName";
import HeaderTabs from "./HeaderTabs";
import KeyParameters from "./KeyParameters";

interface IKeyUsage {
  cRLSign: boolean;
  dataEncipherment: boolean;
  decipherOnly: boolean;
  digitalSignature: boolean;
  encipherOnly: boolean;
  keyAgreement: boolean;
  keyEncipherment: boolean;
  keyCertSign: boolean;
  nonRepudiation: boolean;
  [key: string]: boolean;
}

interface IExtendedKeyUsage {
  "1.3.6.1.5.5.7.3.1": boolean;
  "1.3.6.1.5.5.7.3.2": boolean;
  "1.3.6.1.5.5.7.3.3": boolean;
  "1.3.6.1.5.5.7.3.4": boolean;
  [key: string]: boolean;
}

interface ICertificateRequestCAState {
  activeService: any;
  activeSubjectNameInfoTab: boolean;
  addService: boolean;
  algorithm: string;
  caTemplate: any;
  caTemplatesArray: any[];
  containerName: string;
  disabled: boolean;
  exportableKey: boolean;
  extKeyUsage: IExtendedKeyUsage;
  filedChanged: boolean;
  formVerified: boolean;
  keyLength: number;
  keyUsage: IKeyUsage;
  keyUsageGroup: string;
  selfSigned: boolean;
  template: any;
  templateName: string;
  OpenButton: boolean;
  RDNsubject: any;
}

interface ICertificateRequestCAProps {
  regrequests: Map<any, any>;
  certrequests: Map<any, any>;
  certificates: Map<any, any>;
  handleShowModalByType: (type: string) => void;
  service?: any;
  servicesMap: Map<any, any>;
  certificateTemplate: any;
  onCancel?: () => void;
  certificateLoading: boolean;
  lic_error: number;
  licenseStatus: boolean;
  loadAllCertificates: () => void;
  removeAllCertificates: () => void;
  addCertificateRequestCA: (certificateRequestCA: ICertificateRequestCA) => void;
  postCertRequest: (url: string, certificateRequestCA: ICertificateRequestCA, subject: any, regRequest: any, serviceId: string) => void;
  postCertRequestAuthCert: (url: string, certificateRequestCA: ICertificateRequestCA, certificateReq: string, subject: any, regRequest: any, serviceId: string) => void;
}

class CertificateRequestCA extends React.Component<ICertificateRequestCAProps, ICertificateRequestCAState> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  constructor(props: any) {
    super(props);

    this.state = {
      activeService: "",
      addService: false,
      caTemplate: "",
      caTemplatesArray: [],
      disabled: true,
      OpenButton: false,
      activeSubjectNameInfoTab: true,
      algorithm: ALG_GOST12_256,
      containerName: uuid(),
      exportableKey: false,
      extKeyUsage: {
        "1.3.6.1.5.5.7.3.1": false,
        "1.3.6.1.5.5.7.3.2": true,
        "1.3.6.1.5.5.7.3.3": false,
        "1.3.6.1.5.5.7.3.4": true,
      },
      formVerified: false,
      filedChanged: true,
      keyLength: 1024,
      keyUsage: {
        cRLSign: false,
        dataEncipherment: true,
        decipherOnly: false,
        digitalSignature: true,
        encipherOnly: false,
        keyAgreement: false,
        keyCertSign: false,
        keyEncipherment: true,
        nonRepudiation: true,
      },
      keyUsageGroup: KEY_USAGE_SIGN_AND_ENCIPHERMENT,
      selfSigned: false,
      template: this.props.templates && this.props.templates.length ? this.props.templates[0] : null,
      templateName: this.props.templates && this.props.templates.length ? this.props.templates[0].FriendlyName : null,
      RDNsubject: {
        "2.5.4.6": {
          type: "2.5.4.6",
          value: "RU",
        },
      },
    };
  }

  componentDidMount() {
    const { service } = this.props;

    if (service) {
      this.activeItemChose(service);
    }

    $(document).ready(() => {
      $("select").material_select();
    });

    $(ReactDOM.findDOMNode(this.refs.templateSelect)).on("change", this.handleTemplateChange);
  }

  componentDidUpdate() {

    if  ( this.state.filedChanged === true) {
      if (this.verifyFields() === true) {
        this.setState({ disabled: true });
      } else {
        this.setState({ disabled: false });
      }
      this.setState ( {filedChanged: false});
    }

    $(document).ready(() => {
      $("select").material_select();
    });

    $(ReactDOM.findDOMNode(this.refs.templateSelect)).on("change", this.handleTemplateChange);
  }

  componentWillUnmount() {
    this.handelCancel();
  }

  render() {
    const { localize, locale } = this.context;
    const { activeSubjectNameInfoTab, addService, algorithm, containerName, formVerified,
      exportableKey, extKeyUsage, keyLength, keyUsage, keyUsageGroup,
      template, templateName, activeService, OpenButton, RDNsubject } = this.state;
    const { certificates, certrequests, regrequests, services, servicesMap, templates } = this.props;
    const classDisabled = this.state.disabled ? "" : "disabled";

    let regRequest;
    let certrequest;
    let certificate;

    const elements = services.map((service: any) => {
      const rrequest = regrequests.find((obj: any) => obj.get("serviceId") === service.id);

      return (
        <ServiceListItem
          key={service.id}
          chooseCert={() => this.activeItemChose(service)}
          isOpen={activeService === service.id}
          toggleOpen={() => this.activeItemChose(service)}
          regRequest={rrequest}
          service={service} />
      );
    });

    let disabled = "disabled";
    if (activeService) {
      disabled = " ";
      regRequest = regrequests.find((obj: any) => obj.get("serviceId") === activeService);
      certrequest = certrequests.find((obj: any) => obj.get("serviceId") === activeService);
      certificate = certrequest ? certificates.get(certrequest.certificateId) : null;
    }

    if (addService) {
      disabled = " ";
    }

    if (OpenButton === true) {
      return (

        <React.Fragment>
          <div className="modal-body">
            <div className="row nobottom">
              <div className="col s12">
                <HeaderTabs activeSubjectNameInfoTab={this.handleChangeActiveTab} />
              </div>

              {activeSubjectNameInfoTab ?
                <div className="col s12 ">
                  <div className="content-wrapper z-depth-1 tbody" style={{ height: "400px" }}>
                    <div className="content-item-relative">
                      <div className="row halfbottom" />
                      <DynamicSubjectName
                        formVerified={formVerified}
                        model={RDNsubject}
                        template={this.state.template}
                        onSubjectChange={this.onSubjectChange}
                      />
                    </div>
                  </div>
                </div> :
                <div className="col s12">
                  <div className="content-wrapper z-depth-1 tbody" style={{ height: "400px" }}>
                    <div className="content-item-relative">
                      <div className="row halfbottom" />
                      <KeyParameters
                        algorithm={algorithm}
                        caTemplates={this.state.caTemplatesArray}
                        containerName={containerName}
                        exportableKey={exportableKey}
                        extKeyUsage={extKeyUsage}
                        formVerified={formVerified}
                        keyLength={keyLength}
                        keyUsage={keyUsage}
                        keyUsageGroup={keyUsageGroup}
                        handleAlgorithmChange={this.handleAlgorithmChange}
                        handleCATemplateChange={this.handleCATemplateChange}
                        handleInputChange={this.handleInputChange}
                        handleKeyUsageChange={this.handleKeyUsageChange}
                        handleKeyUsageGroupChange={this.handleKeyUsageGroupChange}
                        handleExtendedKeyUsageChange={this.handleExtendedKeyUsageChange}
                        toggleExportableKey={this.toggleExportableKey}
                      />
                    </div>
                  </div>
                </div>
              }

              <div className="row halfbottom" />

              <div className="row halfbottom">
                <div style={{ float: "right" }}>
                  <div style={{ display: "inline-block", margin: "10px" }}>
                    <a className="btn btn-text waves-effect waves-light modal-close" onClick={this.handelCancel}>{localize("Common.cancel", locale)}</a>
                  </div>
                  <div style={{ display: "inline-block", margin: "10px" }}>
                  <a
                    className={`btn btn-outlined waves-effect waves-light ${classDisabled}`}
                    onClick={this.handelReady}>{localize("Common.ready", locale)}</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </React.Fragment>
      );
    }
    return (
      <div className="modal-body">
        <div className="row halftop">
          {
            this.props.service ?
              null :
              <div className="col s12">
                <div className="content-wrapper tbody border_group" style={activeService ? { height: "200px" } : { height: "450px" }}>
                  <div className="row">
                    <div className="col s12">
                      <span className="card-infos sub">
                        Доступные подключения к сервисам Удостоверяющих Центров
                      </span>
                      <div className="col-12">
                        <div className="row halfbottom" />
                        <div className="collection">
                          {elements}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row" />
              </div>
          }

          {
            activeService ?
              <React.Fragment>
                <div className="col s12">
                  <div className="content-wrapper tbody border_group" style={this.props.service ? { height: "420px" } : { height: "200px" }}>
                    <div className="row">
                      <div className="row" />
                      <div className="input-field input-field-csr col s12">
                        <select className="select" ref="templateSelect" defaultValue={templateName} onChange={this.handleTemplateChange} >
                          {
                            templates.map((template: any) => {
                              return <option key={template.FriendlyName} value={template.FriendlyName}>{template.FriendlyName}</option>;
                            })
                          }
                        </select>
                        <label>{localize("Services.type_certificate_holder", locale)}</label>
                      </div>
                    </div>

                    <div className="row" />

                    <div className="row">
                      <ServiceInfo service={{
                        ...(servicesMap.get(activeService)).toJS(), login: regRequest ? regRequest.Token : "",
                        password: regRequest ? regRequest.Password : "",
                        comment: regRequest ? regRequest.Comment : "",
                        keyPhrase: regRequest ? regRequest.KeyPhrase : "",
                        email: regRequest ? regRequest.Email : "",
                      }} certificate={certificate} />

                    </div>
                  </div>
                </div>

              </ React.Fragment> :
              null
          }

          <div className="row halfbottom" />

          <div className="row halfbottom">
            <div style={{ float: "left" }}>
              <div style={{ display: "inline-block", margin: "10px" }}>
                <input
                  name="addService"
                  className="filled-in"
                  type="checkbox"
                  id="addService"
                  checked={addService}
                  onChange={this.toggleAddService}
                />
                <label htmlFor="addService">
                  {localize("Services.add_new_service", locale)}
                </label>
              </div>
            </div>

            <div style={{ float: "right" }}>
              <div style={{ display: "inline-block", margin: "10px" }}>
                <a className="btn btn-text waves-effect waves-light modal-close" onClick={this.handelCancel}>{localize("Common.cancel", locale)}</a>
              </div>
              <div style={{ display: "inline-block", margin: "10px" }}>
                <a className={`btn btn-outlined waves-effect waves-light ${classDisabled}`}onClick={() => { this.funcOpenButton()}}>{localize("Common.ready", locale)}</a>
              </div>
            </div>
          </div>
        </div>
      </div >

    );
  }

  onSubjectChange = (model: any) => {
    this.setState({ RDNsubject: { ...model }, filedChanged: true });
  }

  activeItemChose = (service: any) => {
    const { regrequests } = this.props;

    if (this.state.activeService && this.state.activeService === service.id) {
      this.setState({ activeService: null });
    } else {
      this.setState({ activeService: service.id, addService: false });

      const request = regrequests.find((obj: any) => obj.get("serviceId") === service.id);
      if (request && request.RDN) {
        let newSubject = {
          ...this.state.RDNsubject,
        };

        Object.keys(request.RDN).map((key) => {
          const value = request.RDN[key];

          if (value) {
            newSubject = {
              ...newSubject,
              [key]: { type: key, value },
            };
          }
        });

        this.setState({ RDNsubject: { ...newSubject } });
      }
    }
  }

  toggleAddService = () => {
    const { activeService, addService } = this.state;
    this.setState({
      activeService: addService ? activeService : "",
      addService: !addService,
    });
  }

  funcOpenButton = () => {
    const { activeService, addService } = this.state;
    const { regrequests } = this.props;

    if (addService) {
      this.handelCancel();
      setTimeout(() => {
        this.props.handleShowModalByType(MODAL_ADD_SERVICE_CA);
      }, 100);
    }

    const regrequest = regrequests.find((obj: any) => obj.get("serviceId") === activeService);
    const caTemplatesObj = this.props.caTemplates.get(regrequest.id);
    let caTemplatesArray;

    if (caTemplatesObj) {
      caTemplatesArray = caTemplatesObj.template;
    }

    this.setState({ OpenButton: true, caTemplatesArray });
  }

  verifyFields = () => {
    const { template, RDNsubject } = this.state;
    const REQULAR_EXPRESSION = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;

    if (!template || !template.RDN) {
      return false;
    }
    let result = true;
    for (let key of Object.keys(template.RDN)) {
      const templateField = template.RDN[key];
      const field = RDNsubject[templateField.Oid];
      if (field) {
        if (templateField.ProhibitEmpty && (!field || !field.value)) {
          result = false;
          break;
        }
        if (field.value && (field.type === "1.2.643.3.131.1.1")) {
          result = validateInn(field.value);
          if (!result) { break; }
        } else if (field.value && (field.type === "1.2.643.100.1")) {
          result = validateOgrn(field.value);
          if (!result) { break; }
        } else if (field.value && (field.type === "1.2.643.100.3")) {
          result = validateSnils(field.value);
          if (!result) { break; }
        } else if (field.value && (field.type === "1.2.643.100.5")) {
          result = validateOgrnip(field.value);
          if (!result) { break; }
        } else if (field.value && (field.type === "1.2.840.113549.1.9.1")) {
          result = REQULAR_EXPRESSION.test(field.value);
          if (!result) { break; }
        }
      }
    }

    return result;
  }

  handleChangeActiveTab = (activeSubjectNameInfoTab: boolean) => {
    this.setState({ activeSubjectNameInfoTab, filedChanged: true });
  }

  handelReady = () => {
    const { localize, locale } = this.context;
    const { activeService, activeSubjectNameInfoTab, caTemplatesArray, algorithm, caTemplate, containerName, exportableKey, extKeyUsage,
      keyUsage, template, RDNsubject } = this.state;
    // tslint:disable-next-line: no-shadowed-variable
    const { addCertificateRequestCA, postCertRequest, postCertRequestAuthCert } = this.props;
    const { licenseStatus, lic_error, servicesMap, regrequests, certrequests, certificates } = this.props;

    const exts = new trusted.pki.ExtensionCollection();
    let keyUsageStr = "critical";
    let extendedKeyUsageStr = "";
    let oid;
    let ext;

    if (caTemplatesArray && caTemplatesArray.length && !caTemplate) {
      $(".toast-set_template").remove();
      if (activeSubjectNameInfoTab) {
        Materialize.toast(localize("CA.goto_keyparams_set_template_subject", locale), 3000, "toast-set_template");
      } else {
        Materialize.toast(localize("CA.goto_keyparams_set_template", locale), 3000, "toast-set_template");
      }
      return;
    }

    if (licenseStatus !== true) {
      $(".toast-jwtErrorLicense").remove();
      Materialize.toast(localize(jwt.getErrorMessage(lic_error), locale), 5000, "toast-jwtErrorLicense");

      logger.log({
        level: "error",
        message: "No correct license",
        operation: "Генерация сертификата",
        operationObject: {
          in: "License",
          out: "Null",
        },
        userName: USER_NAME,
      });

      return;
    }

    if (!this.verifyFields()) {
      $(".toast-required_fields").remove();
      Materialize.toast(localize("Services.fill_required_fields", locale), 3000, "toast-required_fields");

      if (!this.state.formVerified) {
        this.setState({ formVerified: true });
      }

      return;
    }

    if (keyUsage.cRLSign) {
      keyUsageStr += ",cRLSign";
    }

    if (keyUsage.dataEncipherment) {
      keyUsageStr += ",dataEncipherment";
    }

    if (keyUsage.decipherOnly) {
      keyUsageStr += ",decipherOnly";
    }

    if (keyUsage.digitalSignature) {
      keyUsageStr += ",digitalSignature";
    }

    if (keyUsage.encipherOnly) {
      keyUsageStr += ",encipherOnly";
    }

    if (keyUsage.keyAgreement) {
      keyUsageStr += ",keyAgreement";
    }

    if (keyUsage.keyCertSign) {
      keyUsageStr += ",keyCertSign";
    }

    if (keyUsage.keyEncipherment) {
      keyUsageStr += ",keyEncipherment";
    }

    if (keyUsage.nonRepudiation) {
      keyUsageStr += ",nonRepudiation";
    }

    if (keyUsageStr.length > "critical".length) {
      oid = new trusted.pki.Oid("keyUsage");
      ext = new trusted.pki.Extension(oid, keyUsageStr);
      exts.push(ext);
    }

    if (extKeyUsage["1.3.6.1.5.5.7.3.1"]) {
      extendedKeyUsageStr.length ? extendedKeyUsageStr += ",1.3.6.1.5.5.7.3.1" : extendedKeyUsageStr += "1.3.6.1.5.5.7.3.1";
    }

    if (extKeyUsage["1.3.6.1.5.5.7.3.2"]) {
      extendedKeyUsageStr.length ? extendedKeyUsageStr += ",1.3.6.1.5.5.7.3.2" : extendedKeyUsageStr += "1.3.6.1.5.5.7.3.2";
    }

    if (extKeyUsage["1.3.6.1.5.5.7.3.3"]) {
      extendedKeyUsageStr.length ? extendedKeyUsageStr += ",1.3.6.1.5.5.7.3.3" : extendedKeyUsageStr += "1.3.6.1.5.5.7.3.3";
    }

    if (extKeyUsage["1.3.6.1.5.5.7.3.4"]) {
      extendedKeyUsageStr.length ? extendedKeyUsageStr += ",1.3.6.1.5.5.7.3.4" : extendedKeyUsageStr += "1.3.6.1.5.5.7.3.4";
    }

    if (extendedKeyUsageStr.length) {
      oid = new trusted.pki.Oid("extendedKeyUsage");
      ext = new trusted.pki.Extension(oid, extendedKeyUsageStr);
      exts.push(ext);
    }

    // if (template === REQUEST_TEMPLATE_KEP_IP || template === REQUEST_TEMPLATE_ADDITIONAL || REQUEST_TEMPLATE_KEP_FIZ) {
    oid = new trusted.pki.Oid("1.2.643.100.111");
    ext = new trusted.pki.Extension(oid, `КриптоПро CSP (версия ${this.getCPCSPVersion()})`);
    exts.push(ext);
    // }

    oid = new trusted.pki.Oid("1.3.6.1.4.1.311.21.7");
    ext = caTemplate ? new trusted.pki.Extension(oid, caTemplate) : new trusted.pki.Extension(oid, "1.2.643.2.2.46.0.8");
    exts.push(ext);

    const certReq = new trusted.pki.CertificationRequest();

    const values = Object.keys(RDNsubject).map((key) => RDNsubject[key]);
    certReq.subject = values;
    certReq.version = 0;
    certReq.extensions = exts;
    certReq.pubKeyAlgorithm = algorithm;
    certReq.exportableFlag = exportableKey;
    // certReq.newKeysetFlag = true;
    certReq.containerName = containerName;

    if (!fs.existsSync(path.join(HOME_DIR, ".Trusted", "CryptoARM GOST", "CSR"))) {
      fs.mkdirSync(path.join(HOME_DIR, ".Trusted", "CryptoARM GOST", "CSR"), { mode: 0o700 });
    }

    let urlName = `requestCA_${RDNsubject["2.5.4.3"] ? RDNsubject["2.5.4.3"].value : ""}_${algorithm}_${formatDate(new Date())}.req`;
    let urlSigName = `requestCAsign_${RDNsubject["2.5.4.3"] ? RDNsubject["2.5.4.3"].value : ""}_${algorithm}_${formatDate(new Date())}.req`;

    if (os.type() === "Windows_NT") {
      urlName = urlName.replace(/[/\\?%*:|"<>]/g, "-");
      urlSigName = urlSigName.replace(/[/\\?%*:|"<>]/g, "-");
    } else {
      urlName = urlName.replace(/[/\\:]/g, "-");
      urlSigName = urlSigName.replace(/[/\\:]/g, "-");
    }

    const url = path.join(DEFAULT_CSR_PATH, urlName);
    const urlSig = path.join(DEFAULT_CSR_PATH, urlSigName);

    try {
      certReq.save(url, trusted.DataFormat.PEM);

      const service = servicesMap.get(activeService);
      const regrequest = regrequests.find((obj: any) => obj.get("serviceId") === service.id);
      let cmsContext = fs.readFileSync(url, "utf8");
      let cmsContextSig = "";
      if (regrequest.certThumbprint) {
        const sd1: trusted.cms.SignedData = new trusted.cms.SignedData();
        const sd2: trusted.cms.SignedData = new trusted.cms.SignedData();
        const certificate = certificates.get(`CRYPTOPRO_MY_${regrequest.certThumbprint}`);
        const cert = window.PKISTORE.getPkiObject(certificate);
        sd1.content = {
          data: cmsContext,
          type: trusted.cms.SignedDataContentType.buffer,
        };
        sd1.sign(cert);
        sd1.save(urlSig, trusted.DataFormat.PEM);
        sd2.content = {
          data: urlSig,
          type: trusted.cms.SignedDataContentType.url,
        };
        sd2.sign(cert);
        sd2.save(urlSig, trusted.DataFormat.PEM);
        cmsContextSig = fs.readFileSync(urlSig, "utf8");
      }
      if (fileCoding(url) === trusted.DataFormat.PEM) {
        cmsContext = cmsContext.replace("-----BEGIN CERTIFICATE REQUEST-----", "");
        cmsContext = cmsContext.replace("-----END CERTIFICATE REQUEST-----", "");
        cmsContext = cmsContext.replace(/\r\n|\n|\r/gm, "");
      } else {
        cmsContext = fs.readFileSync(url, "base64");
      }

      const id = uuid();
      const certificateRequestCA: ICertificateRequestCA = {
        certRequestId: "",
        certificateReq: cmsContext,
        id,
        status: "",
      };

      addCertificateRequestCA(certificateRequestCA);

      if (!regrequest.certThumbprint) {
        postCertRequest(`${service.settings.url}`, certificateRequestCA, values, regrequest, service.id);
      } else {
        postCertRequestAuthCert(`${service.settings.url}`, certificateRequestCA, cmsContextSig, values, regrequest, service.id);
      }

      Materialize.toast(localize("CSR.create_request_created", locale), 2000, "toast-csr_created");
    } catch (e) {
      Materialize.toast(localize("CSR.create_request_error", locale), 4000, "toast-csr_error");
    }

    this.handelCancel();
  }

  handleReloadCertificates = () => {
    // tslint:disable-next-line:no-shadowed-variable
    const { certificateLoading, loadAllCertificates, removeAllCertificates } = this.props;

    removeAllCertificates();

    if (!certificateLoading) {
      loadAllCertificates();
    }
  }

  handelCancel = () => {
    const { onCancel } = this.props;

    if (onCancel) {
      onCancel();
    }
  }

  toggleExportableKey = () => {
    this.setState({ exportableKey: !this.state.exportableKey });
  }

  handleTemplateChange = (ev: any) => {
    const { templates } = this.props;
    const name = ev.target.value;

    this.setState({ filedChanged: true, templateName: name, template: templates.find((item: any) => item.FriendlyName === name) });
  }

  handleAlgorithmChange = (ev: any) => {
    this.setState({ algorithm: ev.target.value });
  }

  handleCATemplateChange = (ev: any) => {
    this.setState({ caTemplate: ev.target.value, filedChanged: true});
  }

  handleInputChange = (ev: any) => {
    const { localize, locale } = this.context;
    const pattern = /^[0-9a-z-.\\\s]+$/i;

    const target = ev.target;
    const name = target.name;
    const value = ev.target.value;

    if (name === "containerName") {
      if (pattern.test(value || !value)) {
        this.setState({ [name]: value });
      } else {
        $(".toast-invalid_character").remove();
        Materialize.toast(localize("Containers.invalid_character", locale), 2000, "toast-invalid_character");
      }

      return;
    }
    this.setState ({filedChanged: true});
    this.setState({ [name]: value });
  }

  handleKeyUsageChange = (ev: any) => {
    const target = ev.target;
    const name = target.name;

    this.setState({
      keyUsage: {
        ...this.state.keyUsage,
        [name]: !this.state.keyUsage[name],
      },
    });
  }

  handleKeyUsageGroupChange = (ev: any) => {
    const { selfSigned } = this.state;
    const group = ev.target.value;
    this.setState({ keyUsageGroup: group });

    switch (group) {
      case KEY_USAGE_SIGN:
        this.setState({
          keyUsage: {
            cRLSign: false,
            dataEncipherment: false,
            decipherOnly: false,
            digitalSignature: true,
            encipherOnly: false,
            keyAgreement: false,
            keyCertSign: selfSigned ? true : false,
            keyEncipherment: false,
            nonRepudiation: true,
          },
        });
        break;

      case KEY_USAGE_ENCIPHERMENT:
        this.setState({
          keyUsage: {
            cRLSign: false,
            dataEncipherment: true,
            decipherOnly: false,
            digitalSignature: false,
            encipherOnly: false,
            keyAgreement: false,
            keyCertSign: selfSigned ? true : false,
            keyEncipherment: true,
            nonRepudiation: false,
          },
        });
        break;

      case KEY_USAGE_SIGN_AND_ENCIPHERMENT:
        this.setState({
          keyUsage: {
            cRLSign: false,
            dataEncipherment: true,
            decipherOnly: false,
            digitalSignature: true,
            encipherOnly: false,
            keyAgreement: false,
            keyCertSign: selfSigned ? true : false,
            keyEncipherment: true,
            nonRepudiation: true,
          },
        });
        break;

      default:
        return;
    }
  }

  handleExtendedKeyUsageChange = (ev: any) => {
    const target = ev.target;
    const name = target.name;

    this.setState({
      extKeyUsage: {
        ...this.state.extKeyUsage,
        [name]: !this.state.extKeyUsage[name],
      },
    });
  }

  getCPCSPVersion = () => {
    try {
      return trusted.utils.Csp.getCPCSPVersion().substring(3, 0);
    } catch (e) {
      return "";
    }
  }
}

export default connect((state) => {
  return {
    caTemplates: state.certtemplate.entities,
    certificateLoading: state.certificates.loading,
    certificates: state.certificates.entities,
    certrequests: state.certrequests.entities,
    lic_error: state.license.lic_error,
    licenseStatus: state.license.status,
    regrequests: state.regrequests.entities,
    services: mapToArr(filteredServicesByType(state, { type: CA_SERVICE })),
    servicesMap: state.services.entities,
    templates: state.templates.entities.toArray(),
  };
}, {
  addCertificateRequestCA, loadAllCertificates, postCertRequest, postCertRequestAuthCert, removeAllCertificates,
})(CertificateRequestCA);
