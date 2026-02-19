import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// ── Step 0: Ensure the database exists ───────────────────────────────────────
async function ensureDatabase() {
    const connStr = process.env.DATABASE_URL!;
    const url = new URL(connStr);
    const dbName = url.pathname.replace(/^\//, '');

    // Connect to 'postgres' system DB to create target DB if missing
    const adminUrl = connStr.replace(`/${dbName}`, '/postgres');
    const adminPool = new Pool({ connectionString: adminUrl });
    try {
        const { rows } = await adminPool.query(
            `SELECT 1 FROM pg_database WHERE datname = $1`,
            [dbName]
        );
        if (rows.length === 0) {
            await adminPool.query(`CREATE DATABASE "${dbName}"`);
            console.log(`🗄️  Created database: ${dbName}`);
        } else {
            console.log(`🗄️  Database "${dbName}" already exists.`);
        }
    } finally {
        await adminPool.end();
    }
}

// ── Step 1: Apply schema DDL (CREATE TABLE IF NOT EXISTS) ─────────────────────
async function ensureSchema(pool: Pool) {
    const schemaPath = path.resolve(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf-8');
    // For development iteration: drop tables to ensuring schema changes (like new columns) are applied
    await pool.query(`
        DROP TABLE IF EXISTS job_postings CASCADE;
        DROP TABLE IF EXISTS tech_tags CASCADE;
        DROP TABLE IF EXISTS companies CASCADE;
    `);
    await pool.query(sql);
    console.log('📐 Schema applied (tables created if missing).');
}

// ── Step 2: Truncate all data (CASCADE handles FK order) ─────────────────────
async function truncateTables(pool: Pool) {
    await pool.query(`
    TRUNCATE TABLE job_postings, tech_tags, companies RESTART IDENTITY CASCADE
  `);
    console.log('🗑️  Existing data truncated.');
}

// ── Company data ──────────────────────────────────────────────────────────────
interface Company {
    name: string;
    uid?: string;
    website: string;
    city: string;
    lat: number;
    lng: number;
    type?: string;
    tags: { tag: string; category: string }[];
}

const companies: Company[] = [

    // --- ENTERPRISE ---
    {
        name: 'Swisscom',
        type: 'Enterprise',
        uid: 'CHE-107.578.016',
        website: 'https://www.swisscom.ch',
        city: 'Bern',
        lat: 46.9479, lng: 7.4474,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Kubernetes', category: 'devops' },
            { tag: 'AWS', category: 'cloud' },
            { tag: 'React', category: 'frontend' },
            { tag: 'Angular', category: 'frontend' },
            { tag: 'Scala', category: 'backend' },
        ],
    },
    {
        name: 'Swisscom Rotkreuz',
        type: 'Enterprise',
        website: 'https://www.swisscom.ch',
        city: 'Rotkreuz',
        lat: 47.1420, lng: 8.4310,
        tags: [
            { tag: 'Kubernetes', category: 'devops' },
            { tag: 'Python', category: 'backend' },
            { tag: 'Java', category: 'backend' },
        ],
    },
    {
        name: 'Logitech',
        type: 'Enterprise',
        uid: 'CHE-115.042.787',
        website: 'https://www.logitech.com',
        city: 'Lausanne',
        lat: 46.5197, lng: 6.6323,
        tags: [
            { tag: 'C++', category: 'backend' },
            { tag: 'Python', category: 'backend' },
            { tag: 'Swift', category: 'frontend' },
            { tag: 'React', category: 'frontend' },
            { tag: 'AWS', category: 'cloud' },
        ],
    },
    {
        name: 'Logitech Daniel Borel Center',
        type: 'Enterprise',
        website: 'https://www.logitech.com',
        city: 'Ecublens',
        lat: 46.5200, lng: 6.5650,
        tags: [
            { tag: 'C++', category: 'backend' },
            { tag: 'Embedded', category: 'backend' },
        ],
    },
    {
        name: 'Proton',
        type: 'Enterprise',
        uid: 'CHE-184.666.789',
        website: 'https://proton.me',
        city: 'Geneva',
        lat: 46.2044, lng: 6.1432,
        tags: [
            { tag: 'Go', category: 'backend' },
            { tag: 'TypeScript', category: 'backend' },
            { tag: 'React', category: 'frontend' },
            { tag: 'Angular', category: 'frontend' },
            { tag: 'Rust', category: 'backend' },
            { tag: 'PostgreSQL', category: 'backend' },
        ],
    },
    {
        name: 'ABB',
        type: 'Enterprise',
        uid: 'CHE-105.879.073',
        website: 'https://www.abb.com',
        city: 'Zürich',
        lat: 47.3769, lng: 8.5417,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Azure', category: 'cloud' },
            { tag: 'Python', category: 'backend' },
            { tag: 'Angular', category: 'frontend' },
            { tag: 'Kubernetes', category: 'devops' },
        ],
    },
    {
        name: 'Google Zürich',
        type: 'Enterprise',
        website: 'https://careers.google.com/locations/zurich/',
        city: 'Zürich',
        lat: 47.3654, lng: 8.5250,
        tags: [
            { tag: 'Go', category: 'backend' },
            { tag: 'Python', category: 'backend' },
            { tag: 'GCP', category: 'cloud' },
            { tag: 'Angular', category: 'frontend' },
            { tag: 'Kubernetes', category: 'devops' },
            { tag: 'TypeScript', category: 'backend' },
        ],
    },
    {
        name: 'UBS',
        type: 'Enterprise',
        uid: 'CHE-101.329.561',
        website: 'https://www.ubs.com',
        city: 'Zürich',
        lat: 47.3690, lng: 8.5380,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Python', category: 'backend' },
            { tag: 'AWS', category: 'cloud' },
            { tag: 'Vue', category: 'frontend' },
            { tag: 'React', category: 'frontend' },
        ],
    },
    {
        name: 'Roche',
        type: 'Enterprise',
        uid: 'CHE-120.833.973',
        website: 'https://www.roche.com',
        city: 'Basel',
        lat: 47.5596, lng: 7.5886,
        tags: [
            { tag: 'Python', category: 'backend' },
            { tag: 'R', category: 'backend' },
            { tag: 'AWS', category: 'cloud' },
            { tag: 'Azure', category: 'cloud' },
            { tag: 'React', category: 'frontend' },
        ],
    },
    {
        name: 'Roche Diagnostics Rotkreuz',
        type: 'Enterprise',
        website: 'https://www.roche.com',
        city: 'Rotkreuz',
        lat: 47.1415, lng: 8.4305,
        tags: [
            { tag: 'C++', category: 'backend' },
            { tag: 'Java', category: 'backend' },
            { tag: 'IoT', category: 'backend' },
        ],
    },
    {
        name: 'Novartis',
        type: 'Enterprise',
        uid: 'CHE-103.838.174',
        website: 'https://www.novartis.com',
        city: 'Basel',
        lat: 47.5650, lng: 7.5800,
        tags: [
            { tag: 'Python', category: 'backend' },
            { tag: 'AWS', category: 'cloud' },
            { tag: 'Spark', category: 'devops' },
            { tag: 'Vue', category: 'frontend' },
        ],
    },
    {
        name: 'Novartis Stein',
        type: 'Enterprise',
        website: 'https://www.novartis.com',
        city: 'Stein AG',
        lat: 47.5450, lng: 7.9500,
        tags: [
            { tag: 'Python', category: 'backend' },
            { tag: 'SAP', category: 'backend' },
        ],
    },
    {
        name: 'SIX Group',
        type: 'Enterprise',
        uid: 'CHE-111.926.021',
        website: 'https://www.six-group.com',
        city: 'Zürich',
        lat: 47.3714, lng: 8.5426,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Kafka', category: 'devops' },
            { tag: 'Angular', category: 'frontend' },
            { tag: 'Azure', category: 'cloud' },
            { tag: 'Kubernetes', category: 'devops' },
        ],
    },
    {
        name: 'SIX Group Olten',
        type: 'Enterprise',
        website: 'https://www.six-group.com',
        city: 'Olten',
        lat: 47.3520, lng: 7.9050,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Mainframe', category: 'backend' },
        ],
    },
    {
        name: 'Ergon Informatik',
        type: 'Enterprise',
        website: 'https://www.ergon.ch',
        city: 'Zürich',
        lat: 47.3783, lng: 8.5200,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Swift', category: 'frontend' },
            { tag: 'Kotlin', category: 'backend' },
            { tag: 'React', category: 'frontend' },
        ],
    },
    {
        name: 'Open Systems',
        type: 'Enterprise',
        website: 'https://www.open-systems.com',
        city: 'Zürich',
        lat: 47.3814, lng: 8.5351,
        tags: [
            { tag: 'Go', category: 'backend' },
            { tag: 'Rust', category: 'backend' },
            { tag: 'AWS', category: 'cloud' },
            { tag: 'React', category: 'frontend' },
        ],
    },
    {
        name: 'Adnovum',
        type: 'Enterprise',
        website: 'https://www.adnovum.ch',
        city: 'Zürich',
        lat: 47.3880, lng: 8.5170,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Angular', category: 'frontend' },
            { tag: 'AWS', category: 'cloud' },
            { tag: 'Docker', category: 'devops' },
        ],
    },
    {
        name: 'Adnovum Lausanne',
        type: 'Enterprise',
        website: 'https://www.adnovum.ch',
        city: 'Lausanne',
        lat: 46.5195, lng: 6.6325,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Security', category: 'devops' },
        ],
    },
    {
        name: 'Tamedia',
        type: 'Enterprise',
        website: 'https://www.tamedia.ch',
        city: 'Zürich',
        lat: 47.3667, lng: 8.5494,
        tags: [
            { tag: 'Scala', category: 'backend' },
            { tag: 'Kafka', category: 'devops' },
            { tag: 'React', category: 'frontend' },
            { tag: 'AWS', category: 'cloud' },
        ],
    },
    {
        name: 'Nestlé Digital Hub',
        type: 'Enterprise',
        website: 'https://www.nestle.com',
        city: 'Lausanne',
        lat: 46.5187, lng: 7.1490,
        tags: [
            { tag: 'Python', category: 'backend' },
            { tag: 'Azure', category: 'cloud' },
            { tag: 'React', category: 'frontend' },
            { tag: 'Kubernetes', category: 'devops' },
        ],
    },
    {
        name: 'EPFL Innovation Park',
        type: 'Enterprise',
        website: 'https://www.innovationpark.ch',
        city: 'Lausanne',
        lat: 46.5228, lng: 6.5677,
        tags: [
            { tag: 'Python', category: 'backend' },
            { tag: 'Rust', category: 'backend' },
            { tag: 'C++', category: 'backend' },
            { tag: 'React', category: 'frontend' },
            { tag: 'GCP', category: 'cloud' },
        ],
    },
    {
        name: 'Zühlke Engineering',
        type: 'Enterprise',
        website: 'https://www.zuehlke.com',
        city: 'Zürich',
        lat: 47.3982, lng: 8.5492,
        tags: [
            { tag: 'C#', category: 'backend' },
            { tag: 'React', category: 'frontend' },
            { tag: 'Azure', category: 'cloud' },
            { tag: 'Kubernetes', category: 'devops' },
            { tag: 'TypeScript', category: 'backend' },
        ],
    },
    {
        name: 'Zühlke Technology Group',
        type: 'Enterprise',
        website: 'https://www.zuehlke.com',
        city: 'Schlieren',
        lat: 47.3980, lng: 8.4450,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'C#', category: 'backend' },
            { tag: 'React', category: 'frontend' },
        ],
    },
    {
        name: 'Sensirion',
        type: 'Enterprise',
        website: 'https://www.sensirion.com',
        city: 'Stäfa',
        lat: 47.2392, lng: 8.7278,
        tags: [
            { tag: 'C++', category: 'backend' },
            { tag: 'Python', category: 'backend' },
            { tag: 'React', category: 'frontend' },
        ],
    },
    {
        name: 'Sunrise UPC',
        type: 'Enterprise',
        website: 'https://www.sunrise.ch',
        city: 'Zürich',
        lat: 47.4042, lng: 8.5680,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'AWS', category: 'cloud' },
            { tag: 'Vue', category: 'frontend' },
            { tag: 'Kafka', category: 'devops' },
        ],
    },
    {
        name: 'Cembra Money Bank',
        type: 'Enterprise',
        website: 'https://www.cembra.ch',
        city: 'Zürich',
        lat: 47.3849, lng: 8.5370,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Azure', category: 'cloud' },
            { tag: 'Angular', category: 'frontend' },
        ],
    },
    {
        name: 'Nvidia Zürich',
        type: 'Enterprise',
        website: 'https://www.nvidia.com',
        city: 'Zürich',
        lat: 47.3764, lng: 8.5476,
        tags: [
            { tag: 'C++', category: 'backend' },
            { tag: 'Python', category: 'backend' },
            { tag: 'CUDA', category: 'backend' },
            { tag: 'PyTorch', category: 'devops' },
        ],
    },
    {
        name: 'Microsoft Switzerland',
        type: 'Enterprise',
        uid: 'CHE-101.408.188',
        website: 'https://www.microsoft.com/de-ch/',
        city: 'Wallisellen',
        lat: 47.4140, lng: 8.5910,
        tags: [
            { tag: 'C#', category: 'backend' },
            { tag: 'Azure', category: 'cloud' },
            { tag: 'TypeScript', category: 'backend' },
            { tag: 'React', category: 'frontend' },
        ],
    },
    {
        name: 'Cisco Systems Switzerland',
        type: 'Enterprise',
        uid: 'CHE-101.037.159',
        website: 'https://www.cisco.com',
        city: 'Wallisellen',
        lat: 47.4125, lng: 8.5895,
        tags: [
            { tag: 'C++', category: 'backend' },
            { tag: 'Python', category: 'backend' },
            { tag: 'Go', category: 'backend' },
            { tag: 'Docker', category: 'devops' },
        ],
    },
    {
        name: 'Oracle Switzerland',
        type: 'Enterprise',
        uid: 'CHE-105.952.969',
        website: 'https://www.oracle.com',
        city: 'Zürich',
        lat: 47.3850, lng: 8.5250,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'SQL', category: 'backend' },
            { tag: 'Cloud Native', category: 'cloud' },
            { tag: 'Kubernetes', category: 'devops' },
        ],
    },
    {
        name: 'PostFinance',
        type: 'Enterprise',
        uid: 'CHE-114.583.132',
        website: 'https://www.postfinance.ch',
        city: 'Bern',
        lat: 46.9480, lng: 7.4474,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Angular', category: 'frontend' },
            { tag: 'OpenShift', category: 'devops' },
            { tag: 'Spring Boot', category: 'backend' },
        ],
    },
    {
        name: 'PostFinance Zofingen',
        type: 'Enterprise',
        website: 'https://www.postfinance.ch',
        city: 'Zofingen',
        lat: 47.2880, lng: 7.9450,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Spring Boot', category: 'backend' },
        ],
    },
    {
        name: 'SBB CFF FFS',
        type: 'Enterprise',
        uid: 'CHE-102.904.446',
        website: 'https://www.sbb.ch',
        city: 'Bern',
        lat: 46.9490, lng: 7.4380,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Angular', category: 'frontend' },
            { tag: 'AWS', category: 'cloud' },
            { tag: 'Kotlin', category: 'backend' },
        ],
    },
    {
        name: 'Siemens Smart Infrastructure HQ',
        type: 'Enterprise',
        uid: 'CHE-105.952.553',
        website: 'https://www.siemens.com',
        city: 'Zug',
        lat: 47.1662, lng: 8.5155,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'C#', category: 'backend' },
            { tag: 'IoT', category: 'backend' },
            { tag: 'Azure', category: 'cloud' },
            { tag: 'React', category: 'frontend' },
        ],
    },
    {
        name: 'Landis+Gyr',
        type: 'Enterprise',
        uid: 'CHE-105.811.530',
        website: 'https://www.landisgyr.com',
        city: 'Cham',
        lat: 47.1821, lng: 8.4589,
        tags: [
            { tag: 'Embedded C', category: 'backend' },
            { tag: 'Python', category: 'backend' },
            { tag: 'C++', category: 'backend' },
            { tag: 'AWS', category: 'cloud' },
        ],
    },
    {
        name: 'V-ZUG',
        type: 'Enterprise',
        website: 'https://www.vzug.com',
        city: 'Zug',
        lat: 47.1770, lng: 8.5130,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'C++', category: 'backend' },
            { tag: 'React Native', category: 'frontend' },
            { tag: 'IoT', category: 'backend' },
        ],
    },
    {
        name: 'Bossard Group',
        type: 'Enterprise',
        website: 'https://www.bossard.com',
        city: 'Zug',
        lat: 47.1750, lng: 8.5100,
        tags: [
            { tag: 'C#', category: 'backend' },
            { tag: 'Azure', category: 'cloud' },
            { tag: 'Angular', category: 'frontend' },
        ],
    },
    {
        name: 'SHL Medical',
        type: 'Enterprise',
        uid: 'CHE-114.856.969',
        website: 'https://www.shl-medical.com',
        city: 'Zug',
        lat: 47.1610, lng: 8.5110,
        tags: [
            { tag: 'C++', category: 'backend' },
            { tag: 'Python', category: 'backend' },
            { tag: 'SAP', category: 'backend' },
        ],
    },
    {
        name: 'Komax Group',
        type: 'Enterprise',
        uid: 'CHE-101.408.825',
        website: 'https://www.komaxgroup.com',
        city: 'Dierikon',
        lat: 47.0980, lng: 8.3650,
        tags: [
            { tag: 'C++', category: 'backend' },
            { tag: 'C#', category: 'backend' },
            { tag: 'Linux', category: 'devops' },
        ],
    },
    {
        name: 'T-Systems Switzerland',
        type: 'Enterprise',
        website: 'https://www.t-systems.com/ch',
        city: 'Opfikon',
        lat: 47.4330, lng: 8.5720,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Cloud', category: 'cloud' },
            { tag: 'SAP', category: 'backend' },
        ],
    },

    // --- FINTECH & BANKING ---
    {
        name: 'Avaloq',
        type: 'Fintech',
        uid: 'CHE-105.845.823',
        website: 'https://www.avaloq.com',
        city: 'Zürich',
        lat: 47.3370, lng: 8.5205,
        tags: [
            { tag: 'PL/SQL', category: 'backend' },
            { tag: 'Java', category: 'backend' },
            { tag: 'Angular', category: 'frontend' },
            { tag: 'Docker', category: 'devops' },
        ],
    },
    {
        name: 'Avaloq Sourcing',
        type: 'Fintech',
        website: 'https://www.avaloq.com',
        city: 'Bioggio',
        lat: 46.0150, lng: 8.9050,
        tags: [
            { tag: 'PL/SQL', category: 'backend' },
            { tag: 'Java', category: 'backend' },
        ],
    },
    {
        name: 'Temenos',
        type: 'Fintech',
        uid: 'CHE-107.514.948',
        website: 'https://www.temenos.com',
        city: 'Geneva',
        lat: 46.2205, lng: 6.1412,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Azure', category: 'cloud' },
            { tag: 'React', category: 'frontend' },
        ],
    },
    {
        name: 'Swissquote',
        type: 'Fintech',
        uid: 'CHE-101.009.664',
        website: 'https://www.swissquote.com',
        city: 'Gland',
        lat: 46.4211, lng: 6.2690,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Spring Boot', category: 'backend' },
            { tag: 'Oracle', category: 'backend' },
            { tag: 'React', category: 'frontend' },
            { tag: 'Kafka', category: 'devops' },
        ],
    },
    {
        name: 'Swissquote Zurich Hub',
        type: 'Fintech',
        website: 'https://www.swissquote.com',
        city: 'Zürich',
        lat: 47.3710, lng: 8.5410,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Kotlin', category: 'backend' },
        ],
    },
    {
        name: 'Neon',
        type: 'Fintech',
        website: 'https://www.neon-free.ch',
        city: 'Zürich',
        lat: 47.3712, lng: 8.5320,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Spring Boot', category: 'backend' },
            { tag: 'AWS', category: 'cloud' },
            { tag: 'React Native', category: 'frontend' },
        ],
    },
    {
        name: 'TWINT',
        type: 'Fintech',
        uid: 'CHE-391.246.516',
        website: 'https://www.twint.ch',
        city: 'Zürich',
        lat: 47.3855, lng: 8.5255,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'AWS', category: 'cloud' },
            { tag: 'Kubernetes', category: 'devops' },
        ],
    },
    {
        name: 'Bitcoin Suisse',
        type: 'Fintech',
        uid: 'CHE-472.482.496',
        website: 'https://www.bitcoinsuisse.com',
        city: 'Zug',
        lat: 47.1662, lng: 8.5155,
        tags: [
            { tag: 'C#', category: 'backend' },
            { tag: 'React', category: 'frontend' },
            { tag: 'Solidity', category: 'backend' },
            { tag: 'Azure', category: 'cloud' },
        ],
    },
    {
        name: 'Sygnum Bank',
        type: 'Fintech',
        uid: 'CHE-419.068.041',
        website: 'https://www.sygnum.com',
        city: 'Zürich',
        lat: 47.3720, lng: 8.5410,
        tags: [
            { tag: 'Go', category: 'backend' },
            { tag: 'TypeScript', category: 'backend' },
            { tag: 'React', category: 'frontend' },
            { tag: 'AWS', category: 'cloud' },
        ],
    },
    {
        name: 'Yokoy',
        type: 'Fintech',
        website: 'https://www.yokoy.io',
        city: 'Zürich',
        lat: 47.3860, lng: 8.5280,
        tags: [
            { tag: 'Python', category: 'backend' },
            { tag: 'TypeScript', category: 'backend' },
            { tag: 'React', category: 'frontend' },
            { tag: 'GCP', category: 'cloud' },
        ],
    },
    {
        name: 'Lykke',
        type: 'Fintech',
        website: 'https://www.lykke.com',
        city: 'Zug',
        lat: 47.1680, lng: 8.5140,
        tags: [
            { tag: 'C#', category: 'backend' },
            { tag: 'Go', category: 'backend' },
            { tag: 'Angular', category: 'frontend' },
        ],
    },
    {
        name: 'BitMEX (HDR Global)',
        type: 'Fintech',
        website: 'https://www.bitmex.com',
        city: 'Zug',
        lat: 47.1670, lng: 8.5180,
        tags: [
            { tag: 'Node.js', category: 'backend' },
            { tag: 'KDB+', category: 'backend' },
            { tag: 'React', category: 'frontend' },
        ],
    },
    {
        name: 'Julius Bär',
        type: 'Fintech',
        website: 'https://www.juliusbaer.com',
        city: 'Zürich',
        lat: 47.3710, lng: 8.5360,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'React', category: 'frontend' },
            { tag: 'Azure', category: 'cloud' },
        ],
    },
    {
        name: 'Vontobel',
        type: 'Fintech',
        website: 'https://www.vontobel.com',
        city: 'Zürich',
        lat: 47.3660, lng: 8.5380,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Angular', category: 'frontend' },
        ],
    },
    {
        name: 'Pictet Group',
        type: 'Fintech',
        website: 'https://www.group.pictet',
        city: 'Geneva',
        lat: 46.1920, lng: 6.1360,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'React', category: 'frontend' },
        ],
    },
    {
        name: 'Lombard Odier',
        type: 'Fintech',
        website: 'https://www.lombardodier.com',
        city: 'Geneva',
        lat: 46.2040, lng: 6.1420,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Oracle', category: 'backend' },
        ],
    },
    {
        name: 'Taurus',
        type: 'Fintech',
        website: 'https://www.taurushq.com',
        city: 'Geneva',
        lat: 46.2100, lng: 6.1400,
        tags: [
            { tag: 'Rust', category: 'backend' },
            { tag: 'TypeScript', category: 'backend' },
            { tag: 'Blockchain', category: 'backend' },
        ],
    },
    {
        name: 'Zürcher Kantonalbank (ZKB)',
        type: 'Fintech',
        website: 'https://www.zkb.ch',
        city: 'Zürich',
        lat: 47.3710, lng: 8.5400,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Angular', category: 'frontend' },
            { tag: 'OpenShift', category: 'devops' },
        ],
    },
    {
        name: 'Raiffeisen Switzerland',
        type: 'Fintech',
        website: 'https://www.raiffeisen.ch',
        city: 'St. Gallen',
        lat: 47.4245, lng: 9.3767,
        tags: [
            { tag: 'C#', category: 'backend' },
            { tag: 'Java', category: 'backend' },
            { tag: 'Angular', category: 'frontend' },
        ],
    },
    {
        name: 'Migros Bank',
        type: 'Fintech',
        website: 'https://www.migrosbank.ch',
        city: 'Zürich',
        lat: 47.3710, lng: 8.5400,
        tags: [
            { tag: 'Java', category: 'backend' },
        ],
    },
    {
        name: 'Banque Migros Tech',
        type: 'Fintech',
        website: 'https://www.migrosbank.ch',
        city: 'Wallisellen',
        lat: 47.4150, lng: 8.5900,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'C#', category: 'backend' },
        ],
    },
    {
        name: 'Valiant Bank',
        type: 'Fintech',
        website: 'https://www.valiant.ch',
        city: 'Bern',
        lat: 46.9480, lng: 7.4470,
        tags: [
            { tag: 'Java', category: 'backend' },
        ],
    },
    {
        name: 'Valiant Bank Lucerne',
        type: 'Fintech',
        website: 'https://www.valiant.ch',
        city: 'Lucerne',
        lat: 47.0500, lng: 8.3050,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Spring', category: 'backend' },
        ],
    },
    {
        name: 'Bank Cler',
        type: 'Fintech',
        website: 'https://www.cler.ch',
        city: 'Basel',
        lat: 47.5540, lng: 7.5900,
        tags: [
            { tag: 'Java', category: 'backend' },
        ],
    },
    {
        name: 'Basler Kantonalbank (BKB)',
        type: 'Fintech',
        website: 'https://www.bkb.ch',
        city: 'Basel',
        lat: 47.5540, lng: 7.5900,
        tags: [
            { tag: 'Java', category: 'backend' },
        ],
    },
    {
        name: 'Berner Kantonalbank (BEKB)',
        type: 'Fintech',
        website: 'https://www.bekb.ch',
        city: 'Bern',
        lat: 46.9480, lng: 7.4470,
        tags: [
            { tag: 'Java', category: 'backend' },
        ],
    },
    {
        name: 'Luzerner Kantonalbank (LUKB)',
        type: 'Fintech',
        website: 'https://www.lukb.ch',
        city: 'Lucerne',
        lat: 47.0510, lng: 8.3090,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Spring', category: 'backend' },
            { tag: 'Angular', category: 'frontend' },
        ],
    },
    {
        name: 'St.Galler Kantonalbank (SGKB)',
        type: 'Fintech',
        website: 'https://www.sgkb.ch',
        city: 'St. Gallen',
        lat: 47.4245, lng: 9.3767,
        tags: [
            { tag: 'Java', category: 'backend' },
        ],
    },
    {
        name: 'Aargauische Kantonalbank (AKB)',
        type: 'Fintech',
        website: 'https://www.akb.ch',
        city: 'Aarau',
        lat: 47.3920, lng: 8.0440,
        tags: [
            { tag: 'Java', category: 'backend' },
        ],
    },
    {
        name: 'Graubündner Kantonalbank (GKB)',
        type: 'Fintech',
        website: 'https://www.gkb.ch',
        city: 'Chur',
        lat: 46.8500, lng: 9.5300,
        tags: [
            { tag: 'Java', category: 'backend' },
        ],
    },
    {
        name: 'Thurgauer Kantonalbank (TKB)',
        type: 'Fintech',
        website: 'https://www.tkb.ch',
        city: 'Weinfelden',
        lat: 47.5680, lng: 9.1100,
        tags: [
            { tag: 'Java', category: 'backend' },
        ],
    },
    {
        name: 'BCV (Banque Cantonale Vaudoise)',
        type: 'Fintech',
        website: 'https://www.bcv.ch',
        city: 'Lausanne',
        lat: 46.5190, lng: 6.6350,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Oracle', category: 'backend' },
            { tag: 'Angular', category: 'frontend' },
        ],
    },
    {
        name: 'BCGE (Banque Cantonale de Genève)',
        type: 'Fintech',
        website: 'https://www.bcge.ch',
        city: 'Geneva',
        lat: 46.2040, lng: 6.1420,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Mainframe', category: 'backend' },
        ],
    },
    {
        name: 'Cornèr Bank',
        type: 'Fintech',
        website: 'https://www.corner.ch',
        city: 'Lugano',
        lat: 46.0037, lng: 8.9511,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Spring', category: 'backend' },
            { tag: 'React', category: 'frontend' },
        ],
    },
    {
        name: 'Crealogix',
        type: 'Fintech',
        uid: 'CHE-108.455.127',
        website: 'https://crealogix.com',
        city: 'Zürich',
        lat: 47.3910, lng: 8.5080,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Angular', category: 'frontend' },
            { tag: 'Spring Boot', category: 'backend' },
        ],
    },
    {
        name: 'N26 (Zurich Tech Hub)',
        type: 'Fintech',
        website: 'https://n26.com',
        city: 'Zürich',
        lat: 47.3780, lng: 8.5300,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Kotlin', category: 'backend' },
            { tag: 'AWS', category: 'cloud' },
        ],
    },
    {
        name: 'Yapeal',
        type: 'Fintech',
        website: 'https://yapeal.ch',
        city: 'Zürich',
        lat: 47.3715, lng: 8.5345,
        tags: [
            { tag: 'Go', category: 'backend' },
            { tag: 'TypeScript', category: 'backend' },
            { tag: 'Azure', category: 'cloud' },
        ],
    },

    // --- CONSULTING ---
    {
        name: 'Netcetera',
        type: 'Consulting',
        uid: 'CHE-103.543.085',
        website: 'https://www.netcetera.com',
        city: 'Zürich',
        lat: 47.3790, lng: 8.5300,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Spring', category: 'backend' },
            { tag: 'Angular', category: 'frontend' },
            { tag: 'React', category: 'frontend' },
            { tag: 'Docker', category: 'devops' },
        ],
    },
    {
        name: 'Netcetera Lausanne',
        type: 'Consulting',
        website: 'https://www.netcetera.com',
        city: 'Lausanne',
        lat: 46.5190, lng: 6.6320,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Angular', category: 'frontend' },
            { tag: 'Spring', category: 'backend' },
        ],
    },
    {
        name: 'Netcetera Winterthur',
        type: 'Consulting',
        website: 'https://www.netcetera.com',
        city: 'Winterthur',
        lat: 47.5000, lng: 8.7240,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Angular', category: 'frontend' },
            { tag: 'Android', category: 'frontend' },
        ],
    },
    {
        name: 'Netcetera Grenchen',
        type: 'Consulting',
        website: 'https://www.netcetera.com',
        city: 'Grenchen',
        lat: 47.1900, lng: 7.3950,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Embedded', category: 'backend' },
        ],
    },
    {
        name: 'Namics (Merkle)',
        type: 'Consulting',
        uid: 'CHE-101.408.066',
        website: 'https://www.namics.com',
        city: 'St. Gallen',
        lat: 47.4245, lng: 9.3767,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'PHP', category: 'backend' },
            { tag: 'Vue', category: 'frontend' },
            { tag: 'Adobe Experience Manager', category: 'backend' },
        ],
    },
    {
        name: 'bbv Software Services',
        type: 'Consulting',
        uid: 'CHE-101.272.935',
        website: 'https://www.bbv.ch',
        city: 'Luzern',
        lat: 47.0502, lng: 8.3093,
        tags: [
            { tag: 'C#', category: 'backend' },
            { tag: 'Java', category: 'backend' },
            { tag: 'Angular', category: 'frontend' },
            { tag: 'Azure', category: 'cloud' },
        ],
    },
    {
        name: 'Liip',
        type: 'Consulting',
        uid: 'CHE-113.593.180',
        website: 'https://www.liip.ch',
        city: 'Zürich',
        lat: 47.3858, lng: 8.5285,
        tags: [
            { tag: 'PHP', category: 'backend' },
            { tag: 'Python', category: 'backend' },
            { tag: 'Vue', category: 'frontend' },
            { tag: 'React', category: 'frontend' },
            { tag: 'Symfony', category: 'backend' },
        ],
    },
    {
        name: 'Liip Fribourg',
        type: 'Consulting',
        website: 'https://www.liip.ch',
        city: 'Fribourg',
        lat: 46.8065, lng: 7.1625,
        tags: [
            { tag: 'PHP', category: 'backend' },
            { tag: 'Drupal', category: 'backend' },
            { tag: 'Vue', category: 'frontend' },
        ],
    },
    {
        name: 'Liip Lausanne',
        type: 'Consulting',
        website: 'https://www.liip.ch',
        city: 'Lausanne',
        lat: 46.5200, lng: 6.6330,
        tags: [
            { tag: 'Python', category: 'backend' },
            { tag: 'Django', category: 'backend' },
            { tag: 'React', category: 'frontend' },
        ],
    },
    {
        name: 'Unic',
        type: 'Consulting',
        uid: 'CHE-108.411.751',
        website: 'https://www.unic.com',
        city: 'Zürich',
        lat: 47.3890, lng: 8.5180,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'PHP', category: 'backend' },
            { tag: 'Drupal', category: 'backend' },
            { tag: 'React', category: 'frontend' },
        ],
    },
    {
        name: 'Unic Biel',
        type: 'Consulting',
        website: 'https://www.unic.com',
        city: 'Biel',
        lat: 47.1360, lng: 7.2450,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Hybris', category: 'backend' },
        ],
    },
    {
        name: 'Ti&m',
        type: 'Consulting',
        uid: 'CHE-112.352.022',
        website: 'https://www.ti8m.com',
        city: 'Zürich',
        lat: 47.3695, lng: 8.5390,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Angular', category: 'frontend' },
            { tag: 'Kubernetes', category: 'devops' },
            { tag: 'Spring Boot', category: 'backend' },
        ],
    },
    {
        name: 'CybSafe (Switzerland)',
        type: 'Consulting',
        website: 'https://www.cybsafe.com',
        city: 'Geneva',
        lat: 46.2044, lng: 6.1432,
        tags: [
            { tag: 'Python', category: 'backend' },
            { tag: 'Django', category: 'backend' },
            { tag: 'React', category: 'frontend' },
        ],
    },
    {
        name: 'ELCA Informatique',
        type: 'Consulting',
        website: 'https://www.elca.ch',
        city: 'Lausanne',
        lat: 46.5190, lng: 6.6320,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'C#', category: 'backend' },
            { tag: 'Angular', category: 'frontend' },
        ],
    },
    {
        name: 'ELCA Geneva',
        type: 'Consulting',
        website: 'https://www.elca.ch',
        city: 'Geneva',
        lat: 46.2100, lng: 6.1400,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'C#', category: 'backend' },
        ],
    },
    {
        name: 'Puzzle ITC',
        type: 'Consulting',
        website: 'https://www.puzzle.ch',
        city: 'Bern',
        lat: 46.9450, lng: 7.4350,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Ruby on Rails', category: 'backend' },
            { tag: 'Angular', category: 'frontend' },
            { tag: 'OpenShift', category: 'devops' },
        ],
    },
    {
        name: 'Puzzle ITC Olten',
        type: 'Consulting',
        website: 'https://www.puzzle.ch',
        city: 'Olten',
        lat: 47.3500, lng: 7.9000,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'OpenShift', category: 'devops' },
        ],
    },
    {
        name: 'Accenture Switzerland',
        type: 'Consulting',
        website: 'https://www.accenture.com/ch-en',
        city: 'Zürich',
        lat: 47.3720, lng: 8.5350,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Cloud', category: 'cloud' },
        ],
    },
    {
        name: 'Deloitte Switzerland (Tech)',
        type: 'Consulting',
        website: 'https://www2.deloitte.com/ch',
        city: 'Zürich',
        lat: 47.3710, lng: 8.5360,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'AWS', category: 'cloud' },
        ],
    },
    {
        name: 'PWC Switzerland (Tech)',
        type: 'Consulting',
        website: 'https://www.pwc.ch',
        city: 'Zürich',
        lat: 47.3850, lng: 8.5280,
        tags: [
            { tag: 'C#', category: 'backend' },
            { tag: 'Azure', category: 'cloud' },
        ],
    },
    {
        name: 'Erni Consulting',
        type: 'Consulting',
        website: 'https://www.ernimetal.ch',
        city: 'Zürich',
        lat: 47.3760, lng: 8.5480,
        tags: [
            { tag: 'C#', category: 'backend' },
            { tag: 'Java', category: 'backend' },
        ],
    },
    {
        name: 'Innofactory',
        type: 'Consulting',
        website: 'https://innofactory.ch',
        city: 'Fribourg',
        lat: 46.8060, lng: 7.1620,
        tags: [
            { tag: 'Node.js', category: 'backend' },
            { tag: 'React', category: 'frontend' },
        ],
    },
    {
        name: 'SonarSource',
        type: 'Consulting',
        website: 'https://www.sonarsource.com',
        city: 'Geneva',
        lat: 46.2120, lng: 6.1380,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'TypeScript', category: 'backend' },
            { tag: 'React', category: 'frontend' },
            { tag: 'Go', category: 'backend' },
        ],
    },

    // --- E-COMMERCE & RETAIL ---
    {
        name: 'Digitec Galaxus',
        type: 'E-Commerce',
        uid: 'CHE-102.213.298',
        website: 'https://www.digitec.ch',
        city: 'Zürich',
        lat: 47.3892, lng: 8.5165,
        tags: [
            { tag: 'C#', category: 'backend' },
            { tag: 'PostgreSQL', category: 'backend' },
            { tag: 'React', category: 'frontend' },
            { tag: 'Azure', category: 'cloud' },
            { tag: 'Kubernetes', category: 'devops' },
        ],
    },
    {
        name: 'Ricardo.ch',
        type: 'E-Commerce',
        uid: 'CHE-105.147.280',
        website: 'https://www.ricardo.ch',
        city: 'Zug',
        lat: 47.1720, lng: 8.5175,
        tags: [
            { tag: 'Go', category: 'backend' },
            { tag: 'Java', category: 'backend' },
            { tag: 'React', category: 'frontend' },
            { tag: 'GCP', category: 'cloud' },
        ],
    },
    {
        name: 'Farmy.ch',
        type: 'E-Commerce',
        website: 'https://www.farmy.ch',
        city: 'Zürich',
        lat: 47.3885, lng: 8.5120,
        tags: [
            { tag: 'Ruby on Rails', category: 'backend' },
            { tag: 'React', category: 'frontend' },
            { tag: 'AWS', category: 'cloud' },
        ],
    },
    {
        name: 'Migros Online',
        type: 'E-Commerce',
        uid: 'CHE-101.442.278',
        website: 'https://www.migros.ch',
        city: 'Ecublens',
        lat: 46.5270, lng: 6.5620,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'PostgreSQL', category: 'backend' },
            { tag: 'React', category: 'frontend' },
            { tag: 'Kubernetes', category: 'devops' },
        ],
    },
    {
        name: 'Coop Digital',
        type: 'E-Commerce',
        website: 'https://www.coop.ch',
        city: 'Basel',
        lat: 47.5460, lng: 7.5940,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Spring Boot', category: 'backend' },
            { tag: 'Angular', category: 'frontend' },
            { tag: 'Azure', category: 'cloud' },
        ],
    },
    {
        name: 'Coop Digital Pratteln',
        type: 'E-Commerce',
        website: 'https://www.coop.ch',
        city: 'Pratteln',
        lat: 47.5200, lng: 7.6900,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Spring Boot', category: 'backend' },
            { tag: 'Angular', category: 'frontend' },
        ],
    },
    {
        name: 'Dosenbach-Ochsner (Digital)',
        type: 'E-Commerce',
        website: 'https://www.dosenbach.ch',
        city: 'Dietikon',
        lat: 47.4060, lng: 8.4010,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Vue', category: 'frontend' },
        ],
    },
    {
        name: 'Doodle',
        type: 'E-Commerce',
        website: 'https://doodle.com',
        city: 'Basel',
        lat: 47.5581, lng: 7.5878,
        tags: [
            { tag: 'Node.js', category: 'backend' },
            { tag: 'React', category: 'frontend' },
            { tag: 'AWS', category: 'cloud' },
            { tag: 'TypeScript', category: 'backend' },
        ],
    },

    // --- INDUSTRIAL ---
    {
        name: 'Schindler',
        type: 'Industrial',
        uid: 'CHE-105.908.523',
        website: 'https://www.schindler.com',
        city: 'Ebikon',
        lat: 47.0815, lng: 8.3395,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Python', category: 'backend' },
            { tag: 'Azure', category: 'cloud' },
            { tag: 'IoT', category: 'backend' },
        ],
    },
    {
        name: 'Endress+Hauser',
        type: 'Industrial',
        uid: 'CHE-105.952.756',
        website: 'https://www.endress.com',
        city: 'Reinach',
        lat: 47.4930, lng: 7.5940,
        tags: [
            { tag: 'C++', category: 'backend' },
            { tag: 'Java', category: 'backend' },
            { tag: 'Angular', category: 'frontend' },
        ],
    },
    {
        name: 'Hilti',
        type: 'Industrial',
        uid: 'CHE-105.962.247',
        website: 'https://www.hilti.group',
        city: 'Schaan',
        lat: 47.1850, lng: 9.5085,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'AWS', category: 'cloud' },
            { tag: 'Spring Boot', category: 'backend' },
            { tag: 'Angular', category: 'frontend' },
        ],
    },
    {
        name: 'Hilti IT Services',
        type: 'Industrial',
        website: 'https://www.hilti.group',
        city: 'Buchs SG',
        lat: 47.1680, lng: 9.4750,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Spring Boot', category: 'backend' },
            { tag: 'AWS', category: 'cloud' },
            { tag: 'Angular', category: 'frontend' },
        ],
    },
    {
        name: 'Stadler Rail',
        type: 'Industrial',
        uid: 'CHE-107.962.062',
        website: 'https://www.stadlerrail.com',
        city: 'Bussnang',
        lat: 47.5560, lng: 9.0850,
        tags: [
            { tag: 'C++', category: 'backend' },
            { tag: 'Embedded C', category: 'backend' },
            { tag: 'Python', category: 'backend' },
        ],
    },
    {
        name: 'Stadler Rail Altenrhein',
        type: 'Industrial',
        website: 'https://www.stadlerrail.com',
        city: 'Altenrhein',
        lat: 47.4830, lng: 9.5500,
        tags: [
            { tag: 'C++', category: 'backend' },
            { tag: 'Embedded', category: 'backend' },
        ],
    },
    {
        name: 'Bühler Group',
        type: 'Industrial',
        uid: 'CHE-105.938.859',
        website: 'https://www.buhlergroup.com',
        city: 'Uzwil',
        lat: 47.4435, lng: 9.1380,
        tags: [
            { tag: 'C#', category: 'backend' },
            { tag: 'Azure', category: 'cloud' },
            { tag: 'Python', category: 'backend' },
            { tag: 'IoT', category: 'backend' },
        ],
    },
    {
        name: 'Geberit',
        type: 'Industrial',
        uid: 'CHE-108.628.320',
        website: 'https://www.geberit.com',
        city: 'Rapperswil-Jona',
        lat: 47.2215, lng: 8.8185,
        tags: [
            { tag: 'SAP ABAP', category: 'backend' },
            { tag: 'Java', category: 'backend' },
            { tag: 'Azure', category: 'cloud' },
            { tag: 'SAP', category: 'backend' },
        ],
    },
    {
        name: 'Georg Fischer (GF)',
        type: 'Industrial',
        uid: 'CHE-108.778.520',
        website: 'https://www.georgfischer.com',
        city: 'Schaffhausen',
        lat: 47.7080, lng: 8.6380,
        tags: [
            { tag: 'SAP', category: 'backend' },
            { tag: 'Java', category: 'backend' },
            { tag: 'IoT', category: 'backend' },
        ],
    },
    {
        name: 'Garmin Switzerland',
        type: 'Industrial',
        website: 'https://www.garmin.com',
        city: 'Schaffhausen',
        lat: 47.6960, lng: 8.6330,
        tags: [
            { tag: 'C++', category: 'backend' },
            { tag: 'Java', category: 'backend' },
            { tag: 'Kotlin', category: 'frontend' },
        ],
    },
    {
        name: 'IWC Schaffhausen',
        type: 'Industrial',
        uid: 'CHE-105.952.126',
        website: 'https://www.iwc.com',
        city: 'Schaffhausen',
        lat: 47.6965, lng: 8.6340,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Salesforce', category: 'cloud' },
            { tag: 'React', category: 'frontend' },
        ],
    },
    {
        name: 'Autoneum',
        type: 'Industrial',
        uid: 'CHE-116.273.818',
        website: 'https://www.autoneum.com',
        city: 'Winterthur',
        lat: 47.5000, lng: 8.7240,
        tags: [
            { tag: 'C#', category: 'backend' },
            { tag: 'Azure', category: 'cloud' },
        ],
    },
    {
        name: 'WinGD',
        type: 'Industrial',
        website: 'https://www.wingd.com',
        city: 'Winterthur',
        lat: 47.4980, lng: 8.7150,
        tags: [
            { tag: 'C++', category: 'backend' },
            { tag: 'Python', category: 'backend' },
            { tag: 'Simulink', category: 'backend' },
        ],
    },
    {
        name: 'Sulzer',
        type: 'Industrial',
        uid: 'CHE-105.908.523',
        website: 'https://www.sulzer.com',
        city: 'Winterthur',
        lat: 47.5000, lng: 8.7250,
        tags: [
            { tag: 'SAP', category: 'backend' },
            { tag: 'Java', category: 'backend' },
            { tag: 'Python', category: 'backend' },
        ],
    },
    {
        name: 'Rieter',
        type: 'Industrial',
        website: 'https://www.rieter.com',
        city: 'Winterthur',
        lat: 47.4950, lng: 8.7200,
        tags: [
            { tag: 'C++', category: 'backend' },
            { tag: 'Python', category: 'backend' },
            { tag: 'IoT', category: 'backend' },
        ],
    },
    {
        name: 'Kistler Group',
        type: 'Industrial',
        website: 'https://www.kistler.com',
        city: 'Winterthur',
        lat: 47.4980, lng: 8.7240,
        tags: [
            { tag: 'C++', category: 'backend' },
            { tag: 'Python', category: 'backend' },
            { tag: 'Embedded', category: 'backend' },
        ],
    },
    {
        name: 'Burckhardt Compression',
        type: 'Industrial',
        website: 'https://www.burckhardtcompression.com',
        city: 'Winterthur',
        lat: 47.4950, lng: 8.7300,
        tags: [
            { tag: 'C#', category: 'backend' },
            { tag: 'Azure', category: 'cloud' },
        ],
    },
    {
        name: 'Belimo',
        type: 'Industrial',
        website: 'https://www.belimo.com',
        city: 'Hinwil',
        lat: 47.3000, lng: 8.8400,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'C++', category: 'backend' },
            { tag: 'IoT', category: 'backend' },
        ],
    },
    {
        name: 'Leica Geosystems',
        type: 'Industrial',
        website: 'https://leica-geosystems.com',
        city: 'Heerbrugg',
        lat: 47.4110, lng: 9.6260,
        tags: [
            { tag: 'C++', category: 'backend' },
            { tag: 'C#', category: 'backend' },
            { tag: 'Python', category: 'backend' },
        ],
    },
    {
        name: 'Innosolv',
        type: 'Industrial',
        website: 'https://www.innosolv.ch',
        city: 'St. Gallen',
        lat: 47.4250, lng: 9.3800,
        tags: [
            { tag: 'C#', category: 'backend' },
            { tag: 'SQL Server', category: 'backend' },
            { tag: 'ASP.NET', category: 'backend' },
        ],
    },
    {
        name: 'Abacus Research',
        type: 'Industrial',
        uid: 'CHE-108.455.127',
        website: 'https://www.abacus.ch',
        city: 'Wittenbach',
        lat: 47.4640, lng: 9.3780,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Angular', category: 'frontend' },
            { tag: 'iOS', category: 'frontend' },
            { tag: 'Docker', category: 'devops' },
        ],
    },
    {
        name: 'Oerlikon',
        type: 'Industrial',
        website: 'https://www.oerlikon.com',
        city: 'Pfäffikon',
        lat: 47.3670, lng: 8.7830,
        tags: [
            { tag: 'SAP', category: 'backend' },
            { tag: 'C#', category: 'backend' },
            { tag: 'Azure', category: 'cloud' },
        ],
    },
    {
        name: 'Oerlikon Metco',
        type: 'Industrial',
        website: 'https://www.oerlikon.com/metco',
        city: 'Wohlen',
        lat: 47.3500, lng: 8.2750,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'IoT', category: 'backend' },
        ],
    },
    {
        name: 'Bucher Industries',
        type: 'Industrial',
        website: 'https://www.bucherindustries.com',
        city: 'Niederweningen',
        lat: 47.5050, lng: 8.3850,
        tags: [
            { tag: 'C#', category: 'backend' },
            { tag: 'SAP', category: 'backend' },
        ],
    },
    {
        name: 'Schaffner Group',
        type: 'Industrial',
        website: 'https://www.schaffner.com',
        city: 'Luterbach',
        lat: 47.2180, lng: 7.5850,
        tags: [
            { tag: 'C#', category: 'backend' },
            { tag: 'Embedded', category: 'backend' },
        ],
    },
    {
        name: 'VAT Group',
        type: 'Industrial',
        website: 'https://www.vatvalve.com',
        city: 'Haag',
        lat: 47.2100, lng: 9.4800,
        tags: [
            { tag: 'C#', category: 'backend' },
            { tag: 'Automation', category: 'backend' },
        ],
    },
    {
        name: 'Sefar',
        type: 'Industrial',
        website: 'https://www.sefar.com',
        city: 'Heiden',
        lat: 47.4420, lng: 9.5300,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Python', category: 'backend' },
        ],
    },
    {
        name: 'Gallus Ferd. Rüesch',
        type: 'Industrial',
        website: 'https://www.gallus-group.com',
        city: 'St. Gallen',
        lat: 47.4110, lng: 9.3500,
        tags: [
            { tag: 'C++', category: 'backend' },
            { tag: 'C#', category: 'backend' },
        ],
    },
    {
        name: 'Trumpf Switzerland',
        type: 'Industrial',
        website: 'https://www.trumpf.com',
        city: 'Grüsch',
        lat: 46.9800, lng: 9.6450,
        tags: [
            { tag: 'C++', category: 'backend' },
            { tag: 'C#', category: 'backend' },
        ],
    },
    {
        name: 'EMS-Chemie',
        type: 'Industrial',
        website: 'https://www.ems-group.com',
        city: 'Domat/Ems',
        lat: 46.8330, lng: 9.4500,
        tags: [
            { tag: 'SAP', category: 'backend' },
            { tag: 'Python', category: 'backend' },
        ],
    },
    {
        name: 'Hamilton Bonaduz',
        type: 'Industrial',
        website: 'https://www.hamiltoncompany.com',
        city: 'Bonaduz',
        lat: 46.8150, lng: 9.4000,
        tags: [
            { tag: 'C++', category: 'backend' },
            { tag: 'C#', category: 'backend' },
            { tag: 'Python', category: 'backend' },
            { tag: 'Robotics', category: 'backend' },
        ],
    },
    {
        name: 'Hamilton Medical',
        type: 'Industrial',
        website: 'https://www.hamilton-medical.com',
        city: 'Bonaduz',
        lat: 46.8160, lng: 9.4010,
        tags: [
            { tag: 'C++', category: 'backend' },
            { tag: 'Embedded', category: 'backend' },
            { tag: 'Qt', category: 'frontend' },
        ],
    },
    {
        name: 'Pilatus Aircraft',
        type: 'Industrial',
        website: 'https://www.pilatus-aircraft.com',
        city: 'Stans',
        lat: 46.9740, lng: 8.3800,
        tags: [
            { tag: 'C#', category: 'backend' },
            { tag: 'C++', category: 'backend' },
            { tag: 'SAP', category: 'backend' },
        ],
    },
    {
        name: 'Ruag International',
        type: 'Industrial',
        website: 'https://www.ruag.com',
        city: 'Emmen',
        lat: 47.0900, lng: 8.3050,
        tags: [
            { tag: 'C++', category: 'backend' },
            { tag: 'Python', category: 'backend' },
            { tag: 'Embedded', category: 'backend' },
        ],
    },
    {
        name: 'BorgWarner',
        type: 'Industrial',
        website: 'https://www.borgwarner.com',
        city: 'Winterthur',
        lat: 47.5000, lng: 8.7250,
        tags: [
            { tag: 'Embedded C', category: 'backend' },
            { tag: 'Python', category: 'backend' },
        ],
    },
    {
        name: 'Oerlikon Balzers',
        type: 'Industrial',
        website: 'https://www.oerlikon.com/balzers',
        city: 'Balzers (LI/CH)',
        lat: 47.0670, lng: 9.5000,
        tags: [
            { tag: 'C#', category: 'backend' },
            { tag: 'Python', category: 'backend' },
        ],
    },

    // --- BIOTECH ---
    {
        name: 'Idorsia',
        type: 'Biotech',
        uid: 'CHE-190.007.868',
        website: 'https://www.idorsia.com',
        city: 'Allschwil',
        lat: 47.5488, lng: 7.5355,
        tags: [
            { tag: 'Python', category: 'backend' },
            { tag: 'Java', category: 'backend' },
            { tag: 'R', category: 'backend' },
            { tag: 'AWS', category: 'cloud' },
        ],
    },
    {
        name: 'Lonza',
        type: 'Biotech',
        uid: 'CHE-106.841.418',
        website: 'https://www.lonza.com',
        city: 'Basel',
        lat: 47.5525, lng: 7.5880,
        tags: [
            { tag: 'Python', category: 'backend' },
            { tag: 'Java', category: 'backend' },
            { tag: 'SAP', category: 'backend' },
        ],
    },
    {
        name: 'Lonza Visp',
        type: 'Biotech',
        website: 'https://www.lonza.com',
        city: 'Visp',
        lat: 46.2900, lng: 7.8800,
        tags: [
            { tag: 'SAP', category: 'backend' },
            { tag: 'Python', category: 'backend' },
            { tag: 'MES', category: 'backend' },
        ],
    },
    {
        name: 'SOPHiA GENETICS',
        type: 'Biotech',
        uid: 'CHE-214.945.892',
        website: 'https://www.sophiagenetics.com',
        city: 'Saint-Sulpice',
        lat: 46.5125, lng: 6.5620,
        tags: [
            { tag: 'Python', category: 'backend' },
            { tag: 'C++', category: 'backend' },
            { tag: 'AWS', category: 'cloud' },
            { tag: 'Docker', category: 'devops' },
            { tag: 'Angular', category: 'frontend' },
        ],
    },
    {
        name: 'Givaudan',
        type: 'Biotech',
        uid: 'CHE-105.786.110',
        website: 'https://www.givaudan.com',
        city: 'Vernier',
        lat: 46.2160, lng: 6.0880,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Azure', category: 'cloud' },
            { tag: 'React', category: 'frontend' },
        ],
    },
    {
        name: 'CSEM',
        type: 'Biotech',
        website: 'https://www.csem.ch',
        city: 'Neuchâtel',
        lat: 46.9930, lng: 6.9320,
        tags: [
            { tag: 'Python', category: 'backend' },
            { tag: 'C', category: 'backend' },
            { tag: 'Machine Learning', category: 'backend' },
            { tag: 'MATLAB', category: 'backend' },
        ],
    },
    {
        name: 'IBSA Institute',
        type: 'Biotech',
        website: 'https://www.ibsa-group.com',
        city: 'Lugano',
        lat: 46.0100, lng: 8.9600,
        tags: [
            { tag: 'Python', category: 'backend' },
            { tag: 'SAP', category: 'backend' },
        ],
    },
    {
        name: 'Syngenta Monthey',
        type: 'Biotech',
        website: 'https://www.syngenta.com',
        city: 'Monthey',
        lat: 46.2500, lng: 6.9500,
        tags: [
            { tag: 'Python', category: 'backend' },
            { tag: 'Data Science', category: 'backend' },
        ],
    },

    // --- LUXURY ---
    {
        name: 'Richemont',
        type: 'Luxury',
        uid: 'CHE-101.554.269',
        website: 'https://www.richemont.com',
        city: 'Bellevue',
        lat: 46.2575, lng: 6.1550,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'AWS', category: 'cloud' },
            { tag: 'React', category: 'frontend' },
            { tag: 'Node.js', category: 'backend' },
        ],
    },
    {
        name: 'Swatch Group',
        type: 'Luxury',
        uid: 'CHE-105.952.126',
        website: 'https://www.swatchgroup.com',
        city: 'Biel/Bienne',
        lat: 47.1350, lng: 7.2460,
        tags: [
            { tag: 'C', category: 'backend' },
            { tag: 'Java', category: 'backend' },
            { tag: 'Swift', category: 'frontend' },
        ],
    },
    {
        name: 'Rolex (IT Center)',
        type: 'Luxury',
        uid: 'CHE-105.922.951',
        website: 'https://www.rolex.com',
        city: 'Geneva',
        lat: 46.1950, lng: 6.1300,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Oracle', category: 'backend' },
            { tag: 'React', category: 'frontend' },
        ],
    },

    // --- INSURANCE ---
    {
        name: 'Zurich Insurance Group',
        type: 'Insurance',
        uid: 'CHE-105.833.148',
        website: 'https://www.zurich.com',
        city: 'Zürich',
        lat: 47.3620, lng: 8.5360,
        tags: [
            { tag: 'C#', category: 'backend' },
            { tag: 'Java', category: 'backend' },
            { tag: 'Azure', category: 'cloud' },
            { tag: 'Angular', category: 'frontend' },
        ],
    },
    {
        name: 'Swiss Re',
        type: 'Insurance',
        uid: 'CHE-106.126.981',
        website: 'https://www.swissre.com',
        city: 'Zürich',
        lat: 47.3610, lng: 8.5440,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Python', category: 'backend' },
            { tag: 'Azure', category: 'cloud' },
            { tag: 'Kubernetes', category: 'devops' },
        ],
    },
    {
        name: 'Helvetia',
        type: 'Insurance',
        uid: 'CHE-105.952.503',
        website: 'https://www.helvetia.ch',
        city: 'St. Gallen',
        lat: 47.4240, lng: 9.3780,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Spring', category: 'backend' },
            { tag: 'AWS', category: 'cloud' },
        ],
    },
    {
        name: 'Baloise',
        type: 'Insurance',
        uid: 'CHE-105.961.428',
        website: 'https://www.baloise.com',
        city: 'Basel',
        lat: 47.5475, lng: 7.5930,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Angular', category: 'frontend' },
            { tag: 'PostgreSQL', category: 'backend' },
        ],
    },
    {
        name: 'Swiss Life',
        type: 'Insurance',
        uid: 'CHE-105.927.854',
        website: 'https://www.swisslife.com',
        city: 'Zürich',
        lat: 47.3615, lng: 8.5355,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Angular', category: 'frontend' },
            { tag: 'Azure', category: 'cloud' },
        ],
    },
    {
        name: 'Axa Switzerland',
        type: 'Insurance',
        website: 'https://www.axa.ch',
        city: 'Winterthur',
        lat: 47.5000, lng: 8.7240,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Angular', category: 'frontend' },
            { tag: 'Cloud Native', category: 'cloud' },
        ],
    },
    {
        name: 'CSS Versicherung',
        type: 'Insurance',
        uid: 'CHE-108.952.128',
        website: 'https://www.css.ch',
        city: 'Lucerne',
        lat: 47.0500, lng: 8.3020,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Angular', category: 'frontend' },
            { tag: 'OpenShift', category: 'devops' },
        ],
    },
    {
        name: 'Visana',
        type: 'Insurance',
        website: 'https://www.visana.ch',
        city: 'Bern',
        lat: 46.9480, lng: 7.4470,
        tags: [
            { tag: 'Java', category: 'backend' },
        ],
    },
    {
        name: 'Sanitas',
        type: 'Insurance',
        website: 'https://www.sanitas.com',
        city: 'Zürich',
        lat: 47.3760, lng: 8.5480,
        tags: [
            { tag: 'Java', category: 'backend' },
        ],
    },
    {
        name: 'Helsana',
        type: 'Insurance',
        website: 'https://www.helsana.ch',
        city: 'Zürich',
        lat: 47.3760, lng: 8.5480,
        tags: [
            { tag: 'Java', category: 'backend' },
        ],
    },
    {
        name: 'Die Mobiliar',
        type: 'Insurance',
        website: 'https://www.mobiliar.ch',
        city: 'Bern',
        lat: 46.9480, lng: 7.4470,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Angular', category: 'frontend' },
        ],
    },
    {
        name: 'Suva',
        type: 'Insurance',
        website: 'https://www.suva.ch',
        city: 'Lucerne',
        lat: 47.0500, lng: 8.3100,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'PL/SQL', category: 'backend' },
        ],
    },

    // --- BLOCKCHAIN ---
    {
        name: 'Ethereum Foundation',
        type: 'Blockchain',
        website: 'https://ethereum.org',
        city: 'Zug',
        lat: 47.1662, lng: 8.5155,
        tags: [
            { tag: 'Go', category: 'backend' },
            { tag: 'Rust', category: 'backend' },
            { tag: 'Solidity', category: 'backend' },
            { tag: 'Python', category: 'backend' },
        ],
    },
    {
        name: 'DFINITY',
        type: 'Blockchain',
        website: 'https://dfinity.org',
        city: 'Zürich',
        lat: 47.3780, lng: 8.5400,
        tags: [
            { tag: 'Rust', category: 'backend' },
            { tag: 'WebAssembly', category: 'backend' },
            { tag: 'Haskell', category: 'backend' },
        ],
    },
    {
        name: 'Cardano Foundation',
        type: 'Blockchain',
        website: 'https://cardanofoundation.org',
        city: 'Zug',
        lat: 47.1665, lng: 8.5150,
        tags: [
            { tag: 'Haskell', category: 'backend' },
            { tag: 'Rust', category: 'backend' },
        ],
    },
    {
        name: 'Metaco',
        type: 'Blockchain',
        website: 'https://www.metaco.com',
        city: 'Lausanne',
        lat: 46.5191, lng: 6.6335,
        tags: [
            { tag: 'Scala', category: 'backend' },
            { tag: 'TypeScript', category: 'backend' },
            { tag: 'Rust', category: 'backend' },
            { tag: 'Kubernetes', category: 'devops' },
        ],
    },
    {
        name: 'WeCan Group',
        type: 'Blockchain',
        website: 'https://wecangroup.ch',
        city: 'Geneva',
        lat: 46.2044, lng: 6.1432,
        tags: [
            { tag: 'Node.js', category: 'backend' },
            { tag: 'TypeScript', category: 'backend' },
            { tag: 'Blockchain', category: 'backend' },
        ],
    },
    {
        name: 'S-PRO',
        type: 'Blockchain',
        website: 'https://s-pro.io',
        city: 'Zug',
        lat: 47.1700, lng: 8.5200,
        tags: [
            { tag: 'Node.js', category: 'backend' },
            { tag: 'TypeScript', category: 'backend' },
            { tag: 'React', category: 'frontend' },
            { tag: 'Blockchain', category: 'backend' },
        ],
    },

    // --- STARTUPS ---
    {
        name: 'Sherpany',
        type: 'Startup',
        website: 'https://www.sherpany.com',
        city: 'Zürich',
        lat: 47.3710, lng: 8.5320,
        tags: [
            { tag: 'Python', category: 'backend' },
            { tag: 'Django', category: 'backend' },
            { tag: 'React', category: 'frontend' },
        ],
    },
    {
        name: 'Smallpdf',
        type: 'Startup',
        website: 'https://smallpdf.com',
        city: 'Zürich',
        lat: 47.3735, lng: 8.5315,
        tags: [
            { tag: 'Go', category: 'backend' },
            { tag: 'TypeScript', category: 'backend' },
            { tag: 'React', category: 'frontend' },
            { tag: 'AWS', category: 'cloud' },
        ],
    },
    {
        name: 'Beekeeper',
        type: 'Startup',
        website: 'https://www.beekeeper.io',
        city: 'Zürich',
        lat: 47.3855, lng: 8.5265,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Python', category: 'backend' },
            { tag: 'React', category: 'frontend' },
            { tag: 'AWS', category: 'cloud' },
        ],
    },
    {
        name: 'Frontify',
        type: 'Startup',
        website: 'https://www.frontify.com',
        city: 'St. Gallen',
        lat: 47.4245, lng: 9.3760,
        tags: [
            { tag: 'PHP', category: 'backend' },
            { tag: 'Laravel', category: 'backend' },
            { tag: 'Vue', category: 'frontend' },
            { tag: 'AWS', category: 'cloud' },
        ],
    },
    {
        name: 'Scandit',
        type: 'Startup',
        website: 'https://www.scandit.com',
        city: 'Zürich',
        lat: 47.3725, lng: 8.5330,
        tags: [
            { tag: 'C++', category: 'backend' },
            { tag: 'Python', category: 'backend' },
            { tag: 'Node.js', category: 'backend' },
            { tag: 'Machine Learning', category: 'backend' },
            { tag: 'AWS', category: 'cloud' },
        ],
    },
    {
        name: 'GetYourGuide',
        type: 'Startup',
        website: 'https://www.getyourguide.com',
        city: 'Zürich',
        lat: 47.3888, lng: 8.5175,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Go', category: 'backend' },
            { tag: 'React', category: 'frontend' },
            { tag: 'AWS', category: 'cloud' },
        ],
    },
    {
        name: 'Flyability',
        type: 'Startup',
        website: 'https://www.flyability.com',
        city: 'Prilly',
        lat: 46.5225, lng: 6.6310,
        tags: [
            { tag: 'C++', category: 'backend' },
            { tag: 'Python', category: 'backend' },
            { tag: 'Embedded', category: 'backend' },
        ],
    },
    {
        name: 'LatticeFlow',
        type: 'Startup',
        website: 'https://latticeflow.ai',
        city: 'Zürich',
        lat: 47.3760, lng: 8.5480,
        tags: [
            { tag: 'Python', category: 'backend' },
            { tag: 'TypeScript', category: 'backend' },
            { tag: 'React', category: 'frontend' },
            { tag: 'Kubernetes', category: 'devops' },
        ],
    },
    {
        name: 'Mila',
        type: 'Startup',
        website: 'https://www.mila.com',
        city: 'Zürich',
        lat: 47.3722, lng: 8.5310,
        tags: [
            { tag: 'Node.js', category: 'backend' },
            { tag: 'React', category: 'frontend' },
            { tag: 'PostgreSQL', category: 'backend' },
        ],
    },
    {
        name: 'Wingtra',
        type: 'Startup',
        website: 'https://wingtra.com',
        city: 'Zürich',
        lat: 47.3820, lng: 8.5210,
        tags: [
            { tag: 'C++', category: 'backend' },
            { tag: 'Python', category: 'backend' },
            { tag: 'Embedded C', category: 'backend' },
        ],
    },
    {
        name: 'Ledgy',
        type: 'Startup',
        website: 'https://www.ledgy.com',
        city: 'Zürich',
        lat: 47.3755, lng: 8.5290,
        tags: [
            { tag: 'Node.js', category: 'backend' },
            { tag: 'TypeScript', category: 'backend' },
            { tag: 'React', category: 'frontend' },
        ],
    },
    {
        name: 'Pexels (Canva Zurich)',
        type: 'Startup',
        website: 'https://www.pexels.com',
        city: 'Zürich',
        lat: 47.3780, lng: 8.5350,
        tags: [
            { tag: 'Ruby on Rails', category: 'backend' },
            { tag: 'React', category: 'frontend' },
            { tag: 'AWS', category: 'cloud' },
        ],
    },
    {
        name: 'Apiax',
        type: 'Startup',
        website: 'https://www.apiax.com',
        city: 'Zürich',
        lat: 47.3715, lng: 8.5340,
        tags: [
            { tag: 'TypeScript', category: 'backend' },
            { tag: 'Node.js', category: 'backend' },
            { tag: 'React', category: 'frontend' },
        ],
    },
    {
        name: 'Ava Women',
        type: 'Startup',
        website: 'https://www.avawomen.com',
        city: 'Zürich',
        lat: 47.3840, lng: 8.5280,
        tags: [
            { tag: 'Python', category: 'backend' },
            { tag: 'Java', category: 'backend' },
            { tag: 'Swift', category: 'frontend' },
        ],
    },
    {
        name: 'Starmind',
        type: 'Startup',
        website: 'https://www.starmind.ai',
        city: 'Zürich',
        lat: 47.3860, lng: 8.5270,
        tags: [
            { tag: 'Python', category: 'backend' },
            { tag: 'Java', category: 'backend' },
            { tag: 'Angular', category: 'frontend' },
        ],
    },
    {
        name: 'Cleveron',
        type: 'Startup',
        website: 'https://www.cleveron.com',
        city: 'Geneva',
        lat: 46.2044, lng: 6.1432,
        tags: [
            { tag: 'Python', category: 'backend' },
            { tag: 'Docker', category: 'devops' },
        ],
    },
    {
        name: 'Teralytics',
        type: 'Startup',
        website: 'https://www.teralytics.net',
        city: 'Zürich',
        lat: 47.3785, lng: 8.5395,
        tags: [
            { tag: 'Scala', category: 'backend' },
            { tag: 'Spark', category: 'devops' },
            { tag: 'Python', category: 'backend' },
            { tag: 'Kubernetes', category: 'devops' },
        ],
    },
    {
        name: 'DeepCode (Snyk)',
        type: 'Startup',
        website: 'https://www.deepcode.ai',
        city: 'Zürich',
        lat: 47.3765, lng: 8.5470,
        tags: [
            { tag: 'Python', category: 'backend' },
            { tag: 'TypeScript', category: 'backend' },
            { tag: 'Go', category: 'backend' },
        ],
    },
    {
        name: 'Mindmaze',
        type: 'Startup',
        website: 'https://www.mindmaze.com',
        city: 'Lausanne',
        lat: 46.5185, lng: 6.6340,
        tags: [
            { tag: 'C++', category: 'backend' },
            { tag: 'Unity', category: 'frontend' },
            { tag: 'C#', category: 'backend' },
            { tag: 'Python', category: 'backend' },
        ],
    },
    {
        name: 'Nexthink',
        type: 'Startup',
        uid: 'CHE-113.731.439',
        website: 'https://www.nexthink.com',
        city: 'Lausanne',
        lat: 46.5195, lng: 6.6320,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'C++', category: 'backend' },
            { tag: 'Kafka', category: 'devops' },
            { tag: 'React', category: 'frontend' },
            { tag: 'AWS', category: 'cloud' },
        ],
    },
    {
        name: 'Squire',
        type: 'Startup',
        website: 'https://www.getsquire.com',
        city: 'Zürich',
        lat: 47.3750, lng: 8.5310,
        tags: [
            { tag: 'Node.js', category: 'backend' },
            { tag: 'React', category: 'frontend' },
        ],
    },
    {
        name: 'Proda',
        type: 'Startup',
        website: 'https://proda.ai',
        city: 'Zürich',
        lat: 47.3760, lng: 8.5280,
        tags: [
            { tag: 'Python', category: 'backend' },
            { tag: 'React', category: 'frontend' },
        ],
    },
    {
        name: 'Exoscale',
        type: 'Startup',
        website: 'https://www.exoscale.com',
        city: 'Lausanne',
        lat: 46.5200, lng: 6.6350,
        tags: [
            { tag: 'Clojure', category: 'backend' },
            { tag: 'Python', category: 'backend' },
            { tag: 'Go', category: 'backend' },
            { tag: 'Docker', category: 'devops' },
            { tag: 'Linux', category: 'devops' },
        ],
    },
    {
        name: 'Hostpoint',
        type: 'Startup',
        uid: 'CHE-101.401.791',
        website: 'https://www.hostpoint.ch',
        city: 'Rapperswil-Jona',
        lat: 47.2260, lng: 8.8180,
        tags: [
            { tag: 'PHP', category: 'backend' },
            { tag: 'Python', category: 'backend' },
            { tag: 'Perl', category: 'backend' },
            { tag: 'Linux', category: 'devops' },
        ],
    },
    {
        name: 'Infomaniak',
        type: 'Startup',
        website: 'https://www.infomaniak.com',
        city: 'Geneva',
        lat: 46.2044, lng: 6.1432,
        tags: [
            { tag: 'PHP', category: 'backend' },
            { tag: 'Python', category: 'backend' },
            { tag: 'Go', category: 'backend' },
            { tag: 'OpenStack', category: 'devops' },
        ],
    },
    {
        name: 'Squirro',
        type: 'Startup',
        website: 'https://squirro.com',
        city: 'Zürich',
        lat: 47.3725, lng: 8.5415,
        tags: [
            { tag: 'Python', category: 'backend' },
            { tag: 'Elasticsearch', category: 'backend' },
            { tag: 'React', category: 'frontend' },
        ],
    },
    {
        name: 'Bequant',
        type: 'Startup',
        website: 'https://bequant.io',
        city: 'Zug',
        lat: 47.1660, lng: 8.5150,
        tags: [
            { tag: 'C++', category: 'backend' },
            { tag: 'Python', category: 'backend' },
        ],
    },
    {
        name: 'Anapaya Systems',
        type: 'Startup',
        website: 'https://www.anapaya.net',
        city: 'Zürich',
        lat: 47.3760, lng: 8.5480,
        tags: [
            { tag: 'Go', category: 'backend' },
            { tag: 'C++', category: 'backend' },
            { tag: 'Networking', category: 'backend' },
        ],
    },
    {
        name: 'Futurae Technologies',
        type: 'Startup',
        website: 'https://www.futurae.com',
        city: 'Zürich',
        lat: 47.3850, lng: 8.5280,
        tags: [
            { tag: 'Python', category: 'backend' },
            { tag: 'Go', category: 'backend' },
            { tag: 'AWS', category: 'cloud' },
        ],
    },
    {
        name: 'VSHN',
        type: 'Startup',
        website: 'https://www.vshn.ch',
        city: 'Zürich',
        lat: 47.3865, lng: 8.5275,
        tags: [
            { tag: 'Kubernetes', category: 'devops' },
            { tag: 'Docker', category: 'devops' },
            { tag: 'Python', category: 'backend' },
            { tag: 'OpenShift', category: 'devops' },
        ],
    },
    {
        name: 'Nine Internet Solutions',
        type: 'Startup',
        website: 'https://www.nine.ch',
        city: 'Zürich',
        lat: 47.3810, lng: 8.5360,
        tags: [
            { tag: 'Kubernetes', category: 'devops' },
            { tag: 'Ruby', category: 'backend' },
            { tag: 'GCP', category: 'cloud' },
        ],
    },
    {
        name: 'Metatoul',
        type: 'Startup',
        website: 'https://metatoul.ch',
        city: 'Geneva',
        lat: 46.2044, lng: 6.1432,
        tags: [
            { tag: 'Python', category: 'backend' },
            { tag: 'Next.js', category: 'frontend' },
        ],
    },
    {
        name: 'Decentriq',
        type: 'Startup',
        website: 'https://www.decentriq.com',
        city: 'Zürich',
        lat: 47.3760, lng: 8.5480,
        tags: [
            { tag: 'Rust', category: 'backend' },
            { tag: 'Python', category: 'backend' },
            { tag: 'Azure', category: 'cloud' },
        ],
    },
    {
        name: 'Tiptapp',
        type: 'Startup',
        website: 'https://www.tiptapp.com',
        city: 'Zürich',
        lat: 47.3750, lng: 8.5300,
        tags: [
            { tag: 'Node.js', category: 'backend' },
            { tag: 'React Native', category: 'frontend' },
            { tag: 'AWS', category: 'cloud' },
        ],
    },
    {
        name: 'Bexio',
        type: 'Startup',
        uid: 'CHE-114.856.969',
        website: 'https://www.bexio.com',
        city: 'Rapperswil',
        lat: 47.2260, lng: 8.8180,
        tags: [
            { tag: 'PHP', category: 'backend' },
            { tag: 'Laravel', category: 'backend' },
            { tag: 'React', category: 'frontend' },
            { tag: 'AWS', category: 'cloud' },
        ],
    },
    {
        name: 'Pexapark',
        type: 'Startup',
        website: 'https://pexapark.com',
        city: 'Schlieren',
        lat: 47.3980, lng: 8.4450,
        tags: [
            { tag: 'Python', category: 'backend' },
            { tag: 'React', category: 'frontend' },
            { tag: 'Azure', category: 'cloud' },
        ],
    },
    {
        name: 'OneDoc',
        type: 'Startup',
        website: 'https://www.onedoc.ch',
        city: 'Geneva',
        lat: 46.2044, lng: 6.1432,
        tags: [
            { tag: 'Ruby on Rails', category: 'backend' },
            { tag: 'React', category: 'frontend' },
        ],
    },
    {
        name: 'Dootix',
        type: 'Startup',
        website: 'https://dootix.com',
        city: 'Ecublens',
        lat: 46.5270, lng: 6.5620,
        tags: [
            { tag: 'PHP', category: 'backend' },
            { tag: 'Laravel', category: 'backend' },
            { tag: 'Vue', category: 'frontend' },
        ],
    },
    {
        name: 'Globaz',
        type: 'Startup',
        uid: 'CHE-101.408.066',
        website: 'https://www.globaz.ch',
        city: 'Le Noirmont',
        lat: 47.2250, lng: 6.9950,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Oracle', category: 'backend' },
            { tag: 'Docker', category: 'devops' },
        ],
    },
    {
        name: 'Bending Spoons Ticino',
        type: 'Startup',
        website: 'https://bendingspoons.com',
        city: 'Lugano',
        lat: 46.0030, lng: 8.9520,
        tags: [
            { tag: 'Swift', category: 'frontend' },
            { tag: 'Kotlin', category: 'frontend' },
            { tag: 'Python', category: 'backend' },
        ],
    },
    {
        name: 'DeepL (Zurich Office)',
        type: 'Startup',
        website: 'https://www.deepl.com',
        city: 'Zürich',
        lat: 47.3780, lng: 8.5400,
        tags: [
            { tag: 'Python', category: 'backend' },
            { tag: 'C++', category: 'backend' },
            { tag: 'PyTorch', category: 'backend' },
        ],
    },
    {
        name: 'Trident Software',
        type: 'Startup',
        website: 'https://trident-software.ch',
        city: 'Sion',
        lat: 46.2330, lng: 7.3600,
        tags: [
            { tag: 'C#', category: 'backend' },
            { tag: 'Azure', category: 'cloud' },
        ],
    },
    {
        name: 'Asendia',
        type: 'Startup',
        website: 'https://www.asendia.com',
        city: 'Glattbrugg',
        lat: 47.4330, lng: 8.5600,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'C#', category: 'backend' },
        ],
    },
    {
        name: 'Emmi Digital',
        type: 'Startup',
        website: 'https://group.emmi.com',
        city: 'Lucerne',
        lat: 47.0500, lng: 8.3000,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Salesforce', category: 'cloud' },
        ],
    },
    {
        name: 'Valora Digital',
        type: 'Startup',
        website: 'https://www.valora.com',
        city: 'Zürich',
        lat: 47.3760, lng: 8.5480,
        tags: [
            { tag: 'Node.js', category: 'backend' },
            { tag: 'React', category: 'frontend' },
        ],
    },
    {
        name: 'Wizdom',
        type: 'Startup',
        website: 'https://wizdom.ai',
        city: 'Zürich',
        lat: 47.3760, lng: 8.5480,
        tags: [
            { tag: 'Python', category: 'backend' },
        ],
    },
    {
        name: 'Esri Switzerland',
        type: 'Startup',
        website: 'https://www.esri.ch',
        city: 'Zürich',
        lat: 47.3760, lng: 8.5480,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Python', category: 'backend' },
        ],
    },
    {
        name: 'OpenData.ch',
        type: 'Startup',
        website: 'https://opendata.ch',
        city: 'Zürich',
        lat: 47.3760, lng: 8.5480,
        tags: [
            { tag: 'Python', category: 'backend' },
        ],
    },
    {
        name: 'Kudelski Security',
        type: 'Startup',
        website: 'https://kudelskisecurity.com',
        city: 'Cheseaux-sur-Lausanne',
        lat: 46.5850, lng: 6.5750,
        tags: [
            { tag: 'C++', category: 'backend' },
            { tag: 'Python', category: 'backend' },
            { tag: 'Go', category: 'backend' },
        ],
    },
    {
        name: 'SWS (MeteoSwiss)',
        type: 'Startup',
        website: 'https://www.meteoswiss.admin.ch',
        city: 'Payerne',
        lat: 46.8110, lng: 6.9420,
        tags: [
            { tag: 'Python', category: 'backend' },
            { tag: 'Fortran', category: 'backend' },
            { tag: 'C++', category: 'backend' },
        ],
    },
    {
        name: 'Post CH AG (IT)',
        type: 'Startup',
        website: 'https://www.post.ch',
        city: 'Bern',
        lat: 46.9480, lng: 7.4470,
        tags: [
            { tag: 'Java', category: 'backend' },
        ],
    },
    {
        name: 'EHL Group IT',
        type: 'Startup',
        website: 'https://www.ehl.edu',
        city: 'Lausanne',
        lat: 46.5580, lng: 6.6800,
        tags: [
            { tag: 'PHP', category: 'backend' },
            { tag: 'React', category: 'frontend' },
        ],
    },
];

