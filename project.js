// ───────────────── Résolution du projet via l'URL ─────────────────
const params = new URLSearchParams(window.location.search);
const slug = params.get("slug");
const index = PROJECTS.findIndex((p) => p.slug === slug);
const project = index === -1 ? PROJECTS[0] : PROJECTS[index];
const currentIndex = index === -1 ? 0 : index;

const prevProject = PROJECTS[(currentIndex - 1 + PROJECTS.length) % PROJECTS.length];
const nextProject = PROJECTS[(currentIndex + 1) % PROJECTS.length];

document.title = `${project.title} — Nawfal Sabi`;

document.getElementById("project-prev").href = `project.html?slug=${prevProject.slug}`;
document.getElementById("project-next").href = `project.html?slug=${nextProject.slug}`;

document.getElementById("project-title").textContent = project.title;
document.getElementById("project-subtitle").textContent = project.subtitle;

const descriptionEl = document.getElementById("project-description");
project.description.forEach((paragraph) => {
	const p = document.createElement("p");
	p.textContent = paragraph;
	descriptionEl.appendChild(p);
});

const metaEl = document.getElementById("project-meta");
const metaRows = [
	["Client", project.client],
	["Agence", project.agency],
	["Collaborateurs", project.collaborators],
	["Rôle", project.role],
	["Année", project.year],
];
metaRows.forEach(([label, value]) => {
	const p = document.createElement("p");
	p.innerHTML = `${label} : <span>${value}</span>`;
	metaEl.appendChild(p);
});

const mediaGrid = document.getElementById("project-media-grid");
project.images.forEach((image) => {
	const figure = document.createElement("div");
	figure.className = "project-media";

	const media = document.createElement(image.type === "video" ? "video" : "img");
	if (image.type === "video") {
		media.src = image.src;
		media.controls = true;
		media.loop = true;
		media.muted = true;
		media.playsInline = true;
		if (image.poster) media.poster = image.poster;
	} else {
		media.src = image.src;
		media.alt = project.title;
		media.loading = "lazy";
	}
	media.width = image.imgWidth;
	media.height = image.imgHeight;
	media.style.aspectRatio = `${image.imgWidth} / ${image.imgHeight}`;
	figure.appendChild(media);

	if (image.overlay) {
		const overlay = document.createElement("div");
		overlay.className = "project-media-overlay";
		[project.title.toLowerCase(), project.focus.toLowerCase(), project.year].forEach((t) => {
			const span = document.createElement("span");
			span.textContent = t;
			overlay.appendChild(span);
		});
		figure.appendChild(overlay);
	}

	mediaGrid.appendChild(figure);
});

const quoteBox = document.createElement("div");
quoteBox.className = "project-quote";
quoteBox.textContent = project.quote;
mediaGrid.appendChild(quoteBox);

// ───────────────── Navigation clavier ─────────────────
document.addEventListener("keydown", (event) => {
	if (event.key === "Escape") {
		window.location.href = "index.html#featured";
	} else if (event.key === "ArrowLeft") {
		window.location.href = `project.html?slug=${prevProject.slug}`;
	} else if (event.key === "ArrowRight") {
		window.location.href = `project.html?slug=${nextProject.slug}`;
	}
});

// ───────────────── Curseur personnalisé ─────────────────
const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;

if (!isCoarsePointer) {
	document.body.classList.add("custom-cursor-active");

	const cursor = document.getElementById("custom-cursor");
	const REST_SCALE = 1 / 3;
	const HOVER_SCALE = 1;
	let mouseX = 0;
	let mouseY = 0;
	let cursorX = 0;
	let cursorY = 0;
	let hoverScale = REST_SCALE;
	let currentScale = REST_SCALE;

	window.addEventListener("mousemove", (event) => {
		mouseX = event.clientX;
		mouseY = event.clientY;
		cursor.classList.add("visible");
	});

	document.addEventListener("mouseleave", () => cursor.classList.remove("visible"));

	function animateCursor() {
		cursorX += (mouseX - cursorX) * 0.2;
		cursorY += (mouseY - cursorY) * 0.2;
		currentScale += (hoverScale - currentScale) * 0.2;
		cursor.style.transform = `translate(${cursorX}px, ${cursorY}px) translate(-50%, -50%) scale(${currentScale})`;
		requestAnimationFrame(animateCursor);
	}

	requestAnimationFrame(animateCursor);

	const hoverTargets = "a, button, .project-media";

	document.addEventListener("mouseover", (event) => {
		if (event.target.closest(hoverTargets)) {
			hoverScale = HOVER_SCALE;
		}
	});

	document.addEventListener("mouseout", (event) => {
		if (event.target.closest(hoverTargets) && !event.relatedTarget?.closest(hoverTargets)) {
			hoverScale = REST_SCALE;
		}
	});
}
