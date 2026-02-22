// Check authentication
if (!localStorage.getItem('token')) {
    window.location.href = '/login';
}

const urlParams = new URLSearchParams(window.location.search);
const resumeId = urlParams.get('id');
const urlTemplate = urlParams.get('template') || 'modern';
const urlColor = urlParams.get('color') || '#2563EB';

// Apply chosen color as primary
document.documentElement.style.setProperty('--primary-color', decodeURIComponent(urlColor));
document.documentElement.style.setProperty('--primary-hover', decodeURIComponent(urlColor));

let resumeData = {
    personalDetails: {
        name: '',
        jobTitle: '',
        email: '',
        phone: '',
        address: '',
        linkedin: '',
        github: ''
    },
    summary: '',
    education: [],
    experience: [],
    projects: [],
    skills: [],
    certifications: [],
    languages: [],
    templateType: urlTemplate,
    accentColor: decodeURIComponent(urlColor)
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    if (resumeId) {
        try {
            showLoader(true);
            const data = await api.resumes.getById(resumeId);
            resumeData = data;
            fillForm();
            renderPreview();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            showLoader(false);
        }
    } else {
        renderPreview();
    }

    // Set up event listeners for inputs
    document.querySelectorAll('.live-input').forEach(input => {
        input.addEventListener('input', updateDataAndPreview);
    });

    document.getElementById('template-select').addEventListener('change', (e) => {
        resumeData.templateType = e.target.value;
        renderPreview();
    });

    document.getElementById('save-btn').addEventListener('click', saveResume);
    document.getElementById('download-btn').addEventListener('click', downloadPDF);
});

function updateDataAndPreview(e) {
    const { name, value } = e.target;

    if (['name', 'jobTitle', 'email', 'phone', 'address', 'linkedin', 'github'].includes(name)) {
        resumeData.personalDetails[name] = value;
    } else if (name === 'skills' || name === 'certifications' || name === 'languages') {
        resumeData[name] = value.split(',').map(s => s.trim()).filter(s => s !== '');
    } else {
        resumeData[name] = value;
    }

    renderPreview();
}

function fillForm() {
    // Fill basic info
    for (const key in resumeData.personalDetails) {
        const input = document.querySelector(`input[name="${key}"]`);
        if (input) input.value = resumeData.personalDetails[key];
    }

    document.querySelector(`textarea[name="summary"]`).value = resumeData.summary || '';
    document.querySelector(`input[name="skills"]`).value = (resumeData.skills || []).join(', ');
    document.querySelector(`input[name="certifications"]`).value = (resumeData.certifications || []).join(', ');
    document.querySelector(`input[name="languages"]`).value = (resumeData.languages || []).join(', ');
    document.getElementById('template-select').value = resumeData.templateType || 'modern';

    // Fill dynamic lists
    const eduList = document.getElementById('education-list');
    eduList.innerHTML = '';
    (resumeData.education || []).forEach((edu, index) => addEducation(edu));

    const expList = document.getElementById('experience-list');
    expList.innerHTML = '';
    (resumeData.experience || []).forEach((exp, index) => addExperience(exp));

    const projList = document.getElementById('projects-list');
    projList.innerHTML = '';
    (resumeData.projects || []).forEach((proj, index) => addProject(proj));
}

// Dynamic Sections Handlers
function addEducation(data = { institution: '', degree: '', startDate: '', endDate: '', description: '' }) {
    const container = document.getElementById('education-list');
    const index = container.children.length;
    const div = document.createElement('div');
    div.className = 'dynamic-item';
    div.innerHTML = `
        <span class="remove-btn" onclick="removeItem(this, 'education')">&times;</span>
        <div class="grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
                <input type="text" placeholder="Institution" value="${data.institution}" oninput="updateListItem(this, 'education', ${index}, 'institution')">
            </div>
            <div class="form-group">
                <input type="text" placeholder="Degree" value="${data.degree}" oninput="updateListItem(this, 'education', ${index}, 'degree')">
            </div>
        </div>
        <div class="grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
                <input type="text" placeholder="Start Date" value="${data.startDate}" oninput="updateListItem(this, 'education', ${index}, 'startDate')">
            </div>
            <div class="form-group">
                <input type="text" placeholder="End Date" value="${data.endDate}" oninput="updateListItem(this, 'education', ${index}, 'endDate')">
            </div>
        </div>
    `;
    container.appendChild(div);
    if (!resumeData.education[index]) resumeData.education.push(data);
    renderPreview();
}

