// Check authentication
if (!localStorage.getItem('token')) {
    window.location.href = '/login';
}

const urlParams = new URLSearchParams(window.location.search);
const resumeId = urlParams.get('id');
const urlTemplateId = urlParams.get('templateId') || null;
const urlTemplate = urlParams.get('template') || 'modern';
const urlColor = decodeURIComponent(urlParams.get('color') || '#2563EB');

// Helper to convert hex to rgba
function hexToRgba(hex, alpha = 1) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Separate accent from primary UI color
function updateAccentVars(hex) {
    document.documentElement.style.setProperty('--accent-color', hex);
    document.documentElement.style.setProperty('--accent-light', hexToRgba(hex, 0.1));
    document.documentElement.style.setProperty('--accent-border', hexToRgba(hex, 0.3));
}

updateAccentVars(urlColor);

let resumeData = {
    personalDetails: {
        name: '', jobTitle: '', email: '', phone: '', address: '', linkedin: '', github: ''
    },
    summary: '',
    education: [],
    experience: [],
    projects: [],
    skills: [],
    certifications: [],
    languages: [],
    templateId: urlTemplateId,
    templateType: urlTemplate,
    accentColor: urlColor
};

async function updateTemplateBackground(templateId) {
    if (!templateId) return;
    try {
        const template = await api.templates.getById(templateId);
        const preview = document.getElementById('resume-preview');
        if (preview && template && template.previewImage) {
            preview.style.backgroundImage = `url(${template.previewImage})`;
            preview.style.backgroundSize = 'contain';
            preview.style.backgroundRepeat = 'no-repeat';
            preview.style.backgroundPosition = 'center';
            preview.style.backgroundColor = 'transparent';
            preview.style.backgroundBlendMode = 'normal';

            // If template has an explicit type from DB, use it
            if (template.type) {
                resumeData.templateType = template.type;
            } else {
                // Fallback Detection: try to find the best layout match from the admin template name
                const name = template.name.toLowerCase();
                if (name.includes('modern')) resumeData.templateType = 'modern';
                else if (name.includes('minimalist')) resumeData.templateType = 'minimalist';
                else if (name.includes('classic')) resumeData.templateType = 'classic';
                else if (name.includes('creative')) resumeData.templateType = 'creative';
                else if (name.includes('executive')) resumeData.templateType = 'executive';
                // If no match found and we don't have a type yet, default to modern
                else if (!resumeData.templateType) resumeData.templateType = 'modern';
            }
        }
    } catch (err) { console.error("Template BG load failed", err); }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Load Admin Templates into Dropdown
    async function loadTemplateDropdown() {
        const select = document.getElementById('template-select');
        try {
            const templates = await api.templates.getAll();
            select.innerHTML = ''; // Clear "Loading..."
            templates.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t._id;
                opt.textContent = t.name;
                // Pre-select current
                if (resumeData.templateId === t._id) opt.selected = true;
                select.appendChild(opt);
            });
        } catch (err) {
            console.error("Failed to load templates for dropdown", err);
            select.innerHTML = '<option value="">Error Loading Templates</option>';
        }
    }

    if (resumeId) {
        try {
            showLoader(true);
            const data = await api.resumes.getById(resumeId);
            resumeData = data;
            if (resumeData.accentColor) updateAccentVars(resumeData.accentColor);
            if (resumeData.templateId) await updateTemplateBackground(resumeData.templateId);
            await loadTemplateDropdown();
            fillForm();
            renderPreview();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            showLoader(false);
        }
    } else {
        try {
            showLoader(true);
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            if (userData.name) resumeData.personalDetails.name = userData.name;
            if (userData.email) resumeData.personalDetails.email = userData.email;

            if (urlTemplateId) {
                resumeData.templateId = urlTemplateId;
                await updateTemplateBackground(urlTemplateId);
            }
            await loadTemplateDropdown();
            fillForm();
            syncFormToData();
            renderPreview();
        } catch (err) {
            console.error(err);
        } finally {
            showLoader(false);
        }
    }

    document.querySelectorAll('.live-input').forEach(input => {
        input.addEventListener('input', updateDataAndPreview);
    });

    document.getElementById('template-select').addEventListener('change', async (e) => {
        const newTplId = e.target.value;
        if (!newTplId) return;

        showLoader(true);
        resumeData.templateId = newTplId;

        // Update background and type
        await updateTemplateBackground(newTplId);

        renderPreview();
        showLoader(false);
    });

    document.getElementById('save-btn').addEventListener('click', saveResume);
    document.getElementById('download-btn').addEventListener('click', downloadPDF);
});

