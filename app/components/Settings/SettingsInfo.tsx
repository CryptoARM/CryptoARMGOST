import PropTypes from "prop-types";
import React from "react";
import CheckBoxWithLabel from "../CheckBoxWithLabel";
import RecipientsList from "../RecipientsList";
import SignerInfo from "../Signature/SignerInfo";

interface ISettingsInfoProps {
  setting: any;
}

export default class SettingsInfo extends React.Component<ISettingsInfoProps, {}> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  render() {
    const { localize, locale } = this.context;
    const { recipients, setting, signer } = this.props;

    return (
      <div className="row">
        <div className="add-cert-collection collection cert-info-list">
          <div className="col s12">
            <div className="primary-text">{localize("Settings.name", locale)}</div>
            <hr />
          </div>
          <div className="col s12 collection-title selectable-text">
            {setting.name}
          </div>

          <div className="row" />

          <div className="col s12">
            <div className="primary-text">{localize("Sign.sign_setting", locale)}</div>
            <hr />
          </div>

          <div className="col s12">
            <div className="input-checkbox">
              <input
                checked={setting.saveToDocuments}
                disabled={true}
                name="saveToDocuments"
                type="checkbox"
                id="saveToDocuments"
                className="filled-in"
              />
              <label htmlFor="saveToDocuments" className="truncate">
                {localize("Documents.save_to_documents", locale)}
              </label>
            </div>

            <div className="input-checkbox">
              <input
                checked={setting.sign.detached}
                disabled={true}
                name="detached"
                type="checkbox"
                id="detached"
                className="filled-in"
              />
              <label htmlFor="detached" className="truncate">
                {localize("Sign.sign_detached", locale)}
              </label>
            </div>

            <div className="input-checkbox">
              <input
                checked={setting.sign.timestamp}
                disabled={true}
                name="timestamp"
                type="checkbox"
                id="timestamp"
                className="filled-in"
              />
              <label htmlFor="timestamp" className="truncate">
                {localize("Sign.sign_time", locale)}
              </label>
            </div>

            <div className="row halfbottom" />

            <div>
              <div className="truncate">
                {localize("Sign.signer_cert", locale)}
              </div>
              {(signer) ? <SignerInfo signer={signer} style={{ fontSize: "90%" }} /> :
                <div className="collection-title selectable-text">
                  {localize("Common.no", locale)}
                </div>}
            </div>

            <div className="row" />

            <div>
              <div className="primary-text">{localize("Encrypt.encrypt_setting", locale)}</div>
              <hr />
            </div>

              <div className="input-checkbox">
                <input
                  checked={setting.encrypt.delete}
                  disabled={true}
                  name="delete"
                  type="checkbox"
                  id="delete"
                  className="filled-in"
                />
                <label htmlFor="delete" className="truncate">
                  {localize("Encrypt.delete_files_after", locale)}
                </label>
              </div>

              <div className="input-checkbox">
                <input
                  checked={setting.encrypt.archive}
                  disabled={true}
                  name="archive"
                  type="checkbox"
                  id="archive"
                  className="filled-in"
                />
                <label htmlFor="archive" className="truncate">
                  {localize("Encrypt.archive_files_before", locale)}
                </label>
              </div>

            <div className="row halfbottom" />

            <div>
              <div className="truncate">
                {"Сертификаты шифрования"}
              </div>
              {(recipients && recipients.length) ?
                <div style={{ height: "calc(100vh - 500px)", fontSize: "125%" }}>
                  <div className="add-certs">
                    <RecipientsList recipients={recipients} disabled={true} />
                  </div>
                </div> :
                <div className="collection-title selectable-text">
                  {localize("Common.no", locale)}
                </div>}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
