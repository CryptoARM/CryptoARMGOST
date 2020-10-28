const express = require('express');
const fileUpload = require('express-fileupload');
const morgan = require('morgan');
const fs = require('fs');
const https = require('https');
const http = require('http');

const privateKey  = fs.readFileSync('pki/key.pem', 'utf8');
const certificate = fs.readFileSync('pki/cert.pem', 'utf8');
const credentials = {key: privateKey, cert: certificate};

const app = express();

const httpsServer = https.createServer(credentials, app);
httpsServer.listen(4040);
console.log('Express server listening on port ', 4040);

const httpServer = http.createServer(app);
httpServer.listen(8080);

//const PORT = 4443;
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/form', function (req, res) {
  res.sendFile(__dirname + '/form.html');
});

// default options
app.use(fileUpload());
app.use(morgan('tiny'));
app.use(express.json());

app.use('/public', express.static(__dirname + '/public'));

app.post('/json', function (req, res) {
  const id = req.query.id;
  if (req.body.jsonrpc !== "2.0") {
    console.log("Error! Wrong jsonrpc version! (" + req.body.jsonrpc + " but MUST be 2.0)");
  }


  console.log("req.body", req.body);

  if (req.body.method === "certificates.parameters"
    || req.body.method === "certificateInfo.parameters"
    || req.body.method === "diagnostics.parameters"
    || req.body.method === "signAndEncrypt.parameters"
    || req.body.method === "startView.parameters"
  ) {
    if (id !== req.body.id) {
      console.log("Error! Id from URL and ID from request is not match! (" + id + " and " + req.body.id + ")");
    }

    if (id) {
      switch (req.body.id) {
        // Server errors
        case "4b05b126-4b74-4d0f-af66-f87ce0bb9cee":
          res.status(405).send('');
          break;
        case "d308db61-a693-4658-b089-25a242711217":
          res.status(415).send('');
          break;
        case "c1e334d3-378a-45ac-842b-b823d2702722":
          res.sendFile(__dirname + '/public/json/server-errors/internal-error.json');
          break;
        case "d53032c9-fc0d-42a7-bdfd-b45bec7b8ab9":
          res.sendFile(__dirname + '/public/json/server-errors/invalid-params.json');
          break;
        case "90dc17c9-4df9-420a-9e25-53b8df4f709f":
          res.sendFile(__dirname + '/public/json/server-errors/invalid-request.json');
          break;
        case "d2056bc4-c8c7-41ee-bdf8-aaa306cdec2f":
          res.sendFile(__dirname + '/public/json/server-errors/method-not-found.json');
          break;
        case "14a52a48-dac7-4b21-8836-744e453a82d2":
          res.sendFile(__dirname + '/public/json/server-errors/parse-error.json');
          break;

        // signAndEncrypt
        case "71407d37-ae12-4a60-9c38-a77664c31f27":
          res.sendFile(__dirname + '/public/json/signAndEncrypt/sign-attached-file.json');
          break;
        case "3a2fca10-fb2c-45eb-a61e-2e0da2a92bf0":
          res.sendFile(__dirname + '/public/json/signAndEncrypt/sign-detached-file.json');
          break;
        case "6afd40d9-4ef2-4d88-a9cc-3f15e4b0a3c0":
          res.sendFile(__dirname + '/public/json/signAndEncrypt/sign-multiple-files.json');
          break;
        case "1b9e26e0-0524-402c-b255-b17dd49ef49b":
          res.sendFile(__dirname + '/public/json/signAndEncrypt/verify-attached-sign.json');
          break;


        // Certificates
        case "f2502c2b-ea27-44d2-bb18-077c6e20dd7d":
          res.sendFile(__dirname + '/public/json/certs/import-cert.json');
          break;
        case "70505a39-3267-4c0f-99a9-02d43165f4f3":
          res.sendFile(__dirname + '/public/json/certs/export-cert.json');
          break;
        case "0a94fab1-eb68-4257-a9da-1399ad208445":
          res.sendFile(__dirname + '/public/json/certs/export-certs.json');
          break;
        case "9b5e6a0b-489d-4812-8866-0b9afce648e1":
          res.sendFile(__dirname + '/public/json/certs/export-certs-stores.json');
          break;
        case "4da4a42a-cecd-4d3b-a13c-466a44fc6924":
          res.sendFile(__dirname + '/public/json/cert-info/cert-info-params.json');
          break;

        case "dd528a4f-da00-40fe-b807-76d9bf7eb535":
          res.sendFile(__dirname + '/public/json/diagnostics/diagnostics-params.json');
          break;

        // Start view
        case "7d8df97a-abc6-42b8-bc2a-f7a354600fd2":
          res.sendFile(__dirname + '/public/json/start-view/certificates-my.json');
          break;

        default:
          res.status(202).sendFile(__dirname + '/public/json/server-errors/internal-error.json');
          break;
      }
    }
  } else if (req.body.method === "certificates.base64") {
    if (id !== req.body.params.id) {
      console.log("Error! Id from URL and ID from request is not match! (" + id + " and " + req.body.params.id + ")");
    }

    console.log("Recieved request with method " + req.body.method + " and id " + req.body.params.id);

    if (req.body.params.certificates) {
      console.log("Recieved " + req.body.params.certificates.length + " certificates for import");
      console.log("========================");
      req.body.params.certificates.forEach(function (cert) {
        console.log("Certificate name: " + cert.friendlyName);
        console.log("Certificate data: " + cert.certificateBase64);
        console.log("------------------------");
      });
      console.log("========================");
    } else {
      console.log("Recieved signgle certificate for import: " + req.body.params.friendlyName);
      console.log("Certificate data: " + req.body.params.certificateBase64);
    }

    res.status(200).send("");
  } else if (req.body.method === "certificateInfo.info") {
    const params = req.body.params;
    console.log("========================");
    console.log("Certificate info recieved:");
    printCertificateInfo(params);
    console.log("========================");

    res.status(200).send("");
  } else if (req.body.method === "diagnostics.information") {
    printDiagnosticInformation(req.body.params);
    res.status(200).send("");
  } else if (req.body.method === "signAndEncrypt.outDirectResults") {
    console.log("outDirectResults", req.body.params.directResults);
    res.status(200).send("");
  } else {
    console.log("Unsupported method: " + req.body.method);
    res.status(400).send('Incorrect token');
  }
});

