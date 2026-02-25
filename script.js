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
  
  // FIX: Clear high-res and metadata immediately
  lightboxImg.classList.remove("loaded");
  lightboxImg.src = ""; 
  metadataDisplay.innerText = ""; 

  lightboxThumb.src = `images/thumbnails/${filename}`;
  lightboxThumb.style.opacity = "1";

  const highResLoader = new Image();
  highResLoader.src = `images/${filename}`;

  highResLoader.onload = function() {
    // Only update if we are still on the same image (ghosting fix)
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
          
          // Brand logic: Ensure "Lumix" is present
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
  lightboxImg.src = "";
}

// Clicking the background closes the view
lightbox.onclick = (e) => {
  closeLightbox();
};

// Clicking the image pixels opens full resolution link
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