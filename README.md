# Batak

Reklamsız ya da reklamlı + Premium üyelikli oynanabilen, sıfırdan yazılmış Batak oyunu.
Tek kod tabanı: web (geliştirme/test) + iOS + Android (Capacitor).

## Özellikler

- **Giriş ekranı:** Apple, Google, Facebook veya misafir girişi (Firebase Authentication); misafir hesabı sonradan bağlanabilir, hesap silme ve oturum kapatma ayarlarda
- **4 mod:** İhaleli, Eşli, Gömmeli (3 kişi), Koz Maça
- **Oda kurma:** oyun tipi, 3 / 5 / 7 / 9 / 11 / 13 el (varsayılan 7), koz oynama kuralı (Koz Çıkmalı / Serbest), mesajlaşma açık/kapalı
- **Kart tasarımı:** klasik düzen (sol üst / sağ alt indeks, klasik pip dizilimi, çerçeveli çift başlı Papaz-Kız-Vale, kırmızı desenli arka yüz), sade ve oyunun tarzına uygun çizim; hepsi kodla çizilen SVG (`src/ui/components/cardArt.tsx`)
- **Oda Bul / Oda Kur:** puanlı masalar; giriş bedeli ve ödül masaya göre, yüksek ödüllü masalara yüksek puanlı oyuncular girer
- **Puan ekonomisi:** günlük giriş ödülü, ödüllü reklamla günde 2 kez puan, masadan çıkana 500 Pt ceza ve yerine bot
- **Lider tablosu ve arkadaşlar:** oyunda bir oyuncuya dokununca profil kartı ve Arkadaş Ekle
- **Takip kolaylığı:** ihaleyi alanın rozetinde ve üst çubukta aldığı/ihale sayacı (ör. 3/7), masanın ortasında koz simgesi
- **Oda içi mesajlaşma:** hızlı sohbet mesajları, emojiler ve serbest yazı; botlar da cevap verir
- **Premium ayrıcalığı:** profil fotoğrafında altın çerçeve ve kral tacı (menüde ve masada)
- Facebook / Google ile girişte profil fotoğrafı otomatik gelir
- **El düzeni:** kartlar iki sıra (altlı üstlü), renkler kırmızı-siyah dönüşümlü, büyük kartlar sağda
- Ayarlar: ses, El Sonu Yaz Boz, Kart Gösterici, masa rengi, oyun hızı
- Bilgisayar rakipler (kurallara tam uyan yapay zekâ)
- Tam Batak kuralları: renk takibi, yükseltme zorunluluğu, koz zorunluluğu, koz açılmadan kozla başlanmaz
- Elle çizilmiş (CSS/SVG) kartlar, çuha masa, kart uçma animasyonları, ses efektleri
- Puan tablosu, el sonu özeti, istatistikler, ayarlar (isim, ses, oyun hızı)
- **Para kazanma:** AdMob reklamları + RevenueCat ile aylık/yıllık Premium (reklamları kaldırır)

## Puan ekonomisi (`src/engine/economy.ts`)

| Kural | Değer |
| --- | --- |
| Başlangıç puanı | 5.000 Pt |
| Günlük giriş ödülü | 1.000 Pt (günde 1) |
| Ödüllü reklam | 500 Pt, günde en fazla 2 |
| Masa ödülleri | 1.000 / 2.600 / 5.000 / 10.000 / 25.000 / 50.000 |
| Ödül dağılımı (4 kişi) | 1. ödülün tamamı, 2. 1/8, 3. 1/16, 4. 0 |
| Gömmeli (3 kişi) | 1. tamamı, 2. 1/8, 3. 0 · Eşli: kazanan takımın her oyuncusu ödülün yarısı |
| Giriş bedeli | ödemeler + %5 kasa payı, oyuncu sayısına bölünür (2.600 ödül → 811 Pt) |
| Oyundan çıkma | giriş bedeli iade edilmez + 500 Pt ceza, yerine bot oynar |

## Çevrim içi katman

