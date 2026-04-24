let imageFiles = [];
let currentIndex = 0;
const imageDimensions = {};

const galleryGrid = document.getElementById("galleryGrid");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxThumb = document.getElementById("lightboxThumb");
const imageWrapper = document.getElementById("imageWrapper");
const metadataDisplay = document.getElementById("metadataDisplay"); // legacy fallback
const infoPopup = document.getElementById("infoPopup");
const downloadBtn = document.getElementById("downloadBtn");

const iconClickPaths = `<path d="M216,116v36a80,80,0,0,1-80,80c-44.18,0-55.81-24-93.32-90a20,20,0,0,1,34.64-20L96,152V44a20,20,0,0,1,40,0v56a20,20,0,0,1,40,0v16a20,20,0,0,1,40,0Z" opacity="0.2"/><path d="M196,88a27.86,27.86,0,0,0-13.35,3.39A28,28,0,0,0,144,74.7V44a28,28,0,0,0-56,0v80l-3.82-6.13A28,28,0,0,0,35.73,146l4.67,8.23C74.81,214.89,89.05,240,136,240a88.1,88.1,0,0,0,88-88V116A28,28,0,0,0,196,88Zm12,64a72.08,72.08,0,0,1-72,72c-37.63,0-47.84-18-81.68-77.68l-4.69-8.27,0-.05A12,12,0,0,1,54,121.61a11.88,11.88,0,0,1,6-1.6,12,12,0,0,1,10.41,6,1.76,1.76,0,0,0,.14.23l18.67,30A8,8,0,0,0,104,152V44a12,12,0,0,1,24,0v68a8,8,0,0,0,16,0V100a12,12,0,0,1,24,0v20a8,8,0,0,0,16,0v-4a12,12,0,0,1,24,0Z"/>`;
const iconClosePaths = `<path d="M216,56V200a16,16,0,0,1-16,16H56a16,16,0,0,1-16-16V56A16,16,0,0,1,56,40H200A16,16,0,0,1,216,56Z" opacity="0.2"/><path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"/>`;
const iconZoomPaths = `<path d="M208,48V208H48V48Z" opacity="0.2"/><path d="M216,48V96a8,8,0,0,1-16,0V67.31l-42.34,42.35a8,8,0,0,1-11.32-11.32L188.69,56H160a8,8,0,0,1,0-16h48A8,8,0,0,1,216,48ZM98.34,146.34,56,188.69V160a8,8,0,0,0-16,0v48a8,8,0,0,0,8,8H96a8,8,0,0,0,0-16H67.31l42.35-42.34a8,8,0,0,0-11.32-11.32ZM208,152a8,8,0,0,0-8,8v28.69l-42.34-42.35a8,8,0,0,0-11.32,11.32L188.69,200H160a8,8,0,0,0,0,16h48a8,8,0,0,0,8-8V160A8,8,0,0,0,208,152ZM67.31,56H96a8,8,0,0,0,0-16H48a8,8,0,0,0-8,8V96a8,8,0,0,0,16,0V67.31l42.34,42.35a8,8,0,0,0,11.32-11.32Z"/>`;
const iconEnvelopePaths = `<path d="M224,56l-96,88L32,56Z" opacity="0.2"/><path d="M224,48H32a8,8,0,0,0-8,8V192a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A8,8,0,0,0,224,48Zm-96,85.15L52.57,64H203.43ZM98.71,128,40,181.81V74.19Zm11.84,10.85,12,11.05a8,8,0,0,0,10.82,0l12-11.05,58,53.15H52.57ZM157.29,128,216,74.18V181.82Z"/>`;
const iconCopyPaths = `<path d="M216,40V168H168V88H88V40Z" opacity="0.2"/><path d="M216,32H88a8,8,0,0,0-8,8V80H40a8,8,0,0,0-8,8V216a8,8,0,0,0,8,8H168a8,8,0,0,0,8-8V176h40a8,8,0,0,0,8-8V40A8,8,0,0,0,216,32ZM160,208H48V96H160Zm48-48H176V88a8,8,0,0,0-8-8H96V48H208Z"/>`;

const getSvg = (id, paths) => `<svg id="${id}" class="cursor-icon" xmlns='http://www.w3.org/2000/svg' viewBox="0 0 256 256">${paths}</svg>`;

const customCursor = document.createElement('div');
customCursor.id = 'custom-cursor';
customCursor.innerHTML = `<div class="cursor-circle">${getSvg('icon-click', iconClickPaths)}${getSvg('icon-close', iconClosePaths)}${getSvg('icon-zoom', iconZoomPaths)}${getSvg('icon-envelope', iconEnvelopePaths)}${getSvg('icon-copy', iconCopyPaths)}</div>`;
document.body.appendChild(customCursor);

document.addEventListener('mousemove', (e) => {
  customCursor.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;

  if (lightbox.classList.contains('active')) {
    if (e.target.nodeType === 1) { // ensure it is an Element before calling closest
      if (e.target.closest('.lightbox-actions')) {
        customCursor.className = '';
      } else if (e.target.closest('#imageWrapper')) {
        customCursor.className = 'active state-zoom';
      } else {
        customCursor.className = 'active state-close';
      }
    }
  }
});

const copyElements = [
  document.querySelector('.sidebar-logo'),
  document.querySelector('.sidebar-top h1'),
  document.querySelector('.tagline')
];

