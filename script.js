let imageFiles = [];

const galleryGrid = document.getElementById("galleryGrid");

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
    { rootMargin: "800px" }
  );

  imageFiles.forEach((file) => {
    const item = document.createElement("div");
    item.className = "gallery-item";

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

    // Change: Open the full-resolution image in a new tab instead of a lightbox
    item.onclick = () => {
      window.open(`images/${file}`, '_blank');
    };
  });
}