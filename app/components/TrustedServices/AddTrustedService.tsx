import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";
import { addTrustedService, hideModalAddTrustedService } from "../../AC/trustedServicesActions";
import store from "../../store";
import { dispatchURLCommand, getHostFromUrl } from "../../AC/urlActions";

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
              <div className="row">
                <div className="col s12">
                  <div className="primary-text">
                    {localize("TrustedServices.site", locale)} {urlToCheck} {localize("TrustedServices.requests_for_cryptoarm", locale)}
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="input-field col s12">
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
}

export default connect((state) => {
  return {
    trustedServices: state.trustedServices,
    urlCmds: state.urlCmds,
  };
})(AddTrustedService);
