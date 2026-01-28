let imageFiles = [];
let currentIndex = 0;

const galleryGrid = document.getElementById("galleryGrid");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const metadataDisplay = document.getElementById("metadataDisplay");

// Fetch the list of images
fetch("images.json")
  .then((res) => res.json())
  .then((data) => {
    imageFiles = data;
    initGallery();
  })
  .catch((err) => console.error("Error loading JSON:", err));

function initGallery() {
  imageFiles.forEach((file, index) => {
    const item = document.createElement("div");
    item.className = "gallery-item";

    const img = document.createElement("img");
    img.src = `images/thumbnails/${file}`; // Direct loading
    img.alt = file;

    // Fade in once loaded
    img.onload = () => img.classList.add("loaded");

    item.appendChild(img);
    galleryGrid.appendChild(item);

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

  // Clear state for new image
  lightboxImg.classList.add("loading");
  metadataDisplay.innerText = "";
  lightboxImg.src = `images/${filename}`;

  lightboxImg.onload = function () {
    lightboxImg.classList.remove("loading");

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

        metadataDisplay.innerText = model
          ? `${model} • ${fStop} • ${shutter} • ${iso}`
          : "";
      });
    }
  };
}

function closeLightbox() {
  lightbox.classList.remove("active");
  document.body.style.overflow = "auto";
  lightboxImg.src = "";
}

function navigate(step) {
  currentIndex = (currentIndex + step + imageFiles.length) % imageFiles.length;
  updateLightboxImage();
}

// Controls
document.getElementById("lightboxClose").onclick = closeLightbox;
document.getElementById("nextBtn").onclick = (e) => {
  e.stopPropagation();
  navigate(1);
};
document.getElementById("prevBtn").onclick = (e) => {
  e.stopPropagation();
  navigate(-1);
};
lightbox.onclick = (e) => {
  if (e.target === lightbox) closeLightbox();
};

document.addEventListener("keydown", (e) => {
  if (!lightbox.classList.contains("active")) return;
  if (e.key === "ArrowRight") navigate(1);
  if (e.key === "ArrowLeft") navigate(-1);
  if (e.key === "Escape") closeLightbox();
});
