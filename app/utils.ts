import * as crypto from "crypto";
import * as fs from "fs";

import { OrderedMap } from "immutable";
import PropTypes from "prop-types";
import React from "react";

let err_hint: string[] = ["Доступны только цифры", "Проверьте количество цифр", "Не правильно введены данные"];
interface ISignatureStatusProps {
  signature: any;
  handleActiveCert: (cert: any) => void;
}

class SignatureStatus extends React.Component<ISignatureStatusProps, any> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

}

export function arrayToMap(arr, RecordModel) {
  return arr.reduce((acc, el) => acc.set(el.id, RecordModel ? new RecordModel(el) : el), new OrderedMap({}))
}

export function mapToArr(obj) {
  return obj.valueSeq().toArray();
}

export function extFile(filename: string) {
  return filename.split(".").pop();
}

function padString(input: string): string {
  const segmentLength = 4;
  const stringLength = input.length;
  const diff = stringLength % segmentLength;

  if (!diff) {
    return input;
  }

  let position = stringLength;
  let padLength = segmentLength - diff;
  const paddedStringLength = stringLength + padLength;
  const buffer = new Buffer(paddedStringLength);

  buffer.write(input);

  while (padLength--) {
    buffer.write("=", position++);
  }

  return buffer.toString();
}

export function toBase64(base64url: string | Buffer): string {
  base64url = base64url.toString();
  return padString(base64url)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");
}

export function isEncryptedKey(path: string) {
  const encPrivkeyHeader = "-----BEGIN ENCRYPTED PRIVATE KEY-----";
  const lengthForRead = encPrivkeyHeader.length;
  const fd = fs.openSync(path, "r");
  const buffer = new Buffer(lengthForRead);
  let res;

  fs.readSync(fd, buffer, 0, lengthForRead, 0);

  if (buffer.toString("utf8", 0, lengthForRead) === encPrivkeyHeader) {
    res = 1;
  } else {
    res = 0;
  }

  fs.close(fd);

  return res;
}

export function fileCoding(filePath: string): number {
  const FD: number = fs.openSync(filePath, "r");
  const BUFFER: Buffer = new Buffer(2);
  let res: any;

  fs.readSync(FD, BUFFER, 0, 2, 0);

  if (BUFFER.toString("utf8", 0, 2) === "--") {
    res = trusted.DataFormat.PEM;
  } else {
    res = trusted.DataFormat.DER;
  }

  fs.close(FD);

  return res;
}

/**
 * Check file exists
 * @param  {string} filePath
 * @returns boolean
 */
export function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    return false;
  }
}

/**
 * Check exists directory
 * @param  {string} dirPath
 */
export function dirExists(dirPath: string): boolean {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch (err) {
    return false;
  }
}

export const uuid = () => {
  const rnb = crypto.randomBytes(16).toString("hex");

  return rnb.substring(0, 8) + "-" + rnb.substring(8, 12) + "-" + rnb.substring(12, 16) + "-" + rnb.substring(16, 20) + "-" + rnb.substring(20);
};

export const randomSerial = () => {
  return Math.floor(Math.random() * 1000000000000000000);
};
export let err_snils = "";
export let err_inn = "";
export let err_ogrn = "";
export let err_ogrnip = "";

export const validateSnils = (snils: string | number) => {
  let result = false;

  if (typeof snils === "number") {
    snils = snils.toString();
  } else if (typeof snils !== "string") {
    snils = "";
  }



  if (!snils.length) {

    return false;
  } else if (/[^0-9]/.test(snils)) {
    err_snils = err_hint[0];

    return false;

  } else if (snils.length !== 11) {
    err_snils = err_hint[1];
    return false;
  } else {
    let sum = 0;

    for (let i = 0; i < 9; i++) {
      sum += parseInt(snils[i], 10) * (9 - i);
    }

    let checkDigit = 0;

    if (sum < 100) {
      checkDigit = sum;
    } else if (sum > 101) {
      checkDigit = parseInt(sum % 101, 10);
      if (checkDigit === 100) {
        checkDigit = 0;
      }
    }
    if (checkDigit === parseInt(snils.slice(-2), 10)) {
      result = true;
    } else {
      err_snils = err_hint[2];
      return false;
    }
  }

  return result;
};

