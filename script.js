// ───────────────── Nettoyage de l'URL (retire /index.html et #featured) ─────────────────
const isLocalFile = window.location.protocol === "file:";
if (!isLocalFile && (window.location.pathname.endsWith("/index.html") || window.location.hash)) {
	window.history.replaceState(null, "", "/");
}

// ───────────────── Selected Work — grille masonry ─────────────────
const ROW_GAP = 14;

function populateGrid(gridEl, isClone = false) {
	PROJECTS.forEach((project, idx) => {
		const cover = project.cover || project.images[0];

		const link = document.createElement("a");
		link.className = "project-card";
		link.href = isLocalFile ? `${project.slug}.html` : `/${project.slug}`;
		if (isClone) {
			link.tabIndex = -1;
		}

		const media = document.createElement("div");
		media.className = "project-card-media";

		const img = document.createElement("img");
		img.src = cover.src;
		img.alt = project.title;
		img.width = cover.imgWidth;
		img.height = cover.imgHeight;
		img.style.aspectRatio = `${cover.imgWidth} / ${cover.imgHeight}`;
		// Charge immédiatement les premières et dernières cartes pour un scroll à l'envers instantané
		const isEdgeCard = idx < 3 || idx >= PROJECTS.length - 3;
		img.loading = isEdgeCard ? "eager" : "lazy";
		img.decoding = "async";
		media.appendChild(img);

		const caption = document.createElement("div");
		caption.className = "project-card-caption";
		caption.innerHTML = `<p class="title">${project.title}</p><p class="subtitle">${project.subtitle}</p>`;

		link.appendChild(media);
		link.appendChild(caption);
		gridEl.appendChild(link);

		let lastSpan = 0;
		const updateSpan = () => {
			const height = link.getBoundingClientRect().height;
			const span = Math.ceil(height) + ROW_GAP;
			if (span === lastSpan) return;
			lastSpan = span;
			link.style.gridRowEnd = `span ${span}`;
		};

		img.addEventListener("load", updateSpan);
		new ResizeObserver(updateSpan).observe(link);
	});
}

// ───────────────── Construction du clone pour le scroll infini (Plyń Druhi) ─────────────────
const infiniteContainer = document.getElementById("infinite-container");
const primaryCycle = document.getElementById("primary-cycle");
const primaryGrid = document.getElementById("featured-grid");

populateGrid(primaryGrid, false);

const cloneCycle = primaryCycle.cloneNode(true);
cloneCycle.id = "clone-cycle";
cloneCycle.setAttribute("aria-hidden", "true");
cloneCycle.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));

const cloneGrid = cloneCycle.querySelector(".featured-grid");
cloneGrid.innerHTML = "";
populateGrid(cloneGrid, true);

infiniteContainer.appendChild(cloneCycle);

document.querySelectorAll(".notes-link").forEach((a) => {
	a.href = isLocalFile ? "notes.html" : "/notes";
});

// ───────────────── Badge Available + Copie Email (suivi souris fluide) ─────────────────
document.querySelectorAll(".availability-btn").forEach((btn) => {
	const tooltip = btn.querySelector(".availability-tooltip");
	let resetTimer = null;
	let targetX = 0;
	let targetY = 0;
	let curX = 0;
	let curY = 0;
	let rafId = null;

	function animateTooltip() {
		curX += (targetX - curX) * 0.16;
		curY += (targetY - curY) * 0.16;
		if (tooltip) {
			tooltip.style.transform = `translate3d(${curX}px, ${curY}px, 0)`;
		}
		if (Math.abs(targetX - curX) > 0.1 || Math.abs(targetY - curY) > 0.1) {
			rafId = requestAnimationFrame(animateTooltip);
		} else {
			rafId = null;
		}
	}

	btn.addEventListener("pointermove", (e) => {
		const rect = btn.getBoundingClientRect();
		targetX = e.clientX - rect.right;
		targetY = e.clientY - rect.top;
		if (rafId === null) {
			rafId = requestAnimationFrame(animateTooltip);
		}
	});

	btn.addEventListener("click", () => {
		navigator.clipboard?.writeText("contact@nawfalsabi.me");
		btn.classList.add("copied");
		if (tooltip) tooltip.textContent = "Email copied!";

		clearTimeout(resetTimer);
		resetTimer = setTimeout(() => {
			btn.classList.remove("copied");
			if (tooltip) tooltip.textContent = "Copy email?";
		}, 2000);
	});
});

// ───────────────── Thème clair / sombre (synchronisé sur l'original + le clone) ─────────────────
const savedTheme = localStorage.getItem("theme");
const favicon = document.getElementById("favicon");

function updateFavicon() {
	if (!favicon) return;
	const isDark = document.documentElement.classList.contains("dark-theme");
	favicon.href = isDark ? "favicon-dark.svg" : "favicon-light.svg";
}

if (savedTheme === "dark") {
	document.documentElement.classList.add("dark-theme");
}
updateFavicon();

document.querySelectorAll(".theme-toggle").forEach((btn) => {
	btn.addEventListener("click", () => {
		document.documentElement.classList.toggle("dark-theme");
		const isDark = document.documentElement.classList.contains("dark-theme");
		localStorage.setItem("theme", isDark ? "dark" : "light");
		updateFavicon();
	});
});

// ───────────────── Infinite Smooth Scroll (vers le haut & vers le bas) ─────────────────
let cycleHeight = primaryCycle.offsetHeight;
let currentScroll = window.scrollY || 0;
let targetScroll = currentScroll;
let scrollRaf = null;
let isProgrammaticScroll = false;
const LERP = 0.11;

