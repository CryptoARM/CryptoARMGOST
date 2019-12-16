import PropTypes, { any } from "prop-types";
import React from "react";
import { connect } from "react-redux";
import { dssPostMFAUser } from "../../AC/dssActions";
import { POST_OPERATION_CONFIRMATION } from "../../constants";

const auth_token = "auth_token";

interface IConfirmTransactionProps {
  dssUserID: string;
  dssPostMFAUser: (url: string, headerfield: string[], body: any, dssUserID: string, type: string, challengeResponse?: any) => Promise<any>;
  onCancel?: () => void;
  onConfirm?: () => void;
  tokensAuth: any;
  users: any;
  dssResponse: any;
}

interface IConfirmTransactionState {
  field_value: any;
  user: any;
}

class ConfirmTransaction extends React.Component<IConfirmTransactionProps, IConfirmTransactionState> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  constructor(props: IConfirmTransactionProps) {
    super(props);

    this.state = ({
      field_value: "",
      user: props.users.get(props.dssUserID),
    });
  }

  componentDidMount() {
    Materialize.updateTextFields();
  }

  componentDidUpdate(prevProps: IConfirmTransactionProps) {
    if (prevProps.dssResponse && prevProps.dssResponse.RefID
      && this.props.dssResponse && prevProps.dssResponse.RefID
      && prevProps.dssResponse.RefID !== this.props.dssResponse.RefID) {
      this.setState({ field_value: "" });
    }
  }

  render() {
    const { localize, locale } = this.context;
    const { field_value, user } = this.state;
    const { dssResponse } = this.props;

    if (!user || !dssResponse) {
      this.handleCancel();
    }

    let disabled = "disabled";
    if (field_value[auth_token]) {
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
                      {dssResponse.Label}
                    </div>
                  </div>

                  <div className="row" />

                  {/* TODO: add support offline transaction
                  {
                    dssResponse.Image && dssResponse.RefID ?
                      <React.Fragment>
                        <div className="col s12">
                          <div className="secondary-text">
                            Или используйте оффлайн-подтверждение
                          </div>
                        </div>
                        <div className="col s12">
                          <div className="secondary-text">
                            1. Наведите камеру телефона на QR-код:
                        </div>
                        </div>
                        <div className="col s12">
                          <img src={`data:image/jpeg;base64,${dssResponse.Image}`} />
                        </div>
                        <div className="col s12">
                          <div className="secondary-text">
                            2. Введите код подтверждения:
                          </div>
                        </div>
                        <div className="row">
                          <div key={auth_token} className="input-field input-field-csr col s12">
                            <input
                              id={auth_token}
                              type="text"
                              name={auth_token}
                              value={field_value[auth_token] ? field_value[auth_token] : ""}
                              onChange={this.handleInputChange}
                              placeholder="Код подтверждения"
                            />
                          </div>
                        </div>
                      </React.Fragment>
                      : null
                  } */}
                </div>
              </div>
            </div>
          </div>

          <div className="row halfbottom" />
          {/* <div className="row halfbottom">
            <div style={{ float: "right" }}>
              <div style={{ display: "inline-block", margin: "10px" }}>
                <a className={`btn btn-outlined waves-effect waves-light ${disabled}`} onClick={this.handleReady}>{localize("Common.ready", locale)}</a>
              </div>
            </div>
          </div> */}
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

  handleReady = () => {
    const { localize, locale } = this.context;
    const { field_value, user } = this.state;
    // tslint:disable-next-line: no-shadowed-variable
    const { dssPostMFAUser, dssUserID, dssResponse, tokensAuth } = this.props;

    const body = {
      Resource: "urn:cryptopro:dss:signserver:signserver",
      TransactionTokenId: dssResponse.RefID,
      Value: field_value[auth_token],
    };

    const challengeResponse = {
      ChallengeResponse:
      {
        TextChallengeResponse:
          [{
            RefId: dssResponse.RefID,
            Value: field_value[auth_token],
          },
          ],
      },
      Resource: "urn:cryptopro:dss:signserver:signserver",
    };

    this.setState({ field_value: "" });

    dssPostMFAUser(
      user.authUrl.replace("/oauth", "/confirmation"),
      dssResponse.Headerfield,
      body,
      dssUserID,
      POST_OPERATION_CONFIRMATION,
      challengeResponse,
    ).then((data2) => console.log(data2));
  }

  handleCancel = () => {
    const { onCancel } = this.props;

    if (onCancel) {
      onCancel();
    }
  }
}

export default connect((state) => ({
  tokensAuth: state.tokens.tokensAuth,
  users: state.users.entities,
}), { dssPostMFAUser })(ConfirmTransaction);
