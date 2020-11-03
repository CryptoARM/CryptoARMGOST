import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { loadAllCertificates } from "../../AC";
import { loadLicense } from "../../AC/licenseActions";
import { LOCATION_ABOUT, TSP_OCSP_ENABLED } from "../../constants";
import {
  BUG, ERROR_CHECK_CSP_LICENSE, ERROR_CHECK_CSP_PARAMS,
  ERROR_LOAD_TRUSTED_CRYPTO, ERROR_LOAD_TRUSTED_CURL, NO_CORRECT_CRYPTOARM_LICENSE,
  NO_CRYPTOARM_LICENSE, NO_GOST_2001, NO_GOST_2012, NO_HAVE_CERTIFICATES_WITH_KEY,
  NO_TSP_OCSP_ENABLED, NOT_INSTALLED_CSP, WARNING,
} from "../../errors";
import { filteredCertificatesSelector } from "../../selectors";
import DiagnosticModal from "../Diagnostic/DiagnosticModal";
import Problems from "../Diagnostic/Problems";
import Resolve from "../Diagnostic/Resolve";
import { collectDiagnosticInfo } from "../../AC/urlCmdDiagnostic";
import localize from "../../i18n/localize";
import { closeDiagnosticModalNoCert } from "../../AC/trustedServicesActions";

interface IError {
  important?: string;
  type: string;
}

interface IDiagnosticState {
  activeError: string;
  criticalError: boolean;
  errors: IError[];
  urlCheck?: boolean;
}

const remote = window.electron.remote;

class Diagnostic extends React.Component<any, IDiagnosticState> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  constructor(props: any) {

