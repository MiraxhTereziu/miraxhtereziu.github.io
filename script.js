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
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const item = entry.target;
        const img = item.querySelector('img');
        
        // Start the fade-in animation for the container
        item.classList.add('reveal');

        // Load the actual image
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute("data-src");
        }
      }
    });
  }, { rootMargin: "200px" });

  imageFiles.forEach((file, index) => {
    const item = document.createElement("div");
    item.className = "gallery-item";

    const img = document.createElement("img");
    img.dataset.src = `images/thumbnails/${file}`;
    img.alt = file;

    img.onload = () => {
      img.classList.add("loaded");
      item.classList.add("img-done"); // Removes placeholder color
    };

    item.appendChild(img);
    galleryGrid.appendChild(item);
    observer.observe(item);

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
  lightboxImg.src = `images/${filename}`;
  metadataDisplay.innerText = "Loading Metadata...";

  lightboxImg.onload = function () {
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

lightbox.onclick = (e) => { if (e.target === lightbox) closeLightbox(); };
lightboxImg.onclick = (e) => {
  e.stopPropagation();
  window.open(lightboxImg.src, '_blank');
};

function closeLightbox() {
  lightbox.classList.remove("active");
  document.body.style.overflow = "auto";
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeLightbox();
});