function addExperience(data = { company: '', role: '', startDate: '', endDate: '', description: '' }) {
    const container = document.getElementById('experience-list');
    const index = container.children.length;
    const div = document.createElement('div');
    div.className = 'dynamic-item';
    div.innerHTML = `
        <span class="remove-btn" onclick="removeItem(this, 'experience')">&times;</span>
        <div class="grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
                <input type="text" placeholder="Company" value="${data.company}" oninput="updateListItem(this, 'experience', ${index}, 'company')">
            </div>
            <div class="form-group">
                <input type="text" placeholder="Role" value="${data.role}" oninput="updateListItem(this, 'experience', ${index}, 'role')">
            </div>
        </div>
        <div class="grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
                <input type="text" placeholder="Start Date" value="${data.startDate}" oninput="updateListItem(this, 'experience', ${index}, 'startDate')">
            </div>
            <div class="form-group">
                <input type="text" placeholder="End Date" value="${data.endDate}" oninput="updateListItem(this, 'experience', ${index}, 'endDate')">
            </div>
        </div>
        <div class="form-group">
            <textarea placeholder="Description" oninput="updateListItem(this, 'experience', ${index}, 'description')">${data.description}</textarea>
        </div>
    `;
    container.appendChild(div);
    if (!resumeData.experience[index]) resumeData.experience.push(data);
    renderPreview();
}

function addProject(data = { title: '', link: '', description: '' }) {
    const container = document.getElementById('projects-list');
    const index = container.children.length;
    const div = document.createElement('div');
    div.className = 'dynamic-item';
    div.innerHTML = `
        <span class="remove-btn" onclick="removeItem(this, 'projects')">&times;</span>
        <div class="grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
                <input type="text" placeholder="Project Title" value="${data.title}" oninput="updateListItem(this, 'projects', ${index}, 'title')">
            </div>
            <div class="form-group">
                <input type="text" placeholder="Link" value="${data.link}" oninput="updateListItem(this, 'projects', ${index}, 'link')">
            </div>
        </div>
        <div class="form-group">
            <textarea placeholder="Description" oninput="updateListItem(this, 'projects', ${index}, 'description')">${data.description}</textarea>
        </div>
    `;
    container.appendChild(div);
    if (!resumeData.projects[index]) resumeData.projects.push(data);
    renderPreview();
}

function updateListItem(el, section, index, field) {
    resumeData[section][index][field] = el.value;
    renderPreview();
}

function removeItem(el, section) {
    const item = el.parentElement;
    const container = item.parentElement;
    const index = Array.from(container.children).indexOf(item);
    resumeData[section].splice(index, 1);
    item.remove();

    // Refresh indices of remaining items
    Array.from(container.children).forEach((child, i) => {
        child.querySelectorAll('input, textarea').forEach(input => {
            const currentOnInput = input.getAttribute('oninput');
            const newOnInput = currentOnInput.replace(/,\s*\d+\s*,/, `, ${i},`);
            input.setAttribute('oninput', newOnInput);
        });
    });

    renderPreview();
}

