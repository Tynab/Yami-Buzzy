# Vendored libraries

Pinned copies of the libraries the page used to load from cdnjs/jsdelivr, so the site keeps working when a CDN is blocked, down or changes a floating version tag. Files are unmodified copies from the npm packages listed below (checked against the registry integrity hash).

| Folder | npm package | License |
| --- | --- | --- |
| `fancybox-5.0.36` | `@fancyapps/ui@5.0.36` (`dist/fancybox/`) | see `LICENSE.md` |
| `lazysizes-5.3.2` | `lazysizes@5.3.2` | MIT |
| `remixicon-4.0.0` | `remixicon@4.0.0` (`fonts/`, woff2 + woff only) | Apache-2.0 |
| `swiper-11.2.10` | `swiper@11.2.10` | MIT |

SHA-256:

```
862504070144a4b17a0e507cb065e52a8e243d9e3a522e2a1a9774beb5643a6e  fancybox-5.0.36/fancybox.umd.js
3d9120fa621da6d613c1698b7014ec6bdf4620366e8f2b7b547059f4b6f6272b  lazysizes-5.3.2/lazysizes.min.js
985f1224c0eeec99d367a9db35e58e44b21e7eb9ce45831b15b4c108e41fd97f  swiper-11.2.10/swiper-bundle.min.js
cccf165ed1b87949fb74a28d313ba8599b9bfbe56749f68ea40ffc3c97ef4c1a  fancybox-5.0.36/fancybox.css
f53b0f6c14c09b5c263713876dfe7185531a3a424a91d192dfee3c5fa03493dd  remixicon-4.0.0/remixicon.css
74ca6aae5468dbc924790c3b4d219a089b90a34bad53a0f7ca3a73e73b6f5ab8  swiper-11.2.10/swiper-bundle.min.css
75d262529ddfa2bc85701acbc59e3c1eb452db52bb9c8902ced0438ff60f2e1c  remixicon-4.0.0/remixicon.woff2
a27a526660a848cec3e83458e2bd0b8fc3b3795b01bf2f7e805990231b078255  remixicon-4.0.0/remixicon.woff
```

To upgrade: `npm pack <package>@<version>`, copy the same files into a new `<name>-<version>/` folder, update the paths in `index.html` and this file, then delete the old folder.
