(function () {
    const slug = window.location.pathname.split('/').pop().replace(/\.html$/i, '') || 'index';
    const main = document.querySelector('main.page-content');
    if (!main) return;

    const headings = {
        pensyarah: 'SENARAI PENSYARAH',
        bantuan: 'SENARAI PENSYARAH BANTUAN',
        arkib: 'SENARAI PENSYARAH (ARKIB)'
    };

    function createCard(person) {
        const card = document.createElement('div');
        card.className = 'staff-card';
        card.style.textAlign = 'center';

        const photo = document.createElement('div');
        photo.className = `staff-photo${person.section === 'arkib' ? ' archive' : ''}`;
        photo.style.cssText = 'width:160px;height:160px;border-radius:50%;overflow:hidden;margin:0 auto 16px;border:4px solid var(--purple);box-shadow:0 8px 24px rgba(58,12,163,0.12);background:#fff;';
        if (person.section === 'arkib') photo.style.borderColor = 'var(--text-light)';

        const image = document.createElement('img');
        image.src = person.image;
        image.alt = person.name;
        image.style.cssText = 'width:100%;height:100%;object-fit:cover;object-position:center top;';
        if (person.image_position === 'left') image.style.transform = 'translateX(-10px) scale(1.1)';
        if (person.image_position === 'right') image.style.transform = 'translateX(20px) scale(1.3)';
        photo.appendChild(image);

        const name = document.createElement('h3');
        name.className = `staff-name${person.section === 'arkib' ? ' archive-name' : ''}`;
        name.style.cssText = 'font-size:16px;font-weight:600;color:var(--text-dark);margin-bottom:4px;line-height:1.35;';
        if (person.link) {
            const link = document.createElement('a');
            link.href = person.link;
            link.target = '_blank';
            link.rel = 'noopener';
            link.textContent = person.name;
            name.appendChild(link);
        } else {
            name.textContent = person.name;
        }

        const role = document.createElement('p');
        role.className = 'staff-role';
        role.style.cssText = 'font-size:13px;color:var(--text-light);margin:0;';
        role.textContent = person.section === 'arkib' ? 'Arkib' : person.role;

        const qualification = document.createElement(person.link ? 'a' : 'p');
        qualification.className = 'qualification-link';
        qualification.style.cssText = 'display:inline-block;margin-top:8px;color:var(--purple);font-family:Georgia,\'Times New Roman\',serif;font-size:13px;font-style:italic;text-decoration:none;';
        qualification.textContent = 'Kelayakan Akademik';
        if (person.link) {
            qualification.href = person.link;
            qualification.target = '_blank';
            qualification.rel = 'noopener';
        }

        card.append(photo, name, role, qualification);
        return card;
    }

    function createHeading(text) {
        const heading = document.createElement('h2');
        heading.textContent = text;
        heading.style.cssText = 'font-size:20px;font-weight:700;color:var(--purple);margin-bottom:24px;border-left:5px solid var(--purple);padding-left:16px;';
        return heading;
    }

    function createGrid(people) {
        const grid = document.createElement('div');
        grid.className = 'staff-grid';
        grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:40px 30px;max-width:1100px;margin:0 auto;';
        people.forEach((person) => grid.appendChild(createCard(person)));
        return grid;
    }

    function sectionFromHeading(text) {
        const value = text.trim().toUpperCase();
        if (!value.includes('SENARAI PENSYARAH')) return null;
        if (value.includes('ARKIB')) return 'arkib';
        if (value.includes('BANTUAN')) return 'bantuan';
        return 'pensyarah';
    }

    function findContainers() {
        const containers = {};
        main.querySelectorAll('h2').forEach((heading) => {
            const section = sectionFromHeading(heading.textContent);
            if (section && !containers[section]) containers[section] = heading.parentElement;
        });

        if (slug === 'kokurikulum') {
            containers.pensyarah = document.getElementById('cms-koko-pensyarah');
            containers.bantuan = document.getElementById('cms-koko-bantuan');
            containers.arkib = document.getElementById('cms-koko-arkib');
        }

        if (slug === 'jka') {
            containers.pensyarah = document.getElementById('cms-jka-pensyarah');
            containers.staff = document.getElementById('cms-jka-staff');
        }
        return containers;
    }

    function renderStandard(data) {
        const containers = findContainers();
        ['pensyarah', 'bantuan', 'arkib', 'staff'].forEach((section) => {
            const container = containers[section];
            const people = (data.staff || []).filter((person) => person.section === section);
            if (!container) return;
            container.replaceChildren();
            if (!people.length) {
                container.hidden = true;
                return;
            }
            container.hidden = false;

            // JKA already provides the grid container and its page heading lives
            // outside it, so render its cards directly into that existing grid.
            if (slug === 'jka' && section === 'pensyarah') {
                people.forEach((person) => container.appendChild(createCard(person)));
                return;
            }

            if (slug === 'jka' && section === 'staff') {
                people.forEach((person) => container.appendChild(createCard(person)));
                return;
            }

            container.appendChild(createHeading(headings[section]));
            const featured = people.filter((person) => person.featured);
            featured.forEach((person) => container.appendChild(createCard(person)));
            const regular = people.filter((person) => !person.featured);
            if (regular.length) container.appendChild(createGrid(regular));
        });
    }

    fetch(`content/portfolios/${slug}.json`, { cache: 'no-store' })
        .then((response) => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(renderStandard)
        .catch((error) => {
            console.warn(`CMS data for ${slug} could not be loaded; showing the HTML fallback.`, error);
        });
})();
