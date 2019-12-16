import PropTypes from "prop-types";
import React from "react";
import ReactDOM from "react-dom";
import { bytesToSize } from "../../utils";
import FileIcon from "../Files/FileIcon";
import SignerCertificateInfo from "../SignerCertificateInfo";
import SignatureStatus from "./SignatureStatus";

interface ISignatureInfoBlockState {
  signerIndex: number;
}

class SignatureInfoBlock extends React.Component<any, ISignatureInfoBlockState> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  constructor(props: any) {
    super(props);

    this.state = {
      signerIndex: 0,
    };
  }

  componentDidMount() {
    /* https://github.com/facebook/react/issues/3667
    * fix onChange for < select >
    */
    $(document).ready(() => {
      $("select").material_select();
    });

    $(ReactDOM.findDOMNode(this.refs.signer_select)).on("change", this.handleSignerChange);

    Materialize.updateTextFields();
  }

  render() {
    const { signerCertificate, file, signatures, handleActiveCert, handleNoShowSignatureInfo, handleNoShowSignerCertificateInfo } = this.props;
    const { localize, locale } = this.context;
    const { signerIndex } = this.state;

    if (!signatures) {
      return null;
    }

    if (signerCertificate) {
      return <SignerCertificateInfo handleBackView={handleNoShowSignerCertificateInfo} certificate={signerCertificate} />;
    }

    const elements = signatures.map((signature: any) => {
      return (
        <SignatureStatus key={signature.id} signature={signature} handleActiveCert={handleActiveCert} />
      );
    });

    const element = elements[signerIndex];

    const options = signatures.map((signature: any, index: number) => {
      return (
        <option value={index}>
          {signature.subject}
        </option>
      );
    });

    const status = this.getSignaturesStatus(signatures);

    return (
      <React.Fragment>
        <div className="row">
          <div className="col s2" style={{ width: "11%" }}>
            <div className={status ? "status_ok_icon" : "status_error_icon"} />
          </div>
          <div className="col s8 ">
            <div className="col s12">
              <div className={status ? "valid" : "unvalid"}>{status ? localize("Sign.sign_ok", locale) : localize("Sign.sign_error", locale)}</div>
              <div className="collection-info ">{"Проверена:"} {(new Date(signatures[0].verifyingTime)).toLocaleDateString(locale, {
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
                month: "numeric",
                year: "numeric",
              })}</div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col s2" style={{ width: "11%" }}>
            <FileIcon file={file} style={{ left: "0px", position: "relative" }} />
          </div>

          <div className="col s10">
            <div className="col s12">
              <div className="truncate">{file.filename}</div>
            </div>
            <div className="col s7">
              <div className="collection-info truncate">{(new Date(file.mtime)).toLocaleDateString(locale, {
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
                month: "numeric",
                year: "numeric",
              })}
              </div>
            </div>
            <div className="col s4">
              <div className="collection-info truncate">{bytesToSize(file.filesize)}</div>
            </div>
          </div>
        </div>

        <div className="row nobottom">
          <div className="input-field col s12">
            <select
              className="select"
              defaultValue={"0"}
              ref="signer_select"
              onChange={this.handleSignerChange} >
              {options}
            </select>
            <label>{localize("Sign.signer", locale)}</label>
          </div>
        </div>

        <div>
          {element}
        </div>
      </React.Fragment>
    );
  }

  handleSignerChange = (ev: any) => {
    this.setState({ signerIndex: ev.target.value });
  }

  getSignaturesStatus = (signatures) => {
    let res = true;

    if (signatures) {
      for (const element of signatures) {
        if (!element.status_verify) {
          res = false;
          break;
        }
      }

      return res;
    } else {
      return false;
    }
  }
}

export default SignatureInfoBlock;
