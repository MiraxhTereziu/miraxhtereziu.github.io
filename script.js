let imageFiles = [];
let currentIndex = 0;
const imageDimensions = {};

const galleryGrid = document.getElementById("galleryGrid");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxThumb = document.getElementById("lightboxThumb");
const metadataDisplay = document.getElementById("metadataDisplay");

// 1. Fetch images and load dimensions
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
        img.onerror = () => {
          imageDimensions[file] = { width: 3, height: 2 };
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
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute("data-src");
        }
      }
    });
  }, { rootMargin: "800px" });

  imageFiles.forEach((file, index) => {
    const item = document.createElement("div");
    item.className = "gallery-item";
    
    const dims = imageDimensions[file] || { width: 3, height: 2 };
    item.style.paddingBottom = `${(dims.height / dims.width) * 100}%`;

    const img = document.createElement("img");
    img.dataset.src = `images/thumbnails/${file}`;
    img.onload = () => {
      img.classList.add("loaded");
      item.classList.add("loaded-container");
    };

    item.onclick = () => openLightbox(index);
    item.appendChild(img);
    galleryGrid.appendChild(item);
    observer.observe(img);
  });
}

function openLightbox(index) {
  currentIndex = index;
  lightbox.classList.add("active");
  document.body.style.overflow = "hidden";
  updateLightboxImage();
}

function updateLightboxImage() {
  const filename = imageFiles[currentIndex];
  
  // Reset High-res
  lightboxImg.classList.remove("loaded");
  metadataDisplay.innerText = "Loading...";

  // Set Thumbnail immediately (cached)
  lightboxThumb.src = `images/thumbnails/${filename}`;
  lightboxThumb.style.opacity = "1";

  // Load High-res in background
  const highResLoader = new Image();
  highResLoader.src = `images/${filename}`;

  highResLoader.onload = function() {
    lightboxImg.src = highResLoader.src;
    lightboxImg.classList.add("loaded");
    
    // EXIF Extraction
    if (window.EXIF) {
      EXIF.getData(highResLoader, function() {
        const model = EXIF.getTag(this, "Model") || "";
        const fStop = EXIF.getTag(this, "FNumber") ? `f/${EXIF.getTag(this, "FNumber")}` : "";
        const iso = EXIF.getTag(this, "ISOSpeedRatings") ? `ISO ${EXIF.getTag(this, "ISOSpeedRatings")}` : "";
        const exp = EXIF.getTag(this, "ExposureTime");
        let shutter = exp ? (exp >= 1 ? `${exp}s` : `1/${Math.round(1 / exp)}s`) : "";
        metadataDisplay.innerText = [model, fStop, shutter, iso].filter(Boolean).join(" • ");
      });
    }

    setTimeout(() => { lightboxThumb.style.opacity = "0"; }, 500);
  };
}

function closeLightbox() {
  lightbox.classList.remove("active");
  document.body.style.overflow = "auto";
}

lightbox.onclick = (e) => { if (e.target === lightbox) closeLightbox(); };

document.addEventListener("keydown", (e) => {
  if (!lightbox.classList.contains("active")) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowRight") { currentIndex = (currentIndex + 1) % imageFiles.length; updateLightboxImage(); }
  if (e.key === "ArrowLeft") { currentIndex = (currentIndex - 1 + imageFiles.length) % imageFiles.length; updateLightboxImage(); }
});