// Leagcy tests
app.get('/json', function (req, res) {
  const accessToken = req.query.accessToken;

  switch (accessToken) {
    case "efac5229-0595-41e9-b1aa-7df406539b87":
      res.sendFile(__dirname + '/public/json/efac5229-0595-41e9-b1aa-7df406539b87.json');
      break;
    case "9c7101f7-9c47-4481-b4da-a6a497abde08":
      res.sendFile(__dirname + '/public/json/9c7101f7-9c47-4481-b4da-a6a497abde08.json');
      break;
    case "2c48eb32-a0a8-405c-ade9-eed130605cba":
      res.sendFile(__dirname + '/public/json/2c48eb32-a0a8-405c-ade9-eed130605cba.json');
      break;
    default:
      res.status(400).send('Incorrect token');
  }
});

app.post('/upload', function (req, res) {
  let sampleFile;
  let uploadPath;

  if (!req.files || Object.keys(req.files).length === 0) {
    res.status(400).send('No files were uploaded.');
    return;
  }

  console.log('req.files >>>', req.files);

  sampleFile = req.files.file;

  uploadPath = __dirname + '/uploads/' + sampleFile.name;

  sampleFile.mv(uploadPath, function (err) {
    if (err) {
      return res.status(500).send(err);
    }

    res.send('File uploaded to ' + uploadPath);
  });
});

function printCertificateInfo(certInfo) {
  if (certInfo.hash) {
    console.log("\thash: " + certInfo.hash);
  }
  if (certInfo.issuerFriendlyName) {
    console.log("\tissuerFriendlyName: " + certInfo.issuerFriendlyName);
  }
  if (certInfo.issuerName) {
    console.log("\tissuerName: " + certInfo.issuerName);
  }
  if (certInfo.notAfter) {
    console.log("\tnotAfter: " + certInfo.notAfter);
  }
  if (certInfo.notBefore) {
    console.log("\tnotBefore: " + certInfo.notBefore);
  }
  if (certInfo.subjectFriendlyName) {
    console.log("\tsubjectFriendlyName: " + certInfo.subjectFriendlyName);
  }
  if (certInfo.subjectName) {
    console.log("\tsubjectName: " + certInfo.subjectName);
  }
  if (certInfo.status !== undefined) {
    console.log("\tstatus: " + certInfo.status);
  }
  if (certInfo.serial) {
    console.log("\tserial: " + certInfo.serial);
  }
}

function printDiagnosticInformation(params) {
  console.log("========================");
  console.log("Diagnostic info recieved:");

  if (params.SYSTEMINFORMATION) {
    var sysinfo = params.SYSTEMINFORMATION;
    console.log("\n\tSYSTEMINFORMATION");
    if (sysinfo.type) {
      console.log("type: " + sysinfo.type);
    }
    if (sysinfo.arch) {
      console.log("arch: " + sysinfo.arch);
    }
    if (sysinfo.platform) {
      console.log("platform: " + sysinfo.platform);
    }
    if (sysinfo.packageType) {
      console.log("packageType: " + sysinfo.packageType);
    }
  }

  if (params.CSP_ENABLED !== undefined) {
    console.log("\n\tCSP_ENABLED");
    console.log("CSP_ENABLED: " + params.CSP_ENABLED);
  }

  if (params.CADES_ENABLED !== undefined) {
    console.log("\n\tCADES_ENABLED");
    console.log("CADES_ENABLED: " + params.CADES_ENABLED);
  }

  if (params.VERSIONS) {
    var versions = params.VERSIONS;
    console.log("\n\tVERSIONS");
    if (versions.cryptoarm) {
      console.log("cryptoarm: " + versions.cryptoarm);
    }
    if (versions.csp) {
      console.log("csp: " + versions.csp);
    }
  }

  if (params.PROVIDERS) {
    var provs = params.PROVIDERS;
    console.log("\n\tPROVIDERS");
    console.log("GOST2012_256: " + provs.GOST2012_256);
    console.log("GOST2012_512: " + provs.GOST2012_512);
  }

  if (params.LICENSES) {
    var licenses = params.LICENSES;
    console.log("\n\tLICENSES");
    if (licenses.cryptoarm) {
      console.log("cryptoarm.status: " + licenses.cryptoarm.status);
      if (licenses.cryptoarm.type) {
        console.log("cryptoarm.type: " + licenses.cryptoarm.type);
      }
      if (licenses.cryptoarm.expiration) {
        console.log("cryptoarm.expiration: " + licenses.cryptoarm.expiration);
      }
    }
    if (licenses.csp) {
      console.log("csp.status: " + licenses.csp.status);
      if (licenses.csp.type) {
        console.log("csp.type: " + licenses.csp.type);
      }
      if (licenses.csp.expiration) {
        console.log("csp.expiration: " + licenses.csp.expiration);
      }
    }
  }

  if (params.PERSONALCERTIFICATES) {
    var certs = params.PERSONALCERTIFICATES;
    console.log("\n\tPERSONALCERTIFICATES");
    certs.forEach((certInfo) => {
      console.log("--------------------");
      printCertificateInfo(certInfo);
    });
    console.log("--------------------");
  }

  console.log("========================");
}
