const fs = require('fs').promises;
const path = require('path');

async function generateStoryPages() {
    try {
        // Read story template
        const template = await fs.readFile(path.join(__dirname, 'story-template.html'), 'utf8');
        
        // Get all .md files in stories directory
        const storiesDir = path.join(__dirname, 'stories');
        const files = await fs.readdir(storiesDir);
        const mdFiles = files.filter(file => file.endsWith('.md'));

        // Create HTML files for each story
        for (const mdFile of mdFiles) {
            const baseName = mdFile.replace('.md', '');
            const htmlPath = path.join(__dirname, 'stories', `${baseName}.html`);
            await fs.writeFile(htmlPath, template);
            console.log(`Generated ${htmlPath}`);
        }
    } catch (error) {
        console.error('Error generating story pages:', error);
    }
}

generateStoryPages();
