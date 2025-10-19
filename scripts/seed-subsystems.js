const { sql } = require('@vercel/postgres');

const subsystemsData = [
    {
        id: 'soulycore',
        name: 'SoulyCore - Cognitive Engine',
        description: 'The central AI brain managing memory and reasoning.',
        progress: 85,
        healthScore: 'A',
        dependencies: [],
        resources: [
            { name: 'GitHub Repo', url: '#' },
            { name: 'Google Docs', url: '#' },
        ],
        milestones: [
            { description: 'V2 Cognitive Architecture Implemented', completed: true },
            { description: 'Context Assembly Pipeline Complete', completed: true },
            { description: 'Memory Extraction Pipeline Complete', completed: false },
        ],
        githubStats: { commits: 128, pullRequests: 12, issues: 3, repoUrl: '#' },
        tasks: {
            completed: ["Implement Episodic Memory", "Implement Semantic Memory"],
            remaining: ["Optimize Context Pruning"]
        }
    },
    {
        id: 'hedra-ui',
        name: 'HedraUI - Main Frontend',
        description: 'The primary user interface built with Next.js and React.',
        progress: 95,
        healthScore: 'A+',
        dependencies: ['soulycore'],
        resources: [
            { name: 'GitHub Repo', url: '#' },
            { name: 'Figma', url: '#' },
        ],
        milestones: [
            { description: 'Dashboard Center Complete', completed: true },
            { description: 'Agent Center Complete', completed: true },
            { description: 'Implement Theming Engine', completed: false },
        ],
        githubStats: { commits: 256, pullRequests: 25, issues: 1, repoUrl: '#' },
         tasks: {
            completed: ["Build Dashboard", "Build Agent Center", "Implement Navigation"],
            remaining: ["Add i18n support"]
        }
    },
    {
        id: 'hedrasoul',
        name: 'HedraSoul - API Orchestrator',
        description: 'The main Laravel-based API gateway and business logic hub.',
        progress: 60,
        healthScore: 'B',
        dependencies: ['soulycore'],
        resources: [
            { name: 'GitHub Repo', url: '#' },
            { name: 'Notion', url: '#' },
        ],
        milestones: [
            { description: 'User Authentication Complete', completed: true },
            { description: 'Implement Core Endpoints', completed: true },
            { description: 'Integrate with HedraLife', completed: false },
        ],
        githubStats: { commits: 78, pullRequests: 8, issues: 5, repoUrl: '#' },
        tasks: {
            completed: ["Setup Laravel project", "Implement JWT Auth"],
            remaining: ["Build Billing Module", "Write API documentation"]
        }
    },
];

async function seedSubsystems() {
    console.log("Seeding subsystems...");
    try {
        await sql`TRUNCATE TABLE subsystems RESTART IDENTITY;`; // Clear existing data

        for (const [index, sub] of subsystemsData.entries()) {
            await sql`
                INSERT INTO subsystems (
                    id, name, description, progress, "healthScore", 
                    dependencies, resources, milestones, "githubStats", tasks, order_index
                ) VALUES (
                    ${sub.id}, ${sub.name}, ${sub.description}, ${sub.progress}, ${sub.healthScore},
                    ${JSON.stringify(sub.dependencies)}, ${JSON.stringify(sub.resources)}, 
                    ${JSON.stringify(sub.milestones)}, ${JSON.stringify(sub.githubStats)},
                    ${sub.tasks ? JSON.stringify(sub.tasks) : null}, ${index}
                );
            `;
        }
        console.log(`Successfully seeded ${subsystemsData.length} subsystems.`);
    } catch (error) {
        console.error("Error seeding subsystems table:", error);
        process.exit(1);
    }
}

seedSubsystems();
