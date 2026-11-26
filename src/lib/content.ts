// Static, CV-derived content only. Values here must not be invented or upgraded.
// Missing owner input (project URLs, credential URL, email, Arabic prose) stays
// absent and is omitted from the published UI; do not invent values or show
// owner-review notices.

export const profile = {
  name: "Romany Tawfiq Shehata",
  title: "Junior Front-End Developer",
  location: "Nag Hammadi, Qena, Egypt",
  summary:
    "Motivated Junior Front-End Developer with hands-on experience building personal web projects using modern web technologies. Knowledgeable in JavaScript, React.js, Next.js, TypeScript, and responsive UI development with HTML, CSS, and Tailwind CSS. Also familiar with backend development, RESTful APIs, and relational and NoSQL databases. Eager to contribute to a development team, solve practical problems, and continue developing strong front-end engineering skills.",
  // Owner-approved translation of the CV summary on 2026-11-25. Project
  // descriptions remain intentionally English-only per the same decision.
  summaryAr:
    "مطوّر واجهات أمامية في بداية مسيرته، متحمّس ولديه خبرة عملية في بناء مشاريع ويب شخصية باستخدام تقنيات الويب الحديثة. على دراية بـ JavaScript وReact.js وNext.js وTypeScript، وبتطوير واجهات متجاوبة باستخدام HTML وCSS وTailwind CSS. كما لديه إلمام بتطوير الجانب الخلفي، وواجهات RESTful، وقواعد البيانات العلائقية وغير العلائقية. يتطلّع إلى المساهمة في فريق تطوير، وحل مشكلات عملية، ومواصلة تنمية مهارات هندسة الواجهات الأمامية.",
  imageUrl: "/rts.jpeg",
  resumeUrl: "/rts_cv.pdf",
} as const;

export const contact = {
  phone: "01201777051",
  whatsapp: "01006985069",
  // Owner-approved for publication on 2026-11-26. The CV does not list it.
  email: "romanytawfiqshehata@gmail.com",
  github: "https://github.com/romanytawfiq",
  linkedin: "https://linkedin.com/in/romany-t-shehata-832639386",
} as const;

export const languages = [
  { name: "Arabic", level: "Native" },
  { name: "English", level: "Intermediate" },
] as const;

export const skillGroups = [
  {
    id: "frontend",
    skills: [
      "HTML5",
      "Semantic markup",
      "CSS3",
      "Responsive layouts",
      "Flexbox",
      "CSS Grid",
      "Tailwind CSS",
    ],
  },
  {
    id: "languages",
    skills: [
      "JavaScript (ES6+)",
      "Modern JavaScript syntax",
      "Browser-side interactivity",
      "Asynchronous programming fundamentals",
      "TypeScript",
    ],
  },
  {
    id: "frameworks",
    skills: [
      "React.js",
      "Components, props, state and hooks",
      "Reusable UI",
      "Next.js fundamentals",
      "React Router DOM",
    ],
  },
  { id: "state", skills: ["Redux", "Redux Toolkit", "Zustand"] },
  { id: "forms", skills: ["React Hook Form", "Zod"] },
  {
    id: "backend",
    skills: [
      "Node.js",
      "Express.js",
      "RESTful API fundamentals",
      "Connecting frontend applications to backend services",
    ],
  },
  {
    id: "databases",
    skills: ["MongoDB", "MySQL", "Relational and NoSQL database fundamentals"],
  },
  { id: "tools", skills: ["Git", "GitHub", "Claude", "ChatGPT"] },
  {
    id: "additional",
    skills: [
      "Computer networking fundamentals",
      "Linux system basics",
      "Filesystem navigation",
      "Command-line fundamentals",
    ],
  },
] as const;

export const projects = [
  {
    slug: "sendflow",
    title: "SendFlow — SMS Messaging Platform",
    description:
      "A web platform designed to help businesses send, receive, and manage SMS communications.",
    stack: [
      "Next.js",
      "React",
      "TypeScript",
      "Tailwind CSS",
      "Prisma",
      "PostgreSQL",
      "Authentication",
      "Email integration",
    ],
    features: [],
  },
  {
    slug: "ecommerce-rest-api",
    title: "E-Commerce RESTful API",
    description:
      "An e-commerce backend API built using Node.js, Express 5, TypeScript, and MongoDB.",
    stack: ["Node.js", "Express 5", "TypeScript", "MongoDB"],
    features: [
      "JWT authentication",
      "Role-based access",
      "Product and category management",
      "Reviews",
      "Wishlists",
      "Addresses",
      "Coupons",
      "Image processing",
      "Search, sorting, and pagination",
    ],
  },
] as const;

