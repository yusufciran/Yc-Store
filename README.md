Yc Store 🛒 - Bilgisayar Bileşenleri E-Ticaret Sitesi

Yc Store, bilgisayar donanımları, çevre birimleri ve elektronik ürünlerin listelendiği, modern ve responsive (mobil uyumlu) bir e-ticaret arayüzü projesidir. Vanilla JavaScript kullanılarak Single Page Application (SPA) mantığında geliştirilmiştir.

🌟 Özellikler

Dinamik Ürün Listeleme: Ürünler harici bir JSON dosyasından çekilerek dinamik olarak listelenir.

Kategori Filtreleme: Yan menü, mobil menü ve footer üzerinden kategori bazlı filtreleme yapılabilir.

Akıllı Arama: Ürün adı, marka veya kategoriye göre anlık arama yapabilme.

Sıralama Seçenekleri: Fiyata göre (Artan/Azalan) ve İsme göre (A-Z/Z-A) sıralama.

Sepet Yönetimi:

Ürünleri sepete ekleme ve çıkarma.

Ürün adetlerini güncelleme.

Dinamik ara toplam ve kargo hesaplaması.

Sepet verilerinin localStorage üzerinde tutulması (Sayfa yenilense bile sepet silinmez).

Ürün Detay Sayfası: Ürün açıklamaları, fiyat bilgisi ve çoklu görsel galerisi.

Responsive Tasarım: Tailwind CSS ile tüm cihazlarda (Mobil, Tablet, Masaüstü) kusursuz görünüm.

SPA Mantığı: Sayfa yenilenmeden hızlı geçişler (Hash Routing).

🛠️ Kullanılan Teknolojiler

HTML5: Semantik yapı.

CSS3 & Tailwind CSS: Hızlı ve modern stillendirme (CDN üzerinden).

JavaScript (ES6+): Modüler yapı, asenkron veri çekme (Fetch API) ve DOM manipülasyonu.

JSON: Ürün veritabanı simülasyonu.

🚀 Kurulum ve Çalıştırma

Bu proje verileri yerel bir JSON dosyasından fetch API ile çektiği için, tarayıcıların CORS (Cross-Origin Resource Sharing) politikası gereği doğrudan dosya açarak (file:// protokolü ile) çalışmayabilir.

Projeyi sorunsuz görüntülemek için bir yerel sunucu (Local Server) kullanmalısınız. Aşağıdaki yöntemlerden birini seçebilirsiniz:

Yöntem 1: VS Code Live Server (Önerilen)

Projeyi Visual Studio Code ile açın.

"Live Server" eklentisini yükleyin.

index.html dosyasına sağ tıklayın ve "Open with Live Server" seçeneğine tıklayın.

Yöntem 2: Python ile

Bilgisayarınızda Python yüklü ise terminali proje klasöründe açıp şu komutu yazın:

python -m http.server


Ardından tarayıcınızda http://localhost:8000 adresine gidin.

Yöntem 3: Node.js ile (http-server)

Node.js yüklü ise:

npx http-server


📂 Proje Yapısı

Yc-Store/
│
├── index.html          # Ana HTML dosyası
├── style.css           # Özel CSS stilleri ve animasyonlar
├── script.js           # Tüm uygulama mantığı (Routing, Cart, Filter vb.)
├── fiyatlar.json       # Ürün verilerini içeren veri kaynağı
└── README.md           # Proje dokümantasyonu

📝 Geliştirme Notları

Kategori Algılama: script.js içerisindeki detectCategory fonksiyonu, ürün açıklamalarındaki anahtar kelimelere göre (RTX, Ryzen, RAM vb.) ürünleri otomatik kategorize eder.

Veri Kaynağı: Yeni ürün eklemek için fiyatlar.json dosyasını düzenlemeniz yeterlidir.

📞 İletişim

Geliştirici: Yusuf Ciran

Email: yusufciran16@gmail.com
