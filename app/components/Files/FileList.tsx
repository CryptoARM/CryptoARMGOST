import { is } from "immutable";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";
import { AutoSizer, List } from "react-virtualized";
import { activeFile, deleteFile, selectTempContentOfSignedFiles } from "../../AC";
import { ENCRYPT, SIGN } from "../../constants";
import { loadingRemoteFilesSelector } from "../../selectors";
import { mapToArr } from "../../utils";
import FileListItem from "./FileListItem";
import RemoteFileListItem from "./RemoteFileListItem";

const HEIGHT_FOR_SIGN = 377;
const HEIGHT_FOR_ENCRYPT = 427;

interface IFileRedux {
  active: boolean;
  extension: string;
  filename: string;
  fullpath: string;
  id: number;
  mtime: Date;
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

interface IFilelistProps {
  activeFile: (id: number, active?: boolean) => void;
  deleteFile: (fileId: number) => void;
  loadingFiles: IRemoteFile[];
  location: any;
  files: IFileRedux[];
  operation: string;
  selectedFilesPackage: boolean;
  selectingFilesPackage: boolean;
  style: any;
}

class FileList extends React.Component<IFilelistProps, {}> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  componentDidMount() {
    this.noGridOverflow();
  }

  componentWillUpdate() {
    this.noGridOverflow();
  }

  shouldComponentUpdate(nextProps: IFilelistProps) {
    const { files, loadingFiles, selectingFilesPackage } = this.props;

    if (selectingFilesPackage !== nextProps.selectingFilesPackage) {
      return true;
    }

    if (loadingFiles.length !== nextProps.loadingFiles.length) {
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

  render() {
    const { files, loadingFiles } = this.props;

    return (
      <div style={{ display: "flex" }}>
        <div style={{ flex: "1 1 auto", height: "calc(100vh - 130px)" }}>
          <AutoSizer>
            {({ height, width }) => (
              <List
                rowCount={files.length + loadingFiles.length}
                height={height}
                width={width}
                overscanRowCount={5}
                rowHeight={45}
                rowRenderer={this.rowRenderer}
                files={loadingFiles.concat(files)}
                style={{ outline: "none" }}
              />
            )}
          </AutoSizer>
        </div>
      </div>
    );
  }

  rowRenderer = ({ index, key, style }) => {
    const { files, operation, loadingFiles, selectTempContentOfSignedFiles } = this.props;

    if (!files.length && !loadingFiles.length) {
      return null;
    }

    if (index > files.length - 1 && loadingFiles.length) {
      const realIndex = index - files.length;

      return (
        <RemoteFileListItem
          removeFiles={() => this.removeFile(loadingFiles[realIndex].id)}
          onClickBtn={() => this.toggleActive(loadingFiles[realIndex])}
          file={loadingFiles[realIndex]}
          operation={operation}
          key={key}
          index={realIndex.toString()}
          style={style}
        />
      );
    } else if (index < files.length) {
      return (
        <FileListItem
          removeFiles={() => this.removeFile(files[index].id)}
          onClickBtn={() => this.onClick(files[index])}
          file={files[index]}
          operation={operation}
          key={key}
          index={index}
          selectTempContentOfSignedFiles={selectTempContentOfSignedFiles}
          style={style}
        />
      );
    }
  }

  getListHeight = () => {
    const { operation } = this.props;

    switch (operation) {
      case SIGN:
        return HEIGHT_FOR_SIGN;

      case ENCRYPT:
      default:
        return HEIGHT_FOR_ENCRYPT;
    }
  }

  onClick = (file: IFileRedux) => {
    if (!file.socket) {
      this.toggleActive(file);
    }
  }

  noGridOverflow() {
    const grid = document.getElementsByClassName("ReactVirtualized__Grid__innerScrollContainer")[0];

    if (grid) {
      grid.style.overflow = "";
    }
  }

  removeFile = (id: number) => {
    // tslint:disable-next-line:no-shadowed-variable
    const { deleteFile } = this.props;

    deleteFile(id);
  }

  toggleActive(file: any) {
    // tslint:disable-next-line:no-shadowed-variable
    const { activeFile } = this.props;

    activeFile(file.id, !file.active);
  }
}

export default connect((state) => {
  return {
    files: mapToArr(state.files.entities),
    loadingFiles: loadingRemoteFilesSelector(state, { loading: true }),
    selectedFilesPackage: state.files.selectedFilesPackage,
    selectingFilesPackage: state.files.selectingFilesPackage,
  };
}, { activeFile, deleteFile, selectTempContentOfSignedFiles })(FileList);
