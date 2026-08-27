/* peter.nz — entrance motion, header state, parallax, cv fold */

const body = document.body;
const mast = document.querySelector('.mast');

/* --- chromatic-split hover layers -------------------------------- */
/* Wrap the label so it paints above the colour layers, then inject them. */
for (const el of document.querySelectorAll('.rgbsplit')) {
    if (el.querySelector('.hover-effect')) continue;

    const link = document.createElement('span');
    link.className = 'link';
    while (el.firstChild) link.appendChild(el.firstChild);

    const fx = document.createElement('span');
    fx.className = 'hover-effect';
    fx.setAttribute('aria-hidden', 'true');
    fx.appendChild(Object.assign(document.createElement('span'), { className: 'fill' }));

    el.append(link, fx);
}

/* --- reveal sections as they arrive ------------------------------- */
/* Position-based rather than IntersectionObserver: an observer never fires
   for a section that goes from below the fold to above it in one jump
   (deep link, restored scroll, fast flick), leaving it invisible for good. */
let pending = [...document.querySelectorAll('.drift.onscroll')];

const revealVisible = () => {
    if (!pending.length) return;
    const trigger = window.innerHeight * 0.88;
    pending = pending.filter((el) => {
        if (el.getBoundingClientRect().top > trigger) return true;
        el.classList.add('shown');
        return false;
    });
};

/* --- scroll: header pill + masthead parallax + reveals ------------ */
let ticking = false;
const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
        const y = window.scrollY;
        body.classList.toggle('scrolled', y > 24);
        if (mast) mast.style.setProperty('--plax', `${Math.min(y, 900) * 0.14}px`);
        revealVisible();
        ticking = false;
    });
};
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', onScroll, { passive: true });
onScroll();

/* --- entrance ----------------------------------------------------- */
const enter = () => {
    body.classList.remove('loading');
    body.classList.add('loaded');
    revealVisible();
};
if (document.readyState === 'complete') enter();
else addEventListener('load', enter, { once: true });

/* --- early career fold -------------------------------------------- */
const more = document.querySelector('.cv-timeline .more');
const cv = document.querySelector('.cv');
if (more && cv) {
    more.setAttribute('aria-expanded', 'false');
    const toggle = () => {
        const open = cv.classList.toggle('show-all');
        more.setAttribute('aria-expanded', String(open));
    };
    more.addEventListener('click', toggle);
    more.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
}

/* --- back to the top ---------------------------------------------- */
const me = document.querySelector('.me');
if (me) {
    me.setAttribute('aria-label', 'Back to top');
    me.addEventListener('click', () => {
        const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: 0, behavior: still ? 'auto' : 'smooth' });
    });
}

/* --- footer year --------------------------------------------------- */
const year = document.querySelector('.year');
if (year) year.textContent = String(new Date().getFullYear());
