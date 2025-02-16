# Proje Dokümantasyonu

## Gereksinimler
Bu projeyi çalıştırmak için öncelikle bilgisayarınıza Docker kurulu olmalıdır. 

Ayrıca, aşağıdaki portların boş olduğundan emin olun:

- `8080` (OpenFGA)
- `8081` (OpenFGA)
- `3000` (OpenFGA)
- `9090` (Keycloak)
- `3001` (Uygulama)
- `3002` (Websocket)

## Kurulum
Root klasoründe docker-compose up komutunun çalıştırılması gerekiyor.

```sh
docker-compose up
```

## Uygulama URL'leri

- **Keycloak Paneli:** [localhost:9090](http://localhost:9090)
- **OpenFGA Playground:** [localhost:3000/playground](http://localhost:3000/playground)
- **Uygulama:** [localhost:3001](http://localhost:3001)

## OpenFGA Konfigürasyonu

1. **OpenFGA Playground** sayfasına gidin: [localhost:3000/playground](http://localhost:3000/playground)
2. Yeni bir **store** oluşturun ve adını `application` olarak belirleyin.
3. Aşağıdaki yetkilendirme modelini **Authorization Model** kısmına yapıştırın ve kaydedin:

```plaintext
model
  schema 1.1

type person
  relations
    define admin: [person]
    define member: [person]

type application
  relations
    define admin: [person]
    define can_assign_delete: admin
    define can_assign_edit: admin
    define can_delete: [person] or admin
    define can_edit: [person] or admin
    define user: [person]
```

4. **Sağ üst köşede** bulunan 3 nokta menüsünden **Copy Store ID**'ye tıklayın.
5. Proje içerisindeki `openfga.ts` dosyasında `STORE_ID` değişkenini güncelleyin.
6. Aynı menüden **Copy Last Authorization Model ID**'ye tıklayın ve `MODEL_ID` değişkenini güncelleyin.

## Keycloak Konfigürasyonu

1. **Keycloak paneline** [localhost:9090](http://localhost:9090) adresinden gidin.
2. **Admin bilgileri** ile giriş yapın:
   - **Kullanıcı adı:** `admin`
   - **Şifre:** `admin`
3. `next-client` adında bir **client** oluşturun.
4. Aşağıdaki değerleri girin:
   - **Valid redirect URIs:** `http://localhost:3001/*`
   - **Valid post logout redirect URIs:** `http://localhost:3001/*`
   - **Web origins:** `http://localhost:3001/*`
5. **Realm Settings** üzerinden **Login** sekmesine gidin ve **User Registration**'u aktif edin.

## Kullanıcı Rolleri ve Yetkiler

Uygulama iki farklı rol tanımlar:

- **Admin**
- **User**

**Giriş yapan kullanıcının OpenFGA tarafında bir rolü yoksa:**

- Admin olarak giriş yaparsa `admin` rolü atanır.
- Kullanıcı olarak giriş yaparsa `user` rolü atanır.

### Yetkiler

- **Admin**, araç listesini ve tüm kullanıcıları görebilir.
- Kullanıcılara yetki verebilir.
- Yetkiye sahip kullanıcılar, düzenleme ve silme işlemleri yapabilir.
- Kullanıcının yetkisi güncellendiğinde anlık bildirim gönderilir ve arayüz buna göre güncellenir.

---

# Project Documentation

## Requirements
Ensure that Docker is installed on your machine.

Also, make sure that the following ports are free:

- `8080` (OpenFGA)
- `8081` (OpenFGA)
- `3000` (OpenFGA)
- `9090` (Keycloak)
- `3001` (Application)
- `3002` (Websocket)

## Installation
The docker-compose up command needs to be executed in the root directory.

```sh
docker-compose up
```


## Application URLs

- **Keycloak Panel:** [localhost:9090](http://localhost:9090)
- **OpenFGA Playground:** [localhost:3000/playground](http://localhost:3000/playground)
- **Application:** [localhost:3001](http://localhost:3001)

## OpenFGA Configuration

Follow the same steps as mentioned in the Turkish documentation to configure OpenFGA.

## Keycloak Configuration

Follow the same steps as mentioned in the Turkish documentation to configure Keycloak.

## User Roles and Permissions

The application has two roles:

- **Admin**
- **User**

Refer to the Turkish documentation for role and permission details.

