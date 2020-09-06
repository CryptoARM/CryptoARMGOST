import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";
import { addTrustedService, hideModalAddTrustedService } from "../../AC/trustedServicesActions";
import store from "../../store";
import { dispatchURLCommand, getHostFromUrl } from "../../AC/urlActions";
import { formatDate } from "../../utils";

interface IAddTrustedServiceProps {
  onCancel?: () => void;
}

interface IAddTrustedServiceState {
  saveService: boolean;
}

class AddTrustedService extends React.Component<
  IAddTrustedServiceProps,
  IAddTrustedServiceState
> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  constructor(props: IAddTrustedServiceProps) {
    super(props);

    this.state = {
      saveService: false,
    };
  }

  componentWillUnmount() {
    this.handelCancel();
  }

  render() {
    const { saveService } = this.state;
    const { localize, locale } = this.context;
    const { trustedServices, urlCmds } = this.props;

    const urlToCheck = trustedServices && trustedServices.urlToCheck ? getHostFromUrl(trustedServices.urlToCheck) : "Unknown URL";

    return (
      <React.Fragment>
        <div className="row halftop">
          <div className="col s12">
            <div className="content-wrapper z-depth-1 tbody">
              <div className="dialog-text">
                {localize("TrustedServices.site", locale)} <span className="cryptoarm-blue" style={{ fontWeight: "bold" }}>{urlToCheck}</span> {localize("TrustedServices.requests_for_cryptoarm", locale)}
              </div>
              <div>
                {this.certInfo()}
              </div>
              <div className="row">
                <div className="dialog-text">
                  <input
                    name="groupDelCont"
                    type="checkbox"
                    id="delCont"
                    className="filled-in"
                    checked={saveService}
                    onClick={this.toggleSaveService}
                  />
                  <label htmlFor="delCont">{localize("TrustedServices.do_not_show_again", locale)}</label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row halfbottom" />

        <div className="row halfbottom">
          <div style={{ float: "right" }}>
            <div style={{ display: "inline-block", margin: "10px" }}>
              <a
                className="btn btn-text waves-effect waves-light modal-close"
                onClick={this.handelCancel}
              >
                {localize("Common.cancel", locale)}
              </a>
            </div>
            <div style={{ display: "inline-block", margin: "10px" }}>
              <a
                className="btn btn-outlined waves-effect waves-light modal-close"
                onClick={this.handleProcessCommandWithService}
              >
                {localize("Common.allow", locale)}
              </a>
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }

  handleProcessCommandWithService = () => {
    const { trustedServices, urlCmds } = this.props;

    const urlToCheck = (trustedServices && trustedServices.urlToCheck) ? trustedServices.urlToCheck : "'Unknown resource'";

    if (this.state.saveService) {
      store.dispatch(addTrustedService(getHostFromUrl(urlToCheck)));
    }

    store.dispatch(hideModalAddTrustedService());
    dispatchURLCommand(urlCmds);
  }

  handelCancel = () => {
    const { onCancel } = this.props;

    if (onCancel) {
      onCancel();
    }

    store.dispatch(hideModalAddTrustedService());
  }

  toggleSaveService = () => {
    this.setState({ saveService: !this.state.saveService });
  }

  certInfo = () => {
    const { cert, urlToCheck } = this.props.trustedServices;
    const { localize, locale } = this.context;

    if (!cert) {
      return (<React.Fragment>{localize("TrustedServices.error_load_cert", locale)}</React.Fragment>);
    }

    return (<div className="dialog-text">
      <div key="host">{localize("TrustedServices.cert_params", locale)}</div>
      <div key="subj">{localize("TrustedServices.cert_subj", locale)}: {cert.subjectFriendlyName}</div>
      <div key="iss">{localize("TrustedServices.cert_issuer", locale)}: {cert.issuerFriendlyName}</div>
      <div key="naft">{localize("TrustedServices.cert_not_after", locale)}: {formatDate(cert.notAfter)}</div>
    </div>);
  }
}

export default connect((state) => {
  return {
    trustedServices: state.trustedServices,
    urlCmds: state.urlCmds,
  };
})(AddTrustedService);
