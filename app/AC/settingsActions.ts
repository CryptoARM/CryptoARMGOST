import {
  ACTIVE_SETTING, AES_128, APPLY_SETTINGS,
  CHANGE_ARCHIVE_FILES_BEFORE_ENCRYPT, CHANGE_DEFAULT_SETTINGS, CHANGE_DELETE_FILES_AFTER_ENCRYPT,
  CHANGE_ECRYPT_ALGORITHM, CHANGE_ECRYPT_ENCODING, CHANGE_LOCALE,
  CHANGE_OCSP_PROXY_LOGIN, CHANGE_OCSP_PROXY_PASSWORD,
  CHANGE_OCSP_PROXY_PORT, CHANGE_OCSP_PROXY_URL, CHANGE_OCSP_URL,
  CHANGE_OCSP_USE_PROXY, CHANGE_OUTFOLDER, CHANGE_SETTINGS_NAME, CHANGE_SIGNATURE_DETACHED,
  CHANGE_SIGNATURE_ENCODING, CHANGE_SIGNATURE_STANDARD, CHANGE_SIGNATURE_TIME, CHANGE_SIGNATURE_TIMESTAMP, CHANGE_SIGNATURE_TIMESTAMP_ON_SIGN,
  CHANGE_TSP_PROXY_LOGIN, CHANGE_TSP_PROXY_PASSWORD, CHANGE_TSP_PROXY_PORT, CHANGE_TSP_PROXY_URL, CHANGE_TSP_URL, CHANGE_TSP_USE_PROXY, CREATE_SETTING,
  DEFAULT_DOCUMENTS_PATH, DELETE_SETTING, GOST_28147, RESET_SETTING_CHANGES, SAVE_SETTINGS,
  TOGGLE_ARCHIVATION_OPERATION, TOGGLE_ENCRYPTION_OPERATION, TOGGLE_REVERSE_OPERATIONS, TOGGLE_SAVE_COPY_TO_DOCUMENTS, TOGGLE_SAVE_RESULT_TO_FOLDER, TOGGLE_SAVE_TO_DOCUMENTS, TOGGLE_SIGNING_OPERATION,
} from "../constants";

export function createSettings(name?: string, setting?: any) {
  return {
    payload: { name, setting },
    type: CREATE_SETTING,
  };
}

export function changeDefaultSettings(id: string) {
  return {
    payload: { id },
    type: CHANGE_DEFAULT_SETTINGS,
  };
}

export function activeSetting(id: string) {
  return {
    payload: { id },
    type: ACTIVE_SETTING,
  };
}

export function deleteSetting(id: string) {
  return {
    payload: { id },
    type: DELETE_SETTING,
  };
}

export function applySettings(settings: any) {

  return {
    payload: { settings },
    type: APPLY_SETTINGS,
  };
}

export function saveSettings() {
  return {
    type: SAVE_SETTINGS,
  };
}

export function resetSettingChanges() {
  return {
    type: RESET_SETTING_CHANGES,
  };
}

export function toggleArchivationOperation(archivationOperation: boolean) {
  return {
    payload: { archivationOperation },
    type: TOGGLE_ARCHIVATION_OPERATION,
  };
}

export function toggleEncryptionOperation(encryptionOperation: boolean) {
  return {
    payload: { encryptionOperation },
    type: TOGGLE_ENCRYPTION_OPERATION,
  };
}

export function toggleSaveResultToFolder(saveResultToFolder: boolean) {
  return {
    payload: { saveResultToFolder },
    type: TOGGLE_SAVE_RESULT_TO_FOLDER,
  };
}

export function toggleSaveCopyToDocuments(saveCopyToDocuments: boolean) {
  return {
    payload: { saveCopyToDocuments },
    type: TOGGLE_SAVE_COPY_TO_DOCUMENTS,
  };
}

export function toggleReverseOperations(reverseOperations: boolean) {
  return {
    payload: { reverseOperations },
    type: TOGGLE_REVERSE_OPERATIONS,
  };
}

export function toggleSigningOperation(signingOperation: boolean) {
  return {
    payload: { signingOperation },
    type: TOGGLE_SIGNING_OPERATION,
  };
}

export function toggleSaveToDocuments(saveToDocuments: boolean) {

  return (dispatch: (action: {}) => void) => {

    if (saveToDocuments) {

      dispatch(changeOutfolder(DEFAULT_DOCUMENTS_PATH));

    } else {

      dispatch(changeOutfolder(""));
    }

    dispatch({
      payload: { saveToDocuments },
      type: TOGGLE_SAVE_TO_DOCUMENTS,
    });

  };
}