function updateCycleHeight() {
	cycleHeight = primaryCycle.offsetHeight;
}

new ResizeObserver(updateCycleHeight).observe(primaryCycle);
window.addEventListener("load", updateCycleHeight);

function wrapScrollValues() {
	if (cycleHeight <= 0) return;
	while (currentScroll < 0) {
		currentScroll += cycleHeight;
		targetScroll += cycleHeight;
	}
	while (currentScroll >= cycleHeight) {
		currentScroll -= cycleHeight;
		targetScroll -= cycleHeight;
	}
}

function animateScroll() {
	updateCycleHeight();
	const diff = targetScroll - currentScroll;

	if (Math.abs(diff) > 0.15) {
		currentScroll += diff * LERP;
	} else {
		currentScroll = targetScroll;
	}

	wrapScrollValues();

	isProgrammaticScroll = true;
	window.scrollTo(0, currentScroll);
	requestAnimationFrame(() => {
		isProgrammaticScroll = false;
	});

	if (Math.abs(targetScroll - currentScroll) > 0.15) {
		scrollRaf = requestAnimationFrame(animateScroll);
	} else {
		scrollRaf = null;
	}

	updateCursorHoverFromPoint();
}

function addScrollDelta(deltaY) {
	updateCycleHeight();
	targetScroll += deltaY;
	if (scrollRaf === null) {
		scrollRaf = requestAnimationFrame(animateScroll);
	}
}

window.addEventListener(
	"wheel",
	(event) => {
		if (event.ctrlKey) return; // Laisse le zoom navigateur intact
		event.preventDefault();

		let delta = event.deltaY;
		if (event.deltaMode === 1) delta *= 32; // Mode lignes
		else if (event.deltaMode === 2) delta *= window.innerHeight; // Mode page

		addScrollDelta(delta);
	},
	{ passive: false }
);

// Support tactile (mobile / tablette) avec inertie et boucle vers le haut
let touchLastY = 0;
let touchVelocity = 0;
let touchLastTime = 0;

window.addEventListener(
	"touchstart",
	(event) => {
		if (event.touches.length !== 1) return;
		touchLastY = event.touches[0].clientY;
		touchVelocity = 0;
		touchLastTime = performance.now();
	},
	{ passive: true }
);

window.addEventListener(
	"touchmove",
	(event) => {
		if (event.touches.length !== 1) return;
		event.preventDefault();
		const now = performance.now();
		const currentY = event.touches[0].clientY;
		const deltaY = touchLastY - currentY;
		const dt = Math.max(1, now - touchLastTime);

		touchVelocity = (deltaY / dt) * 16;
		touchLastY = currentY;
		touchLastTime = now;

		addScrollDelta(deltaY * 1.15);
	},
	{ passive: false }
);

window.addEventListener(
	"touchend",
	() => {
		if (Math.abs(touchVelocity) > 1.5) {
			addScrollDelta(touchVelocity * 10);
		}
	},
	{ passive: true }
);

// Support clavier (Flèches, PageUp/PageDown, Espace)
window.addEventListener("keydown", (event) => {
	if (["INPUT", "TEXTAREA", "BUTTON"].includes(document.activeElement?.tagName)) return;
	const step = 120;
	const pageStep = window.innerHeight * 0.85;

	if (event.key === "ArrowDown") {
		event.preventDefault();
		addScrollDelta(step);
	} else if (event.key === "ArrowUp") {
		event.preventDefault();
		addScrollDelta(-step);
	} else if (event.key === "PageDown" || (event.key === " " && !event.shiftKey)) {
		event.preventDefault();
		addScrollDelta(pageStep);
	} else if (event.key === "PageUp" || (event.key === " " && event.shiftKey)) {
		event.preventDefault();
		addScrollDelta(-pageStep);
	}
});

// Synchronisation si l'utilisateur déplace la scrollbar manuellement
window.addEventListener(
	"scroll",
	() => {
		if (isProgrammaticScroll || scrollRaf !== null) return;
		updateCycleHeight();
		if (cycleHeight <= 0) return;

		if (window.scrollY >= cycleHeight) {
			currentScroll = window.scrollY - cycleHeight;
			targetScroll = currentScroll;
			window.scrollTo(0, currentScroll);
		} else {
			currentScroll = window.scrollY;
			targetScroll = currentScroll;
		}
	},
	{ passive: true }
);

// ───────────────── Curseur personnalisé (GPU + Framer-style smoothing) ─────────────────
const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
let updateCursorHoverFromPoint = () => {};

if (!isCoarsePointer) {
	document.body.classList.add("custom-cursor-active");

	const cursor = document.getElementById("custom-cursor");
	const CURSOR_HALF = 15;
	const SMOOTH_SPEED = 22; // Indépendant du framerate (60Hz / 120Hz / 144Hz)
	let mouseX = 0;
	let mouseY = 0;
	let cursorX = 0;
	let cursorY = 0;
	let hasInitialized = false;
	let lastTime = 0;
	let animationFrame = null;

	function isHoverTarget(el) {
		if (!el) return false;
		if (el.closest(".project-card")) {
			return !!el.closest(".project-card-media");
		}
		return !!el.closest("a, button");
	}

	updateCursorHoverFromPoint = () => {
		if (!hasInitialized) return;
		const el = document.elementFromPoint(mouseX, mouseY);
		cursor.classList.toggle("is-hover", isHoverTarget(el));
	};

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
			cursor.classList.toggle("is-hover", isHoverTarget(event.target));

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
