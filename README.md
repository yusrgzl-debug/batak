# Batak

Reklamsız ya da reklamlı + Premium üyelikli oynanabilen, sıfırdan yazılmış Batak oyunu.
Tek kod tabanı: web (geliştirme/test) + iOS + Android (Capacitor).

## Özellikler

- **3 mod:** İhaleli Batak, Eşli Batak, Koz Maça
- 5 / 11 / 21 el seçenekleri, 3 bilgisayar rakip (kurallara tam uyan yapay zekâ)
- Tam Batak kuralları: renk takibi, yükseltme zorunluluğu, koz zorunluluğu, koz açılmadan kozla başlanmaz
- Elle çizilmiş (CSS/SVG) kartlar, çuha masa, kart uçma animasyonları, ses efektleri
- Puan tablosu, el sonu özeti, istatistikler, ayarlar (isim, ses, oyun hızı)
- **Para kazanma:** AdMob reklamları + RevenueCat ile aylık/yıllık Premium (reklamları kaldırır)

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
```

Web sürümünde satın alma simüle edilir (Premium'a Geç → anında aktif). Ayarlar ekranındaki
geliştirici düğmesiyle sıfırlanır.

## Mağazaya çıkış

1. `npx cap add ios` ve `npx cap add android`, ardından `npm run cap:sync`
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

- **İhaleli:** İhaleci tutturursa aldığı el kadar +, tutturamazsa ihale kadar −. Diğerleri aldığı
  el kadar +; hiç el alamayan ihale kadar −.
- **Eşli:** Takım elleri toplanır; ihaleci takım tutturursa toplam el +, tutturamazsa ihale kadar −.
- **Koz Maça:** Herkes kendi sözüne göre: tutarsa aldığı el +, tutmazsa söz kadar −.

Kurallar `src/engine/game.ts > scoreRound` içinde, kolayca değiştirilebilir.
