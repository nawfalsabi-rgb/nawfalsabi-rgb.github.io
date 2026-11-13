// ───────────────── Résolution du projet via l'URL propre (/sora) ou ?slug= ─────────────────
const isLocalFile = window.location.protocol === "file:";
const getProjectHref = (slug) => (isLocalFile ? `${slug}.html` : `/${slug}`);
const homeHref = isLocalFile ? "index.html" : "/";

const params = new URLSearchParams(window.location.search);
const pathSegment = window.location.pathname
	.replace(/\/+$/, "")
	.split("/")
	.pop()
	.replace(/\.html$/i, "");
const slug = params.get("slug") || pathSegment;

const index = PROJECTS.findIndex((p) => p.slug === slug);
const project = index === -1 ? PROJECTS[0] : PROJECTS[index];
const currentIndex = index === -1 ? 0 : index;

if (!isLocalFile && (window.location.pathname !== `/${project.slug}` || window.location.search)) {
	window.history.replaceState(null, "", `/${project.slug}`);
}

const prevProject = PROJECTS[(currentIndex - 1 + PROJECTS.length) % PROJECTS.length];
const nextProject = PROJECTS[(currentIndex + 1) % PROJECTS.length];

document.title = `${project.title} — Nawfal Sabi`;

const canonical = document.createElement("link");
canonical.rel = "canonical";
canonical.href = `https://nawfalsabi.me/${project.slug}`;
document.head.appendChild(canonical);

const closeLink = document.getElementById("project-close");
if (closeLink) closeLink.href = homeHref;
document.getElementById("project-prev").href = getProjectHref(prevProject.slug);
document.getElementById("project-next").href = getProjectHref(nextProject.slug);

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
	["Collaborateurs", project.collaborators],
	["Rôle", project.role],
	["Année", project.year],
].filter(([, value]) => value && value !== "—");
metaRows.forEach(([label, value]) => {
	const p = document.createElement("p");
	p.innerHTML = `${label} : <span>${value}</span>`;
	metaEl.appendChild(p);
});

const mediaGrid = document.getElementById("project-media-grid");
project.images.forEach((image, index) => {
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
		media.loading = index === 0 ? "eager" : "lazy";
		media.decoding = "async";
		if (index === 0) media.fetchPriority = "high";
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
		window.location.href = homeHref;
	} else if (event.key === "ArrowLeft") {
		window.location.href = getProjectHref(prevProject.slug);
	} else if (event.key === "ArrowRight") {
		window.location.href = getProjectHref(nextProject.slug);
	}
});

// ───────────────── Curseur personnalisé (GPU + Framer-style smoothing) ─────────────────
const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;

if (!isCoarsePointer) {
	document.body.classList.add("custom-cursor-active");

	const cursor = document.getElementById("custom-cursor");
	const CURSOR_HALF = 15;
	const SMOOTH_SPEED = 22;
	const hoverTargets = "a, button, .project-media";
	let mouseX = 0;
	let mouseY = 0;
	let cursorX = 0;
	let cursorY = 0;
	let hasInitialized = false;
	let lastTime = 0;
	let animationFrame = null;

	window.addEventListener(
		"pointermove",
		(event) => {
			mouseX = event.clientX;
			mouseY = event.clientY;

			if (!hasInitialized) {
				cursorX = mouseX;
				cursorY = mouseY;
				hasInitialized = true;
				cursor.style.transform = `translate3d(${cursorX - CURSOR_HALF}px, ${cursorY - CURSOR_HALF}px, 0)`;
			}

			cursor.classList.add("visible");
			cursor.classList.toggle("is-hover", !!event.target?.closest(hoverTargets));

			if (animationFrame === null) {
				lastTime = performance.now();
				animationFrame = requestAnimationFrame(animateCursor);
			}
		},
		{ passive: true }
	);

	document.addEventListener("mouseleave", () => cursor.classList.remove("visible"));

	function animateCursor(now) {
		const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
		lastTime = now;

		const alpha = 1 - Math.exp(-SMOOTH_SPEED * dt);
		cursorX += (mouseX - cursorX) * alpha;
		cursorY += (mouseY - cursorY) * alpha;

		cursor.style.transform = `translate3d(${cursorX - CURSOR_HALF}px, ${cursorY - CURSOR_HALF}px, 0)`;

		const isMoving = Math.abs(mouseX - cursorX) > 0.05 || Math.abs(mouseY - cursorY) > 0.05;
		animationFrame = isMoving ? requestAnimationFrame(animateCursor) : null;
	}
}
