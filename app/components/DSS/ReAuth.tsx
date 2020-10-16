import { userInfo } from "os";
import PropTypes, { any } from "prop-types";
import React from "react";
import { connect } from "react-redux";
import { deletePasswordDSS, rememberPasswordDSS } from "../../AC";
import { dssAuthIssue, getPolicyDSS } from "../../AC/dssActions";

const login_dss = "login_dss";
const password_dss = "password_dss";
const is_api_v2 = "is_api_v2";

interface IReAuthProps {
  dssUserID: string;
  dssAuthIssue: (user: IUserDSS) => Promise<void>;
  getPolicyDSS: (url: string, dssUserID: string, token: string) => Promise<void>;
  onCancel?: () => void;
  onGetTokenAndPolicy: () => void;
  tokensAuth: any;
  users: any;
  passwordDSS: any;
  rememberPasswordDSS: (id: string, password: string) => void;
  deletePasswordDSS: (id: string) => void;
}

interface IReAuthState {
  field_value: any;
  user: any;
  passwordUserDSS: any;
  isRememberPassword: boolean;
  tryAuthWithoutPasswordEntering: boolean;
  isApiv2: boolean;
}

class ReAuth extends React.Component<IReAuthProps, IReAuthState> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  constructor(props: IReAuthProps) {
    super(props);

    const passwordUserDSS = props.passwordDSS.get(props.dssUserID);
    this.state = ({
      field_value: { login_dss: "", password_dss: passwordUserDSS && passwordUserDSS.password ? passwordUserDSS.password : "" },
      isRememberPassword: passwordUserDSS && passwordUserDSS.password ? true : false,
      passwordUserDSS,
      tryAuthWithoutPasswordEntering: true,
      user: props.users.get(props.dssUserID),
      isApiv2: false,
    });
  }

  componentDidMount() {
    const self = this;
    const { field_value, user } = this.state;

    $(document).ready(() => {
      $("select").material_select();

      $("select").on("change", self.handleInputChange);

      Materialize.updateTextFields();
    });

    try {
      Materialize.updateTextFields();
    } catch (e) {
      //
    }

    if (user) {
        const newSubject = {
          ...this.state.field_value,
          [is_api_v2]: user.isApiv2 === "v2.0" ? user.isApiv2 : "v1.0",
        };

        this.setState(({
          field_value: { ...newSubject },
          isApiv2: user.isApiv2 === "v2.0" ? true : false,
        }));
    }

    this.handleReady();
  }

  render() {
    const { localize, locale } = this.context;
    const { field_value, user, isRememberPassword, isApiv2 } = this.state;

    if (!user) {
      this.handleCancel();
    }

    let disabled = "disabled";
    if (field_value[password_dss]) {
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

                  <div className="col s12">
                    <div className="primary-text">
                      {localize("DSS.need_reauth", locale)}
                    </div>
                  </div>

                  <div className="row" />

                  <div className="row">
                    <div key={login_dss} className="input-field input-field-csr col s12">
                      <input
                        disabled={true}
                        id={login_dss}
                        type="text"
                        name={login_dss}
                        value={user ? user.login : ""}
                        placeholder={localize("DSS.enter_your_login", locale)}
                      />
                      <label htmlFor={login_dss}>{localize("DSS.login_dss", locale)}</label>
                    </div>
                  </div>

                  <div className="row halfbottom">
                    <div key={password_dss} className="input-field input-field-csr col s12">
                      <input
                        id={password_dss}
                        type="password"
                        name={password_dss}
                        value={field_value[password_dss] ? field_value[password_dss] : ""}
                        onChange={this.handleInputChange}
                        placeholder={localize("DSS.enter_your_password", locale)}
                      />
                      <label htmlFor={password_dss}>{localize("DSS.password_dss", locale)}</label>
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

                  <div className="row halfbottom">
                    <div style={{ float: "left" }}>
                      <div style={{ display: "inline-block", margin: "10px" }}>
                        <input
                          name="isApiv2"
                          className="filled-in"
                          type="checkbox"
                          id="isApiv2"
                          checked={isApiv2}
                          onChange={this.toggleIsApiv2}
                        />
                        <label htmlFor="isApiv2">
                          {localize("DSS.use_api_v2", locale)}
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

  handleInputChange = (ev: any) => {
    const target = ev.target;
    const name = target.name;
    const value = ev.target.value;

    const newSubject = {
      ...this.state.field_value,
      [name]: value,
    };

    this.setState(({
      field_value: { ...newSubject },
    }));
  }

  toggleIsRememberPassword = () => {
    const { isRememberPassword } = this.state;
    this.setState({
      isRememberPassword: !isRememberPassword,
    });
  }

  toggleIsApiv2 = () => {
    const { isApiv2 } = this.state;
    const newSubject = {
      ...this.state.field_value,
      [is_api_v2]: !isApiv2 ? "v2.0" : "v1.0",
    };

    this.setState(({
      field_value: { ...newSubject },
      isApiv2: !isApiv2,
    }));
  }

  handleReady = () => {
    const { localize, locale } = this.context;
    const { field_value, user, isRememberPassword, passwordUserDSS, tryAuthWithoutPasswordEntering } = this.state;
    // tslint:disable-next-line: no-shadowed-variable
    const { dssAuthIssue, getPolicyDSS, onGetTokenAndPolicy, passwordDSS, rememberPasswordDSS, deletePasswordDSS } = this.props;

    const userDSS: IUserDSS = {
      authUrl: user.authUrl,
      dssUrl: user.dssUrl,
      id: user.id,
      password: field_value.password_dss,
      user: user.login,
      isApiv2: field_value.is_api_v2,
    };

    dssAuthIssue(userDSS).then(
      (result: any) => {
        $(".toast-authorization_successful").remove();
        Materialize.toast(localize("DSS.authorization_successful", locale), 3000, "toast-authorization_successful");

        if (isRememberPassword) {
          rememberPasswordDSS(user.id, field_value.password_dss);
        } else {
          if (passwordUserDSS && passwordUserDSS.password) {
            deletePasswordDSS(user.id);
          }
        }

        getPolicyDSS(user.dssUrl, user.id, result.AccessToken).then(
          () => {
            onGetTokenAndPolicy();
            this.handleCancel();
          },
          (error) => {
            $(".toast-getPolicyDSS_failed").remove();
            Materialize.toast(error, 2000, "toast-getPolicyDSS_failed");

            this.handleCancel();
          },
        );
      },
      (error) => {
        if (tryAuthWithoutPasswordEntering) {
          this.setState({
            tryAuthWithoutPasswordEntering: false,
          });
        } else {
          $(".toast-authorization_failed").remove();
          Materialize.toast(localize("DSS.authorization_failed", locale), 3000, "toast-authorization_failed");

          $(".toast-dssAuthIssue_failed").remove();
          Materialize.toast(error.message, 2000, "toast-dssAuthIssue_failed");

          this.handleCancel();
        }
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

export default connect((state) => ({
  passwordDSS: state.passwordDSS.entities,
  tokensAuth: state.tokens.tokensAuth,
  users: state.users.entities,
}), { rememberPasswordDSS, deletePasswordDSS, dssAuthIssue, getPolicyDSS })(ReAuth);