    super(props);
    this.state = ({
      activeError: "",
      criticalError: false,
      errors: [],
    });

  }

  checkCPCSP = () => {
    const { localize, locale } = this.context;

    try {
      if (!trusted.utils.Csp.isGost2012_256CSPAvailable()) {
        $(".toast-noProvider2012").remove();
        Materialize.toast(localize("Csp.noProvider2012", locale), 5000, "toast-noProvider2012");

        this.setState({
          errors: [...this.state.errors, {
            important: WARNING,
            type: NO_GOST_2012,
          }],
        });

        this.setState({ criticalError: false });
        return false;
      }

      if (!trusted.utils.Csp.checkCPCSPLicense()) {
        $(".toast-noCPLicense").remove();
        Materialize.toast(localize("Csp.noCPLicense", locale), 5000, "toast-noCPLicense");

        this.setState({
          errors: [...this.state.errors, {
            important: WARNING,
            type: ERROR_CHECK_CSP_LICENSE,
          }],
        });

        return false;
      }
    } catch (e) {
      $(".toast-cspErr").remove();
      Materialize.toast(localize("Csp.cspErr", locale), 2000, "toast-cspErr");

      this.setState({
        errors: [...this.state.errors, {
          type: ERROR_CHECK_CSP_PARAMS,
        }],
      });

      this.setState({ criticalError: false });

      return false;
    }

    return true;
  }

  checkTspAndOcsp = () => {
    if (!(TSP_OCSP_ENABLED)) {
      this.setState({
        errors: [...this.state.errors, {
          important: WARNING,
          type: NO_TSP_OCSP_ENABLED,
        }],
      });
    }
  }

  checkTrustedCryptoLoadedErr = () => {

    if (window.tcerr) {
      if (window.tcerr.message) {
        if (~window.tcerr.message.indexOf("libcapi")) {
          this.setState({
            errors: [...this.state.errors, {
              important: BUG,
              type: NOT_INSTALLED_CSP,
            }],
          });

          this.setState({ criticalError: true });

          return false;
        }
      }

      this.setState({
        errors: [...this.state.errors, {
          important: BUG,
          type: ERROR_LOAD_TRUSTED_CRYPTO,
        }],
      });

      this.setState({ criticalError: true });

      return false;
    }

    if (window.curlerr) {
      this.setState({
        errors: [...this.state.errors, {
          important: WARNING,
          type: ERROR_LOAD_TRUSTED_CURL,
        }],
      });

      this.setState({ criticalError: false });

      return false;
    }

    return true;
  }

  componentWillReceiveProps(nextProps: any) {
    const { certificatesLoaded, loadingLicense } = this.props;
    const { errors } = this.state;

    if (nextProps.statusLicense === false && nextProps.lic_format === "NONE" && nextProps.verifiedLicense == true && loadingLicense === false) {
      this.setState({
        errors: [...this.state.errors, {
          important: WARNING,
          type: NO_CRYPTOARM_LICENSE,
        }],
      });

    }
    if (nextProps.dataLicense && nextProps.lic_format === undefined && nextProps.statusLicense === false && nextProps.verifiedLicense == true && loadingLicense === false) {
      let isLicWarn: boolean = false;
      this.state.errors.map(er => {
        if (er.type === NO_CORRECT_CRYPTOARM_LICENSE) {
          isLicWarn = true
        }
      })
      if (!isLicWarn) {
        this.setState({
          errors: [...this.state.errors, {
            important: WARNING,
            type: NO_CORRECT_CRYPTOARM_LICENSE,
          }],
        });
      }
    }
    if (nextProps.lic_format === "dlv" && nextProps.statusLicense === false && nextProps.verifiedLicense == true && loadingLicense === false) {

      this.setState({
        errors: [...this.state.errors, {
          important: WARNING,
          type: NO_CORRECT_CRYPTOARM_LICENSE,
        }],
      });
    }
    if (nextProps.lic_format === "JWT" && nextProps.statusLicense === false && nextProps.verifiedLicense == true && loadingLicense === false) {
      this.setState({
        errors: [...this.state.errors, {
          important: WARNING,
          type: NO_CORRECT_CRYPTOARM_LICENSE,
        }],

      });

    }

    if (certificatesLoaded === false && nextProps.certificatesLoaded && (nextProps.certificates.size === 0) || nextProps.trustedServices.showErrNoCert) {
        this.setState({
          errors: [...this.state.errors, {
            important: WARNING,
            type: NO_HAVE_CERTIFICATES_WITH_KEY,
          }],
        });

      if (nextProps.trustedServices.showErrNoCert){
        this.setState({ urlCheck: true });
        closeDiagnosticModalNoCert();
      }
    }

  }

  componentDidMount() {
    const { certificatesLoading } = this.props;

    // tslint:disable-next-line:no-shadowed-variable
    const { loadAllCertificates, loadLicense } = this.props;

    if (this.checkTrustedCryptoLoadedErr()) {
      this.checkCPCSP();

      this.checkTspAndOcsp();
    }

    loadLicense();

    if (!certificatesLoading) {
      loadAllCertificates();
    }

  }

  getCloseButton() {
    const { localize, locale } = this.context;
    const { activeError, criticalError } = this.state;

    if (!criticalError && activeError === NO_CORRECT_CRYPTOARM_LICENSE || activeError === NO_CRYPTOARM_LICENSE || activeError === ERROR_CHECK_CSP_LICENSE) {

      return (
        <Link to={LOCATION_ABOUT} onClick={() => $("#modal-window-diagnostic").closeModal()}>
          <a className="btn btn-outlined waves-effect waves-light modal-close">{localize("Common.goOver", locale)}</a>
        </Link>
      );
    } else {
      return (
        <div style={{width: "762px", display: "flex", justifyContent: "space-between"}}>
          <div>
            <a className="btn btn-text waves-effect waves-light" onClick={copyDiagnosticInfo}>{localize("DiagnosticInfo.information_about_system", locale)}</a>
          </div>
          <div>
            <a className="btn btn-outlined waves-effect waves-light" onClick={this.handleMaybeCloseApp}>{localize("Diagnostic.close", locale)}</a>
          </div>
        </div>
      );
    }

  }

  showModalWithError = () => {
    let test = 0;

    const { localize, locale } = this.context;
    const { errors } = this.state;

    if (!errors || !errors.length) {
      return null;
    }

    const cspErrors: IError[] = [];
    for (const error of errors) {
      if (error.type === NO_GOST_2012 ||
        error.type === ERROR_CHECK_CSP_PARAMS) {
        cspErrors.push(error);
      }

    }

    if (cspErrors.length) {
      if (!this.state.activeError) {

        this.setState({ activeError: cspErrors[0].type });
      }
    } else {
      if (!this.state.activeError) {
        this.setState({ activeError: errors[0].type });
      }
    }

    let errors_bad_LICENSE = 0
    let errorCounter_LICENSE = 0
    for (let usl = 0; usl < errors.length; usl++) {
      if (errors[errorCounter_LICENSE].type == "NO_CRYPTOARM_LICENSE") {
        errors_bad_LICENSE++;
        if (errors_bad_LICENSE >= 2) {
          this.setState({
            errors: errors.slice(errorCounter_LICENSE, errorCounter_LICENSE + 1)
          });
          errors_bad_LICENSE--
        }
      }
      errorCounter_LICENSE++;
    }

    return (
      <DiagnosticModal
        isOpen={true}
        header={localize("Diagnostic.header", locale)}
        onClose={this.handleMaybeCloseApp}>

        <div>
          <div className="row nobottom">
            <div className="diagnostic-content-item">
              <div className="col s6 m5 l6 problem-contaner"> 
                <Problems errors={cspErrors.length ? cspErrors : errors} activeError={this.state.activeError} onClick={this.handleClickOnError} />
              </div>
              <div className="col s6 m7 l6 problem-contaner">
                <Resolve activeError={this.state.activeError} onClose={this.handleMaybeCloseApp}/>
              </div>
            </div>

            <div className="row halfbottom" />

            <div className="row halfbottom">
              <div style={{ float: "right" }}>
                <div style={{ display: "inline-block", margin: "10px" }}>
                  {this.getCloseButton()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DiagnosticModal>
    );
  }

  handleClickOnError = (error: string) => {

    this.setState({ activeError: error });

  }

  handleMaybeCloseApp = () => {
    const { criticalError, urlCheck} = this.state;

    if (!this.props.trustedServices.showErrNoCert && urlCheck) {
      this.setState({
        activeError: "",
        errors: [],
        urlCheck: false,
      })
    }

    if (criticalError) {
      remote.getGlobal("sharedObject").isQuiting = true;
      remote.getCurrentWindow().close();
    }

    $("#modal-window-diagnostic").closeModal();
  }

  render() {
    return (
      <React.Fragment>
        {this.showModalWithError()}
      </React.Fragment>
    );
  }
}

