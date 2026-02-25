let imageFiles = [];
let currentIndex = 0;
const imageDimensions = {};

const galleryGrid = document.getElementById("galleryGrid");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxThumb = document.getElementById("lightboxThumb");
const imageWrapper = document.getElementById("imageWrapper");
const metadataDisplay = document.getElementById("metadataDisplay");

// Load data
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
    img.src = `images/thumbnails/${file}`;
    img.onload = () => {
      img.classList.add("loaded");
      item.classList.add("loaded-container");
    };

    item.onclick = () => openLightbox(index);
    item.appendChild(img);
    galleryGrid.appendChild(item);
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
  
  // FIX: Immediately clear the old high-res source to prevent ghosting
  lightboxImg.classList.remove("loaded");
  lightboxImg.src = ""; 
  metadataDisplay.innerText = ""; // Remove loading message

  // Show thumbnail
  lightboxThumb.src = `images/thumbnails/${filename}`;
  lightboxThumb.style.opacity = "1";

  const highResLoader = new Image();
  highResLoader.src = `images/${filename}`;

  highResLoader.onload = function() {
    // Only update if the user hasn't switched images while this was loading
    if (highResLoader.src.includes(imageFiles[currentIndex])) {
      lightboxImg.src = highResLoader.src;
      lightboxImg.classList.add("loaded");
      
      if (window.EXIF) {
        EXIF.getData(highResLoader, function() {
          const model = EXIF.getTag(this, "Model") || "";
          const fStop = EXIF.getTag(this, "FNumber") ? `f/${EXIF.getTag(this, "FNumber")}` : "";
          const iso = EXIF.getTag(this, "ISOSpeedRatings") ? `ISO ${EXIF.getTag(this, "ISOSpeedRatings")}` : "";
          const exp = EXIF.getTag(this, "ExposureTime");
          let shutter = exp ? (exp >= 1 ? `${exp}s` : `1/${Math.round(1 / exp)}s`) : "";
          
          // Added "Lumix" to the brand display
          const brand = model.toLowerCase().includes("lumix") ? "" : "Lumix ";
          metadataDisplay.innerText = [brand + model, fStop, shutter, iso].filter(Boolean).join(" • ");
        });
      }
      setTimeout(() => { lightboxThumb.style.opacity = "0"; }, 400);
    }
  };
}

function closeLightbox() {
  lightbox.classList.remove("active");
  document.body.style.overflow = "auto";
  lightboxImg.src = ""; // Clear src on close
}

// Logic for clicking outside the image
lightbox.onclick = (e) => {
  closeLightbox();
};

// Logic for clicking the actual image
imageWrapper.onclick = (e) => {
  e.stopPropagation();
  window.open(`images/${imageFiles[currentIndex]}`, '_blank');
};

document.addEventListener("keydown", (e) => {
  if (!lightbox.classList.contains("active")) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowRight") { currentIndex = (currentIndex + 1) % imageFiles.length; updateLightboxImage(); }
  if (e.key === "ArrowLeft") { currentIndex = (currentIndex - 1 + imageFiles.length) % imageFiles.length; updateLightboxImage(); }
});