// Inline Editing Sync (Canva-like)
window.syncInlineEdit = (el) => {
    const section = el.dataset.section;
    const field = el.dataset.field;
    const index = el.dataset.index;
    const val = el.innerText;

    if (section === 'personalDetails') {
        resumeData.personalDetails[field] = val;
        // Also sync the sidebar form if it exists
        const input = document.querySelector(`input[name="${field}"]`);
        if (input) input.value = val;
    } else if (section === 'summary') {
        resumeData.summary = val;
        const textarea = document.querySelector('textarea[name="summary"]');
        if (textarea) textarea.value = val;
    } else if (section === 'skills' && index !== '') {
        resumeData.skills[parseInt(index)] = val;
        // Sync back to comma separated input
        const skillsInput = document.querySelector('input[name="skills"]');
        if (skillsInput) skillsInput.value = resumeData.skills.join(', ');
    } else if (index !== '') {
        const idx = parseInt(index);
        if (resumeData[section] && resumeData[section][idx]) {
            resumeData[section][idx][field] = val;

            // Try to find the corresponding sidebar input
            const container = document.getElementById(`${section}-list`);
            if (container && container.children[idx]) {
                const sidebarInput = container.children[idx].querySelector(`[oninput*="${field}"]`);
                if (sidebarInput) sidebarInput.value = val;
            }
        }
    }
};

function syncFormToData() {
    const form = document.getElementById('resume-form');
    if (!form) return;
    for (const key in resumeData.personalDetails) {
        const input = document.querySelector(`input[name="${key}"]`);
        if (input) resumeData.personalDetails[key] = input.value;
    }
    const summaryTextarea = document.querySelector('textarea[name="summary"]');
    if (summaryTextarea) resumeData.summary = summaryTextarea.value;
    ['skills', 'certifications', 'languages'].forEach(f => {
        const input = document.querySelector(`input[name="${f}"]`);
        if (input) resumeData[f] = input.value.split(',').map(s => s.trim()).filter(s => s !== '');
    });
}

function updateDataAndPreview(e) {
    const { name, value } = e.target;
    if (['name', 'jobTitle', 'email', 'phone', 'address', 'linkedin', 'github'].includes(name)) {
        resumeData.personalDetails[name] = value;
    } else if (['skills', 'certifications', 'languages'].includes(name)) {
        resumeData[name] = value.split(',').map(s => s.trim()).filter(s => s !== '');
    } else {
        resumeData[name] = value;
    }
    renderPreview();
}

function fillForm() {
    const { personalDetails, summary, skills, certifications, languages, templateType } = resumeData;
    for (const key in personalDetails) {
        const input = document.querySelector(`input[name="${key}"]`);
        if (input) input.value = personalDetails[key] || '';
    }
    if (document.querySelector('textarea[name="summary"]')) document.querySelector('textarea[name="summary"]').value = summary || '';
    ['skills', 'certifications', 'languages'].forEach(f => {
        const input = document.querySelector(`input[name="${f}"]`);
        if (input) input.value = (resumeData[f] || []).join(', ');
    });
    if (document.getElementById('template-select')) document.getElementById('template-select').value = templateType || 'modern';
}

