// ───────────────── Fade-in au scroll ─────────────────
function fadeInOnScroll(el, delay = 0) {
	el.classList.add("fade-hidden");
	const observer = new IntersectionObserver(
		([entry]) => {
			if (entry.isIntersecting) {
				setTimeout(() => {
					el.classList.remove("fade-hidden");
					el.classList.add("fade-visible");
				}, delay);
				observer.disconnect();
			}
		},
		{ threshold: 0.1 }
	);
	observer.observe(el);
}

document.querySelectorAll(".featured-header, .section-label").forEach((el) => fadeInOnScroll(el));

// ───────────────── Thème clair / sombre ─────────────────
const themeToggle = document.getElementById("theme-toggle");
const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {
	document.documentElement.classList.add("dark-theme");
}

themeToggle.addEventListener("click", () => {
	document.documentElement.classList.toggle("dark-theme");
	const isDark = document.documentElement.classList.contains("dark-theme");
	localStorage.setItem("theme", isDark ? "dark" : "light");
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

	function isHoverTarget(el) {
		if (!el) return false;
		if (el.closest(".project-card")) {
			return !!el.closest(".project-card-media");
		}
		return !!el.closest("a, button, #archive tbody tr");
	}

	document.addEventListener("mouseover", (event) => {
		if (isHoverTarget(event.target)) {
			hoverScale = HOVER_SCALE;
		}
	});

	document.addEventListener("mouseout", (event) => {
		if (isHoverTarget(event.target) && !isHoverTarget(event.relatedTarget)) {
			hoverScale = REST_SCALE;
		}
	});
}

// ───────────────── Selected Work — grille masonry ─────────────────
const ROW_GAP = 14;

const featuredGrid = document.getElementById("featured-grid");

PROJECTS.forEach((project) => {
	const cover = project.images[0];

	const link = document.createElement("a");
	link.className = "project-card";
	link.href = `project.html?slug=${project.slug}`;

	const media = document.createElement("div");
	media.className = "project-card-media";

	const img = document.createElement("img");
	img.src = cover.src;
	img.alt = project.title;
	img.width = cover.imgWidth;
	img.height = cover.imgHeight;
	img.style.aspectRatio = `${cover.imgWidth} / ${cover.imgHeight}`;
	img.loading = "lazy";
	media.appendChild(img);

	if (cover.overlay) {
		const overlay = document.createElement("div");
		overlay.className = "project-card-overlay";
		[project.title.toLowerCase(), project.focus.toLowerCase(), project.year].forEach((t) => {
			const span = document.createElement("span");
			span.textContent = t;
			overlay.appendChild(span);
		});
		media.appendChild(overlay);
	}

	const caption = document.createElement("div");
	caption.className = "project-card-caption";
	caption.innerHTML = `<p class="title">${project.title}</p><p class="subtitle">${project.subtitle}</p>`;

	link.appendChild(media);
	link.appendChild(caption);
	featuredGrid.appendChild(link);

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

// ───────────────── Archive — filtres + tableau + preview ─────────────────
const filters = ["Tous", "Brand", "UI", "3D", "Identity", "Motion"];

const filtersEl = document.getElementById("archive-filters");
const tbody = document.getElementById("archive-tbody");
const preview = document.getElementById("archive-preview");
const previewImg = preview.querySelector("img");

let activeFilter = "Tous";

function renderFilters() {
	filtersEl.innerHTML = "";
	filters.forEach((f, i) => {
		const btn = document.createElement("button");
		btn.textContent = f;
		if (f === activeFilter) btn.classList.add("active");
		if (i < filters.length - 1) {
			const sep = document.createElement("span");
			sep.className = "sep";
			sep.textContent = "/";
			btn.appendChild(sep);
		}
		btn.addEventListener("click", () => {
			activeFilter = f;
			renderFilters();
			renderTable();
		});
		filtersEl.appendChild(btn);
	});
}

function renderTable() {
	const filtered = activeFilter === "Tous" ? ARCHIVE_PROJECTS : ARCHIVE_PROJECTS.filter((p) => p.focusKey === activeFilter);

	tbody.innerHTML = "";
	filtered.forEach((project) => {
		const tr = document.createElement("tr");
		tr.innerHTML = `
			<td class="id-cell">${project.id}</td>
			<td class="title-cell">${project.title}</td>
			<td class="focus-cell">${project.focus}</td>
			<td class="year-cell">${project.year}</td>
		`;

		tr.addEventListener("mouseenter", () => {
			tbody.querySelectorAll("tr").forEach((row) => {
				if (row !== tr) row.classList.add("dimmed");
			});
			previewImg.src = project.poster;
			preview.classList.add("visible");
		});

		tr.addEventListener("mouseleave", () => {
			tbody.querySelectorAll("tr").forEach((row) => row.classList.remove("dimmed"));
			preview.classList.remove("visible");
		});

		tr.addEventListener("click", () => {
			window.location.href = `project.html?slug=${project.slug}`;
		});

		tbody.appendChild(tr);
	});
}

document.getElementById("archive").addEventListener("mousemove", (event) => {
	preview.style.left = `${event.clientX + 24}px`;
	preview.style.top = `${event.clientY - 80}px`;
});

renderFilters();
renderTable();

// ───────────────── About — skills + copie email ─────────────────
const skills = [
	"Branding & Identité",
	"UI Design",
	"UX Research",
	"Direction Artistique",
	"Design 3D",
	"Motion Design",
	"Design Système",
	"Typographie",
];

const skillsGrid = document.getElementById("skills-grid");
skills.forEach((skill) => {
	const span = document.createElement("span");
	span.textContent = skill;
	skillsGrid.appendChild(span);
});

const EMAIL = "nawfal@nawfalsabi.com";
const copyBtn = document.getElementById("copy-email-btn");
const copyText = document.getElementById("copy-email-text");
const copyHint = document.getElementById("copy-email-hint");

copyBtn.addEventListener("click", () => {
	navigator.clipboard.writeText(EMAIL);
	copyBtn.classList.add("copied");
	copyText.textContent = "Copié !";
	copyHint.textContent = "";
	setTimeout(() => {
		copyBtn.classList.remove("copied");
		copyText.textContent = EMAIL;
		copyHint.textContent = "↗ copier";
	}, 2000);
});
