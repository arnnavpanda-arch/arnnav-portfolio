import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()
client = MongoClient(os.getenv("MONGO_URI"))
db = client.get_database("portfolioDB")

# Clear existing to avoid duplicates if run multiple times
db.about.delete_many({})
db.skills.delete_many({})
db.projects.delete_many({})
db.experience.delete_many({})
db.education.delete_many({})
db.awards.delete_many({})

db.about.insert_one({
    "text": "Third-year Computer Science & Engineering student at NIST University with hands-on full-stack development experience, having independently built three production-style platforms using Python/Flask, Node.js/Express.js, MongoDB, and JavaScript. Comfortable across the stack — from REST API design and real-time features to cloud deployment. Seeking a Full-Stack Developer / Software Developer role to build and scale web applications."
})

db.skills.insert_many([
    { "category": "Languages", "items": ["Python", "C", "C++", "JavaScript", "Java"] },
    { "category": "Web Development", "items": ["HTML", "CSS", "JavaScript", "Flask", "Node.js", "Express.js", "REST APIs"] },
    { "category": "Database & Tools", "items": ["MongoDB", "MongoDB Atlas", "SQL", "Git", "GitHub", "Render", "VS Code", "Postman"] }
])

db.projects.insert_many([
    {
        "title": "AURA Dispatch",
        "description": "Full-stack platform managing logistics-agency operations: attendance, staff management, shop assignment, delivery tracking, payroll, and commissions. Built delivery OTP verification and an administrative control panel with real-time updates via Flask-SocketIO. Deployed on Render.",
        "link": ""
    },
    {
        "title": "AURA Shopping Platform",
        "description": "Connected local customers with nearby merchants through a centralized shopping and delivery system with customer storefront, merchant operations, and order management. Built REST APIs with Express.js and MongoDB, deployed on Render.",
        "link": ""
    },
    {
        "title": "AURA CareerForge",
        "description": "Developed a full-stack recruitment management SPA with a responsive Glassmorphism UI, built scalable Flask REST APIs with MongoDB Atlas for applicant data and document management, implemented real-time cross-device auto-sync using JavaScript polling and DOM change detection, and automated dynamic A4-format Offer Letter generation using database-driven templates for print-ready PDF output.",
        "link": ""
    }
])

db.experience.insert_many([
    {
        "title": "Full Stack Python Internship Program",
        "company": "Deweagle Technologies, Patna",
        "date": "2026",
        "description": "Completed the Full Stack Python Internship Program, focusing on full-stack development."
    }
])

db.education.insert_many([
    {
        "degree": "B.Tech, Computer Science & Engineering",
        "institution": "NIST University",
        "date": "Expected 2028",
        "description": "7.61 CGPA"
    },
    {
        "degree": "Class XII",
        "institution": "Aska Science Higher Secondary School",
        "date": "2024",
        "description": "67%"
    },
    {
        "degree": "Class X",
        "institution": "Saraswati Shishu Vidya Mandir",
        "date": "2022",
        "description": "82%"
    }
])

db.awards.insert_many([
    {
        "title": "Certificate in C++",
        "description": "National Board of Computer Education, India (2025)"
    },
    {
        "title": "Full Stack Python Internship Program",
        "description": "Deweagle Technologies, Patna (2026)"
    },
    {
        "title": "Academic Excellence",
        "description": "Awarded a laptop for securing high marks in the Class XII examination at the block level — recognized for academic performance."
    }
])

print("Database seeded with original data successfully!")
