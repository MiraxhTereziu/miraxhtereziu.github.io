let imageFiles = [];
let currentIndex = 0;
const imageDimensions = {};

const galleryGrid = document.getElementById("galleryGrid");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxThumb = document.getElementById("lightboxThumb");
const imageWrapper = document.getElementById("imageWrapper");
const metadataDisplay = document.getElementById("metadataDisplay");

fetch("images.json")
  .then(res => res.json())
  .then(data => {
    imageFiles = data;
    shuffleArray(imageFiles);
    return Promise.all(imageFiles.map(file => {
      return new Promise(resolve => {
        const img = new Image();
        img.onload = () => {
          imageDimensions[file] = { width: img.naturalWidth, height: img.naturalHeight };
          resolve();
        };
        img.src = `images/thumbnails/${file}`;
      });
    }));
  })
  .then(() => initGallery());

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function initGallery() {
  imageFiles.forEach((file, index) => {
    const item = document.createElement("div");
    item.className = "gallery-item";
    const dims = imageDimensions[file] || { width: 3, height: 2 };
    item.style.paddingBottom = `${(dims.height / dims.width) * 100}%`;

    const img = document.createElement("img");
    img.crossOrigin = "Anonymous";
    img.src = `images/thumbnails/${file}`;
    img.onload = () => {
      img.classList.add("loaded");
      item.style.setProperty('--hover-color', getDominantColor(img));
    };

    item.onclick = () => openLightbox(index);
    item.appendChild(img);
    galleryGrid.appendChild(item);
  });
}

function getDominantColor(imgEl) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  // Sample at a small size for speed
  const SIZE = 80;
  canvas.width = SIZE;
  canvas.height = SIZE;
  ctx.drawImage(imgEl, 0, 0, SIZE, SIZE);

  let data;
  try {
    data = ctx.getImageData(0, 0, SIZE, SIZE).data;
  } catch (e) {
    return 'rgb(150, 150, 150)';
  }

  // Bucket hues (36 buckets = 10° each), weighted by saturation × lightness-friendliness
  const HUE_BUCKETS = 36;
  const buckets = new Float32Array(HUE_BUCKETS);
  const bucketR = new Float32Array(HUE_BUCKETS);
  const bucketG = new Float32Array(HUE_BUCKETS);
  const bucketB = new Float32Array(HUE_BUCKETS);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    const d = max - min;

    if (d < 0.12) continue; // skip near-greys / near-whites / near-blacks

    const s = d / (1 - Math.abs(2 * l - 1));
    let h = 0;
    if (max === r) h = ((g - b) / d + 6) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = h / 6; // 0–1

    const bucketIdx = Math.floor(h * HUE_BUCKETS) % HUE_BUCKETS;
    // Weight: prefer vivid colours (high saturation) at a mid lightness
    const weight = s * (1 - Math.abs(2 * l - 1));
    buckets[bucketIdx] += weight;
    bucketR[bucketIdx] += data[i] * weight;
    bucketG[bucketIdx] += data[i + 1] * weight;
    bucketB[bucketIdx] += data[i + 2] * weight;
  }

  // Find the winning bucket
  let bestIdx = 0, bestVal = -1;
  for (let i = 0; i < HUE_BUCKETS; i++) {
    if (buckets[i] > bestVal) { bestVal = buckets[i]; bestIdx = i; }
  }

  if (bestVal <= 0) return 'rgb(150, 150, 150)';

  const w = buckets[bestIdx];
  const fr = Math.round(bucketR[bestIdx] / w);
  const fg = Math.round(bucketG[bestIdx] / w);
  const fb = Math.round(bucketB[bestIdx] / w);

  // Boost saturation slightly so the border pops
  const max = Math.max(fr, fg, fb) / 255;
  const min = Math.min(fr, fg, fb) / 255;
  const boost = 1.25;
  const mid = (max + min) / 2 * 255;
  const br = Math.round(Math.min(255, Math.max(0, mid + (fr - mid) * boost)));
  const bg = Math.round(Math.min(255, Math.max(0, mid + (fg - mid) * boost)));
  const bb = Math.round(Math.min(255, Math.max(0, mid + (fb - mid) * boost)));

  return `rgb(${br}, ${bg}, ${bb})`;
}

function openLightbox(index) {
  currentIndex = index;
  lightbox.classList.add("active");
  document.body.style.overflow = "hidden";
  updateLightboxImage();
}

function updateLightboxImage() {
  const filename = imageFiles[currentIndex];

  const dims = imageDimensions[filename] || { width: 3, height: 2 };
  imageWrapper.style.setProperty('--aspect-ratio', dims.width / dims.height);

  lightboxImg.classList.remove("loaded");
  lightboxImg.src = "";
  metadataDisplay.innerText = "";

  lightboxThumb.src = "";
  lightboxThumb.style.opacity = "1";
  lightboxThumb.src = `images/thumbnails/${filename}`;

  const highResLoader = new Image();
  highResLoader.src = `images/${filename}`;

  highResLoader.onload = function () {
    if (highResLoader.src.includes(imageFiles[currentIndex])) {
      lightboxImg.src = highResLoader.src;

      // Request an animation frame to let the browser paint the new `src` at opacity 0,
      // and then apply the `loaded` class in the next frame so it transitions to opacity 1.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          lightboxImg.classList.add("loaded");
        });
      });

      if (window.EXIF) {
        EXIF.getData(highResLoader, function () {
          const model = EXIF.getTag(this, "Model");
          const fStop = EXIF.getTag(this, "FNumber");
          const iso = EXIF.getTag(this, "ISOSpeedRatings");
          const exp = EXIF.getTag(this, "ExposureTime");

          if (!model && !fStop && !iso && !exp) {
            metadataDisplay.innerText = "No metadata found";
            return;
          }

          const fStopStr = fStop ? `f/${fStop}` : "";
          const isoStr = iso ? `ISO ${iso}` : "";
          const shutterStr = exp ? (exp >= 1 ? `${exp}s` : `1/${Math.round(1 / exp)}s`) : "";

          const modelStr = model || "";
          const brand = modelStr.toLowerCase().includes("lumix") ? "" : "Lumix ";
          const finalModelStr = brand + modelStr;

          metadataDisplay.innerText = [finalModelStr, fStopStr, shutterStr, isoStr].filter(Boolean).join(" • ");
        });
      } else {
        metadataDisplay.innerText = "No metadata found";
      }
      // Wait for the .4s opacity transition defined in CSS to finish
      // before completely hiding the thumbnail so a clean cross-fade happens.
      setTimeout(() => {
        lightboxThumb.style.opacity = "0";
      }, 450);
    }
  };
}

function closeLightbox() {
  lightbox.classList.remove("active");
  document.body.style.overflow = "auto";
  lightboxImg.src = "";
}

lightbox.onclick = () => {
  closeLightbox();
};

imageWrapper.onclick = (e) => {
  e.stopPropagation();
  window.open(`images/${imageFiles[currentIndex]}`, '_blank');
};

metadataDisplay.onclick = (e) => {
  e.stopPropagation();
};

document.addEventListener("keydown", (e) => {
  if (!lightbox.classList.contains("active")) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowRight") { currentIndex = (currentIndex + 1) % imageFiles.length; updateLightboxImage(); }
  if (e.key === "ArrowLeft") { currentIndex = (currentIndex - 1 + imageFiles.length) % imageFiles.length; updateLightboxImage(); }
});

// Initialize Smooth Scrolling (Lenis)
const lenis = new Lenis({
  lerp: 0.1, // Adjust the smoothness (lower = smoother)
  smoothWheel: true,
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}

requestAnimationFrame(raf);