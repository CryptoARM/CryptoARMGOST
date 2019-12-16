import { is } from "immutable";
import PropTypes from "prop-types";
import React from "react";
import Media from "react-media";
import { connect } from "react-redux";
import { activeFile, deleteFile, filePackageDelete, filePackageSelect, selectFile } from "../../AC";
import { SIGN } from "../../constants";
import { loadingRemoteFilesSelector } from "../../selectors";
import { mapToArr } from "../../utils";
import FileList from "../Files/FileList";
import FileTable from "../Files/FileTable";
import ProgressBars from "../ProgressBars";
import FileTableSmall from "./FileTableSmall";

const appBarStyle = {
  width: "calc(100% - 85px)",
};

interface IFile {
  lastModified: number;
  mtime: Date;
  name: string;
  path: string;
  size: number;
  type: string;
  webkitRelativePath: string;
  remoteId?: string;
  socket?: string;
}

interface IFilePath {
  fullpath: string;
  extra?: any;
  socket?: string;
}

interface IFileRedux {
  active: boolean;
  extension: string;
  filename: string;
  fullpath: string;
  id: number;
  mtime: Date;
  remoteId: string;
  socket: string;
}

export interface IRemoteFile {
  extra: any;
  id: number;
  loaded: boolean;
  loading: boolean;
  name: string;
  socketId: string;
  totalSize: number;
  url: string;
}

interface IFileSelectorProps {
  activeFile: (id: number, active?: boolean) => void;
  deleteFile: (fileId: number) => void;
  operation: string;
  loadingFiles: IRemoteFile[];
  files: IFileRedux[];
  selectFile: (fullpath: string, name?: string, mtime?: Date, size?: number) => void;
  selectedFilesPackage: boolean;
  selectingFilesPackage: boolean;
  filePackageSelect: (files: IFilePath[]) => void;
  filePackageDelete: (filesId: number[]) => void;
}

class FileSelector extends React.Component<IFileSelectorProps, {}> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  componentDidMount() {
    $(".nav-small-btn, .file-setting-item").dropdown({
      alignment: "left",
      belowOrigin: false,
      gutter: 0,
      inDuration: 300,
      outDuration: 225,
    });
  }

  shouldComponentUpdate(nextProps: IFileSelectorProps) {
    const { files, loadingFiles, searchValue, selectingFilesPackage } = this.props;

    if (selectingFilesPackage !== nextProps.selectingFilesPackage) {
      return true;
    }

    if (loadingFiles.length !== nextProps.loadingFiles.length) {
      return true;
    }

    if (searchValue !== nextProps.searchValue) {
      return true;
    }

    if (selectingFilesPackage || nextProps.selectingFilesPackage) {
      return false;
    }

    if (!selectingFilesPackage && !nextProps.selectingFilesPackage && nextProps.files.length !== this.props.files.length) {
      return true;
    }

    if (files.length === nextProps.files.length) {
      for (let i = 0; i <= files.length; i++) {
        if (is(files[i], nextProps.files[i])) {
          continue;
        } else {
          return true;
        }
      }
    }

    return false;
  }

  dragLeaveHandler(event: any) {
    event.target.classList.remove("draggedOver");

    const zone = document.querySelector("#droppableZone");
    if (zone) {
      zone.classList.remove("droppableZone-active");
    }
  }

  dragEnterHandler(event: any) {
    event.target.classList.add("draggedOver");
  }

  dragOverHandler(event: any) {
    event.stopPropagation();
    event.preventDefault();
  }

  directoryReader = (reader: any) => {
    reader.readEntries((entries: any) => {
      entries.forEach((entry: any) => {
        this.scanFiles(entry);
      });

      if (entries.length === 100) {
        this.directoryReader(reader);
      }
    });
  }

  scanFiles = (item: any) => {
    // tslint:disable-next-line:no-shadowed-variable
    const { selectFile } = this.props;

    if (item.isDirectory) {
      const reader = item.createReader();

      this.directoryReader(reader);
    } else {
      item.file((dropfile: IFile) => {
        selectFile(dropfile.path, dropfile.name, dropfile.mtime, dropfile.size);
      });
    }
  }

  dropHandler = (event: any) => {
    event.stopPropagation();
    event.preventDefault();
    event.target.classList.remove("draggedOver");

    const zone = document.querySelector("#droppableZone");
    if (zone) {
      zone.classList.remove("droppableZone-active");
    }

    const items = event.dataTransfer.items;

    for (const item of items) {
      const entry = item.webkitGetAsEntry();

      if (entry) {
        this.scanFiles(entry);
      }
    }
  }

  dropZoneActive() {
    const zone = document.querySelector("#droppableZone");
    if (zone) {
      zone.classList.add("droppableZone-active");
    }
  }

  render() {
    return (
      <div>
        {this.getBody()}
      </div>
    );
  }

  getBody() {
    const { localize, locale } = this.context;
    const { loadingFiles, files, selectingFilesPackage } = this.props;

    if (selectingFilesPackage) {
      return <ProgressBars />;
    }

    const active = files.length > 0 || loadingFiles.length > 0 ? "active" : "not-active";
    const collection = files.length > 0 || loadingFiles.length > 0 ? "collection" : "";
    const disabled = this.getDisabled();

    return (
      <div className="add">
        {
          disabled ?
            null
            :
            <div id="droppableZone" onDragEnter={(event: any) => this.dragEnterHandler(event)}
              onDrop={(event: any) => this.dropHandler(event)}
              onDragOver={(event: any) => this.dragOverHandler(event)}
              onDragLeave={(event: any) => this.dragLeaveHandler(event)}>
            </div>
        }
        <div onDragEnter={this.dropZoneActive.bind(this)}>
          <div className={"add-file-item " + active} id="items-hidden">
            <div className="row " />
            <div className="row " />
            <div className="row " />
            <div className="row " />
            <div className="row " />
            <div className="row " />
            <div className="row " />
            <div className="row " />
            <div className="headline6 add-file-item-text">{localize("Settings.drag_drop", locale)}</div>
            <i className="material-icons large fullscreen">fullscreen</i>
          </div>
          <div className={collection} >
            <Media query="(max-width: 1020px)">
              {(matches) =>
                matches ? (
                  <FileTableSmall operation={this.props.operation} searchValue={this.props.searchValue}/>
                ) :
                  (
                    <FileTable operation={this.props.operation} searchValue={this.props.searchValue}/>
                  )
              }
            </Media>
          </div>
        </div>
      </div>
    );
  }

  getDisabled = () => {
    const { files, loadingFiles } = this.props;

    if (loadingFiles.length) {
      return true;
    }

    if (files.length) {
      for (const file of files) {
        if (file.socket) {
          return true;
        }
      }
    }

    return false;
  }
}

export default connect((state) => {
  return {
    files: mapToArr(state.files.entities),
    loadingFiles: loadingRemoteFilesSelector(state, { loading: true }),
    selectedFilesPackage: state.files.selectedFilesPackage,
    selectingFilesPackage: state.files.selectingFilesPackage,
  };
}, { activeFile, deleteFile, selectFile })(FileSelector);
