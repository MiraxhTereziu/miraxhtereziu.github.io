let imageFiles = [];
let currentIndex = 0;

const galleryGrid = document.getElementById("galleryGrid");
const lightbox = document.getElementById("lightbox");
const lightboxThumb = document.getElementById("lightboxThumb");
const lightboxImg = document.getElementById("lightboxImg");
const metadataDisplay = document.getElementById("metadataDisplay");
const splashScreen = document.getElementById("splashScreen");
const splashImage = document.getElementById("splashImage");

let galleryLoaded = false;

fetch("images.json")
  .then((res) => res.json())
  .then((data) => {
    imageFiles = data;
    shuffleArray(imageFiles);
    
    // Show random splash image
    const randomIndex = Math.floor(Math.random() * imageFiles.length);
    splashImage.src = `images/thumbnails/${imageFiles[randomIndex]}`;
    
    initGallery();
  });

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
    item.style.aspectRatio = "4 / 3";

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

  // Mark gallery as loaded and fade out splash screen
  galleryLoaded = true;
  setTimeout(() => {
    splashScreen.classList.add("fade-out");
    // Remove splash screen after animation completes
    setTimeout(() => {
      splashScreen.style.display = "none";
    }, 600);
  }, 300); // Small delay to let initial images start loading
}

function openLightbox(index) {
  currentIndex = index;
  lightbox.classList.add("active");
  document.body.style.overflow = "hidden";
  updateLightboxImage();
}

function updateLightboxImage() {
  const filename = imageFiles[currentIndex];
  
  // Reset both images
  lightboxThumb.style.opacity = "0";
  lightboxImg.style.opacity = "0";
  lightboxImg.classList.remove("animate-in");
  metadataDisplay.innerText = "";
  
  // Load thumbnail first (quick display)
  lightboxThumb.src = `images/thumbnails/${filename}`;
  lightboxThumb.onload = () => {
    lightboxThumb.style.opacity = "1";
  };
  
  // Load full resolution in background
  lightboxImg.src = `images/${filename}`;
  lightboxImg.onload = function () {
    // Fade from thumbnail to full resolution
    lightboxThumb.style.opacity = "0";
    lightboxImg.style.opacity = "1";
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

lightbox.onclick = (e) => {
  if (e.target === lightbox) closeLightbox();
};

lightboxImg.onclick = (e) => {
  e.stopPropagation();
  const filename = imageFiles[currentIndex];
  window.open(`images/${filename}`, '_blank');
};

document.addEventListener("keydown", (e) => {
  if (!lightbox.classList.contains("active")) return;
  if (e.key === "Escape") closeLightbox();
});