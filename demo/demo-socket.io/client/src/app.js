import io from 'socket.io-client';

var socket = io.connect('https://localhost:4040');
var formsign = document.getElementById('sign');
var formverify = document.getElementById('verify');
var formencrypt = document.getElementById('encrypt');
var formdecrypt = document.getElementById('decrypt');
var formUnavailable = document.getElementById('unavailable');

socket.on('disconnect', () => {
  console.log('--- socket was disconnect (cryptoarm closed)');
});

socket.on('connect', () => {
  console.log('--- socket connect (cryptoarm start)');
  console.log('--- socket info:');
  console.log('------ socket connected status: ', socket.connected);
  console.log('------ socket id: ', socket.id);
});

var file1 = {};
file1.name = 'filename1.txt';
file1.url = 'http://localhost:3000/resources/file1.txt'
file1.id = 1;

var file2 = {};
file2.name = 'filename2.txt';
file2.url = 'http://localhost:3000/resources/file2.txt'
file2.id = 2;

var file3 = {};
file3.name = 'filename3.txt';
file3.url = 'http://localhost:3000/resources/file3.txt'
file3.id = 3;

var file4 = {};
file4.name = 'filename4.sig';
file4.url = 'http://localhost:3000/resources/file4.sig'
file4.id = 4;

var file5 = {};
file5.name = 'filename5.enc';
file5.url = 'http://localhost:3000/resources/file5.enc'
file5.id = 5;

var file6 = {};
file6.name = 'filename6.txt';
file6.url = 'http://localhost:3000/resources/fileUnavailable'
file6.id = 6;

var file7 = {};
file7.name = 'filename7.pdf';
file7.url = 'http://localhost:3000/resources/file7.pdf'
file7.id = 7;

var signRequest = {};
signRequest.jsonrpc = '2.0';
signRequest.method = 'sign';
signRequest.params = {};
signRequest.params.token = '';
signRequest.params.files = [file1, file2, file3, file7];
signRequest.params.extra = {};
signRequest.params.uploader = 'https://bitrix.tsumo.org/bitrix/components/trustednet/trustednet.sign/ajax.php?command=upload';
signRequest.params.cancel = 'https://bitrix.tsumo.org/bitrix/components/trustednet/trustednet.sign/ajax.php?command=updateStatus&status=2';
signRequest.params.error = 'https://bitrix.tsumo.org/bitrix/components/trustednet/trustednet.sign/ajax.php?command=updateStatus&status=3';

socket.on('signed', function (data) {
	console.log('--- signed: ', data);
});

formsign.onsubmit = function(ev) {
	ev.preventDefault();

	socket.emit("sign", signRequest);
}

var verifyRequest = {};
verifyRequest.jsonrpc = '2.0';
verifyRequest.method = 'verify';
verifyRequest.params = {};
verifyRequest.params.token = '';
verifyRequest.params.files = [file4];
verifyRequest.params.extra = {};

formverify.onsubmit = function(ev) {
	ev.preventDefault();

	socket.emit("verify", verifyRequest);
}

socket.on('verified', function (data) {
	console.log('--- verified: ', data);
});

var encryptRequest = {};
encryptRequest.jsonrpc = '2.0';
encryptRequest.method = 'encrypt';
encryptRequest.params = {};
encryptRequest.params.token = '';
encryptRequest.params.files = [file1, file2];
encryptRequest.params.extra = {};

formencrypt.onsubmit = function(ev) {
	ev.preventDefault();

	socket.emit("encrypt", encryptRequest);
}

socket.on('encrypted', function (data) {
  console.log('--- encrypted: ', data);
});

var decryptRequest = {};
decryptRequest.jsonrpc = '2.0';
decryptRequest.method = 'encrypt';
decryptRequest.params = {};
decryptRequest.params.token = '';
decryptRequest.params.files = [file5];
decryptRequest.params.extra = {};

formdecrypt.onsubmit = function(ev) {
	ev.preventDefault();

	socket.emit("decrypt", decryptRequest);
}

socket.on('decrypted', function (data) {
	console.log('--- decrypted: ', data);
});


var signUnavailableRequest = {};
signUnavailableRequest.jsonrpc = '2.0';
signUnavailableRequest.method = 'sign';
signUnavailableRequest.params = {};
signUnavailableRequest.params.token = '';
signUnavailableRequest.params.files = [file6];
signUnavailableRequest.params.extra = {};

socket.on('unavailable', function (data) {
	console.log('--- unavailable: ', data);
});

formUnavailable.onsubmit = function(ev) {
	ev.preventDefault();

	socket.emit("sign", signUnavailableRequest);
}
