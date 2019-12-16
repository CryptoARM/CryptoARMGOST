import PropTypes from "prop-types";
import React from "react";
import ReactDOM from "react-dom";

interface ISignatureStandardSelectorProps {
  value: string;
  disabled?: boolean;
  handleChange: (encoding: string) => void;
}

const SignatureStandard = {
  CADES: "CAdES-X Long Type 1",
  CMS: "CMS",
};

class SignatureStandardSelector extends React.Component<ISignatureStandardSelectorProps, {}> {
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
    $(ReactDOM.findDOMNode(this.refs.standard)).on("change", this.changeStandard);
  }

  changeStandard = (ev: any) => {
    this.props.handleChange(ev.target.value);
  }

  render() {
    const { localize, locale } = this.context;
    const classDisabled = this.props.disabled ? "disabled" : "";

    return (
      <div className={classDisabled}>
        <div className="input-field">
          <select className="select" id="standard" ref="standard" defaultValue={this.props.value}>
            <option value={SignatureStandard.CMS}>
              {SignatureStandard.CMS}
            </option>
            <option value={SignatureStandard.CADES}>
              {SignatureStandard.CADES}
            </option>
          </select>
          <label>
            {localize("Sign.standard", locale)}
          </label>
        </div>
      </div>
    );
  }
}

export default SignatureStandardSelector;
