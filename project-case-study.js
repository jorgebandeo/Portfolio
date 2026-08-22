(() => {
  const esc = (value = '') => String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  function renderCaseStudy(project) {
    const cs = project?.caseStudy;
    if (!cs) return '';

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
              <div>
                <h3>${esc(label)}</h3>
                <p>${esc(text)}</p>
              </div>
            </article>
          `).join('')}
        </div>

        ${(materials.length || results.length) ? `
          <div class="case-study__grid">
            ${materials.length ? `<article class="case-study__panel"><h3>MATERIALS // STACK</h3><ul>${materials.map(x => `<li>${esc(x)}</li>`).join('')}</ul></article>` : ''}
            ${results.length ? `<article class="case-study__panel"><h3>RESULTS // OUTPUT</h3><ul>${results.map(x => `<li>${esc(x)}</li>`).join('')}</ul></article>` : ''}
          </div>
        ` : ''}
      </section>`;
  }

  window.ProjectCaseStudy = { render: renderCaseStudy };
})();