// Values below are transcribed from the certificate PDFs supplied by the
// owner in `certificaties/`. `documentUrl` points to a copy published under
// `public/certificates/`; `credentialUrl` is the issuer verification link
// printed on the certificate where one exists.
export const certifications = [
  {
    title: "Introduction to Front-End Development",
    issuer: "Coursera",
    issueDate: "October 10, 2025",
    credentialUrl: "https://coursera.org/verify/ZBI7LXGCPD1D",
    documentUrl: "/certificates/meta-1-introduction-to-front-end-development.pdf",
    coverage: [],
  },
  {
    title: "Programming with JavaScript",
    issuer: "Coursera",
    issueDate: "October 13, 2025",
    credentialUrl: "https://coursera.org/verify/A5B1NV93LS4W",
    documentUrl: "/certificates/meta-2-programming-with-javascript.pdf",
    coverage: [],
  },
  {
    title: "Version Control",
    issuer: "Coursera",
    issueDate: "October 14, 2025",
    credentialUrl: "https://coursera.org/verify/4YW99M5YHWOM",
    documentUrl: "/certificates/meta-3-version-control.pdf",
    coverage: [],
  },
  {
    title: "HTML and CSS in depth",
    issuer: "Coursera",
    issueDate: "October 18, 2025",
    credentialUrl: "https://coursera.org/verify/D65DT61TPZ1Z",
    documentUrl: "/certificates/meta-4-html-and-css-in-depth.pdf",
    coverage: [],
  },
  {
    title: "React Basics",
    issuer: "Coursera",
    issueDate: "October 22, 2025",
    credentialUrl: "https://coursera.org/verify/0DVWE2ZJW1OX",
    documentUrl: "/certificates/meta-5-react-basics.pdf",
    coverage: [],
  },
  {
    title: "Advanced React",
    issuer: "Coursera",
    issueDate: "October 23, 2025",
    credentialUrl: "https://coursera.org/verify/UVMT9EG60DB3",
    documentUrl: "/certificates/meta-6-advanced-react.pdf",
    coverage: [],
  },
  {
    title: "Principles of UX/UI Design",
    issuer: "Coursera",
    issueDate: "October 28, 2025",
    credentialUrl: "https://coursera.org/verify/SDZE39KMGUE2",
    documentUrl: "/certificates/meta-7-principles-of-ux-ui-design.pdf",
    coverage: [],
  },
  {
    title: "Front-End Developer Capstone",
    issuer: "Coursera",
    issueDate: "November 1, 2025",
    credentialUrl: "https://coursera.org/verify/GSUFZXAEZPII",
    documentUrl: "/certificates/meta-8-front-end-developer-capstone.pdf",
    coverage: [],
  },
  {
    title: "Coding Interview Preparation",
    issuer: "Coursera",
    issueDate: "November 8, 2025",
    credentialUrl: "https://coursera.org/verify/450CU53QCRY8",
    documentUrl: "/certificates/meta-9-coding-interview-preparation.pdf",
    coverage: [],
  },
  {
    title: "Meta Front-End Developer Professional Certificate",
    issuer: "Coursera",
    issueDate: "November 8, 2025",
    credentialUrl: "https://coursera.org/verify/professional-cert/0E1YDK0IAPAC",
    documentUrl: "/certificates/meta-front-end-developer-professional-certificate.pdf",
    coverage: [
      "Front-end development foundations",
      "HTML",
      "CSS",
      "JavaScript",
      "React",
      "Responsive web design",
      "Version control",
      "Building interactive user interfaces",
    ],
  },
  {
    title: "MongoDB - The Complete Developer's Guide 2023",
    issuer: "Udemy",
    issueDate: "August 24, 2023",
    credentialUrl: "https://ude.my/UC-8fcf3161-567d-4ac4-bda7-d64b639233a1",
    documentUrl: "/certificates/mongodb-the-complete-developers-guide-2023.pdf",
    coverage: [],
  },
  {
    title: "NodeJS - Build a Full E-Commerce RESTful APIs 2023",
    issuer: "Udemy",
    issueDate: "August 6, 2023",
    credentialUrl: "https://ude.my/UC-40e26bd7-eba0-4d80-8b4f-40ad76b63cfb",
    documentUrl: "/certificates/nodejs-build-a-full-ecommerce-restful-apis-2023.pdf",
    coverage: [],
  },
  {
    title: "Master CSS",
    issuer: "Shiyar Academy",
    issueDate: "November 11, 2025",
    credentialUrl: null,
    documentUrl: "/certificates/shiyar-academy-css.pdf",
    coverage: [],
  },
  {
    title: "Master HTML",
    issuer: "Shiyar Academy",
    issueDate: "November 5, 2020",
    credentialUrl: null,
    documentUrl: "/certificates/shiyar-academy-html.pdf",
    coverage: [],
  },
  {
    title: "Master SQL - MySQL",
    issuer: "Shiyar Academy",
    issueDate: "October 1, 2022",
    credentialUrl: null,
    documentUrl: "/certificates/shiyar-academy-sql-mysql.pdf",
    coverage: [],
  },
] as const;
