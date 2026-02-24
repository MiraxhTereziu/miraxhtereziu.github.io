let imageFiles = [];
let currentIndex = 0;

const galleryGrid = document.getElementById("galleryGrid");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const metadataDisplay = document.getElementById("metadataDisplay");

// Store image dimensions for aspect ratio
const imageDimensions = {};

fetch("images.json")
  .then((res) => res.json())
  .then((data) => {
    imageFiles = data;
    shuffleArray(imageFiles);
    // Load image dimensions first
    loadImageDimensions().then(() => {
      initGallery();
    });
  });

function loadImageDimensions() {
  // Pre-load dimensions from thumbnails or create a manifest
  // For now, we'll use a common ratio or load it dynamically
  return Promise.all(
    imageFiles.map((file) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          imageDimensions[file] = {
            width: img.naturalWidth,
            height: img.naturalHeight,
          };
          resolve();
        };
        img.onerror = () => {
          // Fallback aspect ratio if image fails to load
          imageDimensions[file] = { width: 3, height: 2 };
          resolve();
        };
        img.src = `images/thumbnails/${file}`;
      });
    })
  );
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function initGallery() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute("data-src");
          }
        }
      });
    },
    { rootMargin: "800px" }
  );

  imageFiles.forEach((file, index) => {
    const item = document.createElement("div");
    item.className = "gallery-item";

    // Calculate aspect ratio for this image
    const dimensions = imageDimensions[file] || { width: 3, height: 2 };
    const aspectRatio = (dimensions.height / dimensions.width) * 100;
    item.style.paddingBottom = `${aspectRatio}%`;

    const img = document.createElement("img");
    img.dataset.src = `images/thumbnails/${file}`;
    img.alt = file;

    img.onload = () => {
      img.classList.add("loaded");
      item.classList.add("loaded-container");
    };

    item.appendChild(img);
    galleryGrid.appendChild(item);
    observer.observe(img);

    item.onclick = () => openLightbox(index);
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
  lightboxImg.style.opacity = "0";
  lightboxImg.classList.remove("animate-in");
  metadataDisplay.innerText = "";
  lightboxImg.src = `images/${filename}`;

  lightboxImg.onload = function () {
    lightboxImg.classList.add("animate-in");
    if (window.EXIF) {
      EXIF.getData(this, function () {
        const model = EXIF.getTag(this, "Model") || "";
        const fStop = EXIF.getTag(this, "FNumber") ? `f/${EXIF.getTag(this, "FNumber")}` : "";
        const iso = EXIF.getTag(this, "ISOSpeedRatings") ? `ISO ${EXIF.getTag(this, "ISOSpeedRatings")}` : "";
        const exp = EXIF.getTag(this, "ExposureTime");
        let shutter = exp ? (exp >= 1 ? `${exp}s` : `1/${Math.round(1 / exp)}s`) : "";
        metadataDisplay.innerText = model ? `${model} • ${fStop} • ${shutter} • ${iso}` : "";
      });
    }
  };
}

function closeLightbox() {
  lightbox.classList.remove("active");
  document.body.style.overflow = "auto";
}

// Click the background (the lightbox div) to close it
lightbox.onclick = (e) => {
  if (e.target === lightbox) closeLightbox();
};

// Click the image inside the lightbox to open high-res in new tab
lightboxImg.onclick = (e) => {
  e.stopPropagation();
  const filename = imageFiles[currentIndex];
  window.open(`images/${filename}`, '_blank');
};

// Key listeners for better UX
document.addEventListener("keydown", (e) => {
  if (!lightbox.classList.contains("active")) return;
  if (e.key === "Escape") closeLightbox();
});