copyElements.forEach(el => {
  if (!el) return;
  el.style.cursor = 'none';

  let copyTimeout;

  el.addEventListener('mouseenter', () => {
    customCursor.querySelector('.cursor-circle').style.backgroundColor = 'black';
    customCursor.className = 'active state-envelope';
  });

  el.addEventListener('mouseleave', () => {
    if (!lightbox.classList.contains('active')) {
      customCursor.className = '';
    }
  });

  el.addEventListener('click', () => {
    navigator.clipboard.writeText("miraxh.tereziu@gmail.com").then(() => {
      customCursor.className = 'active state-copy';
      clearTimeout(copyTimeout);
      copyTimeout = setTimeout(() => {
        if (customCursor.classList.contains('state-copy')) {
          customCursor.className = 'active state-envelope';
        }
      }, 1000);
    });
  });
});

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
      const color = getDominantColor(img);
      item.style.setProperty('--hover-color', color);
    };

    item.addEventListener('mouseenter', () => {
      const color = item.style.getPropertyValue('--hover-color');
      customCursor.querySelector('.cursor-circle').style.backgroundColor = color;
      customCursor.className = 'active state-click';
    });

    item.addEventListener('mouseleave', () => {
      if (!lightbox.classList.contains('active')) {
        customCursor.className = '';
      }
    });

    item.onclick = () => openLightbox(index);
    item.appendChild(img);
    galleryGrid.appendChild(item);
  });
}

function getDominantColor(imgEl) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  // Sample at a smaller size for high speed
  const SIZE = 40;
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

function setLightboxCursor(color) {
  const c = color || 'rgb(40,40,40)';
  lightbox.dataset.hoverColor = c;
  customCursor.querySelector('.cursor-circle').style.backgroundColor = c;
}

function openLightbox(index) {
  currentIndex = index;
  const items = document.querySelectorAll('.gallery-item');
  const color = items[index]
    ? getComputedStyle(items[index]).getPropertyValue('--hover-color').trim()
    : '';
  setLightboxCursor(color);
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
  if (metadataDisplay) metadataDisplay.innerText = "";
  if (infoPopup) {
    infoPopup.innerText = "";
    infoPopup.classList.remove("has-content");
  }
  if (downloadBtn) {
    const c = lightbox.dataset.hoverColor || 'rgb(40,40,40)';
    downloadBtn.style.backgroundColor = c;
    downloadBtn.href = `images/${filename}`;
  }

  lightboxThumb.src = "";
  lightboxThumb.style.opacity = "1";
  lightboxThumb.src = `images/thumbnails/${filename}`;

  const highResLoader = new Image();
  highResLoader.src = `images/${filename}`;

  highResLoader.decode().then(() => {
    if (highResLoader.src.includes(imageFiles[currentIndex])) {
      lightboxImg.src = highResLoader.src;

      // Request an animation frame to let the browser paint the new `src` at opacity 0,
      // and then apply the `loaded` class in the next frame so it transitions to opacity 1.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          lightboxImg.classList.add("loaded");
        });
      });

      const resolutionStr = `${highResLoader.naturalWidth} x ${highResLoader.naturalHeight}`;

      if (window.EXIF) {
        // Process EXIF loosely in the background to avoid blocking the slide animation
        setTimeout(() => {
          if (!highResLoader.src.includes(imageFiles[currentIndex])) return;
          EXIF.getData(highResLoader, function () {
            const model = EXIF.getTag(this, "Model");
            const fStop = EXIF.getTag(this, "FNumber");
            const iso = EXIF.getTag(this, "ISOSpeedRatings");
            const exp = EXIF.getTag(this, "ExposureTime");

            if (!model && !fStop && !iso && !exp) {
              if (infoPopup) {
                infoPopup.innerText = resolutionStr;
                infoPopup.classList.add("has-content");
              }
              return;
            }

            const fStopStr = fStop ? `f/${fStop}` : "";
            const isoStr = iso ? `ISO ${iso}` : "";
            const shutterStr = exp ? (exp >= 1 ? `${exp}s` : `1/${Math.round(1 / exp)}s`) : "";

            const modelStr = model || "";
            const brand = modelStr.toLowerCase().includes("lumix") ? "" : "Lumix ";
            const finalModelStr = modelStr ? brand + modelStr : "";

            if (infoPopup) {
              infoPopup.innerText = [finalModelStr, resolutionStr, fStopStr, shutterStr, isoStr].filter(Boolean).join(" • ");
              infoPopup.classList.add("has-content");
            }
          });
        }, 10);
      } else {
        if (infoPopup) {
          infoPopup.innerText = resolutionStr;
          infoPopup.classList.add("has-content");
        }
      }
      // Wait for the .4s opacity transition defined in CSS to finish
      // before completely hiding the thumbnail so a clean cross-fade happens.
      setTimeout(() => {
        lightboxThumb.style.opacity = "0";
      }, 450);
    }
  }).catch(() => {
    // Fallback if decode fails or is interrupted
    lightboxImg.src = highResLoader.src;
    lightboxImg.classList.add("loaded");
  });
}

function closeLightbox() {
  lightbox.classList.remove("active");
  customCursor.className = '';
  document.body.style.overflow = "auto";
  lightboxImg.src = "";
}

lightbox.onclick = (e) => {
  if (e.target.closest('.lightbox-actions')) return;
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
  if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
    if (e.key === "ArrowRight") currentIndex = (currentIndex + 1) % imageFiles.length;
    else currentIndex = (currentIndex - 1 + imageFiles.length) % imageFiles.length;
    const items = document.querySelectorAll('.gallery-item');
    const color = items[currentIndex]
      ? getComputedStyle(items[currentIndex]).getPropertyValue('--hover-color').trim()
      : '';
    setLightboxCursor(color);
    updateLightboxImage();
  }
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