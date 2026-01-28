let imageFiles = [];
let currentIndex = 0;

const galleryGrid = document.getElementById("galleryGrid");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const metadataDisplay = document.getElementById("metadataDisplay");

// 1. Fetch the list of images from JSON
fetch("images.json")
  .then((res) => res.json())
  .then((data) => {
    imageFiles = data;
    initGallery();
  })
  .catch((err) => console.error("Error loading JSON:", err));

// 2. Initialize the gallery grid with Lazy Loading
function initGallery() {
  imageFiles.forEach((file, index) => {
    const item = document.createElement("div");
    item.className = "gallery-item";

    const img = document.createElement("img");
    img.src = `images/thumbnails/${file}`;
    img.alt = file;

    // METHOD 1: Native Lazy Loading
    // Tells the browser to only load this image when it's about to scroll into view
    img.loading = "lazy";

    // Fade in thumbnail once it finally loads
    img.onload = () => img.classList.add("loaded");

    item.appendChild(img);
    galleryGrid.appendChild(item);

    item.onclick = () => openLightbox(index);
  });
}

// 3. Lightbox Functions
function openLightbox(index) {
  currentIndex = index;
  lightbox.classList.add("active");
  document.body.style.overflow = "hidden";
  updateLightboxImage();
}

function updateLightboxImage() {
  const filename = imageFiles[currentIndex];

  // Reset states for animation and hide "ghost" of previous image
  lightboxImg.style.opacity = "0";
  lightboxImg.classList.remove("animate-in");
  metadataDisplay.innerText = "";

  // Clear src to ensure the browser treats the next load as a fresh event
  lightboxImg.src = "";
  lightboxImg.src = `images/${filename}`;

  lightboxImg.onload = function () {
    // Trigger the reveal animation (Fade + Scale)
    lightboxImg.classList.add("animate-in");

    // Extract EXIF data
    if (window.EXIF) {
      EXIF.getData(this, function () {
        const model = EXIF.getTag(this, "Model") || "";
        const fStop = EXIF.getTag(this, "FNumber")
          ? `f/${EXIF.getTag(this, "FNumber")}`
          : "";
        const iso = EXIF.getTag(this, "ISOSpeedRatings")
          ? `ISO ${EXIF.getTag(this, "ISOSpeedRatings")}`
          : "";
        const exp = EXIF.getTag(this, "ExposureTime");
        let shutter = exp
          ? exp >= 1
            ? `${exp}s`
            : `1/${Math.round(1 / exp)}s`
          : "";

        if (model) {
          metadataDisplay.innerText = `${model} • ${fStop} • ${shutter} • ${iso}`;
        }
      });
    }
  };
}

function closeLightbox() {
  lightbox.classList.remove("active");
  document.body.style.overflow = "auto";
  lightboxImg.src = "";
  lightboxImg.classList.remove("animate-in");
}

function navigate(step) {
  // Hide current image instantly before index change
  lightboxImg.style.opacity = "0";
  lightboxImg.classList.remove("animate-in");

  currentIndex = (currentIndex + step + imageFiles.length) % imageFiles.length;
  updateLightboxImage();
}

// 4. Interaction Events

// Click the image to navigate forward
lightboxImg.onclick = (e) => {
  e.stopPropagation();
  navigate(1);
};

document.getElementById("lightboxClose").onclick = closeLightbox;

// Background click to close
lightbox.onclick = (e) => {
  if (e.target === lightbox) closeLightbox();
};

// Keyboard Navigation
document.addEventListener("keydown", (e) => {
  if (!lightbox.classList.contains("active")) return;

  if (e.key === "ArrowRight") navigate(1);
  if (e.key === "ArrowLeft") navigate(-1);
  if (e.key === "Escape") closeLightbox();
});
