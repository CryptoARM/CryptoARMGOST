import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";
import {
  changeArchiveFilesBeforeEncrypt, changeDeleteFilesAfterEncrypt,
  changeEncryptEncoding, changeEncryptOutfolder, toggleSaveToDocuments,
} from "../../AC";
import CheckBoxWithLabel from "../CheckBoxWithLabel";
import EncodingTypeSelector from "../EncodingTypeSelector";

const dialog = window.electron.remote.dialog;

interface IEncryptSettingsProps {
  changeDeleteFilesAfterEncrypt: (del: boolean) => void;
  changeEncryptOutfolder: (path: string) => void;
  changeEncryptEncoding: (encoding: string) => void;
  changeArchiveFilesBeforeEncrypt: (archive: boolean) => void;
  saveToDocuments: boolean;
  settings: {
    archive: boolean,
    delete: boolean,
    encoding: string,
    outfolder: string,
    saveToDocuments: boolean,
  };
  toggleSaveToDocuments: (saveToDocuments: boolean) => void;
}

class EncryptSettings extends React.Component<IEncryptSettingsProps, {}> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  addDirect() {
    // tslint:disable-next-line:no-shadowed-variable
    const { changeEncryptOutfolder } = this.props;

    if (!window.framework_NW) {
      const directory = dialog.showOpenDialog({ properties: ["openDirectory"] });
      if (directory) {
        changeEncryptOutfolder(directory[0]);
      }
    } else {
      const clickEvent = document.createEvent("MouseEvents");
      clickEvent.initEvent("click", true, true);
      document.querySelector("#choose-folder").dispatchEvent(clickEvent);
    }
  }

  handleDeleteClick = () => {
    // tslint:disable-next-line:no-shadowed-variable
    const { changeDeleteFilesAfterEncrypt, settings } = this.props;
    changeDeleteFilesAfterEncrypt(!settings.delete);
  }

  handleArchiveClick = () => {
    // tslint:disable-next-line:no-shadowed-variable
    const { changeArchiveFilesBeforeEncrypt, settings } = this.props;
    changeArchiveFilesBeforeEncrypt(!settings.archive);
  }

  handleEncodingChange = (encoding: string) => {
    // tslint:disable-next-line:no-shadowed-variable
    const { changeEncryptEncoding } = this.props;
    changeEncryptEncoding(encoding);
  }

  render() {
    const { saveToDocuments, settings } = this.props;
    const { localize, locale } = this.context;

    return (
      <div className="settings-content">
        <div className="col s12 m12 l6">
          <EncodingTypeSelector EncodingValue={settings.encoding} handleChange={this.handleEncodingChange} />
        </div>
        <div className="col s12 m12 l6">
          <CheckBoxWithLabel onClickCheckBox={this.handleDeleteClick}
            isChecked={settings.delete}
            elementId="delete_files"
            title={localize("Encrypt.delete_files_after", locale)} />
        </div>
        <div className="col s12 m12 l6">
          <CheckBoxWithLabel onClickCheckBox={this.handleArchiveClick}
            isChecked={settings.archive}
            elementId="archive_files"
            title={localize("Encrypt.archive_files_before", locale)} />
        </div>
      </div>
    );
  }
}

export default connect((state) => ({
  saveToDocuments: state.settings.getIn(["entities", state.settings.active]).saveToDocuments,
  settings: state.settings.getIn(["entities", state.settings.active]).encrypt,
}), { changeArchiveFilesBeforeEncrypt, changeDeleteFilesAfterEncrypt, changeEncryptEncoding, changeEncryptOutfolder, toggleSaveToDocuments }, null, { pure: false })(EncryptSettings);