// ── Main seed function ────────────────────────────────────────────────────────
async function seed() {
    // 1. Make sure the DB exists (creates it if missing)
    await ensureDatabase();

    // 2. Connect to the target DB
    const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

    try {
        // 3. Create tables / extensions if they don't exist
        await ensureSchema(pool);

        // 4. Wipe existing data so re-runs are idempotent
        await truncateTables(pool);

        // 5. Insert companies + their tags inside a single transaction
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            for (const company of companies) {
                const res = await client.query(
                    `INSERT INTO companies (name, uid, website, city, lat, lng, type)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
                    [company.name, company.uid ?? null, company.website, company.city, company.lat, company.lng, company.type ?? null]
                );
                const companyId: string = res.rows[0].id;

                for (const { tag, category } of company.tags) {
                    await client.query(
                        `INSERT INTO tech_tags (company_id, tag, category, source)
             VALUES ($1, $2, $3, 'seed')
             ON CONFLICT (company_id, tag) DO NOTHING`,
                        [companyId, tag, category]
                    );
                }
                console.log(`  ✅ ${company.name} (${company.tags.length} tags)`);
            }

            await client.query('COMMIT');
            console.log(`\n🎉 Seed complete — ${companies.length} Swiss companies loaded.`);
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Seed failed:', err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

seed();
