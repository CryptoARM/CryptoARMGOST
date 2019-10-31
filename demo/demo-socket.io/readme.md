### Steps

```
$ npm install
$ gulp
$ node server
```

### API

* [SERVER](#server)
* [CLIENT](#client)
* [EVENTS](#events)
* [POST](#post)

<a name="server" />

### SERVER

Старт сервера с использованием Node https

```typescript
import * as fs from "fs";
import * as https from "https";
import * as socketIO from "socket.io";

const privateKey  = fs.readFileSync("/ssl/key.pem", "utf8");
const certificate = fs.readFileSync("/ssl/cert.pem", "utf8");

const credentials = {key: privateKey, cert: certificate};

https.createServer(credentials).listen(4040);

const io = socketIO.listen(https);
```

#### Событие 'connection' (синоним 'connect')

Сработает при подключении клиента

```typescript
io.on('connection', (socket) => {
// ...
}
```

#### Class: Socket

##### Событие 'disconnect'

Сработает при отключении клиента

```typescript
io.on('connection', (socket) => {
  socket.on('disconnect', () => {
    // ...
  });
});
```

##### socket.on(eventName, callback)

Добавляет обработчик для указанного события

```typescript
socket.on('sign', (data) => {
  console.log(data);
});
```

<a name="client" />

### CLIENT

Подключение к серверу

```typescript
import io from 'socket.io-client';
const socket = io.connect('https://localhost:4040');
```

#### Class: io.Socket

##### Событие 'disconnect'

Сработает при разрыве соединения с сервером

```typescript
socket.on('disconnect', (reason) => {
  // ...
});
```

##### Событие 'connect'

Сработает при успешном переподключении

```typescript
socket.on('connect', () => {
  // ...
});
```

##### socket.id

Уникальный идентификатор сокета

##### socket.on(eventName, callback)

Добавляет обработчик для указанного события

```typescript
socket.on('signed', (data) => {
  console.log(data);
});
```

<a name="events" />

### EVENTS
События, зарегестрированные в КриптоАРМ ГОСТ

### Server events

События, генерируемые сервером

#### signed

Документ подписан

```typescript
interface signed {
  id: number;
}
```

#### verified

Подпись проверена

```typescript
interface certificate {
  serial: string; // серийный номер сертификата
  subjectFriendlyName: string; // дружественное имя владельца (CN)
  organizationName: string; // организация
  issuerFriendlyName: string; // дружественное имя издателя (CN)
  notAfter: number; // срок действия сертификата
  signatureAlgorithm: string; // алгоритм подписи
  signatureDigestAlgorithm: string; // хеш алгоритм подписи
  publicKeyAlgorithm: string; // алгоритм публичного ключа
  hash: string; // отпечаток
  key: boolean; // налиичие привязки к закрытому ключу
  status: boolean; // результат проверки
}

interface verified {
  id: number;
  signatureAlgorithm: string,
  certs: certificate[],
  digestAlgorithm: string,
  status: boolean,
  subject: string,
}
```

#### encrypted

Документ зашифрован

```typescript
interface encrypted {
  id: number;
}
```

#### decrypted

Документ расшифрован

```typescript
interface decrypted {
  id: number;
}
```

#### unavailable

Не удалось скачать файл

#### cancelled

Отмена операции для файла

```typescript
interface cancelled {
  id: number;
}
```


#### error

Произошла ошибка


### Client events

События, генерируемые клиентом

#### sign

Отправка докуентов на подпись

```typescript
interface file {
  id: string; // уникальный идентификатор
  name: string; // имя файла
  url: string; // ссылка для загрузки файла
}

interface sign {
  method: string;
  params: {
    token: string;
    files: file[];
    extra: any;
    uploader: string; // ссылка для отправки подписанного файла
  }
  id: string;
}
```

#### verify

Отправка докуентов на проверку

```typescript
interface file {
  id: string; // уникальный идентификатор
  name: string; // имя файла
  url: string; // ссылка для загрузки файла
}

interface verify {
  method: string;
  params: {
    token: string;
    files: file[];
  }
  id: string;
}
```

#### encrypt

Отправка докуентов на шифрование

```typescript
interface file {
  id: string; // уникальный идентификатор
  name: string; // имя файла
  url: string; // ссылка для загрузки файла
}

interface encrypt {
  method: string;
  params: {
    token: string;
    files: file[];
    extra: any;
    uploader: string; // ссылка для отправки зашифрованного файла
  }
  id: string;
}
```

#### decrypt

Отправка докуентов на расшифрование

```typescript
interface file {
  id: string; // уникальный идентификатор
  name: string; // имя файла
  url: string; // ссылка для загрузки файла
}

interface decrypt {
  method: string;
  params: {
    token: string;
    files: file[];
    uploader: string; // ссылка для отправки расшифрованного файла
  }
  id: string;
}
```

<a name="post" />

### POST

#### upload

Отправка документов

```typescript
interface signer {
  subjectFriendlyName: string;
  issuerFriendlyName: string;
  notBefore: Date;
  notAfter: Date;
  digestAlgorithm: string;
  signingTime: Date;
  subjectName: string;
  issuerName: string;
}

interface formData {
  extra: string;
  file: stream;
  id: string;
  signers?: signer[];
}

interface post {
  formData: formData;
  url: string; // ссылка для отправки файла
}
```
