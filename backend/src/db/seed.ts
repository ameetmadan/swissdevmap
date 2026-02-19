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
    tags: { tag: string; category: string }[];
}

const companies: Company[] = [
    {
        name: 'Swisscom',
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
        name: 'Logitech',
        uid: 'CHE-115.042.787',
        website: 'https://www.logitech.com',
        city: 'Lausanne',
        lat: 46.5197, lng: 6.6323,
        tags: [
            { tag: 'C++', category: 'backend' },
            { tag: 'Python', category: 'backend' },
            { tag: 'React', category: 'frontend' },
            { tag: 'AWS', category: 'cloud' },
        ],
    },
    {
        name: 'Proton',
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
        name: 'Novartis',
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
        name: 'SIX Group',
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
        name: 'Ergon Informatik',
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
        name: 'Tamedia',
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
        name: 'Sensirion',
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
        name: 'Doodle',
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
    {
        name: 'Cembra Money Bank',
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
        name: 'SBB CFF FFS',
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

    // --- FINTECH & BANKING ---
    {
        name: 'Avaloq',
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
        name: 'Temenos',
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
        uid: 'CHE-101.009.664',
        website: 'https://www.swissquote.com',
        city: 'Gland',
        lat: 46.4211, lng: 6.2690,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Spring Boot', category: 'backend' },
            { tag: 'React', category: 'frontend' },
            { tag: 'Kafka', category: 'devops' },
        ],
    },
    {
        name: 'Neon',
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
        website: 'https://www.lykke.com',
        city: 'Zug',
        lat: 47.1680, lng: 8.5140,
        tags: [
            { tag: 'C#', category: 'backend' },
            { tag: 'Go', category: 'backend' },
            { tag: 'Angular', category: 'frontend' },
        ],
    },
    // --- SOFTWARE AGENCIES & CONSULTING ---
    {
        name: 'Netcetera',
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
        name: 'Namics (Merkl)',
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
        name: 'Tiptapp',
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
        name: 'Liip',
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
        name: 'Unic',
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
        name: 'Ti&m',
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
        website: 'https://www.cybsafe.com',
        city: 'Geneva',
        lat: 46.2044, lng: 6.1432,
        tags: [
            { tag: 'Python', category: 'backend' },
            { tag: 'Django', category: 'backend' },
            { tag: 'React', category: 'frontend' },
        ],
    },

    // --- E-COMMERCE & RETAIL ---
    {
        name: 'Digitec Galaxus',
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
        uid: 'CHE-101.442.278',
        website: 'https://www.migros.ch',
        city: 'Ecublens',
        lat: 46.5270, lng: 6.5620,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'React', category: 'frontend' },
            { tag: 'Kubernetes', category: 'devops' },
        ],
    },

    // --- INDUSTRIAL & ENGINEERING (INDUSTRY 4.0) ---
    {
        name: 'Schindler',
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
        name: 'Hilti Switzerland',
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
        name: 'Stadler Rail',
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
        name: 'Bühler Group',
        uid: 'CHE-105.938.859',
        website: 'https://www.buhlergroup.com',
        city: 'Uzwil',
        lat: 47.4435, lng: 9.1380,
        tags: [
            { tag: 'C#', category: 'backend' },
            { tag: 'Azure', category: 'cloud' },
            { tag: 'Python', category: 'backend' },
        ],
    },
    {
        name: 'Geberit',
        uid: 'CHE-108.628.320',
        website: 'https://www.geberit.com',
        city: 'Rapperswil-Jona',
        lat: 47.2215, lng: 8.8185,
        tags: [
            { tag: 'SAP ABAP', category: 'backend' },
            { tag: 'Java', category: 'backend' },
            { tag: 'Azure', category: 'cloud' },
        ],
    },

    // --- LIFE SCIENCES & BIOTECH ---
    {
        name: 'Idorsia',
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
        name: 'SOPHiA GENETICS',
        uid: 'CHE-214.945.892',
        website: 'https://www.sophiagenetics.com',
        city: 'Saint-Sulpice',
        lat: 46.5125, lng: 6.5620,
        tags: [
            { tag: 'Python', category: 'backend' },
            { tag: 'C++', category: 'backend' },
            { tag: 'AWS', category: 'cloud' },
            { tag: 'Docker', category: 'devops' },
        ],
    },
    {
        name: 'Givaudan',
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

    // --- LUXURY & WATCHES (DIGITAL DEPARTMENTS) ---
    {
        name: 'Richemont',
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

    // --- INSURANCE & FINANCE ---
    {
        name: 'Zurich Insurance Group',
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

    // --- BLOCKCHAIN & CRYPTO VALLEY ---
    {
        name: 'Ethereum Foundation',
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
        website: 'https://www.metaco.com',
        city: 'Lausanne',
        lat: 46.5191, lng: 6.6335,
        tags: [
            { tag: 'Scala', category: 'backend' },
            { tag: 'TypeScript', category: 'backend' },
            { tag: 'Kubernetes', category: 'devops' },
        ],
    },

    // --- OTHER SCALE-UPS & INNOVATION ---
    {
        name: 'Sherpany',
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
        website: 'https://www.scandit.com',
        city: 'Zürich',
        lat: 47.3725, lng: 8.5330,
        tags: [
            { tag: 'C++', category: 'backend' },
            { tag: 'Python', category: 'backend' },
            { tag: 'Node.js', category: 'backend' },
            { tag: 'AWS', category: 'cloud' },
        ],
    },
    {
        name: 'GetYourGuide',
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
        website: 'https://www.flyability.com',
        city: 'Pausud',
        lat: 46.5225, lng: 6.6310,
        tags: [
            { tag: 'C++', category: 'backend' },
            { tag: 'Python', category: 'backend' },
            { tag: 'Embedded', category: 'backend' },
        ],
    },
    {
        name: 'LatticeFlow',
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
        website: 'https://www.teralytics.net',
        city: 'Zürich',
        lat: 47.3785, lng: 8.5395,
        tags: [
            { tag: 'Scala', category: 'backend' },
            { tag: 'Python', category: 'backend' },
            { tag: 'Kubernetes', category: 'devops' },
        ],
    },
    {
        name: 'DeepCode (Snyk)',
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
        website: 'https://www.mindmaze.com',
        city: 'Lausanne',
        lat: 46.5185, lng: 6.6340,
        tags: [
            { tag: 'C++', category: 'backend' },
            { tag: 'Unity', category: 'frontend' },
            { tag: 'Python', category: 'backend' },
        ],
    },
    {
        name: 'Nexthink',
        website: 'https://www.nexthink.com',
        city: 'Lausanne',
        lat: 46.5195, lng: 6.6320,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'C++', category: 'backend' },
            { tag: 'React', category: 'frontend' },
            { tag: 'AWS', category: 'cloud' },
        ],
    },
    {
        name: 'Bestmile',
        website: 'https://www.bestmile.com',
        city: 'Lausanne',
        lat: 46.5191, lng: 6.6330,
        tags: [
            { tag: 'Scala', category: 'backend' },
            { tag: 'Go', category: 'backend' },
            { tag: 'AWS', category: 'cloud' },
        ],
    },
    {
        name: 'Squire',
        website: 'https://www.getsquire.com',
        city: 'Zürich',
        lat: 47.3750, lng: 8.5310,
        tags: [
            { tag: 'Node.js', category: 'backend' },
            { tag: 'React', category: 'frontend' },
        ],
    },
    {
        name: 'WeCan Group',
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
        name: 'Proda',
        website: 'https://proda.ai',
        city: 'Zürich',
        lat: 47.3760, lng: 8.5280,
        tags: [
            { tag: 'Python', category: 'backend' },
            { tag: 'React', category: 'frontend' },
        ],
    },
    {
        name: 'Amnis',
        website: 'https://amnis.io',
        city: 'Zürich',
        lat: 47.3820, lng: 8.5150,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Angular', category: 'frontend' },
        ],
    },
    {
        name: 'N26 (Zurich Tech Hub)',
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
        website: 'https://yapeal.ch',
        city: 'Zürich',
        lat: 47.3715, lng: 8.5345,
        tags: [
            { tag: 'Go', category: 'backend' },
            { tag: 'TypeScript', category: 'backend' },
            { tag: 'Azure', category: 'cloud' },
        ],
    },
    {
        name: 'Exoscale',
        website: 'https://www.exoscale.com',
        city: 'Lausanne',
        lat: 46.5200, lng: 6.6350,
        tags: [
            { tag: 'Clojure', category: 'backend' },
            { tag: 'Python', category: 'backend' },
            { tag: 'Go', category: 'backend' },
            { tag: 'Docker', category: 'devops' },
        ],
    },
    {
        name: 'Hostpoint',
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
        website: 'https://www.infomaniak.com',
        city: 'Geneva',
        lat: 46.2044, lng: 6.1432,
        tags: [
            { tag: 'PHP', category: 'backend' },
            { tag: 'Python', category: 'backend' },
            { tag: 'OpenStack', category: 'devops' },
        ],
    },
    {
        name: 'Crealogix',
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
        name: 'Squirro',
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
        name: 'Knip',
        website: 'https://www.knip.com',
        city: 'Zürich',
        lat: 47.3710, lng: 8.5350,
        tags: [
            { tag: 'Ruby on Rails', category: 'backend' },
            { tag: 'Swift', category: 'frontend' },
        ],
    },
    {
        name: 'Dosenbach-Ochsner (Digital)',
        website: 'https://www.dosenbach.ch',
        city: 'Dietikon',
        lat: 47.4060, lng: 8.4010,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Vue', category: 'frontend' },
        ],
    },
    {
        name: 'Trakal',
        website: 'https://trakal.com',
        city: 'Zürich',
        lat: 47.3780, lng: 8.5350,
        tags: [
            { tag: 'Node.js', category: 'backend' },
            { tag: 'React', category: 'frontend' },
        ],
    },
    {
        name: 'Bequant',
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
        name: 'Puzzle ITC',
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
        name: 'Nine Internet Solutions',
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
        website: 'https://metatoul.ch',
        city: 'Geneva',
        lat: 46.2044, lng: 6.1432,
        tags: [
            { tag: 'Python', category: 'backend' },
            { tag: 'Next.js', category: 'frontend' },
        ],
    },
    {
        name: 'Amnis Financial',
        website: 'https://amnis.io',
        city: 'Zürich',
        lat: 47.3820, lng: 8.5150,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'TypeScript', category: 'backend' },
        ],
    },
    {
        name: 'Swissquote Bank',
        website: 'https://swissquote.com',
        city: 'Gland',
        lat: 46.4211, lng: 6.2690,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Oracle', category: 'backend' },
        ],
    },
    {
        name: 'Decentriq',
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
        name: 'Coop Digital',
        website: 'https://www.coop.ch',
        city: 'Basel',
        lat: 47.5460, lng: 7.5940,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Angular', category: 'frontend' },
            { tag: 'Azure', category: 'cloud' },
        ],
    },
    {
        name: 'Raiffeisen Switzerland',
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
        name: 'Julius Bär',
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
        website: 'https://www.lombardodier.com',
        city: 'Geneva',
        lat: 46.2040, lng: 6.1420,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Oracle', category: 'backend' },
        ],
    },
    {
        name: 'Kudelski Security',
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
        name: 'ELCA Informatique',
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
        name: 'Erni Consulting',
        website: 'https://www.ernimetal.ch',
        city: 'Zürich',
        lat: 47.3760, lng: 8.5480,
        tags: [
            { tag: 'C#', category: 'backend' },
            { tag: 'Java', category: 'backend' },
        ],
    },
    {
        name: 'Zühlke Technology Group',
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
        name: 'Swisscom DevOps',
        website: 'https://www.swisscom.ch',
        city: 'Rotkreuz',
        lat: 47.1400, lng: 8.4300,
        tags: [
            { tag: 'Kubernetes', category: 'devops' },
            { tag: 'Python', category: 'backend' },
        ],
    },
    {
        name: 'Abacus Research',
        website: 'https://www.abacus.ch',
        city: 'Wittenbach',
        lat: 47.4640, lng: 9.3780,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Angular', category: 'frontend' },
        ],
    },
    {
        name: 'Bexio',
        website: 'https://www.bexio.com',
        city: 'Rapperswil',
        lat: 47.2260, lng: 8.8180,
        tags: [
            { tag: 'PHP', category: 'backend' },
            { tag: 'Laravel', category: 'backend' },
            { tag: 'React', category: 'frontend' },
        ],
    },
    {
        name: 'PWC Switzerland (Tech)',
        website: 'https://www.pwc.ch',
        city: 'Zürich',
        lat: 47.3850, lng: 8.5280,
        tags: [
            { tag: 'C#', category: 'backend' },
            { tag: 'Azure', category: 'cloud' },
        ],
    },
    {
        name: 'Deloitte Switzerland (Tech)',
        website: 'https://www2.deloitte.com/ch',
        city: 'Zürich',
        lat: 47.3710, lng: 8.5360,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'AWS', category: 'cloud' },
        ],
    },
    {
        name: 'Accenture Switzerland',
        website: 'https://www.accenture.com/ch-en',
        city: 'Zürich',
        lat: 47.3720, lng: 8.5350,
        tags: [
            { tag: 'Java', category: 'backend' },
            { tag: 'Cloud', category: 'cloud' },
        ],
    },
    {
        name: 'Swiss Quote',
        website: 'https://swissquote.com',
        city: 'Bern',
        lat: 46.9480, lng: 7.4470,
        tags: [
            { tag: 'Java', category: 'backend' },
        ],
    },
    {
        name: 'Wizdom',
        website: 'https://wizdom.ai',
        city: 'Zürich',
        lat: 47.3760, lng: 8.5480,
        tags: [
            { tag: 'Python', category: 'backend' },
        ],
    },
    {
        name: 'DeepL (Zurich Office)',
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
        name: 'Sensirion AG',
        website: 'https://www.sensirion.com',
        city: 'Stäfa',
        lat: 47.2392, lng: 8.7278,
        tags: [
            { tag: 'C++', category: 'backend' },
        ],
    },
    {
        name: 'Esri Switzerland',
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
        website: 'https://opendata.ch',
        city: 'Zürich',
        lat: 47.3760, lng: 8.5480,
        tags: [
            { tag: 'Python', category: 'backend' },
        ],
    },
    {
        name: 'Valora Digital',
        website: 'https://www.valora.com',
        city: 'Zürich',
        lat: 47.3760, lng: 8.5480,
        tags: [
            { tag: 'Node.js', category: 'backend' },
            { tag: 'React', category: 'frontend' },
        ],
    },
    {
        name: 'Axa Switzerland (Tech)',
        website: 'https://www.axa.ch',
        city: 'Winterthur',
        lat: 47.5000, lng: 8.7240,
        tags: [
            { tag: 'Java', category: 'backend' },
        ],
    },
    {
        name: 'CSS Versicherung',
        website: 'https://www.css.ch',
        city: 'Luzern',
        lat: 47.0500, lng: 8.3000,
        tags: [
            { tag: 'Java', category: 'backend' },
        ],
    },
    {
        name: 'Visana',
        website: 'https://www.visana.ch',
        city: 'Bern',
        lat: 46.9480, lng: 7.4470,
        tags: [
            { tag: 'Java', category: 'backend' },
        ],
    },
    {
        name: 'Sanitas',
        website: 'https://www.sanitas.com',
        city: 'Zürich',
        lat: 47.3760, lng: 8.5480,
        tags: [
            { tag: 'Java', category: 'backend' },
        ],
    },
    {
        name: 'Helsana',
        website: 'https://www.helsana.ch',
        city: 'Zürich',
        lat: 47.3760, lng: 8.5480,
        tags: [
            { tag: 'Java', category: 'backend' },
        ],
    },
    {
        name: 'Die Mobiliar',
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
        website: 'https://www.suva.ch',
        city: 'Luzern',
        lat: 47.0500, lng: 8.3000,
        tags: [
            { tag: 'Java', category: 'backend' },
        ],
    },
    {
        name: 'Zürcher Kantonalbank (ZKB)',
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
        name: 'Basler Kantonalbank (BKB)',
        website: 'https://www.bkb.ch',
        city: 'Basel',
        lat: 47.5540, lng: 7.5900,
        tags: [
            { tag: 'Java', category: 'backend' },
        ],
    },
    {
        name: 'Berner Kantonalbank (BEKB)',
        website: 'https://www.bekb.ch',
        city: 'Bern',
        lat: 46.9480, lng: 7.4470,
        tags: [
            { tag: 'Java', category: 'backend' },
        ],
    },
    {
        name: 'Luzerner Kantonalbank (LUKB)',
        website: 'https://www.lukb.ch',
        city: 'Luzern',
        lat: 47.0500, lng: 8.3000,
        tags: [
            { tag: 'Java', category: 'backend' },
        ],
    },
    {
        name: 'St.Galler Kantonalbank (SGKB)',
        website: 'https://www.sgkb.ch',
        city: 'St. Gallen',
        lat: 47.4245, lng: 9.3767,
        tags: [
            { tag: 'Java', category: 'backend' },
        ],
    },
    {
        name: 'Aargauische Kantonalbank (AKB)',
        website: 'https://www.akb.ch',
        city: 'Aarau',
        lat: 47.3920, lng: 8.0440,
        tags: [
            { tag: 'Java', category: 'backend' },
        ],
    },
    {
        name: 'Graubündner Kantonalbank (GKB)',
        website: 'https://www.gkb.ch',
        city: 'Chur',
        lat: 46.8500, lng: 9.5300,
        tags: [
            { tag: 'Java', category: 'backend' },
        ],
    },
    {
        name: 'Thurgauer Kantonalbank (TKB)',
        website: 'https://www.tkb.ch',
        city: 'Weinfelden',
        lat: 47.5680, lng: 9.1100,
        tags: [
            { tag: 'Java', category: 'backend' },
        ],
    },
    {
        name: 'Valiant Bank',
        website: 'https://www.valiant.ch',
        city: 'Bern',
        lat: 46.9480, lng: 7.4470,
        tags: [
            { tag: 'Java', category: 'backend' },
        ],
    },
    {
        name: 'Bank Cler',
        website: 'https://www.cler.ch',
        city: 'Basel',
        lat: 47.5540, lng: 7.5900,
        tags: [
            { tag: 'Java', category: 'backend' },
        ],
    },
    {
        name: 'Migros Bank',
        website: 'https://www.migrosbank.ch',
        city: 'Zürich',
        lat: 47.3710, lng: 8.5400,
        tags: [
            { tag: 'Java', category: 'backend' },
        ],
    },
    {
        name: 'Post CH AG (IT)',
        website: 'https://www.post.ch',
        city: 'Bern',
        lat: 46.9480, lng: 7.4470,
        tags: [
            { tag: 'Java', category: 'backend' },
        ],
    }
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
                    `INSERT INTO companies (name, uid, website, city, lat, lng)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
                    [company.name, company.uid ?? null, company.website, company.city, company.lat, company.lng]
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
