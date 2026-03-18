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
      item.style.setProperty('--hover-color', getAverageRGB(img));
    };

    item.onclick = () => openLightbox(index);
    item.appendChild(img);
    galleryGrid.appendChild(item);
  });
}

function getAverageRGB(imgEl) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = imgEl.naturalWidth || 100;
  const height = canvas.height = imgEl.naturalHeight || 100;

  ctx.drawImage(imgEl, 0, 0);

  let data;
  try {
      data = ctx.getImageData(0, 0, width, height).data;
  } catch(e) {
      return 'rgb(150, 150, 150)';
  }
  
  let r = 0, g = 0, b = 0, count = 0;
  for (let i = 0, l = data.length; i < l; i += 160) {
      r += data[i];
      g += data[i+1];
      b += data[i+2];
      count++;
  }

  if (count > 0) {
      r = Math.floor(r / count);
      g = Math.floor(g / count);
      b = Math.floor(b / count);
      // Blend toward white to create a pastel version
      const pastelStrength = 0.55;
      r = Math.round(r + (255 - r) * pastelStrength);
      g = Math.round(g + (255 - g) * pastelStrength);
      b = Math.round(b + (255 - b) * pastelStrength);
      return `rgb(${r}, ${g}, ${b})`;
  }
  return 'rgb(150, 150, 150)';
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

  lightboxThumb.src = `images/thumbnails/${filename}`;
  lightboxThumb.style.opacity = "1";

  const highResLoader = new Image();
  highResLoader.src = `images/${filename}`;

  highResLoader.onload = function() {
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
        EXIF.getData(highResLoader, function() {
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

lightbox.onclick = (e) => {
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