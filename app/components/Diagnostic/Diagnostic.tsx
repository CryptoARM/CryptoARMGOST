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

interface IError {
  important?: string;
  type: string;
}

interface IDiagnosticState {
  activeError: string;
  criticalError: boolean;
  errors: IError[];
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
      this.setState({
        errors: [...this.state.errors, {
          important: WARNING,
          type: NO_CORRECT_CRYPTOARM_LICENSE,
        }],
      });
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

    if (certificatesLoaded === false && nextProps.certificatesLoaded && (nextProps.certificates.size === 0)) {
      this.setState({
        errors: [...this.state.errors, {
          important: WARNING,
          type: NO_HAVE_CERTIFICATES_WITH_KEY,
        }],
      });

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
        <a className="btn btn-outlined waves-effect waves-light modal-close" onClick={this.handleMaybeCloseApp}>{localize("Diagnostic.close", locale)}</a>
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
                <Resolve activeError={this.state.activeError} />
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

    const { criticalError } = this.state;

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
  };
}, { loadAllCertificates, loadLicense })(Diagnostic);
