RESIDENT — статичний сайт, готовий до деплою

СТОРІНКИ
index.html     — головна
catalog.html   — каталог: продаж
rent.html      — каталог: оренда
object.html    — сторінка об'єкта (object.html#obj=213-436-621)
team.html      — команда
about.html     — про нас
careers.html   — вакансії
privacy.html   — політика конфіденційності

ПАПКИ І ФАЙЛИ
assets/        — фото (WebP), кадри анімації першого екрана (assets/hero-film), логотип і скрипти (dc-lite.js рендерить сторінки, idiomorph.min.js — бібліотека оновлення)
favicon.*, apple-touch-icon.png, site.webmanifest — іконки сайту
robots.txt, sitemap.xml — для пошукових систем
_headers       — правила кешування для Netlify (assets кешуються на рік)

ЯК ЗАДЕПЛОЇТИ
Netlify: app.netlify.com → Add new site → Deploy manually → перетягнути всю папку resident-site.
Vercel: vercel.com → Add New → Project → завантажити папку (Framework: Other, без збірки).
GitHub Pages: залити вміст папки в репозиторій → Settings → Pages → гілка main, папка / (root).
Звичайний хостинг: залити вміст папки в public_html (або www) через FTP чи файловий менеджер.
Важливо: index.html має лежати в корені сайту, поруч із папкою assets.

ПІСЛЯ ДЕПЛОЮ
1. Якщо домен не resident.dp.ua — замінити його в усіх *.html (canonical, og:url, og:image), у robots.txt і sitemap.xml.
2. Залити картинки превью 1200×630 у папку og/ (імена вказані в og:image кожної сторінки).
3. Вставити код GA4 і Meta Pixel на місця з коментарями <!-- GA4 --> та <!-- Meta Pixel -->.
4. Підключити відправку форм (пошта / Telegram-бот / CRM) — зараз форми лише показують «Дякуємо!».
5. Перевірити pagespeed.web.dev і превью посилань на opengraph.xyz.

Сайт працює тільки через http(s) — відкривати index.html подвійним кліком з диска не варто.
