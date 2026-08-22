(() => {
  const esc = (value = '') => String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  function renderSubprojects(project) {
    const items = Array.isArray(project?.subprojects) ? project.subprojects : [];
    if (!items.length) return '';
    return `
      <section class="subprojects" aria-label="Projetos e exercícios deste repositório">
        <div class="subprojects__header">
          <p class="case-study__eyebrow">REPOSITORY // SUBPROJECTS</p>
          <h2>Projetos dentro deste repositório</h2>
          <p>Este repositório reúne trabalhos independentes. Abaixo estão os principais módulos e o que foi desenvolvido em cada um.</p>
        </div>
        <div class="subprojects__grid">
          ${items.map((item, index) => `
            <article class="subproject-card">
              <div class="subproject-card__top"><span>${String(index + 1).padStart(2,'0')}</span><code>${esc(item.path || '')}</code></div>
              <h3>${esc(item.name || item.path || 'Subprojeto')}</h3>
              ${item.summary ? `<p>${esc(item.summary)}</p>` : ''}
              ${Array.isArray(item.details) && item.details.length ? `<ul>${item.details.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
              ${Array.isArray(item.technologies) && item.technologies.length ? `<div class="subproject-card__tags">${item.technologies.map(x => `<span>${esc(x)}</span>`).join('')}</div>` : ''}
            </article>
          `).join('')}
        </div>
      </section>`;
  }

  function renderCaseStudy(project) {
    const cs = project?.caseStudy;
    const subprojects = renderSubprojects(project);
    if (!cs) return subprojects;

    const sections = [
      ['MISSION // CONTEXTO', cs.intro],
      ['OBJECTIVE // OBJETIVO', cs.objective],
      ['BUILD // DESENVOLVIMENTO', cs.implementation],
      ['SYSTEM // ARQUITETURA', cs.architecture],
      ['STATUS // ANDAMENTO', cs.progress]
    ].filter(([, text]) => text);

    const materials = Array.isArray(cs.materials) ? cs.materials : [];
    const results = Array.isArray(cs.results) ? cs.results : [];

    return `
      <section class="case-study" aria-label="Estudo de caso técnico">
        <div class="case-study__header">
          <div>
            <p class="case-study__eyebrow">LCARS // TECHNICAL CASE STUDY</p>
            <h2>${esc(cs.title || 'Registro de desenvolvimento')}</h2>
          </div>
          <span class="case-study__status">DEEP RECORD</span>
        </div>

        <div class="case-study__timeline">
          ${sections.map(([label, text], index) => `
            <article class="case-study__section">
              <span class="case-study__index">0${index + 1}</span>
              <div><h3>${esc(label)}</h3><p>${esc(text)}</p></div>
            </article>
          `).join('')}
        </div>

        ${(materials.length || results.length) ? `
          <div class="case-study__grid">
            ${materials.length ? `<article class="case-study__panel"><h3>MATERIALS // STACK</h3><ul>${materials.map(x => `<li>${esc(x)}</li>`).join('')}</ul></article>` : ''}
            ${results.length ? `<article class="case-study__panel"><h3>RESULTS // OUTPUT</h3><ul>${results.map(x => `<li>${esc(x)}</li>`).join('')}</ul></article>` : ''}
          </div>` : ''}
      </section>
      ${subprojects}`;
  }

  window.ProjectCaseStudy = { render: renderCaseStudy };
})();