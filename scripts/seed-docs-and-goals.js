// scripts/seed-docs-and-goals.js
const { sql } = require('@vercel/postgres');
const fs = require('fs/promises');
const path = require('path');

const docsDirectory = path.join(process.cwd(), 'DocsV2');

const docsToSeed = [
    { key: 'vision', title: 'Project Vision', file: '00_Project_Vision.md' },
    { key: 'system_arch', title: 'System Architecture', file: '01_System_Architecture.md' },
    { key: 'cognitive_model', title: 'Cognitive Model', file: '02_Cognitive_Model.md' },
    { key: 'core_engine', title: 'Core Engine Deep Dive', file: '03_Core_Engine_Deep_Dive.md' },
    { key: 'api_ref', title: 'API Reference', file: '04_API_Reference.md' },
    { key: 'db_schema', title: 'Database Schema', file: '05_Database_Schema.md' },
    { key: 'frontend_arch', title: 'Frontend Architecture', file: '06_Frontend_Architecture.md' },
    { key: 'setup', title: 'Setup & Deployment', file: '07_Setup_And_Deployment.md' },
    { key: 'security', title: 'Security Model', file: '08_Security_Model.md' },
    { key: 'workflow', title: 'Development Workflow', file: '09_Development_Workflow.md' },
];

const goalsToSeed = {
    main_goal: `تحقيق الإدارة والأتمتة الكاملة لحياة "هدرا" بكل تفاصيلها وعلى جميع الأصعدة الشخصية والمهنية. يتضمن ذلك خلق منظومة بيئية رقمية شاملة, ذكية, واستباقية, تتفهم وتساعد وتتطور معه, مما يمكّن من تحقيق أقصى أداء, صحة مثالية, ووعي عميق بالذات.`,
    ideas: `سيتم تحقيق المهمة من خلال بناء **HedraSoul**, وهي منظومة بيئية معيارية قائمة على مبدأ \`API-First\` وتتألف من خدمات مصغرة متخصصة. **SoulyCore**, العقل المعرفي المركزي, سيوفر الذاكرة والقدرة على الاستنتاج لجميع الأنظمة الفرعية. كل نظام فرعي, مثل **HsContacts** (للذكاء الاجتماعي) و **HedraLife** (للتحليلات الشخصية), سيعمل كمكون مستقل ومترابط في آن واحد. المبدأ الجوهري هو **"التحكم القائم على الرؤى"**, الذي يفرض على كل نظام فرعي توفير لوحات معلومات تفاعلية تحول البيانات الخام إلى رؤى قابلة للتنفيذ, مما يمكّن من اتخاذ قرارات مستنيرة.`,
    status: `بدأ التطوير الأولي للأنظمة التأسيسية. تم تأسيس **HedraSoul (Laravel)** ليكون هيئة التنسيق الأساسية. **SoulyCore (Next.js)** يخضع حاليًا لتصميم معماري نشط, مع التركيز على إنشاء محرك ذاكرة واستنتاج معرفي متطور ومتعدد الطبقات. التركيز الأساسي ينصب على إنهاء البنية المعمارية المعرفية الأساسية قبل التوسع إلى الأنظمة الفرعية المتخصصة الأخرى.`
};

async function seedDocumentations() {
    console.log("Seeding documentations...");
    try {
        for (const doc of docsToSeed) {
            const filePath = path.join(docsDirectory, doc.file);
            let content = `## ${doc.title}\n\nDocumentation content not found.`;
            try {
                content = await fs.readFile(filePath, 'utf-8');
            } catch (e) {
                console.warn(`Warning: Could not read file ${doc.file}. Using placeholder content.`);
            }
            
            await sql`
                INSERT INTO "documentations" ("docKey", "title", "content")
                VALUES (${doc.key}, ${doc.title}, ${content})
                ON CONFLICT ("docKey") DO UPDATE SET
                    "title" = EXCLUDED."title",
                    "content" = EXCLUDED."content",
                    "lastUpdatedAt" = CURRENT_TIMESTAMP;
            `;
        }
        console.log(`Successfully seeded ${docsToSeed.length} documentation entries.`);
    } catch (error) {
        console.error("Error seeding documentations table:", error);
        process.exit(1);
    }
}

async function seedHedraGoals() {
    console.log("Seeding Hedra goals...");
    try {
        for (const [key, content] of Object.entries(goalsToSeed)) {
             await sql`
                INSERT INTO "hedra_goals" ("sectionKey", "content")
                VALUES (${key}, ${content})
                ON CONFLICT ("sectionKey") DO UPDATE SET
                    "content" = EXCLUDED."content",
                    "lastUpdatedAt" = CURRENT_TIMESTAMP;
            `;
        }
        console.log(`Successfully seeded ${Object.keys(goalsToSeed).length} Hedra goal sections.`);
    } catch (error) {
         console.error("Error seeding Hedra goals table:", error);
        process.exit(1);
    }
}

async function runAllSeeds() {
    await seedDocumentations();
    await seedHedraGoals();
    console.log("Finished seeding docs and goals.");
}

runAllSeeds();