// Static story data
const stories = [
    {
        title: "fading lights",
        date: "2020",
        excerpt: "The sun was setting, casting long shadows across the empty street. A gentle breeze rustled through...",
        link: "/writing/stories/fading-lights"
    },
    {
        title: "he loves me not",
        date: "2019",
        excerpt: "I remember the day I first saw him. He was sitting at his desk, completely absorbed in his work...",
        link: "/writing/stories/he-loves-me-not"
    },
    {
        title: "my cup of chai",
        date: "2019",
        excerpt: "I grimace at the sound of my glasses scraping against the windowsill. I wash my face with cold water and look...",
        link: "/writing/stories/my-cup-of-chai"
    },
    {
        title: "the queen is dead",
        date: "2019",
        excerpt: "A boy dashed through the rain, holding his jacket above his head. \"I'm going to be late!\" He relaxed when he...",
        link: "/writing/stories/the-queen-is-dead"
    }
];

document.addEventListener('DOMContentLoaded', function() {
    const storiesContainer = document.getElementById('stories-list');
    if (!storiesContainer) return;

    const projectsDiv = document.createElement('div');
    projectsDiv.className = 'projects';

    stories.forEach(story => {
        const storyLink = document.createElement('a');
        storyLink.href = story.link;
        storyLink.className = 'project-container';

        storyLink.innerHTML = `
            <div class="project-link">
                <span class="project-title">${story.title}</span>
                <span class="project-date">${story.date}</span>
            </div>
            <p class="project-excerpt">
                ${story.excerpt}
            </p>
        `;

        projectsDiv.appendChild(storyLink);
    });

    storiesContainer.appendChild(projectsDiv);
});

// For debugging
console.log('index.js loaded');
