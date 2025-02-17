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
- `4318` (Open Telemetry)

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

### Keycloak Giriş Bilgilari

username: admin password: admin
