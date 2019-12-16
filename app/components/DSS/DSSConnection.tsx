import { OrderedMap } from "immutable";
import PropTypes, { any } from "prop-types";
import React from "react";
import { connect } from "react-redux";
import { deletePasswordDSS, rememberPasswordDSS } from "../../AC";
import { dssAuthIssue, getCertificatesDSS, getPolicyDSS } from "../../AC/dssActions";
import { md5 } from "../../utils";
import ConfirmTransaction from "../DSS/ConfirmTransaction";
import ProgressBars from "../ProgressBars";

const url_oath = "url_oath";
const url_sign = "url_sign";
const login_dss = "login_dss";
const password_dss = "password_dss";

const URL_AUTHORIZATION_USER_DSS = "https://dss.cryptopro.ru/STS/oauth";
const URL_SIGN_SERVER_DSS = "https://dss.cryptopro.ru/SignServer/rest";

interface IDSSConnectionProps {
  dssAuthIssue: (user: IUserDSS) => Promise<void>;
  dssResponses: OrderedMap<any, any>;
  getCertificatesDSS: (url: string, dssUserID: string, token: string) => Promise<void>;
  getPolicyDSS: (url: string, dssUserID: string, token: string) => Promise<void>;
  onCancel?: () => void;
  handleReloadCertificates?: () => void;
  tokensAuth: any;
  passwordDSS: any;
  isLoaded: boolean;
  isLoading: boolean;
  rememberPasswordDSS: (id: string, password: string) => void;
  deletePasswordDSS: (id: string) => void;
}

interface IDSSConnectionState {
  field_value: any;
  isTestDSS: boolean;
  isRememberPassword: boolean;
  dssUserID: string;
  dssResponse: any;
}

class DSSConnection extends React.Component<IDSSConnectionProps, IDSSConnectionState> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  constructor(props: IDSSConnectionProps) {
    super(props);

