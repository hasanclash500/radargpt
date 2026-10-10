# سئوی فنی دیوساز

دامنه اصلی (canonical): https://divsaz.ir

## مسیرهای اصلی

- https://divsaz.ir/
- https://divsaz.ir/listings
- https://divsaz.ir/blog
- https://divsaz.ir/about
- https://divsaz.ir/robots.txt
- https://divsaz.ir/sitemap.xml

## پیاده‌سازی

1. robots.txt: خزش صفحات عمومی مجاز است؛ مسیرهای احراز هویت، مدیریت، ذخیره‌ها و API عمومی نیستند.
2. XML sitemap: از مسیر api/sitemap.mjs و بازنویسی Vercel فراهم می‌شود. صفحات آگهی، مقاله، صفحات منتشرشده و مشاوران عمومی به صورت صفحه‌بندی‌شده از Convex دریافت می‌شوند.
3. URLهای خصوصی، منتشرنشده یا noIndex و URLهای با canonical متفاوت به نقشه سایت وارد نمی‌شوند.
4. برای صفحات فیلترشده canonical به فهرست آگهی‌ها برمی‌گردد و برای صفحات ناموجود دستور noindex وجود دارد.
5. X-Robots-Tag: noindex برای صفحات مدیریت، ورود، ذخیره‌ها و لندینگ‌های پیش‌نمایش تنظیم شده است.
6. تست خودکار sitemap: دستور npm run seo:test و تست‌های GitHub Actions.
7. بررسی پس از انتشار: دستور npm run seo:audit.
8. برای Bing و سایر سرویس‌های پشتیبان IndexNow، بعد از تأیید سایت از npm run seo:indexnow استفاده کنید.

## چک‌لیست انتشار

- در تنظیمات Environment Variables پروژه Vercel، یک CONVEX_URL یا VITE_CONVEX_URL معتبر برای محیط Production تعریف شده باشد. این نشانی عمومی Convex است و کلید محرمانه محسوب نمی‌شود.
- بدون URL دیتابیس یا هنگام خطای دریافت داده، sitemap به‌جای ارائه XML ناقص با HTTP 503 برمی‌گردد؛ خطا را با تنظیم محیط و مشاهده لاگ بررسی کنید.
- پس از انتشار، https://divsaz.ir/sitemap.xml باید HTTP 200 و Content-Type: application/xml داشته باشد.
- هرگونه www یا دامنه ثانویه را با ریدایرکت دائمی به https://divsaz.ir منتقل کنید.
- در https://search.google.com/search-console/ مالکیت Domain Property مربوط به divsaz.ir را از طریق DNS تأیید و سپس https://divsaz.ir/sitemap.xml را در بخش Sitemaps ثبت کنید.
- در https://www.bing.com/webmasters/ نیز دامنه و نقشه سایت را ثبت کنید.
- گزارش‌های Pages/Indexing، Sitemaps، Core Web Vitals و تست URLهای آگهی را بررسی کنید. ارسال نقشه سایت به معنی تضمین ایندکس یا رتبه نیست.

## محدودیت فعلی که باید در برنامه بعدی رفع شود

این سایت با React و Vite و به روش SPA ساخته شده است. متادیتای آگهی‌ها و مقالات هنگام اجرای JavaScript در مرورگر تولید می‌شود. برای نمایش پیش‌نمایش درست در شبکه‌های اجتماعی و خزنده‌هایی که JavaScript اجرا نمی‌کنند، پیش‌رندر HTML یا SSR ویژه URL هر آگهی/مقاله لازم است. robots.txt و sitemap.xml به‌تنهایی این مشکل را حل نمی‌کنند.

از انتشار آگهی‌های تکراری و بی‌کیفیت، تصویر بدون Alt Text و صفحات با توضیح تکراری پرهیز کنید.
