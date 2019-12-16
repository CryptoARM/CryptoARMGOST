import PropTypes from "prop-types";
import React from "react";
import ReactDOM from "react-dom";

interface ISignatureTypeSelectorProps {
  detached: boolean;
  disabled?: boolean;
  handleChange: (value: boolean) => void;
}

const SignatureTypes = {
  ATTACHED: "ATTACHED",
  DETACHED: "DETACHED",
};

class SignatureTypeSelector extends React.Component<ISignatureTypeSelectorProps, {}> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  /**
   * https://github.com/facebook/react/issues/3667
   */
  componentDidMount() {
    $(document).ready(() => {
      $("select").material_select();
    });
    $(ReactDOM.findDOMNode(this.refs.type_of_signature)).on("change", this.changeSignatureType);
  }

  changeSignatureType = (ev: any) => {
    this.props.handleChange(ev.target.value === SignatureTypes.DETACHED);
  }

  render() {
    const { localize, locale } = this.context;
    const classDisabled = this.props.disabled ? "disabled" : "";

    return (
      <div className={classDisabled}>
        <div className="input-field">
          <select className="select" id="type_of_signature" ref="type_of_signature"
            defaultValue={this.props.detached ? SignatureTypes.DETACHED : SignatureTypes.ATTACHED}>
            <option value={SignatureTypes.ATTACHED}>
              {localize("Sign.sign_type_attached", locale)}
            </option>
            <option value={SignatureTypes.DETACHED}>
              {localize("Sign.sign_type_detached", locale)}
            </option>
          </select>
          <label>
            {localize("Sign.type_of_signature", locale)}
          </label>
        </div>
      </div>
    );
  }
}

export default SignatureTypeSelector;