function renderPreview() {
    const preview = document.getElementById('resume-preview');
    const { personalDetails, summary, education, experience, projects, skills, certifications, languages, templateType } = resumeData;

    // Helper to make fields editable in-place
    const edit = (section, field, value, index = '') => {
        return `<span contenteditable="true" data-section="${section}" data-field="${field}" data-index="${index}" oninput="syncInlineEdit(this)" class="editable-field">${value || ''}</span>`;
    };

    const getSkillsHtml = () => skills.length > 0 ? `
        <div style="margin-bottom: 1.5rem;">
            <h3 style="color: var(--accent-color); text-transform: uppercase; font-size: 0.9rem; border-bottom: 1px solid var(--accent-border); margin-bottom: 0.5rem; font-weight: 700;">Skills</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
                ${skills.map((s, i) => `<span style="background: var(--accent-light); color: var(--accent-color); padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8rem; font-weight: 600;">${edit('skills', '', s, i)}</span>`).join('')}
            </div>
        </div>
    ` : '';

    // All templates now use transparent background to reveal the ADMIN TEMPLATE IMAGE underneath
    const containerStyle = `background: transparent; color: #333; min-height: 297mm;`;

    if (templateType === 'modern') {
        preview.innerHTML = `
            <div style="${containerStyle} padding: 1.5rem;">
                <div style="border-bottom: 4px solid var(--accent-color); padding-bottom: 1rem; margin-bottom: 1.5rem;">
                    <h1 style="font-size: 2.8rem; margin-bottom: 0.2rem; color: #1e293b;">${edit('personalDetails', 'name', personalDetails.name || 'Your Name')}</h1>
                    <h3 style="color: var(--accent-color); font-weight: 600;">${edit('personalDetails', 'jobTitle', personalDetails.jobTitle || 'Job Title')}</h3>
                    <div style="display: flex; gap: 1rem; margin-top: 0.8rem; flex-wrap: wrap; font-size: 0.85rem; color: #64748b;">
                        <span><i class="fas fa-envelope" style="color:var(--accent-color)"></i> ${edit('personalDetails', 'email', personalDetails.email)}</span>
                        <span><i class="fas fa-phone" style="color:var(--accent-color)"></i> ${edit('personalDetails', 'phone', personalDetails.phone)}</span>
                        <span><i class="fas fa-map-marker-alt" style="color:var(--accent-color)"></i> ${edit('personalDetails', 'address', personalDetails.address)}</span>
                    </div>
                </div>
                ${summary ? `<div style="margin-bottom: 1.5rem;"><h3 style="color:var(--accent-color); text-transform:uppercase; font-size:0.9rem; border-bottom:1px solid var(--accent-border); margin-bottom:0.5rem; font-weight:700;">Summary</h3><p style="font-size:0.92rem; line-height:1.6;">${edit('summary', 'summary', summary)}</p></div>` : ''}
                ${experience.length > 0 ? `
                    <div style="margin-bottom: 1.5rem;">
                        <h3 style="color:var(--accent-color); text-transform:uppercase; font-size:0.9rem; border-bottom:1px solid var(--accent-border); margin-bottom:0.8rem; font-weight:700;">Experience</h3>
                        ${experience.map((exp, i) => `
                            <div style="margin-bottom: 1rem;">
                                <div style="display: flex; justify-content: space-between; font-weight: 700;">
                                    <span>${edit('experience', 'role', exp.role || 'Role', i)}</span>
                                    <span style="color: var(--accent-color); font-size: 0.8rem;">${edit('experience', 'startDate', exp.startDate, i)} - ${edit('experience', 'endDate', exp.endDate, i)}</span>
                                </div>
                                <div style="font-style: italic; font-size: 0.85rem; margin-bottom: 0.3rem;">${edit('experience', 'company', exp.company || 'Company', i)}</div>
                                <div style="font-size: 0.88rem; white-space: pre-line;">${edit('experience', 'description', exp.description || 'Job Description', i)}</div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    } else if (templateType === 'creative') {
        preview.innerHTML = `
            <div style="${containerStyle} display: grid; grid-template-columns: 260px 1fr; gap: 0;">
                <aside style="background: var(--accent-light); padding: 2rem; border-right: 1px solid var(--accent-border);">
                    <div style="width: 120px; height: 120px; background: #ddd; border-radius: 50%; margin: 0 auto 1.5rem; border: 4px solid #fff;"></div>
                    <h1 style="font-size: 1.8rem; font-weight: 800; text-align: center; line-height: 1.1; margin-bottom: 0.5rem;">${edit('personalDetails', 'name', personalDetails.name)}</h1>
                    <p style="text-align: center; color: var(--accent-color); font-weight: 600; font-size: 0.85rem; margin-bottom: 2rem;">${edit('personalDetails', 'jobTitle', personalDetails.jobTitle)}</p>
                    
                    <div style="margin-bottom: 2rem;">
                        <h4 style="font-size: 0.75rem; color: var(--accent-color); letter-spacing: 1px; margin-bottom: 1rem; border-bottom: 1px solid var(--accent-border); padding-bottom: 0.3rem;">CONTACT</h4>
                        <div style="font-size: 0.8rem; display: flex; flex-direction: column; gap: 0.6rem;">
                            <div><i class="fas fa-envelope" style="width:20px"></i> ${edit('personalDetails', 'email', personalDetails.email)}</div>
                            <div><i class="fas fa-phone" style="width:20px"></i> ${edit('personalDetails', 'phone', personalDetails.phone)}</div>
                            <div><i class="fas fa-map-marker-alt" style="width:20px"></i> ${edit('personalDetails', 'address', personalDetails.address)}</div>
                        </div>
                    </div>

                    <div>
                        <h4 style="font-size: 0.75rem; color: var(--accent-color); letter-spacing: 1px; margin-bottom: 1rem; border-bottom: 1px solid var(--accent-border); padding-bottom: 0.3rem;">SKILLS</h4>
                        <div style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.85rem;">
                            ${skills.map((s, i) => `<div>• ${edit('skills', '', s, i)}</div>`).join('')}
                        </div>
                    </div>
                </aside>
                <main style="padding: 2.5rem;">
                    <section style="margin-bottom: 2.5rem;">
                        <h3 style="color: var(--accent-color); font-size: 1.1rem; border-bottom: 2px solid var(--accent-color); display: inline-block; padding-bottom: 0.2rem; margin-bottom: 1rem;">ABOUT ME</h3>
                        <p style="font-size: 0.95rem; line-height: 1.7;">${edit('summary', 'summary', summary)}</p>
                    </section>
                    <section>
                         <h3 style="color: var(--accent-color); font-size: 1.1rem; border-bottom: 2px solid var(--accent-color); display: inline-block; padding-bottom: 0.2rem; margin-bottom: 1rem;">EXPERIENCE</h3>
                         ${experience.map((exp, i) => `
                            <div style="margin-bottom: 1.5rem;">
                                <div style="display: flex; justify-content: space-between; font-weight: 800;">
                                    <span style="font-size: 1.05rem;">${edit('experience', 'role', exp.role, i)}</span>
                                    <span style="font-size: 0.8rem; color: #64748b;">${exp.startDate} - ${exp.endDate}</span>
                                </div>
                                <div style="color: var(--accent-color); font-weight: 700; font-size: 0.9rem; margin: 0.2rem 0 0.5rem;">${edit('experience', 'company', exp.company, i)}</div>
                                <p style="font-size: 0.92rem;">${edit('experience', 'description', exp.description, i)}</p>
                            </div>
                         `).join('')}
                    </section>
                </main>
            </div>
        `;
    } else if (templateType === 'classic') {
        preview.innerHTML = `
            <div style="${containerStyle} padding: 3rem; font-family: 'Times New Roman', serif;">
                <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 1rem; margin-bottom: 2rem;">
                    <h1 style="font-size: 2.5rem; text-transform: uppercase; margin-bottom: 0.5rem;">${edit('personalDetails', 'name', personalDetails.name || 'Your Name')}</h1>
                    <div style="font-size: 0.95rem; font-style: italic;">
                        ${edit('personalDetails', 'address', personalDetails.address)} • ${edit('personalDetails', 'phone', personalDetails.phone)} • ${edit('personalDetails', 'email', personalDetails.email)}
                    </div>
                </div>
                
                <section style="margin-bottom: 2rem;">
                    <h3 style="font-size: 1.1rem; border-bottom: 1px solid #333; padding-bottom: 0.1rem; margin-bottom: 0.8rem; font-weight: bold;">PROFESSIONAL SUMMARY</h3>
                    <p style="font-size: 1rem; line-height: 1.5; text-align: justify;">${edit('summary', 'summary', summary)}</p>
                </section>

                <section style="margin-bottom: 2rem;">
                    <h3 style="font-size: 1.1rem; border-bottom: 1px solid #333; padding-bottom: 0.1rem; margin-bottom: 1rem; font-weight: bold;">EXPERIENCE</h3>
                    ${experience.map((exp, i) => `
                        <div style="margin-bottom: 1.2rem;">
                            <div style="display: flex; justify-content: space-between; font-weight: bold;">
                                <span>${edit('experience', 'company', exp.company, i)}</span>
                                <span>${exp.startDate} - ${exp.endDate}</span>
                            </div>
                            <div style="font-style: italic; margin-bottom: 0.3rem;">${edit('experience', 'role', exp.role, i)}</div>
                            <p style="font-size: 0.95rem;">${edit('experience', 'description', exp.description, i)}</p>
                        </div>
                    `).join('')}
                </section>

                <section>
                    <h3 style="font-size: 1.1rem; border-bottom: 1px solid #333; padding-bottom: 0.1rem; margin-bottom: 1rem; font-weight: bold;">EDUCATION</h3>
                    ${education.map((edu, i) => `
                        <div style="margin-bottom: 0.8rem; display: flex; justify-content: space-between;">
                            <div><strong>${edit('education', 'institution', edu.institution, i)}</strong>, ${edit('education', 'degree', edu.degree, i)}</div>
                            <div style="font-style: italic;">${edu.endDate}</div>
                        </div>
                    `).join('')}
                </section>
            </div>
        `;
    } else if (templateType === 'minimalist') {
        preview.innerHTML = `
            <div style="${containerStyle} padding: 3rem; text-align: center;">
                <div style="margin-bottom: 3rem;">
                    <h1 style="font-size: 3rem; margin-bottom: 0.5rem; letter-spacing: -1.5px; color: #0f172a;">${edit('personalDetails', 'name', personalDetails.name || 'Your Name')}</h1>
                    <h3 style="color: var(--accent-color); font-weight: 500; text-transform: uppercase; letter-spacing: 4px; font-size: 0.9rem;">${edit('personalDetails', 'jobTitle', personalDetails.jobTitle)}</h3>
                    <div style="margin-top: 1rem; font-size: 0.85rem; color: #64748b; display: flex; justify-content: center; gap: 1.5rem;">
                        <span>${edit('personalDetails', 'email', personalDetails.email)}</span>
                        <span style="color: #e2e8f0;">|</span>
                        <span>${edit('personalDetails', 'phone', personalDetails.phone)}</span>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 4rem; text-align: left; border-top: 1px solid #f1f5f9; padding-top: 3rem;">
                    <aside>
                        <h4 style="color: var(--accent-color); font-size: 0.75rem; font-weight: 900; letter-spacing: 2px; margin-bottom: 1.5rem;">SKILLS</h4>
                        <div style="display: flex; flex-direction: column; gap: 0.6rem; font-size: 0.9rem;">
                            ${skills.map((s, i) => `<div>• ${edit('skills', '', s, i)}</div>`).join('')}
                        </div>
                    </aside>
                    <main>
                        <h4 style="color: var(--accent-color); font-size: 0.75rem; font-weight: 900; letter-spacing: 2px; margin-bottom: 1.5rem;">EXPERIENCE</h4>
                        ${experience.map((exp, i) => `
                            <div style="margin-bottom: 2.5rem;">
                                <div style="display: flex; justify-content: space-between; font-weight: 700; margin-bottom: 0.4rem;">
                                    <span style="font-size: 1.1rem;">${edit('experience', 'role', exp.role, i)}</span>
                                    <span style="font-weight: 500; font-size: 0.8rem; color: #94a3b8;">${exp.startDate} - ${exp.endDate}</span>
                                </div>
                                <div style="font-style: italic; font-size: 0.9rem; color: var(--accent-color); margin-bottom: 0.8rem;">${edit('experience', 'company', exp.company, i)}</div>
                                <p style="font-size: 0.95rem; color: #475569; line-height: 1.7;">${edit('experience', 'description', exp.description, i)}</p>
                            </div>
                        `).join('')}
                    </main>
                </div>
            </div>
        `;
    } else if (templateType === 'executive') {
        preview.innerHTML = `
            <div style="${containerStyle} border: 1px solid #e2e8f0; position: relative;">
                <div style="background: var(--accent-color); height: 12px; width: 100%;"></div>
                <div style="padding: 4rem;">
                    <header style="margin-bottom: 4rem; text-align: center;">
                        <h1 style="font-size: 3.5rem; font-weight: 900; color: #0f172a; margin-bottom: 0.5rem; text-transform: uppercase;">${edit('personalDetails', 'name', personalDetails.name || 'Your Name')}</h1>
                        <h2 style="font-size: 1.2rem; color: var(--accent-color); font-weight: 700; text-transform: uppercase; letter-spacing: 6px; margin-bottom: 2rem;">${edit('personalDetails', 'jobTitle', personalDetails.jobTitle || 'Executive Profile')}</h2>
                        <div style="display: flex; justify-content: center; gap: 2rem; font-size: 0.85rem; color: #64748b; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; padding: 1rem 0;">
                            <span>${edit('personalDetails', 'email', personalDetails.email)}</span>
                            <span>${edit('personalDetails', 'phone', personalDetails.phone)}</span>
                        </div>
                    </header>
                    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 4rem; text-align: left;">
                        <section>
                            <h3 style="font-size: 1.1rem; font-weight: 800; border-bottom: 2px solid #0f172a; padding-bottom: 0.5rem; margin-bottom: 1.5rem;">PROFESSIONAL EXPERIENCE</h3>
                            ${experience.map((exp, i) => `
                                <div style="margin-bottom: 2.5rem;">
                                    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.5rem;">
                                        <h4 style="font-size: 1.2rem; font-weight: 800;">${edit('experience', 'role', exp.role, i)}</h4>
                                        <span style="font-size: 0.85rem; color: #64748b;">${exp.startDate} — ${exp.endDate}</span>
                                    </div>
                                    <div style="font-weight: 700; color: var(--accent-color); margin-bottom: 1rem;">${edit('experience', 'company', exp.company, i)}</div>
                                    <div style="font-size: 0.95rem; color: #334155; line-height: 1.7;">${edit('experience', 'description', exp.description, i)}</div>
                                </div>
                            `).join('')}
                        </section>
                        <aside>
                            <h3 style="font-size: 1.1rem; font-weight: 800; border-bottom: 2px solid #0f172a; padding-bottom: 0.5rem; margin-bottom: 1.5rem;">EXPERT SKILLS</h3>
                            <div style="display: flex; flex-direction: column; gap: 0.8rem; font-size: 0.95rem;">
                                ${skills.map((s, i) => `<div>• ${edit('skills', '', s, i)}</div>`).join('')}
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
        `;
    } else {
        // Fallback for ANY OTHER admin template: use a centered high-quality transparent layout
        preview.innerHTML = `
            <div style="${containerStyle} padding: 4rem; text-align: center;">
                 <h1 style="font-size: 4rem; font-weight: 900; margin-bottom: 0.5rem; color: #1e293b;">${edit('personalDetails', 'name', personalDetails.name || 'Your Name')}</h1>
                 <h2 style="font-size: 1.5rem; color: var(--accent-color); font-weight: 600; margin-bottom: 3rem; text-transform: uppercase; letter-spacing: 2px;">${edit('personalDetails', 'jobTitle', personalDetails.jobTitle || 'Your Profession')}</h2>
                 
                 <div style="max-width: 800px; margin: 0 auto; text-align: left;">
                    <section style="margin-bottom: 4rem;">
                        <h3 style="font-size: 1.2rem; border-bottom: 2px solid var(--accent-color); display: inline-block; padding-bottom: 0.3rem; margin-bottom: 1.5rem;">SUMMARY</h3>
                        <p style="font-size: 1.1rem; line-height: 1.8; color: #475569;">${edit('summary', 'summary', summary || 'Click here to start writing your professional summary...')}</p>
                    </section>

                    <section>
                         <h3 style="font-size: 1.2rem; border-bottom: 2px solid var(--accent-color); display: inline-block; padding-bottom: 0.3rem; margin-bottom: 2rem;">KEY EXPERIENCE</h3>
                         ${experience.length > 0 ? experience.map((exp, i) => `
                            <div style="margin-bottom: 2.5rem;">
                                <div style="display: flex; justify-content: space-between; align-items: baseline;">
                                    <h4 style="font-size: 1.3rem; font-weight: 800;">${edit('experience', 'role', exp.role, i)}</h4>
                                    <span style="color: #94a3b8;">${exp.startDate} - ${exp.endDate}</span>
                                </div>
                                <div style="color: var(--accent-color); font-weight: 700; margin-bottom: 0.8rem;">${edit('experience', 'company', exp.company, i)}</div>
                                <p style="font-size: 1rem; line-height: 1.7;">${edit('experience', 'description', exp.description, i)}</p>
                            </div>
                         `).join('') : '<p style="color:#94a3b8; font-style:italic;">Add your experience in the sidebar to see it appear here...</p>'}
                    </section>
                 </div>
            </div>
        `;
    }
}

// REST OF CRUD
async function saveResume() {
    showLoader(true);
    try {
        if (resumeId) { await api.resumes.update(resumeId, resumeData); showToast('Changes saved successfully'); }
        else { const d = await api.resumes.create(resumeData); window.location.href = `/builder?id=${d._id}`; }
    } catch (err) { showToast(err.message, 'error'); } finally { showLoader(false); }
}

async function downloadPDF() {
    const el = document.getElementById('resume-preview');
    showLoader(true);
    try {
        const canvas = await html2canvas(el, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jspdf.jsPDF('p', 'mm', 'a4');
        const w = pdf.internal.pageSize.getWidth();
        const h = (canvas.height * w) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, w, h);
        pdf.save(`${resumeData.personalDetails.name || 'resume'}.pdf`);
    } catch (err) { console.error(err); showToast('PDF generation failed', 'error'); } finally { showLoader(false); }
}

function addEducation(data = { institution: '', degree: '', startDate: '', endDate: '' }) {
    const container = document.getElementById('education-list');
    const index = container.children.length;
    const div = document.createElement('div');
    div.className = 'dynamic-item';
    div.innerHTML = `<div class="grid-2"><input type="text" placeholder="Institution" value="${data.institution}" oninput="updateListItem(this, 'education', ${index}, 'institution')"><input type="text" placeholder="Degree" value="${data.degree}" oninput="updateListItem(this, 'education', ${index}, 'degree')"></div>`;
    container.appendChild(div);
    if (!resumeData.education[index]) resumeData.education.push(data);
    renderPreview();
}

function addExperience(data = { company: '', role: '', startDate: '', endDate: '', description: '' }) {
    const container = document.getElementById('experience-list');
    const index = container.children.length;
    const div = document.createElement('div');
    div.className = 'dynamic-item';
    div.innerHTML = `<input type="text" placeholder="Role" value="${data.role}" oninput="updateListItem(this, 'experience', ${index}, 'role')"><textarea placeholder="Desc" oninput="updateListItem(this, 'experience', ${index}, 'description')">${data.description}</textarea>`;
    container.appendChild(div);
    if (!resumeData.experience[index]) resumeData.experience.push(data);
    renderPreview();
}

function updateListItem(el, sec, idx, fld) {
    if (!resumeData[sec][idx]) resumeData[sec][idx] = {};
    resumeData[sec][idx][fld] = el.value;
    renderPreview();
}