export function copyDiagnosticInfo () {
  let diagnosticInfo: string = "";
  let isTrusted: boolean;

  const diagOperations = ["SYSTEMINFORMATION", "CSP_ENABLED", "CADES_ENABLED", "VERSIONS", "PROVIDERS", "LICENSES"];
  const result = collectDiagnosticInfo("fromSideMenu", diagOperations)

  try {
    trusted.utils.Csp.isGost2012_256CSPAvailable();
    isTrusted = true;
   } catch(e) {
     try {
      trusted.utils.Csp.getCPCSPVersion();
      isTrusted = true;
     } catch(e){
        isTrusted = false;
     }
   }

  if (result.SYSTEMINFORMATION !== undefined) {
    diagnosticInfo = `Информация о системе: архитектура - ${result.SYSTEMINFORMATION.arch}, тип - ${result.SYSTEMINFORMATION.packageType}, платформа - ${result.SYSTEMINFORMATION.platform}, тип ОС - ${result.SYSTEMINFORMATION.type};\n`
  }

  if (result.CSP_ENABLED !== undefined && isTrusted) {
    diagnosticInfo += `Криптопровайдер КриптоПро CSP: ${result.CSP_ENABLED ? "установлен" : "не установлен"};\n`
  }

  if (result.CADES_ENABLED !== undefined) {
    diagnosticInfo += `Модуль "Усовершенственная подпись": ${result.CADES_ENABLED ? "установлен" : "не установлен"};\n`
  }

  if (result.VERSIONS !== undefined) {
    diagnosticInfo += `Версии: криптоАРМ - ${result.VERSIONS.cryptoarm}${isTrusted ? (", криптоПро - " + (result.VERSIONS.csp ? result.VERSIONS.csp : "не установлен") + ";\n") : ";\nМодуль trusted-crypto: не загружен;\n"}`
  }

  if (result.PROVIDERS !== undefined) {
    diagnosticInfo += `Провайдеры: криптопровайдер ГОСТ 2012-256 - ${result.PROVIDERS.GOST2012_256 ? "установлен" : "не установлен"}, криптопровайдер ГОСТ 2012-512 - ${result.PROVIDERS.GOST2012_512 ? "установлен" : "не установлен"};\n`
  }

  if (result.LICENSES !== undefined) {
    let lic
    if (result.LICENSES.cryptoarm.type === "temporary") {
        lic = "временная"
    } else if (result.LICENSES.cryptoarm.type === "permament") {
        lic = "бессрочная"
    } else {lic = "отсутствует"}
    diagnosticInfo += `Лизензии: КриптоАРМ - ${lic}, статус лизензии КриптоАРМ - ${result.LICENSES.cryptoarm.status ? "действительна" : "недействительна"}, статус лизензии КриптоПро CSP - ${result.LICENSES.csp.status ? "действительна" : "недействительна"};\n`
  }
  
  const { clipboard } = require('electron')
  clipboard.writeText(diagnosticInfo, 'selection')
  Materialize.toast(localize("DiagnosticInfo.copy_text", window.locale), 3000);
}

export default connect((state) => {
  return {
    certificates: filteredCertificatesSelector(state, { operation: "personal_certs" }),
    certificatesLoaded: state.certificates.loaded,
    certificatesLoading: state.certificates.loading,
    dataLicense: state.license.data,
    lic_error: state.license.lic_error,
    lic_format: state.license.lic_format,
    loadedLicense: state.license.loaded,
    loadingLicense: state.license.loading,
    statusLicense: state.license.status,
    verifiedLicense: state.license.verified,
    trustedServices: state.trustedServices,
  };
}, { loadAllCertificates, loadLicense })(Diagnostic);
