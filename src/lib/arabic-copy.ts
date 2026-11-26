// Owner-approved Arabic copy for CV/CMS fields that are stored in English.
// The CMS remains the source of truth for the English text; this map only
// supplies the Arabic rendering. Unknown strings fall back to the stored value
// and are marked with lang="en" by the Localized component so screen readers
// do not read English text with Arabic pronunciation rules.

const ARABIC_COPY: Record<string, string> = {
  // Stored SEO copy (spelling normalised to the owner-approved Arabic title)
  "روماني توفيق شحاته - مطور واجهات اماميه":
    "روماني توفيق شحاتة - مطور واجهات أمامية",

  // Profile
  "Junior Front-End Developer": "مطوّر واجهات أمامية مبتدئ",
  "Nag Hammadi, Qena, Egypt": "نجع حمادي، قنا، مصر",

  // Language proficiency
  Arabic: "العربية",
  Native: "لغة أم",
  English: "الإنجليزية",
  Intermediate: "متوسطة",

  // Skills
  "Semantic markup": "ترميز دلالي",
  "Responsive layouts": "تخطيطات متجاوبة",
  "Modern JavaScript syntax": "بناء JavaScript الحديث",
  "Browser-side interactivity": "التفاعلية في المتصفح",
  "Asynchronous programming fundamentals": "أساسيات البرمجة غير المتزامنة",
  "Components, props, state and hooks": "المكوّنات والخصائص (props) والحالة وHooks",
  "Reusable UI": "واجهات مستخدم قابلة لإعادة الاستخدام",
  "Next.js fundamentals": "أساسيات Next.js",
  "RESTful API fundamentals": "أساسيات واجهات RESTful",
  "Connecting frontend applications to backend services":
    "ربط تطبيقات الواجهات الأمامية بخدمات الخلفية",
  "Relational and NoSQL database fundamentals": "أساسيات قواعد البيانات العلائقية وNoSQL",
  "Computer networking fundamentals": "أساسيات شبكات الحاسوب",
  "Linux system basics": "أساسيات نظام Linux",
  "Filesystem navigation": "التنقل في نظام الملفات",
  "Command-line fundamentals": "أساسيات سطر الأوامر",
  DevOPS: "ممارسات DevOps",

  // Curated projects
  "SendFlow — SMS Messaging Platform": "SendFlow — منصة إرسال الرسائل النصية",
  "A web platform designed to help businesses send, receive, and manage SMS communications.":
    "منصة ويب تساعد الشركات على إرسال واستقبال الرسائل النصية وإدارتها.",
  Authentication: "المصادقة",
  "Email integration": "تكامل البريد الإلكتروني",
  "E-Commerce RESTful API": "واجهة RESTful للتجارة الإلكترونية",
  "An e-commerce backend API built using Node.js, Express 5, TypeScript, and MongoDB.":
    "واجهة خلفية للتجارة الإلكترونية مبنية بـ Node.js وExpress 5 وTypeScript وMongoDB.",
  "JWT authentication": "مصادقة JWT",
  "Role-based access": "وصول قائم على الأدوار",
  "Product and category management": "إدارة المنتجات والفئات",
  Reviews: "التقييمات",
  Wishlists: "قوائم الرغبات",
  Addresses: "العناوين",
  Coupons: "الكوبونات",
  "Image processing": "معالجة الصور",
  "Search, sorting, and pagination": "البحث والترتيب والصفحات",

  // Synced GitHub descriptions
  "Django roadmap outlines key features and improvements for upcoming releases, including performance and scalability improvements, new features for modern web development, enhanced security, and improved developer experience.":
    "خارطة طريق Django تستعرض أبرز الميزات والتحسينات للإصدارات القادمة، بما في ذلك تحسينات الأداء وقابلية التوسّع وميزات جديدة لتطوير الويب الحديث وتعزيز الأمان وتحسين تجربة المطوّر.",
  "A fully functional E-commerce RESTful API built with Node.js, Express, and TypeScript. Features include user authentication (JWT), product management, cart and order system, payment integration, and admin dashboard endpoints. Designed with scalability, clean architecture":
    "واجهة RESTful متكاملة للتجارة الإلكترونية مبنية بـ Node.js وExpress وTypeScript. تتضمن مصادقة المستخدمين (JWT) وإدارة المنتجات ونظام السلة والطلبات وتكامل المدفوعات ونقاط لوحة الإدارة، مع تصميم يركز على قابلية التوسّع وبنية نظيفة",
  "A modern and responsive personal portfolio website to showcase my projects, skills, and experience. Built with HTML, CSS, and JavaScript, featuring a clean design and smooth user experience.":
    "موقع شخصي حديث ومتجاوب لعرض المشاريع والمهارات والخبرة، مبني بـ HTML وCSS وJavaScript، بتصميم نظيف وتجربة مستخدم سلسة.",
  "A simple front-end application for managing appointments, built using React, TypeScript, and Vite. The app displays a list of saved appointments, with each entry featuring a live countdown timer showing the time remaining until the scheduled event. Users can also add new appointments or delete existing ones.":
    "تطبيق واجهات أمامي بسيط لإدارة المواعيد، مبني بـ React وTypeScript وVite. يعرض قائمة بالمواعيد المحفوظة، ولكل موعد عدّاد مباشر للوقت المتبقي، مع إمكانية إضافة مواعيد جديدة أو حذف المواعيد الحالية.",
  "A small, single-page React application for collecting questions and answers.":
    "تطبيق React صغير من صفحة واحدة لجمع الأسئلة والأجوبة.",
  "SendFlow is a modern SMS messaging platform for businesses. Send, receive, and manage SMS communications with ease.":
    "SendFlow منصة حديثة لإرسال الرسائل النصية للشركات. إرسال واستقبال وإدارة الرسائل بسهولة.",

  // Certifications
  "Introduction to Front-End Development": "مقدمة في تطوير الواجهات الأمامية",
  "Programming with JavaScript": "البرمجة بـ JavaScript",
  "Version Control": "التحكم بالإصدارات",
  "HTML and CSS in depth": "HTML وCSS بعمق",
  "React Basics": "أساسيات React",
  "Advanced React": "React المتقدم",
  "Principles of UX/UI Design": "مبادئ تصميم تجربة المستخدم وواجهة المستخدم",
  "Front-End Developer Capstone": "مشروع ختامي لمطوّر الواجهات الأمامية",
  "Coding Interview Preparation": "التحضير لمقابلات البرمجة",
  "Meta Front-End Developer Professional Certificate":
    "شهادة Meta الاحترافية في تطوير الواجهات الأمامية",
  "MongoDB - The Complete Developer's Guide 2023": "MongoDB — الدليل الشامل للمطوّر 2023",
  "NodeJS - Build a Full E-Commerce RESTful APIs 2023":
    "NodeJS — بناء واجهات RESTful متكاملة للتجارة الإلكترونية 2023",
  "Master CSS": "إتقان CSS",
  "Master HTML": "إتقان HTML",
  "Master SQL - MySQL": "إتقان SQL — MySQL",

  // Certificate coverage chips
  "Front-end development foundations": "أساسيات تطوير الواجهات الأمامية",
  "Responsive web design": "تصميم ويب متجاوب",
  "Building interactive user interfaces": "بناء واجهات مستخدم تفاعلية",

  // Certificate dates
  "October 10, 2025": "10 أكتوبر 2025",
  "October 13, 2025": "13 أكتوبر 2025",
  "October 14, 2025": "14 أكتوبر 2025",
  "October 18, 2025": "18 أكتوبر 2025",
  "October 22, 2025": "22 أكتوبر 2025",
  "October 23, 2025": "23 أكتوبر 2025",
  "October 28, 2025": "28 أكتوبر 2025",
  "November 1, 2025": "1 نوفمبر 2025",
  "November 8, 2025": "8 نوفمبر 2025",
  "August 24, 2023": "24 أغسطس 2023",
  "August 6, 2023": "6 أغسطس 2023",
  "November 11, 2025": "11 نوفمبر 2025",
  "November 5, 2020": "5 نوفمبر 2020",
  "October 1, 2022": "1 أكتوبر 2022",

  // Miscellaneous labels
  Demo: "معاينة",
  Email: "البريد الإلكتروني",
};

export function localize(value: string, arabic: boolean): string {
  if (!arabic) return value;
  return ARABIC_COPY[value.trim()] ?? value;
}

export function needsEnglishTag(value: string, arabic: boolean): boolean {
  return arabic && localize(value, arabic) === value && /[A-Za-z]/.test(value);
}