`src/services/online.ts` içindeki `OnlineService` arayüzü masalar, cüzdan, lider tablosu ve
arkadaşlık için sunucunun karşılaması gerekenleri tanımlar. Şu an `LocalOnline` (demo) çalışır:
cüzdan ve arkadaşlar cihazda tutulur, diğer oyuncular simüle edilir. Gerçek çok oyunculu oyun
için puanların ve oyun durumunun sunucuda tutulduğu bir arka uç gerekir (öneri: Firebase
Auth + Firestore + Cloud Functions, ya da gerçek zamanlı oyun için Colyseus/Nakama). Oyun kuralları
(`src/engine`) saf TypeScript olduğundan sunucuda aynen kullanılabilir.

## İş modeli seçimi

`src/services/config.ts`:

| Ayar | Sonuç |
| --- | --- |
| `ADS_ENABLED: true` | Ücretsiz + reklamlı. Menüde banner, her 2 oyunda bir geçiş reklamı. Premium reklamları kaldırır. |
| `ADS_ENABLED: false` | Tamamen reklamsız uygulama. |

Oyun sırasında asla reklam gösterilmez; banner yalnızca menüde, geçiş reklamı yalnızca oyun bittiğinde.

## Geliştirme

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # kural motoru + 60 bot oyunu simülasyonu
npm run build
npm run build:web  # tek dosyalık tarayıcı demosu: dist-web/batak.html
```

Web sürümünde satın alma simüle edilir (Premium'a Geç → anında aktif). Ayarlar ekranındaki
geliştirici düğmesiyle sıfırlanır.

## Mağazaya çıkış

0. **Giriş (Firebase):** Firebase projesi aç, Authentication'da Google, Apple, Facebook ve
   Anonymous sağlayıcılarını etkinleştir. `GoogleService-Info.plist` (iOS) ve
   `google-services.json` (Android) dosyalarını ekle, Facebook App ID'yi Info.plist /
   strings.xml'e yaz, Xcode'da "Sign in with Apple" yeteneğini aç. Sonra
   `src/services/auth.ts` içinde `FIREBASE_CONFIGURED = true` yap. O zamana kadar giriş
   cihazda simüle edilir (demo modu).
1. `npx cap add ios` ve `npx cap add android`, ardından `npm run icons` (uygulama ikonu ve açılış
   ekranı `resources/` klasöründen tüm boyutlarda üretilir) ve `npm run cap:sync`
2. **App Store Connect / Google Play Console:** `batak_premium_monthly` ve `batak_premium_yearly`
   otomatik yenilenen abonelikleri oluştur.
3. **RevenueCat:** bu ürünleri `premium` entitlement'ına bağla, "current" offering'e ekle;
   API anahtarlarını `config.ts > REVENUECAT_KEYS` alanına yaz.
4. **AdMob:** uygulama + banner/geçiş birimleri oluştur, `config.ts > ADMOB` değerlerini değiştir,
   `testing: false` yap. iOS `Info.plist`'e `GADApplicationIdentifier`, Android
   `AndroidManifest.xml`'e AdMob App ID ekle. iOS için ATT izni ve AB için UMP onayı gerekir.
5. Gizlilik politikası ve kullanım koşulları bağlantılarını Premium ekranına ekle (Apple şartı).

## Yapı

```
src/engine/   kartlar, kurallar, oyun durumu, bot yapay zekâsı (saf TS, testli)
src/services/ premium (RevenueCat), ads (AdMob), config
src/ui/       React ekranları, bileşenler, stiller
```

## Puanlama

- **Gömmeli (3 kişi):** 16'şar kart, 4 kart yerde. İhale en az 7. İhaleyi alan önce kozu seçer,
  sonra elinden 4 kart gömer; gömdükten sonra yerdeki 4 kart eline gelir (ilk turda "YENİ"
  etiketiyle) ve oyuna o başlar. Gömülen kartlar sayılmaz; puanlama İhaleli ile aynı.
- **İhaleli:** İhaleci tutturursa aldığı el kadar +, tutturamazsa ihale kadar −. Diğerleri aldığı
  el kadar +; hiç el alamayan ihale kadar −.
- **Eşli:** Takım elleri toplanır; ihaleci takım tutturursa toplam el +, tutturamazsa ihale kadar −.
- **Koz Maça:** Herkes kendi sözüne göre: tutarsa aldığı el +, tutmazsa söz kadar −.

Kurallar `src/engine/game.ts > scoreRound` içinde, kolayca değiştirilebilir.
