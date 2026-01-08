

function projectCardHtml( projectName , ProjectStatus , ...ProjectFrameWorks  ){
    const frameworksHTML = ProjectFrameWorks.map(fw => `<div class="fm">${fw}</div>`).join('');
    
    return `
    <div class="project-card">
        <div class="status-badge">
            <div>
                ${ProjectStatus}
            </div>
        </div>

        <div class="main-fm">
            ${frameworksHTML}
        </div>
        <div class="bottom-card">
            <h6>${projectName}</h6>
            <button id="modal-button"> view more</button>
        </div>
    </div>
    `;
}


function insertProjectCards(projects) {
    const container = document.querySelector('.public-projects-container');
    
    if (!container) {
        console.error('Projects container not found');
        return;
    }
    

    container.innerHTML = '';
    

    projects.forEach((project, index) => {
        const cardHTML = projectCardHtml(
            project.title,
            project.status,
            ...project.frameworks
        );
        
        const cardWrapper = document.createElement('div');
        cardWrapper.innerHTML = cardHTML;
        const cardElement = cardWrapper.firstElementChild;
        

        cardElement.dataset.projectId = project.id;
        cardElement.dataset.projectIndex = index;
        

        if (project.image) {
            cardElement.style.backgroundImage = `url('${project.image}')`;
        }
        
        container.appendChild(cardElement);
    });
        
}



function addModalToCards(projects) {
    const projectCards = document.querySelectorAll('.project-card');
    
    projectCards.forEach((card) => {
        const viewMoreButton = card.querySelector('#modal-button');
        const projectIndex = parseInt(card.dataset.projectIndex);
        const project = projects[projectIndex];
        
        if (!viewMoreButton || !project) return;
        
 
        const modalHTML = createModalHTML(project);
        
  
        let modal = document.querySelector(`#modal-${project.id}`);
        if (!modal) {
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            modal = document.querySelector(`#modal-${project.id}`);
        }
        
 
        viewMoreButton.addEventListener('click', () => {
            modal.showModal();
        });
        
      
        const closeButton = modal.querySelector('.close-button');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                modal.close();
            });
        }
        
 
        modal.addEventListener('click', (e) => {
            const rect = modal.getBoundingClientRect();
            if (
                e.clientX < rect.left ||
                e.clientX > rect.right ||
                e.clientY < rect.top ||
                e.clientY > rect.bottom
            ) {
                modal.close();
            }
        });
    });
    
    console.log('Modals added to all project cards');
}



function createModalHTML(project) {
    const frameworksBadges = project.frameworks
        .map(fw => `<div class="framework-badge">${fw}</div>`)
        .join('');
    
    const teamMembersHTML = project.teamMembers
        .map(member => `
            <div class="team-member-card">
                <div class="team-mem-image">
                    <img src="${member.image}" alt="${member.name}">
                </div>
                <div class="team-mem-info">
                    <span>${member.name}</span>
                    <a href="${member.githubLink}" target="_blank">GitHub Link</a>
                </div>
            </div>
        `)
        .join('');
    
    return `
        <dialog id="modal-${project.id}" class="modal-container">
            <div class="modal-header">
                <p class="proj-title">${project.title}</p>
                <div class="status-badge">${project.status}</div>
                <button class="close-button"></button>
            </div>

            <div class="modal-body">
                <div class="left-body">
                    <div class="project-desc">${project.description}</div>
                    <div class="proejct-frameworks">
                        ${frameworksBadges}
                    </div>
                </div>

                <div class="right-body">
                    ${teamMembersHTML}
                </div>
            </div>
        </dialog>
    `;
}


// Global variables
let allProjects = [];
let selectedFrameworks = new Set();

// getFraeworks from projects
function getAllFrameworks(projects) {
    const frameworks = new Set();
    projects.forEach(project => {
        project.frameworks.forEach(fw => frameworks.add(fw));
    });
    return Array.from(frameworks).sort();
}

//  checkboxes
function createFilterCheckboxes(projects) {
    const filterContainer = document.getElementById('filter-container');
    if (!filterContainer) return;
    
    const frameworks = getAllFrameworks(projects);
    
    filterContainer.innerHTML = '';
    
    frameworks.forEach(framework => {
        const filterItem = document.createElement('div');
        filterItem.className = 'filter-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `filter-${framework}`;
        checkbox.value = framework;
        checkbox.addEventListener('change', handleFilterChange);
        
        const label = document.createElement('label');
        label.htmlFor = `filter-${framework}`;
        label.textContent = framework;
        
        filterItem.appendChild(checkbox);
        filterItem.appendChild(label);
        filterContainer.appendChild(filterItem);
    });
}

// Handle filter change
function handleFilterChange(event) {
    const framework = event.target.value;
    
    if (event.target.checked) {
        selectedFrameworks.add(framework);
    } else {
        selectedFrameworks.delete(framework);
    }
    
    applyFiltersAndSearch();
}

// filter and search 
function applyFiltersAndSearch() {
    const searchInput = document.getElementById('search-input');
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    let filteredProjects = allProjects;
    

    if (selectedFrameworks.size > 0) {
        filteredProjects = filteredProjects.filter(project => {
            return project.frameworks.some(fw => selectedFrameworks.has(fw));
        });
    }
    
 
    if (searchTerm) {
        filteredProjects = filteredProjects.filter(project => {
           
            const titleMatch = project.title.toLowerCase().includes(searchTerm);
            
           
            const memberMatch = project.teamMembers.some(member => 
                member.name.toLowerCase().includes(searchTerm)
            );
            
            return titleMatch || memberMatch;
        });
    }
    
   
    insertProjectCards(filteredProjects);
    addModalToCards(allProjects); 
}

// Clear all filters
function clearAllFilters() {
    selectedFrameworks.clear();
    
    const checkboxes = document.querySelectorAll('#filter-container input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = false);
    
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
    
    applyFiltersAndSearch();
}


function initializeSearch() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', applyFiltersAndSearch);
    }
    
    const clearButton = document.getElementById('clear-filters');
    if (clearButton) {
        clearButton.addEventListener('click', clearAllFilters);
    }
}

async function initializeApp() {
    try {
        
        const response = await fetch('sampleData.json');
        const projects = await response.json();
        
        allProjects = projects;
    
        createFilterCheckboxes(projects);
        
        initializeSearch();
        
        insertProjectCards(projects);

        addModalToCards(projects);
        
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}



document.addEventListener('DOMContentLoaded', initializeApp);