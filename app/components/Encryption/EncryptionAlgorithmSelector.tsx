import PropTypes from "prop-types";
import React from "react";
import ReactDOM from "react-dom";
import { setDefaultEncryptionAlg } from "../../AC/settingsActions";
import { AES_128, AES_192, AES_256, DES, DES3,
  GOST_28147, GOST_R3412_2015_K, GOST_R3412_2015_M,
} from "../../constants";

interface IEncryptionAlgorithmSelectorProps {
  EncryptionValue: string;
  disabled?: boolean;
  handleChange: (encoding: string) => void;
  showGostAlgs: boolean;
}

class EncryptionAlgorithmSelector extends React.Component<IEncryptionAlgorithmSelectorProps, {}> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  componentDidMount() {
    const self = this;
    $(document).ready(() => {
      $("select").material_select();
    });
    $(ReactDOM.findDOMNode(this.refs.EncryptionAlgorithmSelector)).on("change", this.changeEncryption);
  }

  componentDidUpdate() {
    $(document).ready(() => {
      $("select").material_select();
    });
  }

  changeEncryption = (ev: any) => {
    this.props.handleChange(ev.target.value);
  }

  render() {
    const { localize, locale } = this.context;

    return (
      <div>
        <div className="input-field">
          <select
            className="select"
            disabled={this.props.disabled}
            id="EncryptionAlgorithmSelector"
            ref="EncryptionAlgorithmSelector"
            value={this.props.EncryptionValue}
          >
            {
              this.props.showGostAlgs ?
              <React.Fragment>
                <option value={GOST_28147}>{localize("Encrypt.GOST_28147", locale)}</option>
                <option value={GOST_R3412_2015_M}>{localize("Encrypt.GOST_R3412_2015_M", locale)}</option>
                <option value={GOST_R3412_2015_K}>{localize("Encrypt.GOST_R3412_2015_K", locale)}</option>
              </React.Fragment>
              :
              <React.Fragment>
                <option value={DES}>{localize("Encrypt.DES", locale)}</option>
                <option value={DES3}>{localize("Encrypt.DES3", locale)}</option>
                <option value={AES_128}>{localize("Encrypt.AES_128", locale)}</option>
                <option value={AES_192}>{localize("Encrypt.AES_192", locale)}</option>
                <option value={AES_256}>{localize("Encrypt.AES_256", locale)}</option>
              </React.Fragment>
            }
          </select>
          <label htmlFor="EncryptionAlgorithmSelector">
            {localize("Encrypt.encrypt_alg", locale)}
          </label>
        </div>
      </div>
    );
  }
}

export default EncryptionAlgorithmSelector;
