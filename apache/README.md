# Run Clothify With Apache

This project can run on Apache without virtual hosts.

## Files added for Apache

- `public-apache/index.php`: single Apache front controller
- `public-apache/.htaccess`: rewrites every request to the front controller
- `backend-php/public/.htaccess`: backend-only routing helper
- `backend-php/public/image.php`: serves uploaded images from `backend-php/storage/upload/images`

## Apache setup

1. Enable `mod_rewrite`.
2. Make sure Apache is connected to PHP.
3. Point Apache `DocumentRoot` to `C:/Users/asus/Downloads/Web-2/public-apache`.
4. Allow overrides for that folder:

```apache
<Directory "C:/Users/asus/Downloads/Web-2/public-apache">
    AllowOverride All
    Require all granted
</Directory>
```

5. Restart Apache.

## URLs

- Storefront: `http://localhost/`
- Admin: `http://localhost/admin`
- API base: `http://localhost/api`

## Notes

- Storefront is served from `frontend/build`.
- Admin is served from `admin/dist` under `/admin`.
- API requests go through `/api/...` and are forwarded to `backend-php/public/index.php`.
- Uploaded images are available through `/api/images/<filename>`.