export const validateInn = (inn: string | number) => {
  let result = false;

  if (typeof inn === "number") {
    inn = inn.toString();
  } else if (typeof inn !== "string") {
    inn = "";
  }

  if (!inn.length) {
    return false;
  } else if (/[^0-9]/.test(inn)) {
    err_inn = err_hint[0];

    return false;
  } else if ([10, 12].indexOf(inn.length) === -1) {

    err_inn = err_hint[1];
    return false;
  } else {
    const checkDigit = (inn, coefficients) => {
      let n = 0;

      // tslint:disable-next-line:forin
      for (const i in coefficients) {
        n += coefficients[i] * inn[i];
      }

      return parseInt(n % 11 % 10, 10);
    };

    switch (inn.length) {
      case 10:
        const n10 = checkDigit(inn, [2, 4, 10, 3, 5, 9, 4, 6, 8]);
        if (n10 === parseInt(inn[9], 10)) {
          result = true;
        }
        break;

      case 12:
        const n11 = checkDigit(inn, [7, 2, 4, 10, 3, 5, 9, 4, 6, 8]);
        const n12 = checkDigit(inn, [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8]);
        if ((n11 === parseInt(inn[10], 10)) && (n12 === parseInt(inn[11], 10))) {
          result = true;
        }
        break;
    }

    if (!result) {
      err_inn = err_hint[2];

      return false;
    }
  }


  return result;
};

export const validateOgrn = (ogrn: string | number) => {
  let result = false;

  if (typeof ogrn === "number") {
    ogrn = ogrn.toString();
  } else if (typeof ogrn !== "string") {
    ogrn = "";
  }

  if (!ogrn.length) {
    return false;
  } else if (/[^0-9]/.test(ogrn)) {

    err_ogrn = err_hint[0];
    return false;
  } else if (ogrn.length !== 13) {

    err_ogrn = err_hint[1];
    return false;
  } else {
    const n13 = parseInt((parseInt(ogrn.slice(0, -1), 10) % 11).toString().slice(-1), 10);
    if (n13 === parseInt(ogrn[12], 10)) {
      result = true;
    } else {

      err_ogrn = err_hint[2];
      return false;
    }
  }

  return result;
};

export const validateOgrnip = (ogrnip: string | number) => {
  let result = false;

  if (typeof ogrnip === "number") {
    ogrnip = ogrnip.toString();
  } else if (typeof ogrnip !== "string") {
    ogrnip = "";
  }

  if (!ogrnip.length) {
    return false;
  } else if (/[^0-9]/.test(ogrnip)) {

    err_ogrnip = err_hint[0];
    return false;
  } else if (ogrnip.length !== 15) {

    err_ogrnip = err_hint[1];
    return false;
  } else {
    const n15 = parseInt((parseInt(ogrnip.slice(0, -1), 10) % 13).toString().slice(-1), 10);
    if (n15 === parseInt(ogrnip[14], 10)) {
      result = true;
    } else {

      err_ogrnip = err_hint[2];
      return false;
    }
  }

  return result;
};

export function formatDate(date: Date) {
  let month = "" + (date.getMonth() + 1);
  let day = "" + date.getDate();
  const year = date.getFullYear();

  if (month.length < 2) {
    month = "0" + month;
  }

  if (day.length < 2) {
    day = "0" + day;
  }

  return [year, month, day].join("-");
}

export function md5(data: string): string {
  return crypto.createHash("md5").update(data).digest("hex").toUpperCase();
}

export function xorConvolutionMD5(hash: string): string {
  let res = "";

  if (hash && hash.length && hash.length === 32) {
    for (let i = 0; i < 8; i++) {
      // tslint:disable-next-line:no-bitwise
      res += (charToHex(hash.charAt(i)) ^ charToHex(hash.charAt(i + 8)) ^ charToHex(hash.charAt(i + 16)) ^ charToHex(hash.charAt(i + 24))).toString(16);
    }
  }

  return res.toUpperCase();
}

function charToHex(char: string): number {
  return parseInt(char, 16);
}

export function bytesToSize(bytes: number, decimals = 2) {
  const sizes = ["B", "KB", "MB", "GB", "TB"];

  if (bytes === 0) {
    return "n/a";
  }

  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  if (i === 0) {
    return `${bytes} ${sizes[i]}`;
  }

  return `${(bytes / Math.pow(1024, i)).toFixed(decimals)} ${sizes[i]}`;
}
