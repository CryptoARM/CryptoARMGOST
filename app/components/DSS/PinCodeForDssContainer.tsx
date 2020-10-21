import PropTypes from "prop-types";
import React from "react";

interface IPinCodeForDssContainerState {
  pin: string;
}

interface IPinCodeForDssContainerProps {
  done: (pin: string) => void;
  clickSign: () => void;
  onCancel?: () => void;
  pin?: string;
}

class PinCodeForDssContainer extends React.Component<IPinCodeForDssContainerProps, IPinCodeForDssContainerState> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  constructor(props: IPinCodeForDssContainerProps) {
    super(props);

    this.state = { pin: props.pin ? props.pin : "" };
  }

  componentDidMount() {
    $(document).on("ready", function() {
      Materialize.updateTextFields();
    });

    try {
      Materialize.updateTextFields();
    } catch (e) {
      //
    }
  }

  componentDidUpdate() {
    Materialize.updateTextFields();
  }

  componentWillUnmount() {
    this.handelCancel();
  }

  render() {
    const { localize, locale } = this.context;
    const { pin } = this.state;

    const disabled = pin ? "" : "disabled";

    return (
      <div className="row nobottom">
        <div className="col s12 ">
          <div className="row halfbottom" />
          <div className="content-wrapper z-depth-1 tbody">
            <div className="content-item-relative">
              <div className="row">

                <div className="col s12">
                  <div className="primary-text">
                    {localize("DSS.has_pin", locale)}
                  </div>
                </div>

                <div className="row" />

                <div className="row">
                  <div className="input-field input-field-csr col s12">
                    <input
                      id="pin"
                      type="password"
                      autofocus="true"
                      className={"validate"}
                      name="pin"
                      value={pin}
                      onChange={this.handleTextChange}
                      placeholder={localize("DSS.enter_your_pin", locale)}
                    />
                    <label htmlFor={"pin"}>{localize("DSS.pin_dss", locale)}</label>
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
              <a className="btn btn-text waves-effect waves-light modal-close" onClick={this.handelCancel}>{localize("Common.cancel", locale)}</a>
            </div>
            <div style={{ display: "inline-block", margin: "10px" }}>
              <a className={`btn btn-outlined waves-effect waves-light ${disabled}`} onClick={this.handleDone}>{localize("Common.ready", locale)}</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  handleTextChange = (ev: any) => {
    this.setState({ pin: ev.target.value });
  }

  handleDone = () => {
    // tslint:disable-next-line:no-shadowed-variable
    const { done, clickSign } = this.props;
    const { pin } = this.state;

    if (done) {
      done(pin);
      setTimeout(() => {
        clickSign();
      }, 100);
    }

    this.handelCancel();
  }

  handelCancel = () => {
    const { onCancel } = this.props;

    if (onCancel) {
      onCancel();
    }
  }
}

export default PinCodeForDssContainer;