    this.state = ({
      field_value: "",
      isTestDSS: false,
      isRememberPassword: false,
      dssUserID: "",
      dssResponse: null,
    });
  }

  componentDidMount() {
    const self = this;

    $(document).ready(() => {
      $("select").material_select();

      $("select").on("change", self.handleInputChange);
    });

    Materialize.updateTextFields();
  }

  componentDidUpdate(prevProps: IDSSConnectionProps) {
    const { localize, locale } = this.context;
    const { dssUserID, field_value } = this.state;
    // tslint:disable-next-line: no-shadowed-variable
    const { getCertificatesDSS } = this.props;
    const { isLoaded, isLoading, handleReloadCertificates } = this.props;

    if (!isLoading && prevProps.isLoading) {
      this.handleCancel();
    }

    const token = this.props.tokensAuth.get(dssUserID);
    const prevToken = prevProps.tokensAuth.get(dssUserID);
    if ((!prevToken && token) || (token && prevToken && token.time !== prevToken.time)) {
      getCertificatesDSS(field_value.url_sign, token.id, token.access_token).then((result) => {
        Materialize.toast(localize("DSS.get_certificates_successful", locale), 3000, "toast-get_certificates_successful");

        if (handleReloadCertificates) {
          handleReloadCertificates();
        }
      }, (error) => {
        Materialize.toast(localize("DSS.get_certificates_failed", locale), 3000, "toast-get_certificates_failed");

        Materialize.toast(error, 3000, "toast-getCertificatesDSS_failed");
      });
    }

    if (!prevProps.dssResponses.size && this.props.dssResponses.size) {
      this.setState({dssResponse:  this.props.dssResponses.first()});
    }
  }

  render() {
    const { localize, locale } = this.context;
    const { dssResponse, field_value, isTestDSS, isRememberPassword } = this.state;
    const { isLoaded, isLoading } = this.props;

    if (isLoading) {
      return dssResponse ? this.getDssResponseLabel(dssResponse) : <ProgressBars />;
    }

    let disabled = "disabled";
    if (field_value[url_oath] && field_value[url_sign] && field_value[login_dss] && field_value[password_dss]) {
      disabled = " ";
    }


    return (
      <React.Fragment>

        <div className="row nobottom">
          <div className="col s12 ">
            <div className="row halfbottom" />
            <div className="content-wrapper z-depth-1 tbody">
              <div className="content-item-relative">
                <div className="row">
                  <div className="row" />
                  <div className="row">
                    <div key={url_oath} className="input-field input-field-csr col s12">
                      <input
                        // disabled={field.ProhibitChange}
                        id={url_oath}
                        type="text"
                        // className={this.validateOidValue(field)}
                        // maxLength={field.Length}
                        name={url_oath}
                        value={field_value[url_oath] ? field_value[url_oath] : ""}
                        onChange={this.handleInputChange}
                        placeholder={`https://`}
                      />
                      <label htmlFor={url_oath}>{localize("DSS.DSS_authorization_server_address", locale)}</label>
                    </div>
                  </div>

                  <div className="row halfbottom">
                    <div key={url_sign} className="input-field input-field-csr col s12">
                      <input
                        // disabled={field.ProhibitChange}
                        id={url_sign}
                        type="text"
                        // className={this.validateOidValue(field)}
                        // maxLength={field.Length}
                        name={url_sign}
                        value={field_value[url_sign] ? field_value[url_sign] : ""}
                        onChange={this.handleInputChange}
                        placeholder={`https://`}
                      />
                      <label htmlFor={url_sign}>{localize("DSS.DSS_server_address", locale)}</label>
                    </div>
                  </div>

                  <div className="row">
                    <div style={{ float: "left" }}>
                      <div style={{ display: "inline-block", margin: "10px" }}>
                        <input
                          name="isTestDSS"
                          className="filled-in"
                          type="checkbox"
                          id="isTestDSS"
                          checked={isTestDSS}
                          onChange={this.toggleIsTestDSS}
                        />
                        <label htmlFor="isTestDSS">
                          {localize("DSS.use_cryptopro_dss_test_service", locale)}
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div key={login_dss} className="input-field input-field-csr col s12">
                      <input
                        // disabled={field.ProhibitChange}
                        id={login_dss}
                        type="text"
                        // className={this.validateOidValue(field)}
                        // maxLength={field.Length}
                        name={login_dss}
                        value={field_value[login_dss] ? field_value[login_dss] : ""}
                        onChange={this.handleInputChange}
                        placeholder={localize("DSS.enter_your_login", locale)}
                      />
                      <label htmlFor={login_dss}>{localize("DSS.login_dss", locale)}</label>
                    </div>
                  </div>

                  <div className="row halfbottom">
                    <div key={password_dss} className="input-field input-field-csr col s12">
                      <input
                        // disabled={field.ProhibitChange}
                        id={password_dss}
                        type="password"
                        // className={this.validateOidValue(field)}
                        // maxLength={field.Length}
                        name={password_dss}
                        value={field_value[password_dss] ? field_value[password_dss] : ""}
                        onChange={this.handleInputChange}
                        placeholder={localize("DSS.enter_your_password", locale)}
                      />
                      <label htmlFor={password_dss}>{localize("DSS.password_dss", locale)}</label>
                      <div id="password_img" className="password_visible" onClick={this.passwordVisibleHide}></div>
                    </div>
                  </div>

                  <div className="row halfbottom">
                    <div style={{ float: "left" }}>
                      <div style={{ display: "inline-block", margin: "10px" }}>
                        <input
                          name="isRememberPassword"
                          className="filled-in"
                          type="checkbox"
                          id="isRememberPassword"
                          checked={isRememberPassword}
                          onChange={this.toggleIsRememberPassword}
                        />
                        <label htmlFor="isRememberPassword">
                          {localize("DSS.remember_password", locale)}
                        </label>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

          <div className="row halfbottom" />
          <div className="row halfbottom">
            <div style={{ float: "right" }}>
              <div style={{ display: "inline-block", margin: "10px" }}>
                <a className="btn btn-text waves-effect waves-light modal-close" onClick={this.handleCancel}>{localize("Common.cancel", locale)}</a>
              </div>
              <div style={{ display: "inline-block", margin: "10px" }}>
                <a className={`btn btn-outlined waves-effect waves-light ${disabled}`} onClick={this.handleReady}>{localize("Common.ready", locale)}</a>
              </div>
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }
  passwordVisibleHide()
  {
    let pass = $('#password_dss');
    pass.attr('type', pass.attr('type') === 'password' ? 'text' : 'password');
    let elm = document.querySelector("#password_img");
    if(elm.className == "password_hide")
    {
      $("#password_img").removeClass();
      $("#password_img").addClass('password_visible');
    }
    else
    {
      $("#password_img").removeClass();
      $("#password_img").addClass('password_hide');
    }



  }
  getDssResponseLabel = (dssResponse: any) => {
    return (
      <React.Fragment>

        <div className="row nobottom">
          <div className="col s12 ">
            <div className="row halfbottom" />
            <div className="content-wrapper z-depth-1 tbody">
              <div className="content-item-relative">
                <div className="row">

                  <div className="col s12">
                    <div className="primary-text">
                      {dssResponse.Label}
                    </div>
                  </div>

                  <div className="row" />
                </div>
              </div>
            </div>
          </div>
          <div className="row halfbottom" />
        </div>

      </React.Fragment>
    );
  }

  handleInputChange = (ev: any) => {
    const target = ev.target;
    const name = target.name;
    const value = ev.target.value;
console.log(value);
    const newSubject = {
      ...this.state.field_value,
      [name]: value,
    };

    this.setState(({
      field_value: { ...newSubject },
    }));
  }

  toggleIsTestDSS = () => {
    const { isTestDSS, field_value } = this.state;
    const newSubject = !isTestDSS ?
      { url_oath: URL_AUTHORIZATION_USER_DSS, url_sign: URL_SIGN_SERVER_DSS } : field_value;
    this.setState({
      field_value: { ...newSubject },
      isTestDSS: !isTestDSS,
    });
  }

  toggleIsRememberPassword = () => {
    const { isRememberPassword } = this.state;
    this.setState({
      isRememberPassword: !isRememberPassword,
    });
  }

  handleReady = () => {
    const { localize, locale } = this.context;
    const { field_value, isRememberPassword } = this.state;
    // tslint:disable-next-line: no-shadowed-variable
    const { dssAuthIssue, getPolicyDSS, rememberPasswordDSS, deletePasswordDSS, passwordDSS } = this.props;

    const dssUserID = md5(field_value.login_dss + field_value.url_oath + field_value.url_sign);
    this.setState({
      dssUserID,
    });

    const userDSS: IUserDSS = {
      authUrl: field_value.url_oath,
      dssUrl: field_value.url_sign,
      id: dssUserID,
      password: field_value.password_dss,
      user: field_value.login_dss,
    };

    dssAuthIssue(userDSS).then(
      (result: any) => {
        $(".toast-authorization_successful").remove();
        Materialize.toast(localize("DSS.authorization_successful", locale), 3000, "toast-authorization_successful");

        if (isRememberPassword) {
          rememberPasswordDSS(dssUserID, field_value.password_dss);
        } else {
          const passwordUserDSS = passwordDSS.get(dssUserID);
          if (passwordUserDSS && passwordUserDSS.password) {
            deletePasswordDSS(dssUserID);
          }
        }

        getPolicyDSS(field_value.url_sign, dssUserID, result.AccessToken).then((null), (error: any) => {
          Materialize.toast(error, 3000, "toast-getPolicyDSS_failed");
        });
      },
      (reject: any) => {
        $(".toast-authorization_failed").remove();
        Materialize.toast(localize("DSS.authorization_failed", locale), 3000, "toast-authorization_failed");

        $(".toast-dssAuthIssue_failed").remove();
        Materialize.toast(reject, 3000, "toast-dssAuthIssue_failed");
      },
    );
  }

  handleCancel = () => {
    const { onCancel } = this.props;

    if (onCancel) {
      onCancel();
    }
  }
}

export default connect((state) => {
  return {
    dssResponses: state.dssResponses.entities,
    isLoaded: state.certificatesDSS.loaded,
    isLoading: state.certificatesDSS.loading,
    passwordDSS: state.passwordDSS.entities,
    tokensAuth: state.tokens.tokensAuth,
  };
}, { dssAuthIssue, getPolicyDSS, rememberPasswordDSS, deletePasswordDSS, getCertificatesDSS })(DSSConnection);
