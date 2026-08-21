const PortfolioProjects = (() => {
    const registryUrl = 'data/projects.json';

    function rawBase(source) {
        return `https://raw.githubusercontent.com/${source.owner}/${source.repo}/${source.ref}/`;
    }

    function manifestUrl(source) {
        return rawBase(source) + source.manifest;
    }

    function resolveAsset(source, path) {
        if (!path) return '';
        if (/^https?:\/\//i.test(path)) return path;
        return rawBase(source) + path.replace(/^\//, '');
    }

    function projectHref(project, source) {
        const params = new URLSearchParams({
            owner: source.owner,
            repo: source.repo,
            ref: source.ref,
            manifest: source.manifest,
            id: project.project.id
        });
        return `projeto.html?${params.toString()}`;
    }

    function validateManifest(data) {
        return Boolean(
            data &&
            data.schemaVersion === 1 &&
            data.project?.id &&
            data.project?.name &&
            Array.isArray(data.categories) &&
            Array.isArray(data.technologies) &&
            data.portfolio
        );
    }

    async function loadManifest(source) {
        const response = await fetch(manifestUrl(source), { cache: 'no-store' });
        if (!response.ok) throw new Error(`Manifesto indisponível: ${source.repo}`);
        const data = await response.json();
        if (!validateManifest(data)) throw new Error(`Manifesto inválido: ${source.repo}`);
        return { data, source };
    }

    async function loadRegistry() {
        const response = await fetch(registryUrl, { cache: 'no-store' });
        if (!response.ok) throw new Error('Registro de projetos indisponível');
        const registry = await response.json();
        return registry.projects || [];
    }

    function iconFor(categories) {
        if (categories.includes('hardware')) return 'fa-microchip';
        if (categories.includes('software')) return 'fa-terminal';
        return 'fa-code';
    }

    function createCard(entry) {
        const { data, source } = entry;
        const card = document.createElement('a');
        const categories = data.categories.map(c => c.toLowerCase());
        card.className = `project manifest-project ${categories.join(' ')}`;
        card.href = projectHref(data, source);
        card.dataset.label = `${categories.join(' + ').toUpperCase()} // AUTO`;
        card.dataset.projectId = data.project.id;

        const visual = document.createElement('div');
        visual.className = 'project-visual manifest-cover';

        const fallback = document.createElement('i');
        fallback.className = `fas ${iconFor(categories)}`;
        fallback.setAttribute('aria-hidden', 'true');
        visual.appendChild(fallback);

        if (data.media?.cover) {
            const image = document.createElement('img');
            image.src = resolveAsset(source, data.media.cover);
            image.alt = '';
            image.loading = 'lazy';
            image.addEventListener('load', () => visual.classList.add('has-image'));
            image.addEventListener('error', () => image.remove());
            visual.prepend(image);
        }

        const title = document.createElement('h3');
        title.textContent = data.project.name;

        const subtitle = document.createElement('p');
        subtitle.textContent = data.project.subtitle;

        const tech = document.createElement('div');
        tech.className = 'project-tech-strip';
        tech.textContent = data.technologies.slice(0, 5).join(' · ');

        const auto = document.createElement('span');
        auto.className = 'manifest-badge';
        auto.textContent = 'MANIFEST // ONLINE';

        card.append(visual, title, subtitle, tech, auto);
        return card;
    }

    async function renderProjectGrid() {
        const grid = document.querySelector('.project-grid');
        if (!grid) return;

        let sources = [];
        try {
            sources = await loadRegistry();
        } catch (error) {
            console.warn(error);
            return;
        }

        const settled = await Promise.allSettled(sources.map(loadManifest));
        const loaded = settled
            .filter(item => item.status === 'fulfilled')
            .map(item => item.value)
            .filter(entry => entry.data.portfolio?.visible !== false)
            .sort((a, b) => (a.data.portfolio?.order ?? 999) - (b.data.portfolio?.order ?? 999));

        loaded.reverse().forEach(entry => grid.prepend(createCard(entry)));
        if (typeof applyFilters === 'function') applyFilters();
        if (typeof setupRevealAnimations === 'function') setupRevealAnimations();
    }

    async function renderProjectDetail() {
        const host = document.getElementById('manifest-project-detail');
        if (!host) return;

        const params = new URLSearchParams(window.location.search);
        const source = {
            owner: params.get('owner') || 'jorgebandeo',
            repo: params.get('repo'),
            ref: params.get('ref') || 'main',
            manifest: params.get('manifest') || 'portfolio.json'
        };

        if (!source.repo) {
            host.innerHTML = '<div class="project-load-error">PROJECT DATA ERROR // repositório não informado.</div>';
            return;
        }

        host.innerHTML = '<div class="project-loading">LCARS // carregando registro do projeto…</div>';

        try {
            const { data } = await loadManifest(source);
            document.title = `${data.project.name} — Jorge Bandeo`;
            host.innerHTML = '';
            host.appendChild(createDetail(data, source));
        } catch (error) {
            host.innerHTML = `<div class="project-load-error">PROJECT DATA ERROR // ${escapeHtml(error.message)}</div>`;
        }
    }

    function createDetail(data, source) {
        const article = document.createElement('article');
        article.className = 'manifest-detail project-article';

        article.innerHTML = `
            <section class="manifest-hero">
                <div>
                    <p class="lcars-label">LCARS // PROJECT RECORD</p>
                    <h1>${escapeHtml(data.project.name)}</h1>
                    <p class="manifest-subtitle">${escapeHtml(data.project.subtitle)}</p>
                </div>
                <div class="manifest-status">${escapeHtml(String(data.project.status).toUpperCase())}</div>
            </section>
            <div class="manifest-tech">${data.technologies.map(t => `<span>${escapeHtml(t)}</span>`).join('')}</div>
            <section class="manifest-overview">
                <div class="manifest-copy panel">
                    <p class="lcars-label">01 // DEVELOPMENT LOG</p>
                    <p>${escapeHtml(data.summary)}</p>
                    <div class="development-grid">
                        ${(data.development || []).map(item => `<div class="development-item"><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.text)}</p></div>`).join('')}
                    </div>
                </div>
                <aside class="manifest-copy panel">
                    <p class="lcars-label">02 // CAPABILITIES</p>
                    <ul class="manifest-highlights">${(data.highlights || []).map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
                </aside>
            </section>
            <section class="manifest-media-section">
                <div class="manifest-section-heading">
                    <div><p class="lcars-label">03 // VISUAL RECORD</p><h2>Fotos e vídeos</h2></div>
                    <span>mídia carregada do repositório</span>
                </div>
                <div class="manifest-gallery"></div>
            </section>
            <section class="manifest-links"></section>
        `;

        const gallery = article.querySelector('.manifest-gallery');
        (data.media?.gallery || []).forEach(item => gallery.appendChild(createMediaItem(item, source, data.project.name)));

        if (!gallery.children.length) {
            gallery.innerHTML = '<div class="media-placeholder">NO MEDIA // aguardando arquivos no repositório</div>';
        }

        const links = article.querySelector('.manifest-links');
        if (data.links?.repository) {
            const repoLink = document.createElement('a');
            repoLink.href = data.links.repository;
            repoLink.target = '_blank';
            repoLink.rel = 'noopener noreferrer';
            repoLink.textContent = 'ABRIR REPOSITÓRIO';
            links.appendChild(repoLink);
        }

        if (data.links?.source && data.links?.repository) {
            const sourceLink = document.createElement('a');
            sourceLink.href = `${data.links.repository}/blob/${source.ref}/${data.links.source}`;
            sourceLink.target = '_blank';
            sourceLink.rel = 'noopener noreferrer';
            sourceLink.textContent = 'VER CÓDIGO-FONTE';
            links.appendChild(sourceLink);
        }
        return article;
    }

    function createMediaItem(item, source, projectName) {
        const figure = document.createElement('figure');
        figure.className = 'manifest-media-card';

        const placeholder = document.createElement('div');
        placeholder.className = 'media-placeholder';
        placeholder.textContent = item.type === 'video' ? 'VIDEO SLOT // aguardando upload' : 'IMAGE SLOT // aguardando upload';
        figure.appendChild(placeholder);

        if (item.src) {
            let media;
            if (item.type === 'video') {
                media = document.createElement('video');
                media.controls = true;
                media.preload = 'metadata';
                media.src = resolveAsset(source, item.src);
            } else {
                media = document.createElement('img');
                media.loading = 'lazy';
                media.src = resolveAsset(source, item.src);
                media.alt = item.caption || projectName || 'Imagem do projeto';
            }
            media.addEventListener('error', () => media.remove());
            figure.appendChild(media);
        }

        if (item.caption) {
            const caption = document.createElement('figcaption');
            caption.textContent = item.caption;
            figure.appendChild(caption);
        }
        return figure;
    }

    function escapeHtml(value = '') {
        return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
    }

    document.addEventListener('DOMContentLoaded', () => {
        renderProjectGrid();
        renderProjectDetail();
    });

    return { loadRegistry, loadManifest, resolveAsset };
})();
