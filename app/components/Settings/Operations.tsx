import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";
import {
  changeOutfolder, toggleArchivationOperation, toggleEncryptionOperation, toggleReverseOperations,
  toggleSaveCopyToDocuments, toggleSaveResultToFolder, toggleSigningOperation,
} from "../../AC/settingsActions";
import { DEFAULT_DOCUMENTS_PATH } from "../../constants";
import CheckBoxWithLabel from "../CheckBoxWithLabel";
import SelectFolder from "../SelectFolder";

const dialog = window.electron.remote.dialog;

interface IOperationsProps {
  settings: any;
  changeOutfolder: (value: string) => void;
  toggleSigningOperation: (value: boolean) => void;
  toggleArchivationOperation: (value: boolean) => void;
  toggleEncryptionOperation: (value: boolean) => void;
  toggleReverseOperations: (value: boolean) => void;
  toggleSaveCopyToDocuments: (value: boolean) => void;
  toggleSaveResultToFolder: (value: boolean) => void;
}

class Operations extends React.Component<IOperationsProps, {}> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  constructor(props: any) {
    super(props);
  }

  render() {
    const { localize, locale } = this.context;
    const { settings, operationIsRemote, signerCert } = this.props;
    const { operations } = settings;
    const { archivation_operation, encryption_operation, reverse_operations,
      save_copy_to_documents, save_result_to_folder, signing_operation } = operations;

    const isDssCert = (signerCert && (signerCert.service || signerCert.dssUserID)) ? true : false;
    const is_disabled = operationIsRemote;

    return (
      <div className="row">
        <div className="col s12">
          <CheckBoxWithLabel
            isChecked={reverse_operations}
            disabled={is_disabled}
            elementId="reverse_operations"
            onClickCheckBox={this.handleReverseOperationsClick}
            title={localize("Operations.reverse_operations", locale)} />

        </div>
        <div className="col s12">
          <CheckBoxWithLabel
            isChecked={signing_operation || operationIsRemote}
            disabled={is_disabled}
            elementId="sign_operation"
            onClickCheckBox={this.handleSigningOperationClick}
            title={localize("Operations.signing_operation", locale)} />
        </div>
        <div className="col s12">
          <CheckBoxWithLabel
            isChecked={archivation_operation && !isDssCert}
            disabled={is_disabled || isDssCert}
            elementId="archivation_operation"
            onClickCheckBox={this.handleArchivationOperationClick}
            title={localize("Operations.archivation_operation", locale)} />
        </div>
        <div className="col s12">
          <CheckBoxWithLabel
            isChecked={encryption_operation && !isDssCert}
            disabled={is_disabled || isDssCert}
            elementId="encryption_operation"
            onClickCheckBox={this.handleEncryptionOperationClick}
            title={localize("Operations.encryption_operation", locale)} />
        </div>
        <div className="col s12">
          <CheckBoxWithLabel
            isChecked={save_copy_to_documents && !operationIsRemote}
            disabled={is_disabled}
            elementId="save_copy_to_documents"
            onClickCheckBox={this.handleSaveCopyClick}
            title={localize("Operations.save_copy_to_documents", locale)} />
        </div>

        <div className="col s12" >
          <CheckBoxWithLabel
            disabled={is_disabled || !signing_operation && !archivation_operation && !encryption_operation}
            onClickCheckBox={this.handleSaveResultToFolder}
            isChecked={save_result_to_folder}
            elementId="save_result_to_folder"
            title={localize("Operations.save_result_to_folder", locale)} />
        </div>

        <div className="col s11">
          <SelectFolder
            disabled={!save_result_to_folder || (!signing_operation && !archivation_operation && !encryption_operation)}
            directory={settings.outfolder}
            viewDirect={this.handleOutfolderChange}
            openDirect={this.addDirect.bind(this)}
          />
        </div>
      </div>
    );
  }

  addDirect() {
    // tslint:disable-next-line: no-shadowed-variable
    const { changeOutfolder } = this.props;

    const directory = dialog.showOpenDialogSync({ properties: ["openDirectory"] });
    if (directory) {
      changeOutfolder(directory[0]);
    }
  }

  handleReverseOperationsClick = () => {
    // tslint:disable-next-line: no-shadowed-variable
    const { toggleReverseOperations, settings } = this.props;

    toggleReverseOperations(!settings.operations.reverse_operations);
  }

  handleSigningOperationClick = () => {
    // tslint:disable-next-line: no-shadowed-variable
    const { toggleSigningOperation, settings } = this.props;

    toggleSigningOperation(!settings.operations.signing_operation);
  }

  handleArchivationOperationClick = () => {
    // tslint:disable-next-line: no-shadowed-variable
    const { toggleArchivationOperation, settings } = this.props;

    toggleArchivationOperation(!settings.operations.archivation_operation);
  }

  handleEncryptionOperationClick = () => {
    // tslint:disable-next-line: no-shadowed-variable
    const { toggleEncryptionOperation, settings } = this.props;

    toggleEncryptionOperation(!settings.operations.encryption_operation);
  }

  handleSaveCopyClick = () => {
    // tslint:disable-next-line: no-shadowed-variable
    const { toggleSaveCopyToDocuments, settings } = this.props;

    toggleSaveCopyToDocuments(!settings.operations.save_copy_to_documents);
  }

  handleOutfolderChange = (ev: any) => {
    // tslint:disable-next-line: no-shadowed-variable
    const { changeOutfolder, settings } = this.props;

    changeOutfolder(ev.target.value);
  }

  handleSaveResultToFolder = () => {
    // tslint:disable-next-line: no-shadowed-variable
    const { toggleSaveResultToFolder, settings } = this.props;

    toggleSaveResultToFolder(!settings.operations.save_result_to_folder);
  }
}

export default connect((state) => {
  return {
    settings: state.settings.getIn(["entities", state.settings.active]),
    operationIsRemote: state.urlActions.performed,
    signerCert: state.certificates.getIn(["entities", state.settings.getIn(["entities", state.settings.active]).sign.signer]),
  };
}, {
  changeOutfolder, toggleArchivationOperation, toggleEncryptionOperation,
  toggleReverseOperations, toggleSaveCopyToDocuments, toggleSaveResultToFolder, toggleSigningOperation,
})(Operations);
