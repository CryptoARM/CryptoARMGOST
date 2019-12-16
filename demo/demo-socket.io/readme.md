# КриптоАРМ ГОСТ - API
# Оглавление
* [КриптоАРМ ГОСТ - взаимодействие с WEB - приложениями](#base)
* [Сценарий](#steps)
* [Используемые модули](#modules)
  * [Что такое Socket.IO](#socketio)
* [Руководство по доработке web-страниц](#pages)
* [Справочник API](#api)
  * [Сервер](#server)
  * [Клиент](#client)
  * [События, зарегестрированные в КриптоАРМ ГОСТ](#events)
    * [Client events - События, генерируемые клиентом](#client-events)
    * [Server events - События, генерируемые сервером](#server-events)
  * [POST](#post)
* [Работа с готовым примером](#demo-app)
  * [Сборка](#build-demo-app)
  * [Использование](#use-demo-app)
* [Примеры проектов](#used)
* [Обратная связь](#support)
		
## <a name="base"></a>КриптоАРМ ГОСТ - взаимодействие с WEB - приложениями

КриптоАРМ ГОСТ позволяет легко встроить в web-приложения следующий функционал:

- Электронная подпись и её проверка
- Шифрование и расшифрование

Для работы используется локальный сервер, а технология сокетов позволяет клиенту работать с любым браузером.

## <a name="steps"></a> Сценарий

![изображение](https://user-images.githubusercontent.com/16474118/70433967-12bbc900-1a94-11ea-936c-ad1935b7f33b.png)

## <a name="modules">Используемые модули

Для общения с порталом и выполнения операций на клиенте используются следующие модули:
 - https: локальный веб-сервер
- socket.io: обеспечивает двустороннюю связь на основе событий в режиме реального времени
- trusted-crypto: выполнение криптографических операций, используя CryptoAPI для взаимодействия с криптопровайдером

На web-портале необходимо добавить только socket.io.js.

### <a name="socketio">Что такое Socket.IO

Socket.IO - это библиотека, которая обеспечивает двустороннюю и основанную на событиях связь, в режиме реального времени между браузером и сервером.

## <a name="pages">Руководство по доработке web-страниц

1. Для возможности работы с КриптоАРМ ГОСТ через JavaScript API на web-странице подключите скрипт socket.io.js
```html
<script type="text/javascript" src="/js/socket.io.js"></script>
```

2. Установите соединение с локальным сервером
```js
socket = io('https://localhost:4040');
```

3. Проверьте, что соединение установлено. Иначе отобразите окно с просьбой запустить КриптоАРМ ГОСТ
```js
socket.connected
```
* (Boolean)
```js
socket.on('connect', () => {
  console.log(socket.connected); // true
});
```

4. Отправляйте требуемые события или реагируйте на ответы от КриптоАРМ ГОСТ


# <a name="api"></a>Справочник API
## <a name="server"> Сервер

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

### Событие 'connection' (синоним 'connect')

Сработает при подключении клиента

```typescript
io.on('connection', (socket) => {
// ...
}
```

### Class: Socket

#### Событие 'disconnect'

Сработает при отключении клиента

```typescript
io.on('connection', (socket) => {
  socket.on('disconnect', () => {
    // ...
  });
});
```

#### socket.on(eventName, callback)

Добавляет обработчик для указанного события

```typescript
socket.on('sign', (data) => {
  console.log(data);
});
```



## <a name="client" /> Клиент

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

## <a name="events" /> События, зарегестрированные в КриптоАРМ ГОСТ
### <a name="server-events" /> Server events - События, генерируемые сервером
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



### <a name="post" /> POST
#### <a name="upload" /> upload

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

# <a name="demo-app">Работа с готовым примером
## <a name="build-demo-app"> Сборка
```
$ npm install
$ npm install -g gulp
$ gulp
$ node server
```
	
## <a name="use-demo-app"> Использование
Если demo-приложение успешно собрано и сервер запущен, откройте в браузере ссылку https://localhost:4000
Внимание: КриптоАРМ ГОСТ также должен быть предварительно запущен
	
![изображение](https://user-images.githubusercontent.com/16474118/70439987-3980fc00-1aa2-11ea-9ecf-db79071ecaa2.png)

При нажатие кнопок send, выполняется та или иная операция, например подпись:

![demo_30](https://user-images.githubusercontent.com/16474118/70441109-c2009c00-1aa4-11ea-8bdf-7ec3f7046552.gif)

Проверка:

![demo_ver_30](https://user-images.githubusercontent.com/16474118/70441117-c6c55000-1aa4-11ea-845d-053ce4b3b22a.gif)

# <a name="used"> Примеры проектов
[КриптоАРМ.Документы ](https://cryptoarm.ru/cryptoarm-docs/) - Подпись актов, договоров, соглашений и других документов
в электронном виде на CMS Bitrix
	
[![youtube](https://user-images.githubusercontent.com/16474118/70445517-b1542400-1aac-11ea-91ce-b720ab220708.png)](https://www.youtube.com/watch?time_continue=1&v=Adz2UnsLw1I "Модуль подписи для Битрикс")

# <a name="support"> Обратная связь
Если у вас есть вопросы по технической поддержке, то напишите нам на support@trusted.ru или откройте обращение на странице [GitHub Issues](https://github.com/TrustedRu/CryptoARMGOST/issues)
