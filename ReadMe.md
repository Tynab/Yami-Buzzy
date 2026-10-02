# WEDDING INVITATION WEBSITE

## Overview

The wedding website of **An Yami & Thu Buzzy**: the invitation for the two ceremonies (Phú Yên, 27.02.2025 and Bến Tre, 16.03.2025), and now a keepsake of the day with our story, photos and videos.

It is a single static page (`index.html`) served by nginx in Docker. Photos, videos and the song are hosted on S3 (`s3.ap-southeast-1.amazonaws.com/tynab.wedding`).

---

## Sections

1. **Welcome gate**: *Start* (with music) or *Enter without music*. It is shown once per browser tab.
2. **Hero**: names, date and venue, with call / gift / map links.
3. **About us**: the bride and the groom.
4. **"Together for" counter and invitation cards**: days, hours, minutes and seconds since the wedding (16.03.2025 10:00), then one card per ceremony with address, date, lunar date and map.
5. **Dress code / schedule** for the day.
6. **Our Love Story**: timeline from 2020 to 2024.
7. **Album Pre-Wedding**: coverflow slider with a lightbox.
8. **Our Moments**: proposal and flycam videos.
9. **Gift**: bank transfer QR in a lightbox.
10. **Wedding Gallery**: second coverflow slider with its own lightbox.
11. **Wedding Invitation**: invitation video and card.
12. **Thank you**.
13. **Background music** (`ido.mp3`) with a floating on/off button. It pauses while a video plays and stays off once a guest turns it off.

---

## Project layout

```
index.html                  the page (markup + a small inline script)
wp-content/
  themes/css, assets/       site styles (UIkit, theme, wedding, style.css)
  themes/js/                UIkit, AOS and main-wedding8a54.js (sliders, lightbox, animations)
  themes/font/              SVN-Gilroy
  pic/                      favicon and dress-code icons
  vendor/                   pinned copies of Swiper, Fancybox, lazysizes, Remix Icon (see VERSIONS.md)
nginx.conf                  gzip, cache headers, no dotfiles
Dockerfile, .dockerignore   image with only the site files
Jenkinsfile                 build, smoke test, push, deploy, Telegram notifications
tools/                      qr_code.py (QR for the printed cards), cwebp-jpg.bat (bulk JPG -> full-size WebP)
```

## Technologies

- **UIkit**: grid, countdown, scrollspy.
- **Swiper**: coverflow albums.
- **Fancybox**: lightbox for the albums and the gift QR.
- **AOS**: scroll animations (once, and off for visitors who prefer reduced motion).
- **lazysizes**: lazy loading of images, backgrounds and video posters.
- **Remix Icon**: icons.

---

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Or the same way it runs in production:

```bash
docker build -t wedding .
docker run --rm -p 8080:80 wedding
# open http://localhost:8080
```

## Deploy

Pushing to `develop` triggers the Jenkins job:

1. **Build**: fails if any site file is still a Git LFS pointer, then builds `yamiannephilim/wedding:<commit>` and `:latest`.
2. **Test**: starts the new image and checks that the page and `main-wedding8a54.js` are served and `/.git` is not.
3. **Push**: pushes both tags to Docker Hub.
4. **Clean / Run**: replaces the `wedding` container on the `yan` network with the new commit's image.

Every step is reported to Telegram.

### Roll back

Deploys are tagged with their short commit hash (from the first build of this pipeline on). Make sure the tag exists before removing the running container:

```bash
docker image inspect yamiannephilim/wedding:<previous-commit> >/dev/null || docker pull yamiannephilim/wedding:<previous-commit>
docker rm -f wedding
docker run -d --name wedding --network yan --restart=unless-stopped yamiannephilim/wedding:<previous-commit>
```

Builds from the old pipeline only ever had `:latest`, so they have no commit tag. To go back to one of those, revert the commits and push; the pipeline rebuilds that version and tags it.

The printed QR code (`tools/qr_code.py`) points to `https://www.yamiannephilim.com/wedding-card`. That route has to keep reaching this container.

---

## Photos, videos and music (S3)