export function changeSettingsName(name: string) {
  return {
    payload: { name },
    type: CHANGE_SETTINGS_NAME,
  };
}

export function changeOutfolder(outfolder: string) {
  return {
    payload: { outfolder },
    type: CHANGE_OUTFOLDER,
  };
}

export function changeEncryptEncoding(encoding: string) {
  return {
    payload: { encoding },
    type: CHANGE_ECRYPT_ENCODING,
  };
}

export function changeDeleteFilesAfterEncrypt(del: boolean) {
  return {
    payload: { del },
    type: CHANGE_DELETE_FILES_AFTER_ENCRYPT,
  };
}

export function changeArchiveFilesBeforeEncrypt(archive: boolean) {
  return {
    payload: { archive },
    type: CHANGE_ARCHIVE_FILES_BEFORE_ENCRYPT,
  };
}

export function changeEncryptionAlgorithm(algorithm: string) {
  return {
    payload: { algorithm },
    type: CHANGE_ECRYPT_ALGORITHM,
  };
}

export function isGostRecipients(recipients: any) {
  return recipients.filter(function(recipient: any) {
    return recipient.publicKeyAlgorithm !== "1.2.643.7.1.1.1.1"
      && recipient.publicKeyAlgorithm !== "1.2.643.7.1.1.1.2";
  }).length === 0;
}

export function getDefaultEncryptionAlg(isGost: boolean) {
  return isGost ? GOST_28147 : AES_128;
}

export function changeSignatureStandard(standard: string) {
  return {
    payload: { standard },
    type: CHANGE_SIGNATURE_STANDARD,
  };
}

export function changeSignatureEncoding(encoding: string) {
  return {
    payload: { encoding },
    type: CHANGE_SIGNATURE_ENCODING,
  };
}

export function changeSignatureDetached(detached: boolean) {
  return {
    payload: { detached },
    type: CHANGE_SIGNATURE_DETACHED,
  };
}

export function changeSignatureTime(time: boolean) {
  return {
    payload: { time },
    type: CHANGE_SIGNATURE_TIME,
  };
}

export function changeSignatureTimestamp(timestamp: boolean) {
  return {
    payload: { timestamp },
    type: CHANGE_SIGNATURE_TIMESTAMP,
  };
}

export function changeSignatureTimestampOnSign(timestamp: boolean) {
  return {
    payload: { timestamp },
    type: CHANGE_SIGNATURE_TIMESTAMP_ON_SIGN,
  };
}

export function changeLocale(locale: string) {
  return {
    payload: { locale },
    type: CHANGE_LOCALE,
  };
}

export function changeTspProxyPort(port: number) {
  return {
    payload: { port },
    type: CHANGE_TSP_PROXY_PORT,
  };
}

export function changeTspProxyUrl(url: string) {
  return {
    payload: { url },
    type: CHANGE_TSP_PROXY_URL,
  };
}

export function changeTspUrl(url: string) {
  return {
    payload: { url },
    type: CHANGE_TSP_URL,
  };
}

export function changeTspUseProxy(use_proxy: boolean) {
  return {
    payload: { use_proxy },
    type: CHANGE_TSP_USE_PROXY,
  };
}

export function changeTspProxyLogin(proxy_login: string) {
  return {
    payload: { proxy_login },
    type: CHANGE_TSP_PROXY_LOGIN,
  };
}

export function changeTspProxyPassword(proxy_password: string) {
  return {
    payload: { proxy_password },
    type: CHANGE_TSP_PROXY_PASSWORD,
  };
}

export function changeOcspProxyPort(port: number) {
  return {
    payload: { port },
    type: CHANGE_OCSP_PROXY_PORT,
  };
}

export function changeOcspProxyUrl(url: string) {
  return {
    payload: { url },
    type: CHANGE_OCSP_PROXY_URL,
  };
}

export function changeOcspUrl(url: string) {
  return {
    payload: { url },
    type: CHANGE_OCSP_URL,
  };
}

export function changeOcspUseProxy(use_proxy: boolean) {
  return {
    payload: { use_proxy },
    type: CHANGE_OCSP_USE_PROXY,
  };
}

export function changeOcspProxyLogin(proxy_login: string) {
  return {
    payload: { proxy_login },
    type: CHANGE_OCSP_PROXY_LOGIN,
  };
}

export function changeOcspProxyPassword(proxy_password: string) {
  return {
    payload: { proxy_password },
    type: CHANGE_OCSP_PROXY_PASSWORD,
  };
}
