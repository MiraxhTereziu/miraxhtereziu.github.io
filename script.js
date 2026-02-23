let imageFiles = [];
let currentIndex = 0;

const galleryGrid = document.getElementById("galleryGrid");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const metadataDisplay = document.getElementById("metadataDisplay");

fetch("images.json")
  .then((res) => res.json())
  .then((data) => {
    imageFiles = data;
    shuffleArray(imageFiles);
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
    { rootMargin: "400px" },
  );

  galleryGrid.innerHTML = ""; // Clean start for the grid

  imageFiles.forEach((file, index) => {
    const item = document.createElement("div");
    item.className = "gallery-item";

    const img = document.createElement("img");
    img.dataset.src = `images/thumbnails/${file}`;
    img.alt = file;

    img.onload = () => {
      // requestAnimationFrame ensures smooth entry without frame drops
      requestAnimationFrame(() => {
        img.classList.add("loaded");
      });
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

function navigate(step) {
  currentIndex = (currentIndex + step + imageFiles.length) % imageFiles.length;
  updateLightboxImage();
}

function closeLightbox() {
  lightbox.classList.remove("active");
  document.body.style.overflow = "auto";
}

lightbox.onclick = (e) => { if (e.target === lightbox) closeLightbox(); };
lightboxImg.onclick = (e) => { e.stopPropagation(); navigate(1); };

document.addEventListener("keydown", (e) => {
  if (!lightbox.classList.contains("active")) return;
  if (e.key === "ArrowRight") navigate(1);
  if (e.key === "ArrowLeft") navigate(-1);
  if (e.key === "Escape") closeLightbox();
});