Naming: `image/NNNN.webp` is the full photo opened in the lightbox, `image/NNNN_1.webp` its thumbnail, `video/*.mp4`, `audio/ido.mp3`.

> **Before any upload**, check how the bucket makes files public: `aws s3api get-bucket-ownership-controls --bucket tynab.wedding`. If ACLs are disabled (`BucketOwnerEnforced`), the commands below work as written. Otherwise, check `aws s3api get-object-acl --bucket tynab.wedding --key image/9115.webp`. If it grants `READ` to `AllUsers`, add `--acl public-read` to **every** `aws s3 cp` below (new files, same-name overwrites and in-place copies). Without it, the uploaded file returns 403 to guests.

### Add a photo to an album

1. Export two WebP files with `cwebp`:

   ```bash
   cwebp -q 80 -resize 2048 0 NNNN.jpg -o NNNN.webp      # lightbox, 2048 px wide is plenty
   cwebp -q 75 -resize 640 0 NNNN.jpg -o NNNN_1.webp     # thumbnail
   ```

2. Upload both with a cache header:

   ```bash
   aws s3 cp NNNN.webp   s3://tynab.wedding/image/ --content-type image/webp --cache-control "public, max-age=2592000"
   aws s3 cp NNNN_1.webp s3://tynab.wedding/image/ --content-type image/webp --cache-control "public, max-age=2592000"
   ```

3. Copy one `swiper-slide` block in `index.html` (in `#album` or `#wedding-gallery`), change the two URLs and the number in its `aria-label`.
4. Add the thumbnail URL to the `resources` preload list at the end of `index.html`. Do not add the full-size photo; Fancybox loads it on demand.

### Make the existing media lighter (one-off, recommended)

- **Big images.** The hero (`9115.webp`, 2.5 MB) and the two backgrounds (`8430.webp`, `9433.webp`) are full-resolution exports. Re-export them about 1600 px wide at quality 75-80 and upload under the **same name**. The first screen loads about 2 MB faster, and `index.html` does not change.
- **Videos.** Move the MP4 index to the front so playback starts sooner. This is lossless:

   ```bash
   ffmpeg -i flycam.mp4 -c copy -movflags +faststart flycam-fast.mp4
   aws s3 cp flycam-fast.mp4 s3://tynab.wedding/video/flycam.mp4 --content-type video/mp4 --cache-control "public, max-age=2592000"
   ```

   Do the same for `propose.mp4` and `card.mp4`. `flycam.mp4` (1080p, about 110 MB) can also be re-encoded to 720p (`-vf scale=-2:720 -c:v libx264 -crf 26 -c:a copy`) to cut it to roughly a quarter.
- **Cache headers on what is already uploaded.** Objects on S3 have no `Cache-Control`, so caching is left to browser heuristics, which are short for newly uploaded or overwritten files. Set it on everything you upload (as above) and, optionally, on what is already there. A file re-uploaded under the same name can then stay stale in browsers for up to `max-age` (30 days here):

   ```bash
   aws s3 cp s3://tynab.wedding/image/ s3://tynab.wedding/image/ --recursive \
     --metadata-directive REPLACE --content-type image/webp --cache-control "public, max-age=2592000"
   ```

   Run it again per folder with `video/` + `video/mp4` and `audio/` + `audio/mpeg`.

### Keep it safe

- Turn on versioning, so an overwrite or delete can be undone:
  `aws s3api put-bucket-versioning --bucket tynab.wedding --versioning-configuration Status=Enabled`
- Keep an offline copy: `aws s3 sync s3://tynab.wedding ./tynab.wedding-backup`
- Renew the `yamiannephilim.com` domain in time, or the printed QR codes stop working.

---

## Credits

- **Icons**: Remix Icon.
- **Libraries**: Swiper, Fancybox, lazysizes and Remix Icon are pinned copies; their versions and licenses are in `wp-content/vendor/VERSIONS.md`. UIkit and AOS (both MIT) ship with the theme in `wp-content/themes/`.
- **Inspiration**: special thanks to the creativity of **[nguyenminhdat](https://github.com/nguyenminhdat)**.
