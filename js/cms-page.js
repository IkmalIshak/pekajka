(function () {
    const script = document.currentScript;
    const source = script && script.dataset ? script.dataset.content : '';
    if (!source) return;

    try {
        // This intentionally loads before each page's existing scripts run, so
        // their event listeners attach to the CMS-rendered content.
        const request = new XMLHttpRequest();
        request.open('GET', source, false);
        request.send(null);
        if (request.status && (request.status < 200 || request.status >= 300)) return;

        const data = JSON.parse(request.responseText);
        if (data.browser_title) document.title = data.browser_title;

        if (data.login_content) {
            renderLoginPage(data.login_content);
            return;
        }
        if (Array.isArray(data.home_slides) && Array.isArray(data.shortcuts)) {
            renderHomepage(data);
            return;
        }

        const hero = document.querySelector('.hero');
        if (hero) {
            const eyebrow = hero.querySelector('.hero-eyebrow');
            const title = hero.querySelector('h1');
            const description = hero.querySelector('.hero-desc');
            const tagline = hero.querySelector('.hero-tagline');
            if (eyebrow && data.hero_eyebrow !== undefined) eyebrow.textContent = data.hero_eyebrow;
            if (title && data.hero_title_html !== undefined) title.innerHTML = data.hero_title_html;
            if (description && data.hero_description_html !== undefined) description.innerHTML = data.hero_description_html;
            else if (description && data.hero_description !== undefined) description.textContent = data.hero_description;
            if (tagline && data.hero_tagline !== undefined) tagline.textContent = data.hero_tagline;
        }

        const main = document.querySelector('main.page-content');
        if (Array.isArray(data.headcount_sections)) {
            renderHeadcount(data);
            return;
        }
        if (main && Array.isArray(data.programs)) {
            renderTimetable(main, data);
            return;
        }
        if (main && Array.isArray(data.memos) && Array.isArray(data.resources)) {
            renderCourseInformation(main, data);
            return;
        }
        if (main && data.content_type === 'grouped_links' && Array.isArray(data.groups)) {
            renderGroupedLinks(main, data);
            return;
        }
        if (main && data.content_type === 'books' && Array.isArray(data.groups)) {
            renderBooks(main, data);
            return;
        }
        if (main && Array.isArray(data.profiles) && Array.isArray(data.elective_sections)) {
            renderStudyPrograms(main, data);
            return;
        }
        if (main && Array.isArray(data.professional_sections)) {
            renderProfessionalDevelopment(main, data);
            return;
        }
        if (main && Array.isArray(data.contacts)) {
            renderContactPage(main, data);
            return;
        }
        if (Array.isArray(data.cards) && data.section_title_html) {
            renderAcademicManagement(data);
            return;
        }
        if (main && Array.isArray(data.departments) && Array.isArray(data.units)) {
            renderEportfolio(main, data);
            return;
        }
        if (main && Array.isArray(data.staff) && data.organisation_image) {
            renderTaskSpecifications(main, data);
            return;
        }
        if (main && data.content_html) main.innerHTML = data.content_html;
        if (main && Array.isArray(data.sections) && data.sections.length) {
            data.sections.forEach((section) => main.appendChild(renderSection(section)));
        }
    } catch (error) {
        console.warn('CMS page data could not be loaded; showing the HTML fallback.', error);
    }

    function element(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text) node.textContent = text;
        return node;
    }

    function renderHomepage(data) {
        const hero = document.getElementById('heroSlider');
        if (hero) {
            hero.replaceChildren();
            const track = element('div', 'hero-slide-track');
            track.id = 'heroTrack';
            data.home_slides.forEach((slide, index) => {
                const node = slide.link ? element('a', `hero-slide${slide.type === 'calendar' ? ' hero-slide-calendar' : ''}`) : element('div', 'hero-slide');
                if (index === 0) node.classList.add('active');
                node.dataset.index = String(index);
                if (slide.link) {
                    node.href = slide.link;
                    node.target = '_blank';
                    node.rel = 'noopener';
                }
                node.appendChild(element('div', `hero-bg${slide.type === 'calendar' ? ' hero-bg-calendar' : ''}`));
                if (slide.calendar_embed_url) {
                    const calendarCard = element('div', 'hero-calendar-card');
                    const badge = element('div', 'hero-calendar-badge');
                    badge.innerHTML = `<span class="live-dot"></span> ${slide.calendar_badge || 'Kalendar Langsung'}`;
                    const frame = element('iframe');
                    frame.src = slide.calendar_embed_url;
                    frame.title = slide.calendar_badge || 'Kalendar';
                    frame.loading = 'lazy';
                    frame.style.border = '0';
                    frame.width = '100%';
                    frame.height = '380';
                    calendarCard.append(badge, frame);
                    node.appendChild(calendarCard);
                }
                const content = element('div', 'hero-content');
                content.appendChild(element('p', 'hero-eyebrow', slide.eyebrow || ''));
                const title = element('h1');
                title.innerHTML = slide.title_html || '';
                content.appendChild(title);
                const description = element('p', 'hero-desc');
                description.innerHTML = slide.description_html || '';
                content.appendChild(description);
                if (slide.tagline) content.appendChild(element('span', 'hero-tagline', slide.tagline));
                node.appendChild(content);
                track.appendChild(node);
            });
            hero.appendChild(track);
            const dots = element('div', 'hero-dots');
            data.home_slides.forEach((slide, index) => {
                const dot = element('button', `hero-dot${index === 0 ? ' active' : ''}`);
                dot.type = 'button';
                dot.setAttribute('onclick', `goToSlide(${index})`);
                dot.setAttribute('aria-label', `Slaid ${index + 1}`);
                dots.appendChild(dot);
            });
            const previous = element('button', 'hero-arrow hero-arrow-prev', '‹');
            previous.type = 'button';
            previous.setAttribute('onclick', 'prevSlide()');
            previous.setAttribute('aria-label', 'Slaid sebelumnya');
            const next = element('button', 'hero-arrow hero-arrow-next', '›');
            next.type = 'button';
            next.setAttribute('onclick', 'nextSlide()');
            next.setAttribute('aria-label', 'Slaid seterusnya');
            hero.append(dots, previous, next);
        }

        const shortcutsSection = document.querySelector('.shortcuts-grid')?.closest('section');
        if (shortcutsSection) {
            shortcutsSection.replaceChildren();
            const header = element('div', 'section-header');
            const titleWrap = element('div');
            titleWrap.appendChild(element('p', 'section-eyebrow', data.shortcuts_eyebrow || ''));
            const title = element('h2', 'section-title');
            title.innerHTML = data.shortcuts_title_html || '';
            titleWrap.appendChild(title);
            header.appendChild(titleWrap);
            const grid = element('div', 'shortcuts-grid');
            data.shortcuts.forEach((item) => {
                const card = element('a', 'shortcut-card');
                card.href = item.link || '#';
                if (item.image) {
                    const image = element('img');
                    image.src = item.image;
                    image.alt = item.title || '';
                    card.appendChild(image);
                }
                card.appendChild(element('span', 'shortcut-card-title', item.title));
                grid.appendChild(card);
            });
            shortcutsSection.append(header, grid);
        }

        const aboutSection = document.querySelector('.photo-feature');
        if (aboutSection && data.about) {
            aboutSection.replaceChildren();
            const imageWrap = element('div', 'photo-feature-img');
            const image = element('img');
            image.src = data.about.image || '';
            image.alt = data.about.title || '';
            imageWrap.appendChild(image);
            const content = element('div', 'photo-feature-content');
            content.append(element('p', 'section-eyebrow', data.about.eyebrow || ''), element('h2', 'section-title', data.about.title || ''), element('p', '', data.about.description || ''));
            if (data.about.button_link) {
                const link = element('a', 'btn-white', data.about.button_text || 'Ketahui Lebih Lanjut →');
                link.href = data.about.button_link;
                content.appendChild(link);
            }
            aboutSection.append(imageWrap, content);
        }

        const locationSection = document.querySelector('.location-section');
        if (locationSection && data.location) {
            locationSection.replaceChildren();
            const info = element('div', 'location-info');
            info.append(element('p', 'section-eyebrow', data.location.eyebrow || ''), element('h2', '', data.location.title || ''), element('p', '', data.location.description || ''));
            (data.location.details || []).forEach((detail) => {
                const row = element('div', 'location-detail');
                row.append(element('span', 'icon', detail.icon || ''), element('span', '', detail.text || ''));
                info.appendChild(row);
            });
            const map = element('div', 'location-map');
            if (data.location.map_embed_url) {
                const frame = element('iframe');
                frame.src = data.location.map_embed_url;
                frame.loading = 'lazy';
                frame.allowFullscreen = true;
                frame.title = data.location.title || 'Lokasi';
                map.appendChild(frame);
            }
            locationSection.append(info, map);
        }
    }

    function renderLoginPage(content) {
        const mappings = [
            ['.login-badge', 'badge'],
            ['.login-eyebrow', 'eyebrow'],
            ['.login-title', 'title'],
            ['.login-desc', 'description'],
            ['#loading-msg', 'loading_message'],
            ['#error-msg', 'error_message'],
            ['.login-hint', 'hint']
        ];
        mappings.forEach(([selector, field]) => {
            const node = document.querySelector(selector);
            if (node && content[field] !== undefined) node.textContent = content[field];
        });
    }

    function renderContactPage(main, data) {
        main.replaceChildren();
        renderPageHeader(main, data);
        const header = element('div', 'contact-header');
        header.append(element('h2', '', data.department_name || ''), element('div', 'sub', data.department_subtitle || ''));
        main.appendChild(header);
        const grid = element('div', 'contact-grid');
        data.contacts.forEach((contact) => {
            const card = element('div', 'contact-card');
            card.append(element('div', 'position', contact.position || ''), element('div', 'name', contact.name || ''));
            if (contact.phone) {
                const phone = element('div', 'phone');
                phone.append(element('span', 'icon', '📱'), document.createTextNode(` ${contact.phone}`));
                card.appendChild(phone);
            }
            if (contact.email) {
                const email = element('a', 'phone', `📧 ${contact.email}`);
                email.href = `mailto:${contact.email}`;
                card.appendChild(email);
            }
            grid.appendChild(card);
        });
        main.append(grid, element('div', 'divider'));
        appendFooterNote(main, data.footer_note);
    }

    function renderEportfolio(main, data) {
        main.replaceChildren();

        const header = element('div');
        header.style.cssText = 'text-align:center;margin-bottom:48px;';
        const title = element('h1', 'page-title', data.page_title || 'e-Portfolio');
        title.style.fontSize = 'clamp(36px, 5vw, 64px)';
        const subtitle = element('p', '', data.subtitle || '');
        subtitle.style.cssText = 'font-size:18px;color:var(--text-mid);';
        const underline = element('div');
        underline.style.cssText = 'width:80px;height:4px;background:var(--purple);margin:16px auto 0;border-radius:4px;';
        header.append(title, subtitle, underline);
        main.appendChild(header);

        main.appendChild(renderPortfolioLinks(data.department_heading || 'Jabatan', data.departments));
        main.appendChild(renderPortfolioLinks(data.unit_heading || 'Unit', data.units));

        if (Array.isArray(data.resources) && data.resources.length) {
            const divider = element('div');
            divider.style.cssText = 'width:100%;height:2px;background:var(--light-gray);margin:50px 0 40px;border-radius:2px;';
            main.appendChild(divider);
            const resources = element('div', 'cms-resource-grid');
            resources.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:40px;align-items:start;';
            data.resources.forEach((resource) => resources.appendChild(renderResource(resource)));
            main.appendChild(resources);
        }

        if (data.footer_note) {
            const note = element('div', '', data.footer_note);
            note.style.cssText = 'margin-top:60px;padding:20px;text-align:center;background:var(--light-gray);border-radius:12px;font-size:14px;color:var(--text-light);font-style:italic;';
            main.appendChild(note);
        }
    }

    function renderPortfolioLinks(headingText, items) {
        const section = element('div');
        section.style.marginBottom = '48px';
        const heading = element('h2', '', headingText);
        heading.style.cssText = 'font-size:20px;font-weight:700;color:var(--purple);margin-bottom:20px;border-left:5px solid var(--purple);padding-left:16px;';
        const grid = element('div', 'ep-grid');
        items.forEach((item) => {
            const link = element('a', 'ep-card');
            link.href = item.link || '#';
            if (item.image) {
                link.style.flexDirection = 'column';
                const image = element('img', 'ep-card-image');
                image.src = item.image;
                image.alt = item.name || '';
                image.style.cssText = 'width:72px;height:72px;object-fit:contain;margin-bottom:10px;';
                link.appendChild(image);
            }
            link.appendChild(element('span', '', item.name));
            grid.appendChild(link);
        });
        section.append(heading, grid);
        return section;
    }

    function renderResource(resource) {
        const card = element('div');
        const title = element('h3', '', resource.title || '');
        title.style.cssText = 'font-size:22px;font-weight:600;color:var(--purple);margin-bottom:16px;';
        card.appendChild(title);
        if (resource.embed_url) {
            const frameBox = element('div');
            frameBox.style.cssText = 'position:relative;width:100%;aspect-ratio:16/9;background:var(--light-gray);border-radius:12px;overflow:hidden;border:1px solid var(--mid-gray);';
            const frame = element('iframe');
            frame.src = resource.embed_url;
            frame.title = resource.title || 'Resource';
            frame.allowFullscreen = true;
            frame.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0;';
            frameBox.appendChild(frame);
            card.appendChild(frameBox);
        }
        const info = element('div');
        info.style.cssText = 'margin-top:12px;display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--light-gray);border-radius:8px;border:1px solid var(--mid-gray);';
        const labels = element('div');
        labels.appendChild(element('div', '', resource.file_name || resource.title || ''));
        const source = element('div', '', resource.source_name || '');
        source.style.cssText = 'font-size:12px;color:var(--text-light);';
        labels.appendChild(source);
        info.appendChild(labels);
        if (resource.link) {
            const link = element('a', '', resource.button_text || 'Buka');
            link.href = resource.link;
            link.target = '_blank';
            link.rel = 'noopener';
            link.style.cssText = 'margin-left:auto;background:var(--purple);color:#fff;padding:6px 16px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:500;';
            info.appendChild(link);
        }
        card.appendChild(info);
        return card;
    }

    function renderTaskSpecifications(main, data) {
        main.replaceChildren();
        main.appendChild(element('h1', 'page-title', data.page_title || data.page));
        main.appendChild(element('div', 'page-subtitle', data.subtitle || ''));

        const organisation = element('section', 'page-section');
        organisation.appendChild(element('h2', 'section-heading', data.organisation_heading || 'Carta Organisasi'));
        organisation.appendChild(element('p', 'section-intro', data.organisation_intro || ''));
        const chart = element('div', 'org-chart-card');
        const toolbar = element('div', 'org-chart-toolbar');
        const toolbarLabel = element('span', 'org-chart-toolbar-label');
        toolbarLabel.innerHTML = '<span class="dot"></span>Carta Organisasi Rasmi';
        const hint = element('span', 'org-chart-hint', '🔍 Lihat penuh');
        const openChart = () => window.openPreview && window.openPreview(data.organisation_image, data.organisation_heading || 'Carta Organisasi', data.subtitle || '');
        hint.addEventListener('click', openChart);
        toolbar.append(toolbarLabel, hint);
        const frame = element('div', 'org-chart-frame');
        frame.addEventListener('click', openChart);
        const chartImage = element('img');
        chartImage.src = data.organisation_image;
        chartImage.alt = data.organisation_heading || 'Carta Organisasi';
        frame.appendChild(chartImage);
        chart.append(toolbar, frame);
        organisation.appendChild(chart);
        main.append(organisation, element('div', 'section-divider'));

        appendStaffGroup(main, data, 'lecturers', data.lecturer_heading || 'Pensyarah', data.lecturer_intro || '');
        main.appendChild(element('div', 'section-divider'));
        appendStaffGroup(main, data, 'administration', data.administration_heading || 'Pembantu Tadbir', data.administration_intro || '');

        if (data.updated_text) {
            const updated = element('div', '', data.updated_text);
            updated.style.cssText = 'margin-top:48px;font-size:14px;color:var(--text-light);border-top:1px solid var(--border-light);padding-top:24px;text-align:center;';
            main.appendChild(updated);
        }
    }

    function appendStaffGroup(main, data, group, headingText, introText) {
        const people = data.staff.filter((person) => person.group === group);
        if (!people.length) return;
        const section = element('section', 'page-section');
        section.appendChild(element('h2', 'section-heading', headingText));
        section.appendChild(element('p', 'section-intro', introText));
        const grid = element('div', 'spek-grid');
        people.forEach((person) => grid.appendChild(renderTaskCard(person)));
        section.appendChild(grid);
        main.appendChild(section);
    }

    function renderTaskCard(person) {
        const card = element('button', 'spek-card');
        card.type = 'button';
        card.addEventListener('click', () => {
            if (window.openPreview) window.openPreview(person.preview_image || person.image, person.name, person.role);
        });
        const header = element('div', 'card-header');
        const avatarWrap = element('div', 'card-avatar-wrap');
        const avatar = element('img', 'card-avatar');
        avatar.src = person.image;
        avatar.alt = person.name;
        avatarWrap.append(avatar, element('span', 'card-avatar-zoom', '🔍'));
        const identity = element('div');
        identity.append(element('div', 'card-title', person.name), element('span', 'card-role', person.role));
        const badge = element('span', 'badge-unit', person.badge || '');
        badge.style.marginLeft = 'auto';
        header.append(avatarWrap, identity, badge);
        const body = element('div', 'card-body');
        const tasks = element('ul');
        (person.tasks || []).forEach((task) => tasks.appendChild(element('li', '', task)));
        body.appendChild(tasks);
        card.append(header, element('div', 'divider-light'), body);
        return card;
    }

    function renderHeadcount(data) {
        const hero = document.querySelector('.hero');
        if (hero) {
            const eyebrow = hero.querySelector('.hero-eyebrow');
            const title = hero.querySelector('h1');
            const description = hero.querySelector('.hero-desc');
            const tagline = hero.querySelector('.hero-tagline');
            if (eyebrow) eyebrow.textContent = data.hero_eyebrow || '';
            if (title) title.textContent = data.hero_title || data.page;
            if (description) description.textContent = data.hero_description || '';
            if (tagline) tagline.textContent = data.hero_tagline || '';
        }

        const content = document.querySelector('.section.section-gray');
        if (!content) return;
        content.replaceChildren();
        data.headcount_sections.forEach((section, index) => {
            const block = element('div', 'cms-headcount-section fade-up visible');
            block.style.cssText = index ? 'margin-top:64px;padding-top:56px;border-top:2px solid var(--light-gray);' : '';
            if (section.title) {
                const heading = element('h2', '', section.title);
                heading.style.cssText = 'font-size:clamp(26px,4vw,40px);color:var(--purple);margin:0 0 12px;text-align:center;';
                block.appendChild(heading);
            }
            if (section.description) {
                const description = element('p', '', section.description);
                description.style.cssText = 'max-width:800px;margin:0 auto 28px;text-align:center;color:var(--text-mid);line-height:1.7;white-space:pre-line;';
                block.appendChild(description);
            }
            if (section.embed_url) {
                const embed = element('div', 'embed-container fade-up visible');
                const frame = element('iframe');
                frame.src = section.embed_url;
                frame.title = section.title || 'Headcount';
                frame.allowFullscreen = true;
                frame.style.height = `${Number(section.embed_height) || 700}px`;
                embed.appendChild(frame);
                block.appendChild(embed);
            }
            const info = element('div', 'embed-info fade-up visible');
            if (section.last_updated) {
                const updated = element('div', 'last-updated');
                const strong = element('strong', '', 'Kemas kini: ');
                updated.append(strong, document.createTextNode(section.last_updated));
                info.appendChild(updated);
            }
            (section.links || []).forEach((item) => {
                const link = element('a', 'drive-link', item.label || 'Buka pautan');
                link.href = item.url;
                link.target = '_blank';
                link.rel = 'noopener';
                info.appendChild(link);
            });
            if (info.childNodes.length) block.appendChild(info);
            if (section.note) {
                const note = element('div', '', section.note);
                note.style.cssText = 'margin-top:40px;padding:20px;text-align:center;background:var(--white);border-radius:12px;font-size:14px;color:var(--text-light);font-style:italic;border:1px solid var(--light-gray);';
                block.appendChild(note);
            }
            content.appendChild(block);
        });
    }

    function renderTimetable(main, data) {
        main.replaceChildren();
        const header = element('div');
        header.style.cssText = 'text-align:center;margin-bottom:48px;';
        const title = element('h1', 'page-title', data.page_title || data.page);
        title.style.fontSize = 'clamp(36px, 5vw, 64px)';
        const subtitle = element('p', '', data.page_subtitle || '');
        subtitle.style.cssText = 'font-size:18px;color:var(--text-mid);';
        const underline = element('div');
        underline.style.cssText = 'width:80px;height:4px;background:var(--purple);margin:16px auto 0;border-radius:4px;';
        header.append(title, subtitle, underline);
        main.append(header, element('div', 'divider'));

        data.programs.forEach((program) => {
            const section = element('div', 'timetable-section');
            section.appendChild(element('h2', '', program.name));
            (program.semesters || []).forEach((semester) => {
                const group = element('div', 'semester-group');
                const semesterHeader = element('div', 'semester-header');
                semesterHeader.append(element('h3', '', semester.name), element('span', 'toggle-icon open', '▼'));
                const body = element('div', `semester-body${semester.open === false ? '' : ' open'}`);
                (semester.documents || []).forEach((documentItem) => {
                    const link = element('a', 'doc-link', documentItem.title);
                    link.href = documentItem.url || '#';
                    if (documentItem.url && documentItem.url !== '#') {
                        link.target = '_blank';
                        link.rel = 'noopener';
                    }
                    body.appendChild(link);
                });
                semesterHeader.addEventListener('click', () => {
                    body.classList.toggle('open');
                    semesterHeader.querySelector('.toggle-icon').classList.toggle('open');
                });
                group.append(semesterHeader, body);
                section.appendChild(group);
            });
            main.append(section, element('div', 'divider'));
        });

        if (data.instruction_note || data.updated_text) {
            const note = element('div');
            note.style.cssText = 'margin-top:40px;padding:24px;background:var(--light-gray);border-radius:16px;border-left:4px solid var(--purple);';
            if (data.instruction_note) note.appendChild(element('p', '', data.instruction_note));
            if (data.updated_text) note.appendChild(element('p', '', data.updated_text));
            main.appendChild(note);
        }
        appendFooterNote(main, data.footer_note);
    }

    function renderCourseInformation(main, data) {
        main.replaceChildren();
        const access = element('section', 'cms-course-access');
        access.style.marginBottom = '50px';
        access.appendChild(cmsPageHeading(data.access_heading));
        const accessGrid = element('div');
        accessGrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:30px;align-items:start;';
        if (data.access_image) {
            const image = element('img');
            image.src = data.access_image;
            image.alt = data.access_heading || 'Maklumat Kursus';
            image.style.cssText = 'width:100%;height:auto;display:block;border-radius:16px;border:1px solid var(--mid-gray);';
            accessGrid.appendChild(image);
        }
        const instructions = element('div');
        instructions.style.cssText = 'background:var(--white);border-radius:16px;padding:28px;border:1px solid var(--mid-gray);';
        if (data.access_instruction) instructions.appendChild(element('p', '', data.access_instruction));
        if (data.access_example) {
            const example = element('div', '', data.access_example);
            example.style.cssText = 'background:var(--off-white);padding:14px 18px;border-radius:10px;border:1px solid var(--mid-gray);margin:16px 0 20px;font-size:13px;word-break:break-all;font-family:monospace;';
            instructions.appendChild(example);
        }
        if (data.access_url) instructions.appendChild(actionLink(data.access_url, data.access_button_text || 'Buka'));
        accessGrid.appendChild(instructions);
        access.appendChild(accessGrid);
        main.append(access, cmsDivider());

        const memoSection = element('section');
        memoSection.style.marginBottom = '40px';
        memoSection.appendChild(cmsPageHeading(data.memo_heading));
        const memoList = element('div');
        memoList.style.cssText = 'max-width:900px;margin:0 auto;';
        data.memos.forEach((memo) => memoList.appendChild(documentRow(memo.title, memo.url, 'Buka →')));
        memoSection.appendChild(memoList);
        main.append(memoSection, cmsDivider());

        data.resources.forEach((resource, index) => {
            const section = element('section');
            section.style.marginBottom = '40px';
            section.appendChild(cmsPageHeading(resource.title));
            if (resource.description) section.appendChild(element('p', '', resource.description));
            if (resource.embed_url) {
                const frameBox = element('div');
                frameBox.style.cssText = 'position:relative;width:100%;aspect-ratio:16/9;background:var(--white);border-radius:16px;overflow:hidden;border:1px solid var(--mid-gray);margin-top:20px;';
                const frame = element('iframe');
                frame.src = resource.embed_url;
                frame.title = resource.title;
                frame.allowFullscreen = true;
                frame.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0;';
                frameBox.appendChild(frame);
                section.appendChild(frameBox);
            }
            section.appendChild(documentRow(`${resource.file_name || resource.title}${resource.source ? ` — ${resource.source}` : ''}`, resource.link, resource.button_text || 'Buka'));
            main.appendChild(section);
            if (index < data.resources.length - 1) main.appendChild(cmsDivider());
        });
        appendFooterNote(main, data.footer_note);
    }

    function renderAcademicManagement(data) {
        const content = document.querySelector('.section.section-gray');
        if (!content) return;
        content.replaceChildren();
        const header = element('div', 'section-header fade-up visible');
        const headingWrap = element('div');
        headingWrap.appendChild(element('p', 'section-eyebrow', data.section_eyebrow || ''));
        const heading = element('h2', 'section-title');
        heading.innerHTML = data.section_title_html;
        headingWrap.appendChild(heading);
        header.appendChild(headingWrap);
        const grid = element('div', 'cards-grid');
        data.cards.forEach((item) => {
            const card = element('a', 'card fade-up visible');
            card.href = item.link || '#';
            const imageWrap = element('div', 'card-img-wrapper');
            const image = element('img', 'card-img');
            image.src = item.image;
            image.alt = item.title;
            imageWrap.appendChild(image);
            const body = element('div', 'card-body');
            body.append(element('h3', '', item.title), element('p', '', item.description), element('span', 'card-arrow', item.button_text || 'Teroka →'));
            card.append(imageWrap, body);
            grid.appendChild(card);
        });
        content.append(header, grid);

        (data.additional_sections || []).forEach((section) => {
            const sectionWrap = element('div', 'fade-up visible');
            sectionWrap.style.cssText = 'margin-top:70px;';
            sectionWrap.appendChild(cmsPageHeading(section.title));
            if (section.description) {
                const description = element('p', '', section.description);
                description.style.cssText = 'max-width:760px;margin:-6px 0 24px;color:var(--text-light);line-height:1.7;';
                sectionWrap.appendChild(description);
            }

            const items = element('div');
            const style = section.display_style || 'links';
            if (style === 'cards') {
                items.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:18px;';
            } else if (style === 'buttons') {
                items.style.cssText = 'display:flex;flex-wrap:wrap;gap:12px;';
            } else {
                items.style.cssText = 'display:grid;gap:10px;';
            }

            (section.items || []).forEach((item) => {
                const link = element('a');
                link.href = item.link || '#';
                if (/^https?:\/\//i.test(item.link || '')) {
                    link.target = '_blank';
                    link.rel = 'noopener';
                }

                if (style === 'cards') {
                    link.style.cssText = 'display:block;padding:24px;background:var(--white);border:1px solid var(--mid-gray);border-radius:16px;text-decoration:none;color:var(--text-dark);box-shadow:0 4px 18px rgba(0,0,0,.04);';
                    link.appendChild(element('h3', '', item.text || ''));
                    if (item.description) {
                        const text = element('p', '', item.description);
                        text.style.cssText = 'margin:10px 0 18px;color:var(--text-light);line-height:1.6;';
                        link.appendChild(text);
                    }
                    link.appendChild(element('strong', '', item.button_text || 'Buka →'));
                } else if (style === 'buttons') {
                    link.textContent = item.text || item.button_text || 'Buka';
                    link.style.cssText = 'display:inline-flex;align-items:center;padding:12px 20px;background:var(--purple);color:#fff;border-radius:10px;text-decoration:none;font-weight:600;';
                } else {
                    link.style.cssText = 'display:flex;justify-content:space-between;align-items:center;gap:16px;padding:15px 18px;background:var(--white);border:1px solid var(--mid-gray);border-radius:10px;text-decoration:none;color:var(--text-dark);';
                    const label = element('span');
                    label.appendChild(element('strong', '', item.text || ''));
                    if (item.description) {
                        const text = element('small', '', item.description);
                        text.style.cssText = 'display:block;margin-top:4px;color:var(--text-light);';
                        label.appendChild(text);
                    }
                    link.append(label, element('span', '', item.button_text || 'Buka →'));
                }
                items.appendChild(link);
            });

            sectionWrap.appendChild(items);
            content.appendChild(sectionWrap);
        });
    }

    function cmsPageHeading(text) {
        const heading = element('h2', '', text || '');
        heading.style.cssText = 'font-size:22px;font-weight:700;color:var(--purple);margin-bottom:20px;border-left:5px solid var(--purple);padding-left:16px;';
        return heading;
    }

    function cmsDivider() {
        const divider = element('div');
        divider.style.cssText = 'width:100%;height:2px;background:var(--light-gray);margin:40px 0;border-radius:2px;';
        return divider;
    }

    function actionLink(url, text) {
        const link = element('a', '', text);
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener';
        link.style.cssText = 'display:inline-flex;background:var(--purple);color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600;';
        return link;
    }

    function documentRow(title, url, buttonText) {
        const link = element('a');
        link.href = url || '#';
        link.target = '_blank';
        link.rel = 'noopener';
        link.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:16px;background:var(--white);padding:16px 24px;border-radius:12px;border:1px solid var(--mid-gray);text-decoration:none;color:var(--text-dark);margin:10px 0;';
        link.append(element('span', '', `📄 ${title || ''}`), element('strong', '', buttonText || 'Buka →'));
        return link;
    }

    function appendFooterNote(main, text) {
        if (!text) return;
        const note = element('div', '', text);
        note.style.cssText = 'margin-top:60px;padding:20px;text-align:center;background:var(--light-gray);border-radius:12px;font-size:14px;color:var(--text-light);font-style:italic;';
        main.appendChild(note);
    }

    function renderPageHeader(main, data) {
        const header = element('div');
        header.style.cssText = 'text-align:center;margin-bottom:48px;';
        const title = element('h1', 'page-title', data.page_title || data.page);
        title.style.fontSize = 'clamp(36px, 5vw, 64px)';
        const subtitle = element('p', '', data.page_subtitle || '');
        subtitle.style.cssText = 'font-size:18px;color:var(--text-mid);';
        const underline = element('div');
        underline.style.cssText = 'width:80px;height:4px;background:var(--purple);margin:16px auto 0;border-radius:4px;';
        header.append(title, subtitle, underline);
        main.append(header, element('div', 'divider'));
    }

    function renderGroupedLinks(main, data) {
        main.replaceChildren();
        renderPageHeader(main, data);
        data.groups.forEach((group) => {
            const section = element('div', data.section_class || 'course-section');
            section.appendChild(element('h2', '', group.name));
            const gridClass = (data.section_class || 'course-section').replace('-section', '-grid');
            const grid = element('div', gridClass);
            (group.items || []).forEach((item) => {
                const card = element('a', data.card_class || 'course-card');
                card.href = item.url || '#';
                card.target = '_blank';
                card.rel = 'noopener';
                card.append(element('span', 'label', item.title), element('span', 'arrow-icon', '→'));
                grid.appendChild(card);
            });
            section.appendChild(grid);
            main.append(section, element('div', 'divider'));
        });
        appendInformationNote(main, data);
        appendFooterNote(main, data.footer_note);
    }

    function renderBooks(main, data) {
        main.replaceChildren();
        renderPageHeader(main, data);
        data.groups.forEach((group) => {
            const section = element('div', 'buku-section');
            section.appendChild(element('h2', '', group.name));
            const grid = element('div', 'buku-grid');
            (group.documents || []).forEach((documentItem) => {
                const card = element('a', 'buku-card');
                card.href = documentItem.url || '#';
                card.target = '_blank';
                card.rel = 'noopener';
                card.append(element('span', 'label', documentItem.title), element('span', 'badge', documentItem.badge || 'PDF'));
                if (documentItem.preview_url) {
                    const preview = element('div', 'pdf-preview');
                    const frame = element('iframe');
                    frame.src = documentItem.preview_url;
                    frame.title = documentItem.title;
                    frame.loading = 'lazy';
                    preview.appendChild(frame);
                    card.appendChild(preview);
                }
                const footer = element('div', 'card-footer');
                footer.append(element('span', '', 'Buka dalam tab baru'), element('span', 'open-link', 'Lihat →'));
                card.appendChild(footer);
                grid.appendChild(card);
            });
            section.appendChild(grid);
            main.append(section, element('div', 'divider'));
        });
        appendInformationNote(main, data);
        appendFooterNote(main, data.footer_note);
    }

    function renderStudyPrograms(main, data) {
        main.replaceChildren();
        renderPageHeader(main, data);
        const profileSection = element('section');
        profileSection.style.marginBottom = '50px';
        profileSection.appendChild(cmsPageHeading(data.profile_heading || 'PROFIL PROGRAM'));
        const grid = element('div', 'program-grid');
        data.profiles.forEach((profile) => {
            const card = element('div', 'program-card');
            if (profile.image) {
                const image = element('img', 'card-img');
                image.src = profile.image;
                image.alt = profile.name;
                card.appendChild(image);
            }
            const body = element('div', 'card-body');
            body.appendChild(element('h3', '', profile.name));
            (profile.cohorts || []).forEach((cohort) => {
                body.appendChild(element('div', 'program-label', cohort.label));
                const list = element('ul', 'program-list');
                (cohort.links || []).forEach((item) => {
                    const row = element('li');
                    const link = element('a', '', item.title);
                    link.href = item.url || '#';
                    link.target = '_blank';
                    link.rel = 'noopener';
                    row.appendChild(link);
                    list.appendChild(row);
                });
                body.appendChild(list);
            });
            card.appendChild(body);
            grid.appendChild(card);
        });
        profileSection.appendChild(grid);
        main.append(profileSection, element('div', 'divider'));

        data.elective_sections.forEach((elective, index) => {
            const section = element('section');
            section.style.marginBottom = '40px';
            section.appendChild(cmsPageHeading(elective.heading));
            const grid = element('div', 'elektif-grid');
            (elective.links || []).forEach((item) => {
                const link = element('a', 'elektif-card');
                link.href = item.url || '#';
                link.target = '_blank';
                link.rel = 'noopener';
                const left = element('div', 'left');
                left.append(element('span', 'icon', '📁'), element('span', 'text', item.title));
                link.append(left, element('div', 'right', 'Buka →'));
                grid.appendChild(link);
            });
            section.appendChild(grid);
            main.appendChild(section);
            if (index < data.elective_sections.length - 1) main.appendChild(element('div', 'divider'));
        });
        appendFooterNote(main, data.footer_note);
    }

    function appendInformationNote(main, data) {
        if (!data.instruction_note && !data.updated_text) return;
        const note = element('div');
        note.style.cssText = 'margin-top:40px;padding:24px;background:var(--light-gray);border-radius:16px;border-left:4px solid var(--purple);';
        if (data.instruction_note) note.appendChild(element('p', '', data.instruction_note));
        if (data.updated_text) note.appendChild(element('p', '', data.updated_text));
        main.appendChild(note);
    }

    function renderProfessionalDevelopment(main, data) {
        main.replaceChildren();
        renderPageHeader(main, data);
        data.professional_sections.forEach((section, index) => {
            const block = element('section', 'cms-professional-section');
            block.style.cssText = 'margin-bottom:48px;';
            if (section.heading) block.appendChild(cmsPageHeading(section.heading));
            if (section.description) {
                const description = element('p', '', section.description);
                description.style.cssText = 'line-height:1.75;color:var(--text-mid);white-space:pre-line;margin-bottom:22px;';
                block.appendChild(description);
            }
            if (section.embed_url) {
                const frameBox = element('div', 'video-wrapper');
                const frame = element('iframe');
                frame.src = section.embed_url;
                frame.title = section.heading || 'Video';
                frame.allowFullscreen = true;
                frameBox.appendChild(frame);
                block.appendChild(frameBox);
            }
            if (Array.isArray(section.items) && section.items.length) {
                const grid = element('div', 'cms-professional-grid');
                grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:20px;';
                section.items.forEach((item) => {
                    const card = element('a', 'cms-professional-card');
                    card.href = item.url || '#';
                    card.target = '_blank';
                    card.rel = 'noopener';
                    card.style.cssText = 'display:flex;flex-direction:column;background:var(--white);border:1px solid var(--mid-gray);border-radius:16px;padding:20px;text-decoration:none;color:var(--text-dark);box-shadow:0 4px 16px rgba(58,12,163,.06);';
                    if (item.preview_url) {
                        const preview = element('iframe');
                        preview.src = item.preview_url;
                        preview.title = item.title || 'Document preview';
                        preview.loading = 'lazy';
                        preview.style.cssText = 'width:100%;height:220px;border:0;border-radius:10px;margin-bottom:14px;pointer-events:none;';
                        card.appendChild(preview);
                    } else if (item.image) {
                        const image = element('img');
                        image.src = item.image;
                        image.alt = item.title || '';
                        image.style.cssText = 'width:100%;height:170px;object-fit:contain;border-radius:10px;margin-bottom:14px;';
                        card.appendChild(image);
                    }
                    const title = element('h3', '', item.title || 'Pautan');
                    title.style.cssText = 'font-size:17px;color:var(--purple);margin:0 0 8px;';
                    card.appendChild(title);
                    if (item.description) card.appendChild(element('p', '', item.description));
                    const action = element('strong', '', item.button_text || 'Buka →');
                    action.style.cssText = 'margin-top:auto;padding-top:14px;color:var(--purple);';
                    card.appendChild(action);
                    grid.appendChild(card);
                });
                block.appendChild(grid);
            }
            if (Array.isArray(section.images) && section.images.length) {
                const grid = element('div', 'cms-image-grid');
                grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px;';
                section.images.forEach((item) => {
                    const image = element('img');
                    image.src = item.image;
                    image.alt = item.alt || section.heading || '';
                    image.style.cssText = 'display:block;width:100%;height:auto;border-radius:16px;border:1px solid var(--mid-gray);';
                    grid.appendChild(image);
                });
                block.appendChild(grid);
            }
            main.appendChild(block);
            if (index < data.professional_sections.length - 1) main.appendChild(element('div', 'divider'));
        });
        appendFooterNote(main, data.footer_note);
    }

    function sectionShell(section) {
        const wrapper = element('section', 'cms-content-section');
        wrapper.style.cssText = 'max-width:1100px;margin:0 auto 56px;padding:0 24px;';
        if (section.heading) {
            const heading = element('h2', 'cms-section-heading', section.heading);
            heading.style.cssText = 'font-size:clamp(26px,4vw,40px);color:var(--purple);margin:0 0 14px;';
            wrapper.appendChild(heading);
        }
        if (section.description) {
            const description = element('p', 'cms-section-description', section.description);
            description.style.cssText = 'font-size:16px;line-height:1.75;color:var(--text-mid);margin:0 0 24px;white-space:pre-line;';
            wrapper.appendChild(description);
        }
        return wrapper;
    }

    function renderSection(section) {
        const wrapper = sectionShell(section);

        if (section.type === 'text') {
            if (section.image) {
                const image = element('img', 'cms-section-image');
                image.src = section.image;
                image.alt = section.heading || '';
                image.style.cssText = 'display:block;max-width:100%;height:auto;border-radius:18px;margin:20px auto;';
                wrapper.appendChild(image);
            }
        }

        if (section.type === 'cards' || section.type === 'links') {
            const grid = element('div', 'cms-content-grid');
            grid.style.cssText = `display:grid;grid-template-columns:repeat(auto-fit,minmax(${section.type === 'cards' ? '240px' : '280px'},1fr));gap:20px;`;
            (section.items || []).forEach((item) => {
                const card = element('article', 'cms-content-card');
                card.style.cssText = 'background:#fff;border:1px solid rgba(58,12,163,.12);border-radius:18px;padding:22px;box-shadow:0 8px 24px rgba(58,12,163,.08);';
                if (item.image) {
                    const image = element('img', 'cms-card-image');
                    image.src = item.image;
                    image.alt = item.title || '';
                    image.style.cssText = 'width:100%;height:190px;object-fit:cover;border-radius:12px;margin-bottom:16px;';
                    card.appendChild(image);
                }
                if (item.title) card.appendChild(element('h3', '', item.title));
                if (item.description) {
                    const description = element('p', '', item.description);
                    description.style.whiteSpace = 'pre-line';
                    card.appendChild(description);
                }
                if (item.link) {
                    const link = element('a', 'cms-card-link', item.button_text || 'Buka');
                    link.href = item.link;
                    link.target = '_blank';
                    link.rel = 'noopener';
                    link.style.cssText = 'display:inline-block;margin-top:14px;color:var(--purple);font-weight:700;';
                    card.appendChild(link);
                }
                grid.appendChild(card);
            });
            wrapper.appendChild(grid);
        }

        if (section.type === 'image' && section.image) {
            const image = element('img', 'cms-section-image');
            image.src = section.image;
            image.alt = section.alt_text || section.heading || '';
            image.style.cssText = 'display:block;width:100%;height:auto;border-radius:18px;';
            wrapper.appendChild(image);
        }

        if (section.type === 'embed' && section.url) {
            const frame = element('iframe', 'cms-section-embed');
            frame.src = section.url;
            frame.title = section.heading || 'Embedded content';
            frame.loading = 'lazy';
            frame.style.cssText = `display:block;width:100%;height:${Number(section.height) || 600}px;border:0;border-radius:18px;`;
            wrapper.appendChild(frame);
        }

        return wrapper;
    }
})();