// Preview Rendering
function renderPreview() {
    const preview = document.getElementById('resume-preview');
    const { personalDetails, summary, education, experience, projects, skills, certifications, languages, templateType } = resumeData;

    // Helper functions for shared sections
    const getSkillsHtml = (style = "") => skills.length > 0 ? `
        <div style="margin-bottom: 1.5rem; ${style}">
            <h3 style="color: inherit; text-transform: uppercase; font-size: 1rem; border-bottom: 1px solid rgba(0,0,0,0.1); margin-bottom: 0.5rem; padding-bottom: 0.2rem;">Skills</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.5rem;">
                ${skills.map(skill => `<span style="background: rgba(0,0,0,0.05); padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.85rem;">${skill}</span>`).join('')}
            </div>
        </div>
    ` : '';

    const getLanguagesHtml = () => languages.length > 0 ? `
        <div style="margin-bottom: 1.5rem;">
            <h3 style="color: inherit; text-transform: uppercase; font-size: 1rem; border-bottom: 1px solid rgba(0,0,0,0.1); margin-bottom: 0.5rem; padding-bottom: 0.2rem;">Languages</h3>
            <p style="font-size: 0.9rem;">${languages.join(', ')}</p>
        </div>
    ` : '';

    if (templateType === 'modern') {
        preview.innerHTML = `
            <div style="border-bottom: 2px solid var(--primary-color); padding-bottom: 1rem; margin-bottom: 1.5rem;">
                <h1 style="font-size: 2.5rem; color: var(--text-dark); margin-bottom: 0.2rem;">${personalDetails.name || 'Your Name'}</h1>
                <h3 style="color: var(--primary-color); font-weight: 500;">${personalDetails.jobTitle || 'Job Title'}</h3>
                <div style="display: flex; gap: 1rem; margin-top: 0.5rem; flex-wrap: wrap; color: var(--text-muted); font-size: 0.9rem;">
                    ${personalDetails.email ? `<span><i class="fas fa-envelope"></i> ${personalDetails.email}</span>` : ''}
                    ${personalDetails.phone ? `<span><i class="fas fa-phone"></i> ${personalDetails.phone}</span>` : ''}
                    ${personalDetails.address ? `<span><i class="fas fa-map-marker-alt"></i> ${personalDetails.address}</span>` : ''}
                    ${personalDetails.linkedin ? `<span><i class="fab fa-linkedin"></i> ${personalDetails.linkedin}</span>` : ''}
                    ${personalDetails.github ? `<span><i class="fab fa-github"></i> ${personalDetails.github}</span>` : ''}
                </div>
            </div>

            ${summary ? `
                <div style="margin-bottom: 1.5rem;">
                    <h3 style="color: var(--primary-color); text-transform: uppercase; font-size: 1rem; border-bottom: 1px solid var(--border-color); margin-bottom: 0.5rem; padding-bottom: 0.2rem;">Summary</h3>
                    <p style="font-size: 0.95rem;">${summary}</p>
                </div>
            ` : ''}

            ${experience.length > 0 ? `
                <div style="margin-bottom: 1.5rem;">
                    <h3 style="color: var(--primary-color); text-transform: uppercase; font-size: 1rem; border-bottom: 1px solid var(--border-color); margin-bottom: 0.8rem; padding-bottom: 0.2rem;">Experience</h3>
                    ${experience.map(exp => `
                        <div style="margin-bottom: 1rem;">
                            <div style="display: flex; justify-content: space-between; font-weight: 700;">
                                <span>${exp.role || 'Role'}</span>
                                <span style="font-weight: 400; color: var(--text-muted);">${exp.startDate} - ${exp.endDate}</span>
                            </div>
                            <div style="font-style: italic; color: var(--text-muted); margin-bottom: 0.3rem;">${exp.company || 'Company'}</div>
                            <p style="white-space: pre-line; font-size: 0.9rem;">${exp.description}</p>
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            ${education.length > 0 ? `
                <div style="margin-bottom: 1.5rem;">
                    <h3 style="color: var(--primary-color); text-transform: uppercase; font-size: 1rem; border-bottom: 1px solid var(--border-color); margin-bottom: 0.8rem; padding-bottom: 0.2rem;">Education</h3>
                    ${education.map(edu => `
                        <div style="margin-bottom: 0.8rem;">
                            <div style="display: flex; justify-content: space-between; font-weight: 700;">
                                <span>${edu.degree || 'Degree'}</span>
                                <span style="font-weight: 400; color: var(--text-muted);">${edu.startDate} - ${edu.endDate}</span>
                            </div>
                            <div style="color: var(--text-muted);">${edu.institution || 'Institution'}</div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                <div>
                    ${getSkillsHtml("color: var(--primary-color);")}
                </div>
                <div>
                     ${getLanguagesHtml()}
                </div>
            </div>
        `;
    } else if (templateType === 'minimalist') {
        preview.innerHTML = `
            <div style="text-align: center; margin-bottom: 2rem;">
                <h1 style="font-size: 3rem; margin-bottom: 0.5rem;">${personalDetails.name || 'Your Name'}</h1>
                <div style="display: flex; justify-content: center; gap: 1rem; font-size: 0.9rem; color: var(--text-muted);">
                    ${personalDetails.email} | ${personalDetails.phone} | ${personalDetails.address}
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 2rem;">
                <div style="border-right: 1px solid var(--border-color); padding-right: 1.5rem;">
                    <section style="margin-bottom: 2rem;">
                        <h4 style="border-bottom: 1px solid var(--text-dark); padding-bottom: 0.2rem; margin-bottom: 1rem;">SKILLS</h4>
                        <ul style="list-style: none; font-size: 0.9rem;">
                            ${skills.map(s => `<li style="margin-bottom: 0.3rem;">${s}</li>`).join('')}
                        </ul>
                    </section>

                    <section style="margin-bottom: 2rem;">
                        <h4 style="border-bottom: 1px solid var(--text-dark); padding-bottom: 0.2rem; margin-bottom: 1rem;">EDUCATION</h4>
                         ${education.map(edu => `
                            <div style="margin-bottom: 1rem; font-size: 0.85rem;">
                                <div style="font-weight: 700;">${edu.degree}</div>
                                <div>${edu.institution}</div>
                                <div style="color: var(--text-muted);">${edu.startDate} - ${edu.endDate}</div>
                            </div>
                        `).join('')}
                    </section>
                </div>

                <div>
                    <section style="margin-bottom: 2rem;">
                        <h4 style="border-bottom: 1px solid var(--text-dark); padding-bottom: 0.2rem; margin-bottom: 1rem;">EXPERIENCE</h4>
                        ${experience.map(exp => `
                            <div style="margin-bottom: 1.5rem;">
                                <div style="display: flex; justify-content: space-between;">
                                    <span style="font-weight: 700;">${exp.role}</span>
                                    <span>${exp.startDate} - ${exp.endDate}</span>
                                </div>
                                <div style="font-style: italic;">${exp.company}</div>
                                <p style="font-size: 0.9rem; margin-top: 0.5rem;">${exp.description}</p>
                            </div>
                        `).join('')}
                    </section>

                    <section>
                        <h4 style="border-bottom: 1px solid var(--text-dark); padding-bottom: 0.2rem; margin-bottom: 1rem;">PROJECTS</h4>
                         ${projects.map(p => `
                            <div style="margin-bottom: 1rem;">
                                <div style="font-weight: 700;">${p.title}</div>
                                <p style="font-size: 0.9rem;">${p.description}</p>
                            </div>
                        `).join('')}
                    </section>
                </div>
            </div>
        `;
    } else if (templateType === 'classic') {
        preview.innerHTML = `
            <div style="text-align: center; border-bottom: 1px solid #000; padding-bottom: 1rem; margin-bottom: 1rem;">
                <h1 style="font-size: 2rem; text-transform: uppercase;">${personalDetails.name || 'Your Name'}</h1>
                <p style="font-size: 1rem; margin-top: 5px;">
                    ${personalDetails.address || ''} | ${personalDetails.phone || ''} | ${personalDetails.email || ''}
                </p>
            </div>

            ${summary ? `
                <div style="margin-bottom: 1rem;">
                    <h3 style="font-size: 1.1rem; border-bottom: 1px solid #000; margin-bottom: 0.5rem;">PROFESSIONAL SUMMARY</h3>
                    <p style="font-size: 0.95rem;">${summary}</p>
                </div>
            ` : ''}

            ${experience.length > 0 ? `
                <div style="margin-bottom: 1rem;">
                    <h3 style="font-size: 1.1rem; border-bottom: 1px solid #000; margin-bottom: 0.5rem;">EXPERIENCE</h3>
                    ${experience.map(exp => `
                        <div style="margin-bottom: 0.8rem;">
                            <div style="display: flex; justify-content: space-between;">
                                <strong>${exp.company}</strong>
                                <span>${exp.startDate} - ${exp.endDate}</span>
                            </div>
                            <div style="font-style: italic;">${exp.role}</div>
                            <p style="font-size: 0.9rem; margin-top: 0.3rem;">${exp.description}</p>
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            ${education.length > 0 ? `
                <div style="margin-bottom: 1rem;">
                    <h3 style="font-size: 1.1rem; border-bottom: 1px solid #000; margin-bottom: 0.5rem;">EDUCATION</h3>
                    ${education.map(edu => `
                        <div style="margin-bottom: 0.5rem;">
                            <div style="display: flex; justify-content: space-between;">
                                <strong>${edu.institution}</strong>
                                <span>${edu.startDate} - ${edu.endDate}</span>
                            </div>
                            <div>${edu.degree}</div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            ${getSkillsHtml()}
        `;
    } else if (templateType === 'creative') {
        preview.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 2.5fr; min-height: 297mm; margin: -20mm; overflow: hidden;">
                <!-- Sidebar -->
                <div style="background: #2D3E50; color: white; padding: 2rem; display: flex; flex-direction: column; gap: 2rem;">
                    <div style="text-align: center;">
                        <h1 style="font-size: 1.8rem; line-height: 1.2; margin-bottom: 1rem;">${personalDetails.name || 'NAME'}</h1>
                        <p style="font-size: 1rem; opacity: 0.8; font-weight: 300;">${personalDetails.jobTitle || ''}</p>
                    </div>
                    
                    <div>
                        <h4 style="border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 0.5rem; margin-bottom: 1rem;">CONTACT</h4>
                        <div style="font-size: 0.85rem; display: flex; flex-direction: column; gap: 0.5rem;">
                             ${personalDetails.email ? `<div><i class="fas fa-envelope"></i> ${personalDetails.email}</div>` : ''}
                             ${personalDetails.phone ? `<div><i class="fas fa-phone"></i> ${personalDetails.phone}</div>` : ''}
                             ${personalDetails.linkedin ? `<div><i class="fab fa-linkedin"></i> ${personalDetails.linkedin}</div>` : ''}
                        </div>
                    </div>

                    <div>
                        <h4 style="border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 0.5rem; margin-bottom: 1rem;">SKILLS</h4>
                        <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
                            ${skills.map(s => `<span style="border: 1px solid rgba(255,255,255,0.3); padding: 0.2rem 0.5rem; border-radius: 20px; font-size: 0.75rem;">${s}</span>`).join('')}
                        </div>
                    </div>
                </div>

                <!-- Main Content -->
                <div style="padding: 3rem; background: white;">
                    ${summary ? `
                        <div style="margin-bottom: 2.5rem;">
                            <h2 style="color: #2D3E50; font-size: 1.5rem; margin-bottom: 1rem; display: flex; align-items: center; gap: 1rem;">
                                <span style="display: block; width: 40px; height: 1px; background: #2D3E50;"></span> SUMMARY
                            </h2>
                            <p style="color: #666; line-height: 1.6;">${summary}</p>
                        </div>
                    ` : ''}

                    ${experience.length > 0 ? `
                        <div style="margin-bottom: 2.5rem;">
                            <h2 style="color: #2D3E50; font-size: 1.5rem; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 1rem;">
                                <span style="display: block; width: 40px; height: 1px; background: #2D3E50;"></span> EXPERIENCE
                            </h2>
                            ${experience.map(exp => `
                                <div style="margin-bottom: 1.5rem; position: relative; padding-left: 1.5rem; border-left: 2px solid #EEE;">
                                    <div style="width: 12px; height: 12px; background: #2D3E50; border-radius: 50%; position: absolute; left: -7px; top: 5px;"></div>
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.3rem;">
                                        <h4 style="margin: 0; color: #333;">${exp.role}</h4>
                                        <span style="font-size: 0.8rem; color: #999;">${exp.startDate} - ${exp.endDate}</span>
                                    </div>
                                    <div style="color: #2D3E50; font-weight: 600; font-size: 0.9rem; margin-bottom: 0.5rem;">${exp.company}</div>
                                    <p style="color: #666; font-size: 0.85rem; margin: 0;">${exp.description}</p>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}

                    ${education.length > 0 ? `
                        <div>
                            <h2 style="color: #2D3E50; font-size: 1.5rem; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 1rem;">
                                <span style="display: block; width: 40px; height: 1px; background: #2D3E50;"></span> EDUCATION
                            </h2>
                            ${education.map(edu => `
                                <div style="margin-bottom: 1rem;">
                                    <h4 style="margin: 0; color: #333;">${edu.degree}</h4>
                                    <div style="color: #666; font-size: 0.9rem;">${edu.institution} | ${edu.startDate} - ${edu.endDate}</div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    } else if (templateType === 'executive') {
        preview.innerHTML = `
            <div style="border: 1px solid #EEE; padding: 2rem;">
                <div style="text-align: left; border-bottom: 4px solid #1A237E; padding-bottom: 1.5rem; margin-bottom: 2rem;">
                    <h1 style="font-size: 2.8rem; color: #1A237E; margin: 0; letter-spacing: -1px;">${personalDetails.name || 'NAME'}</h1>
                    <h2 style="font-size: 1.3rem; color: #555; margin-top: 0.5rem; font-weight: 300; letter-spacing: 2px; text-transform: uppercase;">${personalDetails.jobTitle || 'EXECUTIVE LEADER'}</h2>
                    <div style="display: flex; gap: 1.5rem; margin-top: 1rem; font-size: 0.85rem; color: #777;">
                        <span>${personalDetails.email}</span>
                        <span>${personalDetails.phone}</span>
                        <span>${personalDetails.address}</span>
                    </div>
                </div>

                ${summary ? `
                    <div style="margin-bottom: 2rem;">
                        <h3 style="background: #1A237E; color: white; padding: 0.3rem 1rem; font-size: 1rem; display: inline-block; margin-bottom: 1rem;">PROFILE</h3>
                        <p style="line-height: 1.6; color: #444;">${summary}</p>
                    </div>
                ` : ''}

                <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 2.5rem;">
                    <div>
                        ${experience.length > 0 ? `
                            <div style="margin-bottom: 2rem;">
                                <h3 style="border-bottom: 2px solid #1A237E; color: #1A237E; font-size: 1.1rem; padding-bottom: 0.3rem; margin-bottom: 1rem;">CAREER HISTORY</h3>
                                ${experience.map(exp => `
                                    <div style="margin-bottom: 1.5rem;">
                                        <div style="display: flex; justify-content: space-between; align-items: baseline;">
                                            <h4 style="margin: 0; font-size: 1.1rem; color: #222;">${exp.role}</h4>
                                            <span style="font-size: 0.8rem; font-weight: 700;">${exp.startDate} - ${exp.endDate}</span>
                                        </div>
                                        <div style="color: #1A237E; font-weight: 700; font-size: 0.95rem; margin-bottom: 0.5rem;">${exp.company}</div>
                                        <p style="color: #555; font-size: 0.9rem; line-height: 1.5;">${exp.description}</p>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                    <div>
                        ${skills.length > 0 ? `
                            <div style="margin-bottom: 2rem;">
                                <h3 style="border-bottom: 2px solid #1A237E; color: #1A237E; font-size: 1.1rem; padding-bottom: 0.3rem; margin-bottom: 1rem;">CORE COMPETENCIES</h3>
                                <ul style="padding-left: 1.2rem; font-size: 0.9rem; color: #444;">
                                    ${skills.map(s => `<li style="margin-bottom: 0.5rem;">${s}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}

                        ${education.length > 0 ? `
                            <div>
                                <h3 style="border-bottom: 2px solid #1A237E; color: #1A237E; font-size: 1.1rem; padding-bottom: 0.3rem; margin-bottom: 1rem;">ACADEMIC BACKGROUND</h3>
                                ${education.map(edu => `
                                    <div style="margin-bottom: 1rem; font-size: 0.85rem;">
                                        <div style="font-weight: 800;">${edu.degree}</div>
                                        <div style="color: #666;">${edu.institution}</div>
                                        <div style="color: #999;">${edu.startDate} - ${edu.endDate}</div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }
}

// API Actions
async function saveResume() {
    showLoader(true);
    try {
        if (resumeId) {
            await api.resumes.update(resumeId, resumeData);
            showToast('Resume updated successfully');
        } else {
            const data = await api.resumes.create(resumeData);
            showToast('Resume saved successfully');
            window.location.href = `/builder?id=${data._id}`;
        }
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        showLoader(false);
    }
}

async function downloadPDF() {
    const element = document.getElementById('resume-preview');
    const { personalDetails } = resumeData;
    const filename = `${(personalDetails.name || 'resume').replace(/\s+/g, '_')}_resume.pdf`;

    showLoader(true);
    try {
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false
        });

        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');

        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(filename);
        showToast('PDF downloaded successfully');
    } catch (err) {
        console.error(err);
        showToast('Error generating PDF', 'error');
    } finally {
        showLoader(false);
    }
}
