let imageFiles = [];
let currentIndex = 0;

const galleryGrid = document.getElementById("galleryGrid");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const metadataDisplay = document.getElementById("metadataDisplay");

// 1. Fetch images
fetch("images.json")
  .then((res) => res.json())
  .then((data) => {
    imageFiles = data;
    initGallery();
  });

// 2. Build Grid with Staggered Fade-in
function initGallery() {
  imageFiles.forEach((file, index) => {
    const item = document.createElement("div");
    item.className = "gallery-item";

    const img = document.createElement("img");
    img.src = `images/thumbnails/${file}`;
    img.alt = file;
    img.loading = "lazy"; // Optimization

    img.onload = () => {
      // Create a "waterfall" effect by staggering the opacity change
      setTimeout(() => {
        img.classList.add("loaded");
      }, index * 80); // 80ms delay per image
    };

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

  lightboxImg.style.opacity = "0";
  lightboxImg.classList.remove("animate-in");
  metadataDisplay.innerText = "";

  lightboxImg.src = "";
  lightboxImg.src = `images/${filename}`;

  lightboxImg.onload = function () {
    lightboxImg.classList.add("animate-in");

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

function navigate(step) {
  lightboxImg.style.opacity = "0";
  lightboxImg.classList.remove("animate-in");
  currentIndex = (currentIndex + step + imageFiles.length) % imageFiles.length;
  updateLightboxImage();
}

function closeLightbox() {
  lightbox.classList.remove("active");
  document.body.style.overflow = "auto";
  lightboxImg.src = "";
}

// 4. Events
lightboxImg.onclick = (e) => {
  e.stopPropagation();
  navigate(1);
};

document.getElementById("lightboxClose").onclick = closeLightbox;
lightbox.onclick = (e) => {
  if (e.target === lightbox) closeLightbox();
};

document.addEventListener("keydown", (e) => {
  if (!lightbox.classList.contains("active")) return;
  if (e.key === "ArrowRight") navigate(1);
  if (e.key === "ArrowLeft") navigate(-1);
  if (e.key === "Escape") closeLightbox();
});
