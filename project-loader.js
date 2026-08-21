const PortfolioProjects = (() => {
    const configUrl = 'data/projects.json';

    function rawBase(source) {
        return `https://raw.githubusercontent.com/${source.owner}/${source.repo}/${source.ref}/`;
    }

    function resolveAsset(source, path) {
        if (!path) return '';
        if (/^https?:\/\//i.test(path)) return path;
        return rawBase(source) + path.replace(/^\//, '');
    }

    function projectHref(project) {
        return `projeto.html?id=${encodeURIComponent(project.project.id)}`;
    }

    function validateProject(data) {
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

    async function loadConfig() {
        const response = await fetch(configUrl, { cache: 'no-store' });
        if (!response.ok) throw new Error('Configuração do catálogo indisponível');
        return response.json();
    }

    async function loadCatalog() {
        const config = await loadConfig();
        const response = await fetch(config.generated || 'data/projects.generated.json', { cache: 'no-store' });
        if (!response.ok) throw new Error('Catálogo compilado indisponível');
        const catalog = await response.json();
        return (catalog.projects || []).filter(validateProject);
    }

    function iconFor(categories) {
        if (categories.includes('ai')) return 'fa-brain';
        if (categories.includes('mobile')) return 'fa-mobile-screen-button';
        if (categories.includes('hardware')) return 'fa-microchip';
        if (categories.includes('web')) return 'fa-globe';
        return 'fa-terminal';
    }

    function createCard(data) {
        const source = data._source || {};
        const categories = data.categories.map(c => c.toLowerCase());
        const card = document.createElement('a');
        card.className = `project manifest-project ${categories.join(' ')}`;
        card.href = projectHref(data);
        card.dataset.label = `${categories.join(' + ').toUpperCase()} // ${source.mode === 'manifest' ? 'MANIFEST' : 'AUTO'}`;
        card.dataset.projectId = data.project.id;

        const visual = document.createElement('div');
        visual.className = 'project-visual manifest-cover';

        const fallback = document.createElement('i');
        fallback.className = `fas ${iconFor(categories)}`;
        fallback.setAttribute('aria-hidden', 'true');
        visual.appendChild(fallback);

        if (data.media?.cover && source.owner && source.repo && source.ref) {
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
        subtitle.textContent = data.project.subtitle || data.summary || '';

        const tech = document.createElement('div');
        tech.className = 'project-tech-strip';
        tech.textContent = data.technologies.slice(0, 5).join(' · ');

        const badge = document.createElement('span');
        badge.className = 'manifest-badge';
        badge.textContent = source.mode === 'manifest' ? 'MANIFEST // CURATED' : 'CATALOG // AUTO';

        card.append(visual, title, subtitle, tech, badge);
        return card;
    }

    async function renderProjectGrid() {
        const grid = document.querySelector('.project-grid');
        if (!grid) return;

        try {
            const projects = await loadCatalog();
            const visible = projects
                .filter(project => project.portfolio?.visible !== false)
                .sort((a, b) => (a.portfolio?.order ?? 999) - (b.portfolio?.order ?? 999));

            grid.innerHTML = '';
            visible.forEach(project => grid.appendChild(createCard(project)));
            if (typeof applyFilters === 'function') applyFilters();
            if (typeof setupRevealAnimations === 'function') setupRevealAnimations();
        } catch (error) {
            console.error(error);
            grid.innerHTML = `<div class="project-load-error">CATALOG ERROR // ${escapeHtml(error.message)}</div>`;
        }
    }

    async function renderProjectDetail() {
        const host = document.getElementById('manifest-project-detail');
        if (!host) return;

        const id = new URLSearchParams(window.location.search).get('id');
        if (!id) {
            host.innerHTML = '<div class="project-load-error">PROJECT DATA ERROR // projeto não informado.</div>';
            return;
        }

        host.innerHTML = '<div class="project-loading">LCARS // carregando registro do projeto…</div>';

        try {
            const projects = await loadCatalog();
            const data = projects.find(project => project.project.id === id);
            if (!data) throw new Error('Projeto não encontrado no catálogo compilado');

            document.title = `${data.project.name} — Jorge Bandeo`;
            host.innerHTML = '';
            host.appendChild(createDetail(data));
        } catch (error) {
            host.innerHTML = `<div class="project-load-error">PROJECT DATA ERROR // ${escapeHtml(error.message)}</div>`;
        }
    }

    function createDetail(data) {
        const source = data._source || {};
        const article = document.createElement('article');
        article.className = 'manifest-detail project-article';

        const sourceLabel = source.mode === 'manifest' ? 'CURATED MANIFEST' : 'AUTO COMPILED';
        article.innerHTML = `
            <section class="manifest-hero">
                <div>
                    <p class="lcars-label">LCARS // PROJECT RECORD // ${escapeHtml(sourceLabel)}</p>
                    <h1>${escapeHtml(data.project.name)}</h1>
                    <p class="manifest-subtitle">${escapeHtml(data.project.subtitle || '')}</p>
                </div>
                <div class="manifest-status">${escapeHtml(String(data.project.status || 'repository').toUpperCase())}</div>
            </section>
            <div class="manifest-tech">${data.technologies.map(t => `<span>${escapeHtml(t)}</span>`).join('')}</div>
            <section class="manifest-overview">
                <div class="manifest-copy panel">
                    <p class="lcars-label">01 // DEVELOPMENT LOG</p>
                    <p>${escapeHtml(data.summary || '')}</p>
                    <div class="development-grid">
                        ${(data.development || []).map(item => `<div class="development-item"><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.text)}</p></div>`).join('')}
                    </div>
                </div>
                <aside class="manifest-copy panel">
                    <p class="lcars-label">02 // CAPABILITIES</p>
                    <ul class="manifest-highlights">${(data.highlights || []).map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
                    <div class="catalog-source-note">SOURCE // ${escapeHtml(source.repo || '')} · ${escapeHtml(source.ref || '')}</div>
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
            gallery.innerHTML = '<div class="media-placeholder">NO MEDIA // este repositório ainda não possui mídia de portfólio mapeada</div>';
        }

        const links = article.querySelector('.manifest-links');
        addLink(links, data.links?.repository, 'ABRIR REPOSITÓRIO');
        addLink(links, data.links?.demo, 'ABRIR DEMO');
        if (data.links?.source && data.links?.repository) {
            addLink(links, `${data.links.repository}/blob/${source.ref || 'main'}/${data.links.source}`, 'VER CÓDIGO-FONTE');
        }
        return article;
    }

    function addLink(host, href, label) {
        if (!href) return;
        const link = document.createElement('a');
        link.href = href;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = label;
        host.appendChild(link);
    }

    function createMediaItem(item, source, projectName) {
        const figure = document.createElement('figure');
        figure.className = 'manifest-media-card';

        const placeholder = document.createElement('div');
        placeholder.className = 'media-placeholder';
        placeholder.textContent = item.type === 'video' ? 'VIDEO SLOT // aguardando upload' : 'IMAGE SLOT // aguardando upload';
        figure.appendChild(placeholder);

        if (item.src && source.owner && source.repo && source.ref) {
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

    return { loadCatalog, resolveAsset };
})();
